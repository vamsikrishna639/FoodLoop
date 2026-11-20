// The donor's queue of incoming requests, shown on the Board under the
// chalkboard.
//
//   Requests   2 WAITING
//   +--------------------------------------------+
//   | Ananya Rao                       APPROVED  |  <- the stamp drops here
//   | Asha Night Shelter · 12 min ago            |
//   | 6 PACKETS   Veg Grilled Sandwiches         |
//   | #FL-0004 · 12 LEFT                         |
//   | [ Approve ]  [ Turn down ]                 |
//   +--------------------------------------------+
//   Decided earlier
//   Farhan Sheikh  3 kg · Dal Tadka     REJECTED
//
// A request decided on this visit stays where it was, with its stamp, so
// the donor sees the result in place. Next visit it moves to "Decided
// earlier". The APPROVED stamp drop (the app's signature moment) plays only
// on the slip that was just approved.
import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon, InfoIcon, XIcon } from '@phosphor-icons/react';
import * as claimsApi from '../../api/claims';
import Button from '../../components/Button';
import { ErrorState } from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StampDrop from '../../components/StampDrop';
import StatusStamp from '../../components/StatusStamp';
import { useSlip } from '../../context/ToastContext';
import useFocusWhen from '../../hooks/useFocusWhen';
import { claimStamp, listingIdOf, listingOf, recipientName, recipientOrg } from '../../lib/claim';
import { ago, quantity, time } from '../../lib/format';
import { available, isOpen } from '../../lib/listing';
import { DURATION, EASE } from '../../lib/motion';

/** How many earlier decisions are listed under the queue. */
const EARLIER_SHOWN = 4;

/**
 * claims:           useClaims({ incoming: true })
 * listingFor(id):   the Board's own copy of a listing (fresher than the one
 *                   inside the claim: it is updated after every approval)
 * onListingChange:  called with a listing the server just changed
 * onStale:          read listings and requests again after a refusal
 */
