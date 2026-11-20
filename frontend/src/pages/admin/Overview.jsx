// The admin's home. Asymmetric on purpose (DESIGN.md section 7): one large
// impact block with the 7-day chart, then the admin's real work, approved
// requests that still need a volunteer, beside a printed "Right now" tally.
//
//   Wide block:   [ 112 PORTIONS DELIVERED | 7-day bar chart       ]
//   Medium block: [ 112 PORTIONS DELIVERED   sentence              ]
//                 [ 7-day bar chart                                ]
//   Below:        [ Needs a volunteer (slips) ] [ Right now receipt ]
//   Phone:        impact, chart, needs a volunteer, right now, stacked.
//
// The switches are container queries, so they follow the room the page has
// (the sidebar and activity rail take part of a 1440 window).
// Everything here refreshes on the live beat (every 20 seconds while the
// tab is visible): the figures, the chart and the queue.
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRightIcon, BicycleIcon, InfoIcon } from '@phosphor-icons/react';
import { dashboard } from '../../api/dashboard';
import * as pickupsApi from '../../api/pickups';
import Button, { ButtonLink } from '../../components/Button';
import { ErrorState } from '../../components/EmptyState';
import ImpactNumber from '../../components/ImpactNumber';
import PageFrame from '../../components/PageFrame';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import SkeletonToken from '../../components/SkeletonToken';
import StatusStamp from '../../components/StatusStamp';
import { useLiveBeat } from '../../context/LiveContext';
import { useSlip } from '../../context/ToastContext';
import useFocusWhen from '../../hooks/useFocusWhen';
import useLiveList from '../../hooks/useLiveList';
import { listingOf, recipientName, recipientOrg } from '../../lib/claim';
import { ago, quantity, time } from '../../lib/format';
import { donorName } from '../../lib/listing';
import { DURATION, EASE } from '../../lib/motion';
import AssignVolunteer from './AssignVolunteer';

// The chart library (Recharts) is large and only the admin sees it, so it is
// loaded separately, the first time this page opens.
const DeliveriesChart = lazy(() => import('../../components/DeliveriesChart'));

