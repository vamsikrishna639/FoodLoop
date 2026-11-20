// The volunteer's home: their runs, each printed as a pickup slip with one
// large button for the next step.
//
//     Chicken Biryani                         ASSIGNED
//     PICKUP SLIP  #FL-0003
//     ----------------------------------------
//     Carry ............................ 8 boxes
//     From ........ Main Block Canteen, Counter 2
//     To ..................... Ananya Rao, Asha...
//     Phone ......................... 9000000003
//     Pickup by ............... Today, 4:30 PM
//     Assigned ................ Today, 12:58 PM
//     Picked up .......................... --:--
//     Delivered .......................... --:--
//     [            I've collected it            ]
//     Can't do this run
//
// Tabs: Assigned / On the way / Delivered. A run moved on during this visit
// stays in the tab it was in (new stamp, next button), so it never jumps
// away mid-task. Runs handed back earlier are not listed.
//
// Wide content (820px or more, a container query): the volunteer's own
// tally stands beside the runs. Narrower: one printed line under the
// Delivered tab, so the first run's button stays near the top on a phone.
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckIcon, ClockIcon, PackageIcon } from '@phosphor-icons/react';
import { dashboard } from '../../api/dashboard';
import * as pickupsApi from '../../api/pickups';
import Button from '../../components/Button';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import FadeUp from '../../components/FadeUp';
import ImpactNumber from '../../components/ImpactNumber';
import Modal from '../../components/Modal';
import PageFrame from '../../components/PageFrame';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import SkeletonToken from '../../components/SkeletonToken';
import StatusStamp from '../../components/StatusStamp';
import { formatLeft } from '../../components/DeadlineClock';
import { useLiveBeat } from '../../context/LiveContext';
import { useSlip } from '../../context/ToastContext';
import useFocusWhen from '../../hooks/useFocusWhen';
import useLiveList from '../../hooks/useLiveList';
import { day, dayTime, quantity, time } from '../../lib/format';
import { DURATION, EASE } from '../../lib/motion';

/** The three tabs, by the pickup status they list. */
const TABS = [
  { status: 'assigned', label: 'Assigned' },
  { status: 'picked_up', label: 'On the way' },
  { status: 'delivered', label: 'Delivered' },
];

const HOUR_MS = 60 * 60 * 1000;

