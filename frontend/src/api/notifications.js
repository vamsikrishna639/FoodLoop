// Notification endpoints (backend/src/routes/notificationRoutes.js).
// Every account sees only its own notifications.
import { api } from './client';

/** Newest first (the latest 50). Returns { notifications, unreadCount }. */
export const list = () => api.get('/notifications');

/** Returns { notification, unreadCount }. */
export const markRead = (id) => api.patch(`/notifications/${id}/read`);

/** Returns { updated, unreadCount, message } ("Marked 3 as read"). */
export const markAllRead = () => api.patch('/notifications/read-all');
