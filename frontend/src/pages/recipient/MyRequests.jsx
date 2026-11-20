// My requests: every request the recipient has made, each printed as a
// receipt that fills in as it moves along.
//
//     Chicken Biryani                       APPROVED
//     REQUEST RECEIPT  #FL-0003
//     ----------------------------------------
//     Asked for ........................ 8 boxes
//     Requested ............... Today, 12:40 PM
//     Approved ................ Today, 12:52 PM
//     Pickup by ................ Today, 4:30 PM
//     Volunteer ......................... --:--
//     Picked up ......................... --:--
//     Delivered ......................... --:--
//
// Active: pending and approved requests still under way. Past: delivered,
// turned down, cancelled, and pending ones whose pickup closed.
// Narrow: one column. With room for two receipts (a 620px container), two
// columns, every second receipt set a little lower, like slips pinned to a
// board. It stays one list in date order, so the reading and Tab order
// match what is on screen (newest first, left to right).
// The switch is a container query (@container): it depends on the room the
// page has, not the window (the sidebar and activity rail take part of it).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { XCircleIcon } from '@phosphor-icons/react';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import FadeUp from '../../components/FadeUp';
import FilterTag from '../../components/FilterTag';
import PageFrame from '../../components/PageFrame';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import SkeletonToken from '../../components/SkeletonToken';
import StatusStamp from '../../components/StatusStamp';
import useClaims from '../../hooks/useClaims';
import { canCancel, claimStamp, isActive, listingOf, nextStep } from '../../lib/claim';
import { dayTime, quantity } from '../../lib/format';
import CancelRequest from './CancelRequest';

export default function MyRequests() {
  const claims = useClaims();
  const navigate = useNavigate();
  const [showPast, setShowPast] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const pastTag = useRef(null); // focus goes here after a cancel (the receipt moved to Past)
  const [cancelCount, setCancelCount] = useState(0);
  const animatedIn = useRef(false); // the receipts fade up on the first load only

  // After each cancel the Past tag (with its new count) takes the focus.
  // This runs after the render that closes the dialog, plus one tick, so
  // the page is no longer inert.
  useEffect(() => {
    if (!cancelCount) return undefined;
    const id = setTimeout(() => pastTag.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [cancelCount]);

  const all = claims.items;
  const active = (all || []).filter(isActive);
  const past = (all || []).filter((c) => !isActive(c));
  const shown = showPast ? past : active;

  const animate = !animatedIn.current && all !== null && shown.length > 0;
  useEffect(() => {
    if (all?.length) animatedIn.current = true;
  }, [all]);

  let body;
  if (all === null && !claims.error) {
    body = (
      <div className="max-w-[420px] space-y-6">
        <SkeletonToken />
        <SkeletonToken />
      </div>
    );
  } else if (all === null) {
    body = <ErrorState message={claims.error} onRetry={claims.load} />;
  } else if (shown.length === 0) {
    body = showPast ? (
      <EmptyState
        art="slip"
        title="No old receipts"
        message="Delivered, turned-down and cancelled requests are kept here as a record."
      />
    ) : (
      <EmptyState
        art="plate"
        title="Nothing on order"
        message="Open a token on the counter, pick how much you need and send a request. Its receipt prints here."
        actionLabel="Go to the counter"
        onAction={() => navigate('/home')}
      />
    );
  } else {
    // Each column needs about 300px so a receipt's times stay on one line.
    // The offset is a transform (it does not move anything else), so the
    // list gets extra room at the bottom for the last lowered receipt.
    body = (
      <div className="@container">
        <ul className="grid max-w-[460px] items-start gap-8 @[620px]:max-w-none @[620px]:grid-cols-2 @[620px]:gap-x-6 @[620px]:pb-10">
          {shown.map((c, i) => (
            <li key={c.id} className="@[620px]:even:translate-y-10">
              <FadeUp index={i} animate={animate}>
                <RequestReceipt claim={c} onCancel={() => setCancelling(c)} />
              </FadeUp>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const count = (list) => (all === null ? '' : ` ${list.length}`);

  return (
    <PageFrame
      title="My requests"
      maxWidth="max-w-[920px]"
      caption="Each request prints a receipt that fills in as the canteen decides and a volunteer brings it over."
    >
      <div className="-mt-2 mb-6 flex flex-wrap gap-x-2">
        <FilterTag label={`Active${count(active)}`} selected={!showPast} onClick={() => setShowPast(false)} />
        <FilterTag
          ref={pastTag}
          label={`Past${count(past)}`}
          selected={showPast}
          onClick={() => setShowPast(true)}
        />
      </div>
      {body}

      <CancelRequest
        claim={cancelling}
        onClose={() => setCancelling(null)}
        onCancelled={(claim) => {
          claims.upsert(claim);
          setCancelCount((n) => n + 1); // the receipt left this tab: focus the Past tag
        }}
      />
    </PageFrame>
  );
}

/** One request as a receipt, with what happens next and Cancel underneath. */
function RequestReceipt({ claim: c, onCancel }) {
  const l = listingOf(c);
  const p = c.pickup;
  const at = (date) => (date ? dayTime(date) : null);

  // The receipt prints only the steps this request can still reach.
  const entries = [
    { label: 'Asked for', value: quantity(c.requestedQuantity, l.unit), emphasis: true },
    { label: 'Requested', value: dayTime(c.createdAt) },
  ];
  if (c.status === 'rejected') {
    entries.push({ label: 'Turned down', value: at(c.decidedAt), emphasis: true });
  } else if (c.status === 'cancelled') {
    if (c.decidedAt) entries.push({ label: 'Approved', value: at(c.decidedAt) });
    entries.push({ label: 'Cancelled', value: at(c.cancelledAt), emphasis: true });
  } else {
    entries.push(
      { label: 'Approved', value: at(c.decidedAt) },
      { label: 'Pickup by', value: dayTime(l.pickupDeadline) },
      { label: 'Volunteer', value: p?.volunteerName || null },
      { label: 'Picked up', value: at(p?.pickedUpAt) },
      { label: 'Delivered', value: at(p?.deliveredAt), emphasis: p?.pickupStatus === 'delivered' }
    );
  }

  return (
    <article aria-label={`Request for ${l.title}`}>
      <ReceiptTimeline
        title={l.title}
        heading="Request receipt"
        reference={`#${l.tokenNumber}`}
        stamp={<StatusStamp kind={claimStamp(c)} />}
        entries={entries}
        headingLevel={2}
      />
      <p className="mt-3 px-1 text-ink-soft t-body">{nextStep(c)}</p>
      {c.note && <p className="mt-1 px-1 text-ink t-body-sm">Your note: &ldquo;{c.note}&rdquo;</p>}
      {canCancel(c) && isActive(c) && (
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Cancel request for ${l.title}`}
          className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-control px-1 text-chilli-deep t-label-lg underline-offset-4 hover:underline"
        >
          <XCircleIcon size={20} weight="bold" aria-hidden="true" />
          Cancel request
        </button>
      )}
    </article>
  );
}
