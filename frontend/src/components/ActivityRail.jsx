// The right-hand rail on desktop: recent activity printed like a till roll.
//
//   Activity
//   WHAT JUST HAPPENED
//   . . . . . . . . . . . . . . . .
//   REQUEST            2 min ago
//   Ananya Rao requested 6 packets of Veg Grilled Sandwiches
//
// The server decides what this user may see (admin: everything; donor: their
// own listings; recipient and volunteer: their own requests or runs).
// It loads when the rail appears and again on every live beat (every 20
// seconds while the tab is visible, see context/LiveContext.jsx). The shell
// mounts it only on desktop, where it is shown.
//
// Lines that arrive with a refresh fade in at the top (they are the change
// worth noticing); the "2 min ago" times move on with each refresh. Screen
// readers hear only the new lines, through a separate live region, instead
// of the whole roll every 20 seconds. It stays quiet, with no illustration,
// so it never competes with the page beside it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { activity } from '../api/dashboard';
import { useLiveBeat } from '../context/LiveContext';
import { ago } from '../lib/format';
import { DURATION, EASE } from '../lib/motion';
import Button from './Button';

const WORDS = {
  posted: 'Posted',
  requested: 'Request',
  approved: 'Approved',
  rejected: 'Turned down',
  cancelled: 'Cancelled',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  delivered: 'Delivered',
};

// The word always carries the meaning; colour only adds to it.
const WORD_COLOURS = { delivered: 'text-leaf', rejected: 'text-chilli-deep', posted: 'text-ink' };

export default function ActivityRail() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const seen = useRef(null); // ids already on the roll (null before the first load)
  const fresh = useRef(new Set()); // ids that arrived with the latest refresh

  const load = useCallback(async () => {
    try {
      const data = await activity();
      const list = data.events;
      if (seen.current) {
        const added = list.filter((e) => !seen.current.has(e.id));
        fresh.current = new Set(added.map((e) => e.id));
        if (added.length > 0) setAnnouncement(added.map((e) => e.text).join('. '));
      }
      seen.current = new Set(list.map((e) => e.id));
      setEvents(list);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveBeat(load);

  let body;
  if (events === null && error) {
    body = (
      <div className="pt-3">
        <p className="text-ink-soft t-body">{error}</p>
        <Button variant="text" className="-ml-3" onClick={load}>
          Try again
        </Button>
      </div>
    );
  } else if (events === null) {
    body = <p className="pt-3 text-ink-soft t-mono-sm">Reading the roll...</p>;
  } else if (events.length === 0) {
    body = (
      <div className="pt-3">
        <p className="text-ink-soft t-mono-sm">Nothing printed yet</p>
        <p className="mt-2 text-ink-soft t-body">Requests, approvals and deliveries will print here as they happen.</p>
      </div>
    );
  } else {
    body = (
      <ul>
        {events.map((e) => (
          <EventLine key={e.id} event={e} isNew={fresh.current.has(e.id)} />
        ))}
      </ul>
    );
  }

  return (
    <div className="px-6 pb-6 pt-12">
      <h2 className="t-title-lg text-ink">Activity</h2>
      <p className="mt-0.5 text-ink-soft t-mono-sm">What just happened</p>
      <div className="perforation mt-3 [--dot:var(--fl-perforation)]" aria-hidden="true" />
      {body}
      {/* Only new lines are read out, without moving focus. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

/** One printed line. A line that just arrived fades in (and rises 4px). */
function EventLine({ event: e, isNew }) {
  const reduced = useReducedMotion();
  return (
    <motion.li
      initial={isNew ? { opacity: 0, y: reduced ? 0 : -4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.out }}
      className="border-b border-line py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-bold t-mono-sm ${WORD_COLOURS[e.kind] || 'text-ink-soft'}`}>{WORDS[e.kind] || 'Note'}</span>
        <time dateTime={e.at} className="shrink-0 text-ink-soft t-mono-sm">
          {ago(e.at)}
        </time>
      </div>
      <p className="mt-1 text-ink t-body">{e.text}</p>
    </motion.li>
  );
}