export default function Pickups() {
  const showSlip = useSlip();
  const fetchRuns = useCallback(async () => (await pickupsApi.mine()).pickups, []);
  const runs = useLiveList(fetchRuns);
  const [tab, setTab] = useState('assigned');
  const tabPicked = useRef(false); // the opening tab is chosen once
  const [movedHere, setMovedHere] = useState(() => new Map()); // run id -> the tab it stays in
  const [lastMoved, setLastMoved] = useState(null); // focus follows this run's next step
  const [busy, setBusy] = useState(null); // run id while its change is saving
  const [toHandBack, setToHandBack] = useState(null);
  const [figures, setFigures] = useState(null);
  const animatedIn = useRef(false);

  // The volunteer's own numbers (rule 4: only delivered runs count).
  const loadFigures = useCallback(() => {
    dashboard()
      .then((data) => setFigures(data.figures))
      .catch(() => {}); // the tally simply waits for the next try
  }, []);
  useEffect(() => {
    loadFigures();
  }, [loadFigures]);
  useLiveBeat(loadFigures);

  const all = runs.items;

  // Which tab a run is listed under. Handed-back runs are only listed when
  // they were handed back on this visit (in the tab they were in).
  const tabOf = (r) => movedHere.get(r.id) ?? (r.pickupStatus === 'cancelled' ? null : r.pickupStatus);
  const inTab = (status) => (all || []).filter((r) => tabOf(r) === status);

  // Open on the tab with work in it: nothing assigned but a run in the bag
  // starts on "On the way". Done once, so it never overrides the volunteer.
  useEffect(() => {
    if (tabPicked.current || all === null) return;
    tabPicked.current = true;
    const waiting = all.filter((r) => r.pickupStatus === 'assigned').length;
    const carrying = all.filter((r) => r.pickupStatus === 'picked_up').length;
    if (waiting === 0 && carrying > 0) setTab('picked_up');
  }, [all]);

  const shown = inTab(tab);
  const animate = !animatedIn.current && all !== null && shown.length > 0;
  useEffect(() => {
    if (all?.length) animatedIn.current = true;
  }, [all]);

  async function move(run, status) {
    setBusy(run.id);
    try {
      const data = await pickupsApi.setStatus(run.id, status);
      // The run keeps its place in this tab for the rest of the visit.
      setMovedHere((map) => new Map(map).set(run.id, tabOf(run)));
      runs.upsert(data.pickup);
      setLastMoved(run.id);
      if (status === 'delivered') loadFigures(); // the tally just grew
      showSlip(data.message, { kind: status === 'cancelled' ? 'note' : 'done' });
    } catch (err) {
      // e.g. 400 "This pickup changed a moment ago. Refresh and try again".
      showSlip(err.message, { kind: 'error' });
      runs.load(); // show the truth
    } finally {
      setBusy(null);
      setToHandBack(null);
    }
  }

  let list;
  if (all === null && runs.error) {
    list = <ErrorState message={runs.error} onRetry={runs.load} />;
  } else if (all === null) {
    list = <SkeletonToken />;
  } else if (shown.length === 0) {
    list = {
      assigned: (
        <EmptyState
          art="clock"
          title="No runs waiting"
          message="When the admin gives you a pickup it prints here, with where to collect it and who it is for."
        />
      ),
      picked_up: (
        <EmptyState art="plate" title="Nothing in your bag" message="Runs you have collected and not yet handed over show here." />
      ),
      delivered: (
        <EmptyState art="slip" title="No deliveries yet" message="Every run you complete is kept here as a record." />
      ),
    }[tab];
  } else {
    list = (
      <ul className="space-y-10">
        {shown.map((r, i) => (
          <li key={r.id}>
            <FadeUp index={i} animate={animate}>
              <RunSlip
                run={r}
                busy={busy === r.id}
                locked={Boolean(busy)}
                focusNext={lastMoved === r.id}
                onMove={(status) => move(r, status)}
                onHandBack={() => setToHandBack(r)}
              />
            </FadeUp>
          </li>
        ))}
      </ul>
    );
  }

  const tallyLine =
    figures &&
    `${figures.runsDelivered} ${figures.runsDelivered === 1 ? 'run' : 'runs'} delivered · ${figures.portionsCarried} portions carried`;

  return (
    <PageFrame
      title="Pickups"
      maxWidth="max-w-[960px]"
      // On phones the caption is left out, so the first run's button is on
      // screen without scrolling; the button labels explain each step.
      caption={<span className="hidden tablet:inline">Collect from the canteen counter, hand it over, and tap the button at each step.</span>}
    >
      <div className="@container">
        <div className="grid items-start gap-10 @[820px]:grid-cols-[minmax(0,560px)_240px] @[820px]:gap-12">
          {/* A slip wider than 560px only stretches the button and the leaders. */}
          <div className="min-w-0 max-w-[560px]">
            <RunTabs
              tab={tab}
              countOf={(status) => (all === null ? null : inTab(status).length)}
              onPick={(status) => {
                tabPicked.current = true;
                setTab(status);
              }}
            />
            {/* Narrow: the tally is a record, so it prints under Delivered only. */}
            {tab === 'delivered' && tallyLine && <p className="mt-2 text-ink-soft t-mono-sm @[820px]:hidden">{tallyLine}</p>}
            <div className="mt-6">{list}</div>
          </div>

          <aside aria-label="Your tally" className="hidden pt-16 @[820px]:block">
            {figures && (
              <>
                <ImpactNumber value={figures.portionsCarried} caption="Portions you carried" />
                <p className="mt-3 text-ink-soft t-body">
                  {figures.runsDelivered === 0
                    ? 'Your first delivery will count here.'
                    : `Over ${figures.runsDelivered} ${figures.runsDelivered === 1 ? 'run' : 'runs'}. Only food that reached someone is counted.`}
                </p>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Handing back cannot be undone by the volunteer, so it asks first. */}
      <Modal open={Boolean(toHandBack)} onClose={() => !busy && setToHandBack(null)} labelledBy="handback-title">
        {toHandBack && (
          <div className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
            <h2 id="handback-title" className="t-headline-md text-ink">
              Hand this run back?
            </h2>
            <p className="mt-2 max-w-[52ch] text-ink t-body-lg">
              The admin will give {toHandBack.listing.title} for {toHandBack.recipient.name} to another volunteer. The
              food stays reserved for them.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="accent"
                loading={busy === toHandBack.id}
                loadingLabel="Handing back"
                onClick={() => move(toHandBack, 'cancelled')}
              >
                Hand back
              </Button>
              <Button variant="text" disabled={Boolean(busy)} onClick={() => setToHandBack(null)}>
                Keep it
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageFrame>
  );
}

/** One run as a pickup slip, with the next step underneath. */
function RunSlip({ run: r, busy, locked, focusNext, onMove, onHandBack }) {
  const l = r.listing;
  const at = (date) => (date ? dayTime(date) : null);
  const to = r.recipient.organization ? `${r.recipient.name}, ${r.recipient.organization}` : r.recipient.name;
  const cancelled = r.pickupStatus === 'cancelled';

  // The deadline comes straight after what to carry (it is the most
  // important fact while collecting); once the food is on the way, where
  // it goes (To) is the line in bold.
  const collecting = r.pickupStatus === 'assigned';
  const entries = [
    { label: 'Carry', value: quantity(r.claim.requestedQuantity, l.unit), emphasis: true },
    { label: 'Pickup by', value: dayTime(l.pickupDeadline), emphasis: collecting },
    { label: 'From', value: l.location },
    { label: 'To', value: to, emphasis: r.pickupStatus === 'picked_up' },
  ];
  if (r.recipient.phone) {
    // A real phone link: one tap to call from the road.
    entries.push({
      label: 'Phone',
      value: (
        <a href={`tel:${r.recipient.phone.replace(/\s/g, '')}`} className="underline underline-offset-4">
          {r.recipient.phone}
        </a>
      ),
    });
  }
  entries.push(
    { label: 'Assigned', value: at(r.assignedAt) },
    { label: 'Picked up', value: at(r.pickedUpAt), emphasis: r.pickupStatus === 'picked_up' },
    { label: 'Delivered', value: at(r.deliveredAt), emphasis: r.pickupStatus === 'delivered' }
  );

  return (
    <article aria-label={`Pickup of ${l.title} for ${r.recipient.name}`}>
      <ReceiptTimeline
        title={l.title}
        heading="Pickup slip"
        reference={`#${l.tokenNumber}`}
        headingLevel={2}
        // A short fade when the stamp changes. The stamp drop is kept for
        // the canteen approving a request.
        stamp={
          <Swap id={r.pickupStatus}>
            {cancelled ? <StatusStamp label="Handed back" ink="text-stamp-grey" /> : <StatusStamp kind={r.pickupStatus} />}
          </Swap>
        }
        entries={entries}
      />
      {r.claim.note && (
        <p className="mt-3 px-1 text-ink t-body">
          Note from {r.recipient.name}: &ldquo;{r.claim.note}&rdquo;
        </p>
      )}
      <div className="mt-4">
        <Swap id={r.pickupStatus}>
          <NextStep run={r} busy={busy} locked={locked} focusNext={focusNext} onMove={onMove} onHandBack={onHandBack} />
        </Swap>
      </div>
    </article>
  );
}

/** The one large button for the next step, or a closing line. */
function NextStep({ run: r, busy, locked, focusNext, onMove, onHandBack }) {
  // After a step, focus moves to what replaced the button: the next button,
  // or the closing line.
  const nextRef = useRef(null);
  useFocusWhen(nextRef, focusNext);

  if (r.pickupStatus === 'delivered') {
    return (
      <p ref={nextRef} tabIndex={-1} className="rounded-stamp px-1 text-ink-soft t-body">
        Delivered{r.deliveredAt ? ` ${day(r.deliveredAt) === 'Today' ? 'at' : 'on'} ${day(r.deliveredAt) === 'Today' ? time(r.deliveredAt) : dayTime(r.deliveredAt)}` : ''}. Thank you for the run.
      </p>
    );
  }
  if (r.pickupStatus === 'cancelled') {
    return (
      <p ref={nextRef} tabIndex={-1} className="rounded-stamp px-1 text-ink-soft t-body">
        Handed back. The admin will find someone else.
      </p>
    );
  }

  const collecting = r.pickupStatus === 'assigned';
  // Only collecting is tied to the canteen's deadline.
  const msLeft = new Date(r.listing.pickupDeadline).getTime() - Date.now();
  let warning = null;
  if (collecting && msLeft <= 0) warning = 'Pickup time has passed. Check with the canteen that the food is still there.';
  else if (collecting && msLeft <= HOUR_MS) warning = `The counter closes this in ${formatLeft(msLeft)}.`;

  return (
    <div>
      {warning && (
        <p className="mb-3 flex items-start gap-2 px-1 text-turmeric-deep t-body">
          <ClockIcon size={18} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          {warning}
        </p>
      )}
      <Button
        ref={nextRef}
        // Ink for both steps: red is kept for actions that cost something
        // (handing back, turning down).
        variant="ink"
        icon={collecting ? PackageIcon : CheckIcon}
        expand
        className="min-h-14"
        loading={busy}
        loadingLabel={collecting ? 'Saving' : 'Delivering'}
        disabled={locked && !busy}
        onClick={() => onMove(collecting ? 'picked_up' : 'delivered')}
      >
        {collecting ? 'I’ve collected it' : 'Mark delivered'}
      </Button>
      {collecting ? (
        <Button variant="text" className="mt-2 -ml-2" disabled={locked} onClick={onHandBack}>
          Can’t do this run
        </Button>
      ) : (
        <p className="mt-3 px-1 text-ink-soft t-body">Hand it to {r.recipient.name}, then tap the button.</p>
      )}
    </div>
  );
}

/**
 * The three tabs as one strip of equal parts, so they fit on one row on a
 * 360px phone (label over count). The chosen part is filled with ink and
 * its label is bold, so it does not depend on colour alone. Colours only
 * change (no motion): these are tapped often.
 */
function RunTabs({ tab, countOf, onPick }) {
  return (
    <div className="-mt-2 grid max-w-[420px] grid-cols-3 overflow-hidden rounded-control border border-ink" role="group" aria-label="Show runs">
      {TABS.map((t, i) => {
        const selected = tab === t.status;
        const count = countOf(t.status);
        return (
          <button
            key={t.status}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(t.status)}
            className={`flex min-h-14 flex-col items-center justify-center px-1 py-1.5 transition-colors duration-[120ms] focus-visible:outline-offset-[-4px] ${
              i > 0 ? 'border-l border-ink' : ''
            } ${selected ? 'bg-ink text-paper' : 'bg-surface text-ink hover:bg-sunken'}`}
          >
            <span className={`t-label-lg ${selected ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            {count !== null && <span className="t-mono-sm">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A 120-200ms fade when `id` changes (opacity only: things change in place). */
function Swap({ id, children }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}
