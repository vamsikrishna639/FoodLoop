// Live updates for signed-in pages, in one place.
//
// Every 20 seconds the app asks the server again for what may have changed
// elsewhere: the user's notifications (the bell badge) and whatever list the
// open page shows (the activity rail, the donor's requests, the volunteer's
// runs ...). This is the ONLY timer that does that.
//
//   - It pauses while the browser tab is hidden (another tab, minimised
//     window, locked phone), so a forgotten tab does not keep asking.
//   - When the tab comes back, it refreshes at once and carries on.
//
// How a page joins in: useLiveBeat(load) runs `load` on every beat.
//
//   const claims = useClaims();       // useClaims already does this
//   useLiveBeat(listings.load);       // and a page can add its own
//
// The provider sits around the ResponsiveShell (App.jsx), so it only runs
// for approved, signed-in users and stops when they sign out.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as notificationsApi from '../api/notifications';

export const BEAT_MS = 20000;

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  // `beat` counts the refreshes. Pages watch it through useLiveBeat.
  const [beat, setBeat] = useState(0);
  const [items, setItems] = useState(null); // notifications, newest first
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(null);
  // Bumped whenever this tab marks something read, so a reply that left
  // before that change cannot bring the old "unread" back.
  const changes = useRef(0);

  const loadNotifications = useCallback(async () => {
    const startedAt = changes.current;
    try {
      const data = await notificationsApi.list();
      if (startedAt !== changes.current) return; // out of date: the next beat fixes it
      setItems(data.notifications);
      setUnread(data.unreadCount);
      setError(null);
    } catch (err) {
      // A failed background refresh keeps what is on screen; the error only
      // shows on the Alerts page when there is nothing to show yet.
      setError(err.message);
    }
  }, []);

  // The timer. It runs only while the tab is visible.
  useEffect(() => {
    let timer = null;

    const tick = () => {
      loadNotifications();
      setBeat((n) => n + 1);
    };
    const start = () => {
      if (timer === null) timer = setInterval(tick, BEAT_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        tick(); // catch up straight away
        start();
      }
    };

    loadNotifications(); // the badge is right from the first screen
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadNotifications]);

  // Marking read changes the screen at once; the server catches up.
  const markRead = useCallback(async (id) => {
    const target = items?.find((n) => n.id === id);
    if (!target || target.isRead) return;
    changes.current += 1;
    setItems((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((n) => Math.max(0, n - 1));
    try {
      const data = await notificationsApi.markRead(id);
      setUnread(data.unreadCount);
    } catch {
      loadNotifications(); // put back the truth
    }
  }, [items, loadNotifications]);

  /** Returns the server's message ("Marked 3 as read"); throws an ApiError on failure. */
  const markAllRead = useCallback(async () => {
    changes.current += 1;
    const data = await notificationsApi.markAllRead();
    setItems((list) => list && list.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    return data.message;
  }, []);

  const value = useMemo(
    () => ({
      beat,
      notifications: { items, unread, error, load: loadNotifications, markRead, markAllRead },
    }),
    [beat, items, unread, error, loadNotifications, markRead, markAllRead]
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/** The notifications and the unread count (see LiveProvider). */
export function useNotifications() {
  return useContext(LiveContext)?.notifications ?? EMPTY;
}

const EMPTY = { items: null, unread: 0, error: null, load() {}, markRead() {}, async markAllRead() {} };

/**
 * Runs `refresh` on every live beat (not on mount: the page loads its data
 * itself). Outside the provider it never runs.
 */
export function useLiveBeat(refresh) {
  const beat = useContext(LiveContext)?.beat ?? 0;
  const latest = useRef(refresh);
  latest.current = refresh;

  useEffect(() => {
    if (beat > 0) latest.current?.();
  }, [beat]);
}
