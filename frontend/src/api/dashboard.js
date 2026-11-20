// Read-only figures: the public impact number and the activity feed.
import { api } from './client';

/** Public, no login: portions delivered so far (counted only once delivered). */
export const impact = () => api.get('/impact');

/** Recent events the signed-in user may see. */
export const activity = () => api.get('/activity');
