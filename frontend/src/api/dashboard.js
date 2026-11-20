// Read-only figures: the public impact number and the activity feed.
import { api } from './client';

/** Public, no login: portions delivered so far (counted only once delivered). */
export const impact = () => api.get('/impact');

/** The signed-in role's figures and a 7-day series: { role, figures, last7Days }. */
export const dashboard = () => api.get('/dashboard');

/** Recent events the signed-in user may see. */
export const activity = () => api.get('/activity');
