// Facts about a claim request, worked out the same way everywhere.
// A claim comes from the API with status (pending | approved | rejected |
// cancelled), listingId (the populated listing), recipientId (populated)
// and pickup (null, or { pickupStatus, volunteerName, ... }).
import { donorName, isOpen } from './listing';

/** The listing the claim is for (populated by the API). */
export function listingOf(c) {
  return c.listingId || {};
}

/** The id of that listing, whether it is populated or not. */
export function listingIdOf(c) {
  return typeof c.listingId === 'string' ? c.listingId : c.listingId?.id;
}

/** "Ananya Rao" (the person who asked). */
export function recipientName(c) {
  return c.recipientId?.name || 'A recipient';
}

/** "Asha Night Shelter", or '' when they gave none. */
export function recipientOrg(c) {
  return c.recipientId?.organization || '';
}

/** Pending or approved: the request still holds a place (rule 7: one per token). */
export function isOpenRequest(c) {
  return c.status === 'pending' || c.status === 'approved';
}

export function isDelivered(c) {
  return c.status === 'approved' && c.pickup?.pickupStatus === 'delivered';
}

/**
 * Still under way, for the Active tab: approved and not yet delivered, or
 * pending on a token that is still open. (A pending request whose pickup
 * closed before the canteen decided can no longer go anywhere.)
 */
export function isActive(c) {
  if (c.status === 'approved') return !isDelivered(c);
  if (c.status === 'pending') return isOpen(listingOf(c));
  return false;
}

/**
 * The recipient may take it back: pending or approved, and no volunteer has
 * collected the food yet (the server refuses after "picked up").
 */
export function canCancel(c) {
  if (!isOpenRequest(c)) return false;
  return !c.pickup || c.pickup.pickupStatus === 'assigned';
}

/**
 * The stamp for a claim. Once approved, the pickup moves it on:
 * APPROVED -> ASSIGNED -> PICKED UP -> DELIVERED.
 */
export function claimStamp(c) {
  if (c.status === 'approved' && c.pickup) return c.pickup.pickupStatus;
  if (c.status === 'pending') return 'pending';
  return c.status;
}

/** One plain sentence for the recipient: where the request stands and what comes next. */
export function nextStep(c) {
  const l = listingOf(c);
  const volunteer = c.pickup?.volunteerName || 'A volunteer';
  switch (claimStamp(c)) {
    case 'pending':
      return isOpen(l)
        ? `Waiting for ${donorName(l)} to decide.`
        : 'Pickup closed before the canteen decided, so this request has lapsed.';
    case 'approved':
      return `Reserved for you at ${l.location}. An admin will assign a volunteer.`;
    case 'assigned':
      return `${volunteer} will collect it from ${l.location}.`;
    case 'picked_up':
      return `${volunteer} has it and is on the way.`;
    case 'delivered':
      return 'Delivered. Check the food before you serve it.';
    case 'rejected':
      return 'The canteen could not give this one. Other tokens may still be open.';
    default:
      return 'You cancelled this request.';
  }
}
