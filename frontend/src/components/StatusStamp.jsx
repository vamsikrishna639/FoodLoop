// A status shown as a rubber stamp: uppercase mono text in a rounded border,
// tilted -6 degrees, with slightly uneven ink. The word is always printed,
// so a stamp never relies on colour alone.

/** Every stamp the app can show: its word and its ink colour (a text class). */
export const STAMPS = {
  available: { label: 'Available', ink: 'text-leaf' },
  reserved: { label: 'Reserved', ink: 'text-turmeric-deep' },
  pending: { label: 'Pending', ink: 'text-ink-soft' },
  approved: { label: 'Approved', ink: 'text-leaf' },
  rejected: { label: 'Rejected', ink: 'text-chilli-deep' },
  cancelled: { label: 'Cancelled', ink: 'text-stamp-grey' },
  assigned: { label: 'Assigned', ink: 'text-ink' },
  picked_up: { label: 'Picked up', ink: 'text-ink' },
  delivered: { label: 'Delivered', ink: 'text-leaf' },
  completed: { label: 'Completed', ink: 'text-leaf' },
  expired: { label: 'Expired', ink: 'text-stamp-grey' },
};

/** API listing status -> stamp kind. */
export function stampForListing(status) {
  return { fully_reserved: 'reserved', expired: 'expired', completed: 'completed' }[status] || 'available';
}

/** API claim status -> stamp kind. */
export function stampForClaim(status) {
  return ['approved', 'rejected', 'cancelled'].includes(status) ? status : 'pending';
}

/** API pickup status -> stamp kind. */
export function stampForPickup(status) {
  return ['picked_up', 'delivered', 'cancelled'].includes(status) ? status : 'assigned';
}

// Uneven ink: a mask whose opacity varies across the stamp, the way a real
// rubber stamp never prints perfectly evenly.
const INK_MASK = 'linear-gradient(135deg, #000 0%, #000d 30%, #000 52%, #000c 78%, #000f 100%)';

const SIZES = {
  sm: 'border-2 px-1.5 py-1 !text-[0.6875rem]',
  md: 'border-2 px-2 py-[5px]',
  lg: 'border-[3px] px-3.5 py-2 !text-xl',
};

/**
 * <StatusStamp kind="approved" />
 * <StatusStamp label="Donor" ink="text-chilli-deep" />   any word as a stamp
 * size: 'sm' | 'md' | 'lg'
 */
export default function StatusStamp({ kind, label, ink, size = 'md', angle = -6, className = '' }) {
  const stamp = STAMPS[kind];
  const word = label ?? stamp?.label ?? '';
  const colour = ink ?? stamp?.ink ?? 'text-ink';

  let box = (
    <span className={`inline-block whitespace-nowrap rounded-stamp border-current t-stamp ${SIZES[size]}`}>
      {word}
    </span>
  );

  // DELIVERED gets a double border.
  if (kind === 'delivered') {
    box = <span className="inline-block rounded-[6px] border border-current p-0.5">{box}</span>;
  }

  return (
    <span
      role="img"
      aria-label={`Status: ${word}`}
      className={`relative inline-block shrink-0 align-middle ${colour} ${className}`}
      style={{ transform: `rotate(${angle}deg)`, WebkitMaskImage: INK_MASK, maskImage: INK_MASK }}
    >
      {box}
      {/* EXPIRED is crossed out. */}
      {kind === 'expired' && (
        <span
          aria-hidden="true"
          className="absolute -inset-x-1 top-1/2 h-0.5 -translate-y-1/2 -rotate-[12deg] rounded-full bg-current"
        />
      )}
    </span>
  );
}
