// Claim request endpoints (backend/src/routes/claimRoutes.js).
// Each returns the response's data plus the server's `message`.
// A claim comes back with its listing (listingId, with the canteen in
// listingId.donorId), the recipient (recipientId) and a `pickup` summary.
import { api } from './client';

/** Recipient only. body: { listingId, requestedQuantity, note }. Returns { claim, message }. */
export const create = (fields) => api.post('/claims', fields);

/** The signed-in recipient's own requests, newest first. Returns { claims }. */
export const mine = () => api.get('/claims/mine');

/** Requests for the signed-in donor's listings: pending first (oldest first), then decided. */
export const incoming = () => api.get('/claims/incoming');

/** Donor who owns the listing. Reserves the portions atomically. Returns { claim, message }. */
export const approve = (id) => api.patch(`/claims/${id}/approve`);

/** Donor who owns the listing. Returns { claim, message }. */
export const reject = (id) => api.patch(`/claims/${id}/reject`);

/** The recipient who made it. Gives approved portions back. Returns { claim, message }. */
export const cancel = (id) => api.patch(`/claims/${id}/cancel`);
