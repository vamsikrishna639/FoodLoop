// The food listing card, shaped like a canteen token slip.
//
//   +------------------------------------------+
//   | [CB]  (veg) VEG              AVAILABLE   |   <- top: what the food is
//   |       Chicken Biryani                    |
//   |       Main Block Canteen                 |
//   o . . . . . . . . . . . . . . . . . . . .  o   <- notches + perforation
//   | #FL-0003                      (ring)     |   <- stub: number, portions,
//   | [][][][][]  12 / 20 LEFT      3h 59m     |      deadline
//   +------------------------------------------+
//
// The notches are cut with a CSS mask (.slip-paper in index.css) and the
// outline is drawn by the parent's drop-shadows, so it follows the notches.
import { useState } from 'react';
import { dishInitials } from '../lib/format';
import { donorName as donorNameOf } from '../lib/listing';
import DeadlineClock from './DeadlineClock';
import PortionMeter from './PortionMeter';
import StatusStamp from './StatusStamp';
import VegMarker from './VegMarker';

// transitionName: a unique view-transition-name (e.g. "token-<id>") so the
// card can fly to the same card on the detail page on phones.
// headingLevel: the title's level in the page outline (2 in a list under the
// page's h1; 1 when the token is the page, on the phone detail page).
export default function TokenCard({
  listing,
  stamp,
  onOpen,
  selected = false,
  transitionName,
  headingLevel = 3,
  as: Tag = 'article',
}) {
  const Title = `h${headingLevel}`;
  const [hovered, setHovered] = useState(false);
  const muted = stamp === 'expired' || stamp === 'completed';
  const donorName = listing.donorName || donorNameOf(listing);
  const interactive = Boolean(onOpen);

  const edge = selected ? 'var(--fl-ink)' : hovered ? 'var(--fl-control)' : 'var(--fl-line)';

  const slip = (
    <div
      className={`slip ${hovered || selected ? 'slip-lifted' : ''} transition-[filter] duration-[120ms]`}
      style={{ '--edge': edge }}
    >
      <div className="slip-paper flex flex-col">
        {/* Top: what the food is. */}
        <div className="flex gap-3 p-4">
          <TicketBlock title={listing.title} foodType={listing.foodType} imageUrl={listing.imageUrl} />
          <div className="min-w-0 flex-1">
            {/* Marker on the left, stamp in the right corner; on very narrow
                cards the stamp wraps below instead of overflowing. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VegMarker type={listing.foodType} showLabel />
              <StatusStamp kind={stamp} />
            </div>
            <Title className={`mt-2 line-clamp-2 t-headline-sm ${muted ? 'text-ink-soft' : 'text-ink'}`}>
              {listing.title}
            </Title>
            <p className="mt-0.5 truncate text-ink-soft t-body">{donorName}</p>
          </div>
        </div>

        {/* Stub: token number, portions, deadline. */}
        <div className="flex h-[var(--stub)] flex-col bg-sunken">
          <div className="perforation mx-[13px]" aria-hidden="true" />
          <div className="flex min-h-0 flex-1 items-center gap-3 px-4">
            <div className="min-w-0 flex-1">
              <p className="t-mono-lg text-ink">#{listing.tokenNumber}</p>
              <div className="mt-1">
                <PortionMeter total={listing.quantity} reserved={listing.reservedQuantity || 0} unit={listing.unit} />
              </div>
            </div>
            {/* Finished and expired tokens have no countdown; the stamp says so. */}
            {!muted && <DeadlineClock deadline={listing.pickupDeadline} />}
          </div>
        </div>
      </div>
    </div>
  );

  const style = transitionName ? { viewTransitionName: transitionName } : undefined;
  if (!interactive) return <Tag style={style}>{slip}</Tag>;

  return (
    <Tag style={style}>
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        aria-pressed={selected || undefined}
        aria-label={`${listing.title} from ${donorName}, token ${listing.tokenNumber}`}
        className="press-scale block w-full rounded-slip text-left transition-transform duration-[120ms] ease-fl-out active:scale-[0.98]"
      >
        {slip}
      </button>
    </Tag>
  );
}

/**
 * The square block on the left of a token. Most listings have no photo, so
 * the default is a printed "ticket" with the dish's initials on a tint of
 * its food-type colour. A photo, when present, replaces it; a broken link
 * falls back to the printed block.
 */
function TicketBlock({ title, foodType, imageUrl }) {
  const [broken, setBroken] = useState(false);
  const tone = { veg: 'text-leaf', 'non-veg': 'text-chilli-deep', mixed: 'text-turmeric-deep' }[foodType] || 'text-leaf';
  const url = (imageUrl || '').trim();

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={`Photo of ${title}`}
        width="68"
        height="68"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="size-[68px] shrink-0 rounded-stamp object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative size-[68px] shrink-0 rounded-stamp border border-current/45 bg-current/12 ${tone}`}
    >
      {/* A printed rule and caption, like the header of a real slip. */}
      <div className="absolute inset-x-[7px] top-[7px] flex items-center gap-1">
        <span className="font-mono text-[8px] font-medium tracking-[0.05em]">TOKEN</span>
        <span className="h-px flex-1 bg-current/45" />
      </div>
      <span className="absolute inset-x-0 bottom-[9px] text-center t-headline-md leading-none">{dishInitials(title)}</span>
    </div>
  );
}
