// Food listing endpoints (backend/src/routes/foodRoutes.js).
// Each returns the response's data plus the server's `message`.
import { api } from './client';

/**
 * Listings on the counter, soonest deadline first.
 * filters: { status: 'available,fully_reserved', foodType, search, closingSoon }
 */
export const list = (filters = {}) => api.get('/foods', filters);

/** The signed-in donor's own listings, newest first. */
export const mine = () => api.get('/foods/mine');

export const get = (id) => api.get(`/foods/${id}`);

/** Donor only. Returns { listing, message }. */
export const create = (fields) => api.post('/foods', fields);

/** The donor who owns it, or an admin. Returns { listing, message }. */
export const update = (id, fields) => api.patch(`/foods/${id}`, fields);

/** Refused (409) while the listing has approved requests. Returns { id, message }. */
export const remove = (id) => api.delete(`/foods/${id}`);
