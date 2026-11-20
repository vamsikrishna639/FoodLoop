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
// It loads once when the rail appears. (Live refresh every 20 seconds is
// added with notifications in Stage 4.) It stays quiet, with no
// illustration, so it never competes with the page beside it.
import { useCallback, useEffect, useState } from 'react';
import { activity } from '../api/dashboard';
import { ago } from '../lib/format';
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

  const load = useCallback(() => {
    setError(null);
    activity()
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          <li key={e.id} className="border-b border-line py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className={`font-bold t-mono-sm ${WORD_COLOURS[e.kind] || 'text-ink-soft'}`}>{WORDS[e.kind] || 'Note'}</span>
              <time dateTime={e.at} className="shrink-0 text-ink-soft t-mono-sm">
                {ago(e.at)}
              </time>
            </div>
            <p className="mt-1 text-ink t-body">{e.text}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="px-6 pb-6 pt-12">
      <h2 className="t-title-lg text-ink">Activity</h2>
      <p className="mt-0.5 text-ink-soft t-mono-sm">What just happened</p>
      <div className="perforation mt-3 [--dot:var(--fl-perforation)]" aria-hidden="true" />
      {/* New lines are announced by screen readers without moving focus. */}
      <div aria-live="polite">{body}</div>
    </div>
  );
}
