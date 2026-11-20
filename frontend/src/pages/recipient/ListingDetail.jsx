// Listing detail: everything a recipient needs before asking for food.
//
// ListingDetailView is the content. It is used in two places:
//   - ListingPage, the full page on phones (/home/listing/:id), which the
//     token card flies into (a View Transition; skipped under reduced motion);
//   - the side panel next to the list on tablets and desktops.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { ArrowLeftIcon, FirstAidKitIcon } from '@phosphor-icons/react';
import { get } from '../../api/foods';
import DeadlineClock from '../../components/DeadlineClock';
import { ErrorState } from '../../components/EmptyState';
import PortionMeter from '../../components/PortionMeter';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import SkeletonToken from '../../components/SkeletonToken';
import StatusStamp from '../../components/StatusStamp';
import TokenCard from '../../components/TokenCard';
import { dayTime, quantity, time } from '../../lib/format';
import { available, canRequest, donorName, isExpired, isOpen, stampOf } from '../../lib/listing';
import RequestFood from './RequestFood';

// claims: the recipient's requests (useClaims), so the request area knows
// whether this token was already asked for. onListingChange: called with a
// fresher copy of the listing (after a cancel or a refusal).
export function ListingDetailView({ listing: l, inPanel = false, claims, onListingChange }) {
  // Page outline: on the phone page the token is the page's h1 and the
  // sections are h2; in the side panel (under "Today's Counter") the token
  // is an h2 and the sections are h3.
  const level = inPanel ? 3 : 2;
  const Section = `h${level}`;
  const requestArea = (
    <RequestFood listing={l} claims={claims} onListingChange={onListingChange} headingLevel={level} />
  );
  return (
    <div>
      {inPanel ? (
        <PanelHeading listing={l} />
      ) : (
        // The same slip as in the list, so the eye keeps its place.
        <TokenCard listing={l} stamp={stampOf(l)} transitionName={`token-${l.id}`} headingLevel={1} />
      )}

      {l.description && <p className="mt-6 max-w-[60ch] text-ink t-body-lg">{l.description}</p>}

      {/* The facts, printed like a receipt. */}
      <ReceiptTimeline
        className="mt-6"
        title={l.location}
        heading="Collect from"
        headingLevel={level}
        reference={`#${l.tokenNumber}`}
        entries={[
          { label: 'Prepared', value: dayTime(l.preparedAt) },
          { label: 'Pickup by', value: dayTime(l.pickupDeadline), emphasis: true },
          { label: 'Posted', value: quantity(l.quantity, l.unit) },
          { label: 'Left', value: quantity(available(l), l.unit), emphasis: true },
        ]}
      />

      <Section className="mt-6 t-title-lg text-ink">Allergens</Section>
      <p className="mt-1 text-ink t-body-lg">{l.allergenNotes || 'None declared by the canteen.'}</p>

      {/* The request area: the form, or the recipient's own request. A
          token nobody can ask for says why in plain words (unless the
          recipient's own request is shown instead). */}
      <div className="mt-6">
        {requestArea}
        {!canRequest(l) && !claims.openFor(l.id) && <ClosedNote listing={l} level={level} />}
      </div>

      <SafetyNote level={level} />
    </div>
  );
}

/** The top of the side panel: name, canteen, the countdown and portions. */
function PanelHeading({ listing: l }) {
  return (
    <div>
      <h2 className="t-headline-md text-ink">{l.title}</h2>
      <p className="mt-1 text-ink-soft t-body">
        {donorName(l)} · #{l.tokenNumber}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        {isOpen(l) ? <DeadlineClock deadline={l.pickupDeadline} /> : <StatusStamp kind={stampOf(l)} />}
        <PortionMeter total={l.quantity} reserved={l.reservedQuantity || 0} unit={l.unit} />
      </div>
    </div>
  );
}

/** Why a token cannot be requested, in plain words. */
function ClosedNote({ listing: l, level }) {
  const Heading = `h${level}`;
  let title = 'Every portion is spoken for';
  let body = 'Approved requests have reserved all of it. If one is cancelled, it comes back here.';
  if (l.status === 'completed') {
    title = 'All handed out';
    body = 'This token has been collected and delivered.';
  } else if (isExpired(l)) {
    title = 'Pickup has closed';
    body = `The deadline passed at ${time(l.pickupDeadline)}, so this token is off the counter.`;
  }
  return (
    <div>
      <Heading className="t-title-lg text-ink">{title}</Heading>
      <p className="mt-1 text-ink-soft t-body-lg">{body}</p>
    </div>
  );
}

/** The food-safety reminder. A deadline alone does not make food safe. */
function SafetyNote({ level }) {
  const Heading = `h${level}`;
  return (
    <aside aria-label="Food safety" className="mt-6 flex gap-3 rounded-control border border-line bg-sunken p-4">
      <FirstAidKitIcon size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-ink" />
      <div>
        <Heading className="t-title-md text-ink">Check before you serve</Heading>
        <p className="mt-1 text-ink t-body">
          Look at and smell the food when you collect it, and read the allergens above. A pickup deadline is not a
          promise that food is safe to eat. If anything seems off, do not serve it.
        </p>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Full page on phones: /home/listing/:id
// ---------------------------------------------------------------------------

export function ListingPage({ id, cached, onFresh, claims }) {
  const reduced = useReducedMotion();
  // Show the copy already in the counter straight away (so the card has
  // something to land on), then fetch a fresh one.
  const [listing, setListing] = useState(cached || null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    get(id)
      .then((data) => {
        setListing(data.listing);
        onFresh?.(data.listing);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  let body;
  // A fresher copy (after a cancel or a refusal) updates this page and the counter.
  const changed = (fresh) => {
    setListing(fresh);
    onFresh?.(fresh);
  };

  if (listing) body = <ListingDetailView listing={listing} claims={claims} onListingChange={changed} />;
  else if (error) body = <ErrorState message={error} onRetry={load} />;
  else body = <SkeletonToken />;

  return (
    <div className="max-w-[640px] px-4 pb-12 pt-2 tablet:px-6">
      {/* A plain back control, left-aligned with the content. */}
      <Link
        to="/home"
        viewTransition={!reduced}
        className="-ml-2 inline-flex min-h-12 items-center gap-2 rounded-control px-2 text-ink t-label-lg hover:underline"
      >
        <ArrowLeftIcon size={20} aria-hidden="true" />
        Counter
      </Link>
      <div className="mt-2">{body}</div>
    </div>
  );
}