export default function Overview() {
  const showSlip = useSlip();
  const [stats, setStats] = useState(null); // { figures, last7Days }
  const [statsError, setStatsError] = useState(null);

  const loadStats = useCallback(() => {
    dashboard()
      .then((data) => {
        setStats(data);
        setStatsError(null);
      })
      .catch((err) => setStatsError(err.message));
  }, []);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useLiveBeat(loadStats);

  const fetchQueue = useCallback(async () => (await pickupsApi.unassigned()).claims, []);
  const queue = useLiveList(fetchQueue);
  // Requests assigned on this visit stay in the list with their stamp
  // (claim id -> { claim, volunteer }), even after a refresh no longer
  // returns them, so the admin sees the result where they clicked.
  const [assignedHere, setAssignedHere] = useState(() => new Map());
  const [assigning, setAssigning] = useState(null);
  const [lastAssigned, setLastAssigned] = useState(null);

  // When requests are waiting, the queue comes first (assigning is the
  // admin's urgent job; the impact figures are a look back). Decided once,
  // when the queue first arrives, so the page never rearranges itself
  // while the admin works through it.
  const [queueFirst, setQueueFirst] = useState(null);
  useEffect(() => {
    if (queueFirst === null && queue.items) setQueueFirst(queue.items.length > 0);
  }, [queue.items, queueFirst]);

  function assigned(claim, pickup, message) {
    setAssignedHere((map) => new Map(map).set(claim.id, { claim, volunteer: pickup.volunteerName }));
    setLastAssigned(claim.id);
    setAssigning(null);
    showSlip(message); // "Meera Nair will collect 8 boxes of Chicken Biryani"
    loadStats(); // "No volunteer" and "On the way" changed
  }

  if (stats === null && statsError) {
    return (
      <PageFrame title="Overview">
        <ErrorState message={statsError} onRetry={loadStats} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Overview"
      maxWidth="max-w-[1040px]"
      caption="What reached people this week, and the requests that still need someone to carry them."
    >
      {/* Same blocks, two orders: the queue leads while requests are waiting. */}
      <div className="flex flex-col gap-12">
        <div className={queueFirst ? 'order-2' : 'order-1'}>
          <ImpactBlock stats={stats} />
        </div>
        <div className={`@container ${queueFirst ? 'order-1' : 'order-2'}`}>
          <div className="grid items-start gap-10 @[860px]:grid-cols-[3fr_2fr] @[860px]:gap-8">
            <VolunteerQueue
              queue={queue}
              assignedHere={assignedHere}
              lastAssigned={lastAssigned}
              pendingAccounts={stats?.figures.pendingAccounts ?? 0}
              onAssign={setAssigning}
            />
            <RightNow figures={stats?.figures} />
          </div>
        </div>
      </div>

      <AssignVolunteer
        claim={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={(pickup, message) => assigned(assigning, pickup, message)}
        onStale={() => {
          queue.load();
          loadStats();
        }}
      />
    </PageFrame>
  );
}

/** The feature block: the one number that matters, and the week behind it. */
function ImpactBlock({ stats }) {
  const f = stats?.figures;
  const deliveries = f?.deliveries ?? 0;

  return (
    <section aria-labelledby="impact-title" className="@container rounded-sharp border border-line bg-surface p-5 tablet:p-6">
      <h2 id="impact-title" className="sr-only">
        Food delivered
      </h2>
      <div className="grid gap-8 @[860px]:grid-cols-[280px_1fr] @[860px]:gap-10">
        {/* Medium width: the sentence sits beside the number, so the block
            stays short and the queue below is reached sooner. */}
        <div className="grid gap-4 @[520px]:grid-cols-[auto_1fr] @[520px]:items-end @[520px]:gap-8 @[860px]:grid-cols-1 @[860px]:gap-4">
          {f ? (
            <ImpactNumber value={f.portionsDelivered} caption="Portions delivered" ink="text-leaf" />
          ) : (
            <p className="flex min-h-[120px] items-end text-ink-soft t-mono-sm">Counting...</p>
          )}
          {/* One printed sentence instead of a row of stat tiles. */}
          <p className="max-w-[46ch] text-ink-soft t-body-lg @[520px]:pb-1">
            {f
              ? `From ${deliveries} ${deliveries === 1 ? 'delivery' : 'deliveries'}. Food counts only once a volunteer has handed it over; the chart shows this week.`
              : 'Food counts only once a volunteer has handed it over.'}
          </p>
        </div>

        <div className="min-w-0">
          <h3 className="t-title-lg text-ink">Last 7 days</h3>
          <p className="text-ink-soft t-mono-sm">Portions delivered per day</p>
          <div className="mt-4">
            {/* The empty box keeps the chart's height while it loads. */}
            <Suspense fallback={<div className="h-[200px]" aria-hidden="true" />}>
              {stats ? <DeliveriesChart days={stats.last7Days} /> : <div className="h-[200px]" aria-hidden="true" />}
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Approved requests with no volunteer yet, oldest approval first. */
function VolunteerQueue({ queue, assignedHere, lastAssigned, pendingAccounts, onAssign }) {
  const items = queue.items;

  let body;
  let waiting;
  if (items === null && queue.error) {
    body = <ErrorState message={queue.error} onRetry={queue.load} />;
  } else if (items === null) {
    body = <SkeletonToken />;
  } else {
    // The server's list, plus the ones assigned on this visit (which it no
    // longer returns), in order of approval.
    const shown = [...items.filter((c) => !assignedHere.has(c.id))];
    for (const { claim } of assignedHere.values()) shown.push(claim);
    shown.sort((a, b) => new Date(a.decidedAt) - new Date(b.decidedAt));
    waiting = shown.length - assignedHere.size;

    body =
      shown.length === 0 ? (
        <p className="max-w-[60ch] text-ink-soft t-body-lg">
          Every approved request has a volunteer. New ones appear here as soon as the canteen approves them.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id}>
              <AssignSlip
                claim={c}
                assignedTo={assignedHere.get(c.id)?.volunteer}
                focusResult={lastAssigned === c.id}
                onAssign={() => onAssign(c)}
              />
            </li>
          ))}
        </ul>
      );
  }

  return (
    <section aria-labelledby="queue-title" className="min-w-0">
      {/* The count sits beside the heading, never above it. */}
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="queue-title" className="t-headline-md text-ink">
          Needs a volunteer
        </h2>
        {waiting !== undefined && (
          <p className="text-ink-soft t-mono-sm">
            {waiting === 0 ? 'None waiting' : `${waiting} waiting`}
            {/* Shows the 20-second refresh is working: the time moves on. */}
            {queue.updatedAt && ` · updated ${time(queue.updatedAt)}`}
          </p>
        )}
      </div>
      {/* The other job waiting for the admin, one line under the heading. */}
      {pendingAccounts > 0 && (
        <ButtonLink to="/approvals" variant="text" icon={ArrowRightIcon} className="-mt-2 mb-2 -ml-3">
          {pendingAccounts === 1 ? '1 account to approve' : `${pendingAccounts} accounts to approve`}
        </ButtonLink>
      )}
      {body}
    </section>
  );
}

