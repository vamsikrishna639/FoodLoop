// Facts about a food listing, worked out the same way everywhere.
// A listing comes from the API with quantity, reservedQuantity, status,
// pickupDeadline and so on (backend/src/models/FoodListing.js).
import { stampForListing } from '../components/StatusStamp';

const HOUR = 60 * 60 * 1000;

/** Portions still free: quantity - reservedQuantity, never below 0. */
export function available(l) {
  return Math.max(0, l.quantity - (l.reservedQuantity || 0));
}

/** Past its deadline (the server also marks it "expired" on its next read). */
export function isExpired(l) {
  return l.status === 'expired' || new Date(l.pickupDeadline).getTime() <= Date.now();
}

/** Still on the counter: not expired and not completed. */
export function isOpen(l) {
  return !isExpired(l) && l.status !== 'completed';
}

/** Someone can still ask for some of it. */
export function canRequest(l) {
  return isOpen(l) && available(l) > 0;
}

/** Open, with an hour or less to go (the "Closing soon" filter uses the same hour). */
export function isClosingSoon(l) {
  return isOpen(l) && new Date(l.pickupDeadline).getTime() - Date.now() <= HOUR;
}

/** The stamp printed on the token. A deadline that just passed shows EXPIRED at once. */
export function stampOf(l) {
  if (l.status !== 'completed' && isExpired(l)) return 'expired';
  return stampForListing(l.status);
}

/** The canteen's name for a listing (the API populates donorId). */
export function donorName(l) {
  return l.donorId?.organization || l.donorId?.name || 'Campus canteen';
}
