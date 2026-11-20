// Pickup endpoints (backend/src/routes/pickupRoutes.js).
// A pickup comes back shaped for the volunteer's slip:
//   { id, pickupStatus, assignedAt, pickedUpAt, deliveredAt, volunteerName,
//     claim: { id, requestedQuantity, note },
//     recipient: { name, organization, phone }, listing: { ...token } }
import { api } from './client';

/** Volunteer: their own runs, newest assignment first. Returns { pickups }. */
export const mine = () => api.get('/pickups/mine');

/** Volunteer: 'picked_up' | 'delivered' | 'cancelled' (hand back). Returns { pickup, message }. */
export const setStatus = (id, status) => api.patch(`/pickups/${id}/status`, { status });

/** Admin: approved requests with no volunteer yet, oldest approval first. Returns { claims }. */
export const unassigned = () => api.get('/pickups/unassigned');

/** Admin. body: { claimRequestId, volunteerId }. Returns { pickup, message }. */
export const assign = (fields) => api.post('/pickups/assign', fields);