export default function RequestQueue({ claims, listingFor, onListingChange, onStale }) {
  const showSlip = useSlip();
  const [decidedHere, setDecidedHere] = useState(() => new Set());
  const [dropId, setDropId] = useState(null); // the slip whose stamp drops
  const [busy, setBusy] = useState(null); // { id, action: 'approve' | 'reject' }
  const [toReject, setToReject] = useState(null);
  const [lastDecided, setLastDecided] = useState(null); // its decision line takes the focus

  // A decided slip keeps its place for this visit, and focus moves to its
  // new decision line (the button that had focus is gone).
  const keepInPlace = (id) => {
    setDecidedHere((set) => new Set(set).add(id));
    setLastDecided(id);
  };

  async function approve(c) {
    setBusy({ id: c.id, action: 'approve' });
    try {
      const data = await claimsApi.approve(c.id);
      claims.upsert(data.claim);
      onListingChange(data.claim.listingId); // fewer portions left now
      keepInPlace(c.id);
      setDropId(c.id);
      showSlip(data.message); // "Approved 6 packets of Veg Grilled Sandwiches"
    } catch (error) {
      // e.g. 400 "Only 2 boxes left, but this request asks for 6 boxes",
      // "This request has already been decided", or a listing that closed.
      showSlip(error.message, { kind: 'error' });
      onStale();
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    const c = toReject;
    setBusy({ id: c.id, action: 'reject' });
    try {
      const data = await claimsApi.reject(c.id);
      claims.upsert(data.claim);
      keepInPlace(c.id);
      showSlip(data.message);
    } catch (error) {
      showSlip(error.message, { kind: 'error' });
      onStale();
    } finally {
      setBusy(null);
      setToReject(null);
    }
  }

  const items = claims.items;
  const waiting = items?.filter((c) => c.status === 'pending').length;

  let body;
  if (items === null && claims.error) {
    body = <ErrorState message={claims.error} onRetry={claims.load} />;
  } else if (items === null) {
    body = <p className="text-ink-soft t-mono">Reading the requests...</p>;
  } else {
    const queue = items.filter((c) => c.status === 'pending' || decidedHere.has(c.id));
    const earlier = items.filter((c) => c.status !== 'pending' && !decidedHere.has(c.id)).slice(0, EARLIER_SHOWN);
    body = (
      <>
        {queue.length === 0 ? (
          <p className="max-w-[60ch] text-ink-soft t-body-lg">
            Nobody is waiting. New requests line up here as soon as they are sent.
          </p>
        ) : (
          <ul className="space-y-3">
            {queue.map((c) => (
              <li key={c.id}>
                <RequestSlip
                  claim={c}
                  listing={listingFor(listingIdOf(c)) || listingOf(c)}
                  drop={dropId === c.id}
                  focusResult={lastDecided === c.id}
                  busy={busy?.id === c.id ? busy.action : null}
                  locked={Boolean(busy)}
                  onApprove={() => approve(c)}
                  onReject={() => setToReject(c)}
                />
              </li>
            ))}
          </ul>
        )}

        {earlier.length > 0 && (
          <div className="mt-8">
            <h3 className="t-title-md text-ink">Decided earlier</h3>
            <ul className="mt-1">
              {earlier.map((c) => (
                <EarlierLine key={c.id} claim={c} />
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="queue-title">
      {/* The count sits beside the heading, never above it. */}
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* tabIndex -1: the Board's "go to requests" link moves focus here. */}
        <h2 id="queue-title" tabIndex={-1} className="scroll-mt-6 rounded-stamp t-headline-md text-ink">
          Requests
        </h2>
        {waiting !== undefined && (
          <p className="text-ink-soft t-mono-sm">
            {waiting === 0 ? 'None waiting' : `${waiting} waiting`}
          </p>
        )}
      </div>
      {body}

      {/* A turned-down request cannot be reopened, so it asks first. */}
      <Modal open={Boolean(toReject)} onClose={() => !busy && setToReject(null)} labelledBy="reject-title">
        {toReject && (
          <div className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
            <h2 id="reject-title" className="t-headline-md text-ink">
              Turn this request down?
            </h2>
            <p className="mt-2 max-w-[52ch] text-ink t-body-lg">
              {recipientName(toReject)} asked for{' '}
              {quantity(toReject.requestedQuantity, listingOf(toReject).unit)} of {listingOf(toReject).title}. They will
              be told it was not approved.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="accent"
                icon={XIcon}
                loading={busy?.action === 'reject'}
                loadingLabel="Turning down"
                onClick={reject}
              >
                Turn down
              </Button>
              <Button variant="text" disabled={Boolean(busy)} onClick={() => setToReject(null)}>
                Keep it
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/** One request: who, how much of what, and Approve / Turn down while it is pending. */
function RequestSlip({ claim: c, listing: l, drop, focusResult, busy, locked, onApprove, onReject }) {
  const resultRef = useRef(null);
  useFocusWhen(resultRef, focusResult && c.status !== 'pending');
  const pending = c.status === 'pending';
  const left = available(l);
  const closed = !isOpen(l);
  const short = pending && c.requestedQuantity > left;
  const who = [recipientOrg(c), ago(c.createdAt)].filter(Boolean).join(' · ');

  // Approve is offered only when it can succeed; the server checks again,
  // atomically, either way. The note says why it is missing.
  let warning = null;
  if (pending && closed) warning = 'Pickup has closed, so this can only be turned down.';
  else if (short)
    warning =
      left === 0
        ? 'Every portion is already reserved, so this can only be turned down.'
        : `Only ${quantity(left, l.unit)} left, fewer than this request asks for, so it can only be turned down.`;

  return (
    <article
      aria-label={`${recipientName(c)} asks for ${quantity(c.requestedQuantity, l.unit)} of ${l.title}`}
      className="rounded-sharp border border-line bg-surface p-4"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="t-title-lg text-ink [overflow-wrap:anywhere]">{recipientName(c)}</h3>
          <p className="mt-0.5 text-ink-soft t-body-sm">{who}</p>
        </div>
        {!pending && (
          <div className="shrink-0 pr-1 pt-1">
            {c.status === 'approved' ? (
              // Only approval drops; other decisions just appear.
              <StampDrop play={drop}>
                <StatusStamp kind="approved" size="lg" />
              </StampDrop>
            ) : (
              <FadeIn>
                <StatusStamp kind={claimStamp(c)} size="lg" />
              </FadeIn>
            )}
          </div>
        )}
      </div>

      {/* What they asked for: the amount in mono, like a token stub. */}
      <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
        <span className="t-mono-lg uppercase text-ink">{quantity(c.requestedQuantity, l.unit)}</span>
        <span className="t-title-md text-ink [overflow-wrap:anywhere]">{l.title}</span>
      </p>
      <p className="mt-0.5 text-ink-soft t-mono-sm">
        #{l.tokenNumber} · {closed ? 'pickup closed' : `${left} left`}
      </p>
      {c.note && <p className="mt-2 max-w-[60ch] text-ink t-body">&ldquo;{c.note}&rdquo;</p>}

      <div className="mt-4">
        {pending ? (
          <>
            {warning && (
              <p className="mb-3 flex items-start gap-2 text-turmeric-deep t-body">
                <InfoIcon size={18} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
                {warning}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {!warning && (
                <Button
                  icon={CheckIcon}
                  loading={busy === 'approve'}
                  loadingLabel="Approving"
                  disabled={locked}
                  onClick={onApprove}
                >
                  Approve
                </Button>
              )}
              <Button variant="outline" icon={XIcon} disabled={locked} onClick={onReject}>
                Turn down
              </Button>
            </div>
          </>
        ) : (
          // The buttons give way to the decision, printed in place.
          <FadeIn>
            <p ref={resultRef} tabIndex={-1} className="rounded-stamp text-ink-soft t-body">
              {decidedLine(c, l.unit)}
            </p>
          </FadeIn>
        )}
      </div>
    </article>
  );
}

/** "6 packets reserved at 12:52 PM. An admin assigns a volunteer next." */
function decidedLine(c, unit) {
  const at = c.decidedAt ? ` at ${time(c.decidedAt)}` : '';
  if (c.status === 'approved') return `${quantity(c.requestedQuantity, unit)} reserved${at}. An admin assigns a volunteer next.`;
  if (c.status === 'rejected') return `Turned down${at}. ${recipientName(c)} has been told.`;
  return `Cancelled by ${recipientName(c)}.`;
}

/** A 120ms fade, for things that change in place (no movement). */
function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.fast, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

/** A request decided before this visit: one compact line. */
function EarlierLine({ claim: c }) {
  const l = listingOf(c);
  return (
    <li className="flex items-center gap-3 border-b border-line py-3">
      <div className="min-w-0 flex-1">
        <p className="t-title-sm text-ink [overflow-wrap:anywhere]">{recipientName(c)}</p>
        <p className="text-ink-soft t-body-sm [overflow-wrap:anywhere]">
          {quantity(c.requestedQuantity, l.unit)} · {l.title}
        </p>
      </div>
      <StatusStamp kind={claimStamp(c)} size="sm" />
    </li>
  );
}
