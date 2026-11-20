// Account endpoints for the admin (backend/src/routes/userRoutes.js).
import { api } from './client';

/**
 * Accounts other than admins. Optional filters (comma lists allowed):
 *   { status: 'pending' | 'approved' | 'rejected', role: 'donor' | 'recipient' | 'volunteer' }
 * Volunteers also carry `activeRuns` (pickups they have on the go).
 * Returns { users }.
 */
export const list = (filters) => api.get('/users', filters);

/** status: 'approved' | 'rejected'. Returns { user, message }. */
export const verify = (id, status) => api.patch(`/users/${id}/verify`, { status });