/** One approved request with "Assign volunteer"; afterwards its stamp and who collects it. */
function AssignSlip({ claim: c, assignedTo, focusResult, onAssign }) {
  const reduced = useReducedMotion();
  const resultRef = useRef(null);
  useFocusWhen(resultRef, focusResult && Boolean(assignedTo));
  const l = listingOf(c);
  const closed = new Date(l.pickupDeadline) <= new Date();
  const who = [recipientOrg(c), c.decidedAt ? `approved ${ago(c.decidedAt)}` : ''].filter(Boolean).join(' · ');
  // A short fade for what changed in place (the stamp drop belongs to the canteen's approval).
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.out },
  };

  return (
    <article
      aria-label={`${quantity(c.requestedQuantity, l.unit)} of ${l.title} for ${recipientName(c)}`}
      className="rounded-sharp border border-line bg-surface p-4"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="t-title-lg text-ink [overflow-wrap:anywhere]">{recipientName(c)}</h3>
          <p className="mt-0.5 text-ink-soft t-body-sm">{who}</p>
        </div>
        {assignedTo && (
          <motion.div {...fade} className="shrink-0 pr-1 pt-1">
            <StatusStamp kind="assigned" size="lg" />
          </motion.div>
        )}
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
        <span className="t-mono-lg uppercase text-ink">{quantity(c.requestedQuantity, l.unit)}</span>
        <span className="t-title-md text-ink [overflow-wrap:anywhere]">{l.title}</span>
      </p>
      <p className="mt-0.5 text-ink-soft t-mono-sm">
        #{l.tokenNumber} · pickup by {time(l.pickupDeadline)} · {donorName(l)}
      </p>

      <div className="mt-4">
        {assignedTo ? (
          <motion.p {...fade} ref={resultRef} tabIndex={-1} className="rounded-stamp text-ink-soft t-body">
            {assignedTo} will collect it. They have been told.
          </motion.p>
        ) : closed ? (
          <p className="flex items-start gap-2 text-turmeric-deep t-body">
            <InfoIcon size={18} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
            Pickup time has passed, so no run can be assigned.
          </p>
        ) : (
          <Button icon={BicycleIcon} onClick={onAssign}>
            Assign volunteer
          </Button>
        )}
      </div>
    </article>
  );
}

/** A printed tally of what is open right now, with a way to the approvals. */
function RightNow({ figures: f }) {
  const n = (key) => (f ? String(f[key]) : null);
  const pending = f?.pendingAccounts ?? 0;
  // (The link to Approvals sits under the queue heading.)

  return (
    <div className="max-w-[420px] @[860px]:pt-1">
      <ReceiptTimeline
        title="Right now"
        heading={`Printed ${time(new Date())}`}
        headingLevel={2}
        entries={[
          { label: 'No volunteer', value: n('awaitingVolunteer'), emphasis: (f?.awaitingVolunteer ?? 0) > 0 },
          { label: 'On the way', value: n('runsOnTheWay') },
          { label: 'Open tokens', value: n('openListings') },
          { label: 'To approve', value: n('pendingAccounts'), emphasis: pending > 0 },
        ]}
        footer="Whole campus"
      />
    </div>
  );
}
