// Alerts: the user's notifications, newest first, grouped by day like the
// pages of a duplicate receipt book.
//
//   Today
//   * APPROVED · NEW                                  12 min ago
//     Your request for 8 boxes of Chicken Biryani was approved.
//     MY REQUESTS ->
//   ----------------------------------------------------------
//     PICKUP                                          25 min ago
//     Kiran Kumar will collect your Chicken Biryani.
//
// An unread line has a red dot, the word NEW and a bolder message, so
// "unread" never depends on colour alone. Selecting a line marks it read
// and opens the page it is about (lib/notification.js alertTarget).
// The list itself lives in LiveContext, which refreshes it (and the bell
// badge) every 20 seconds while the tab is visible.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon, ChecksIcon } from '@phosphor-icons/react';
import Button from '../../components/Button';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import PageFrame from '../../components/PageFrame';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/LiveContext';
import { useSlip } from '../../context/ToastContext';
import { ago, day, time } from '../../lib/format';
import { alertTarget, alertWord } from '../../lib/notification';

export default function Alerts() {
  const { user } = useAuth();
  const notifications = useNotifications();
  const showSlip = useSlip();
  const [marking, setMarking] = useState(false);
  const firstHeading = useRef(null); // focus lands here after "Mark all read" disappears
  const { items, unread } = notifications;

  // Read the list again on arrival, so it is never up to 20 seconds old.
  const reload = notifications.load;
  useEffect(() => {
    reload();
  }, [reload]);

  async function markAll() {
    setMarking(true);
    try {
      const message = await notifications.markAllRead();
      showSlip(message); // "Marked 3 as read"
      // The button is gone now; keep the keyboard user's place on the list.
      setTimeout(() => firstHeading.current?.focus(), 0);
    } catch (err) {
      showSlip(err.message, { kind: 'error' });
    } finally {
      setMarking(false);
    }
  }

  let body;
  if (items === null && notifications.error) {
    body = <ErrorState message={notifications.error} onRetry={notifications.load} />;
  } else if (items === null) {
    body = <AlertsSkeleton />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        art="slip"
        title="Nothing to tell you yet"
        message="Approvals, pickups and deliveries that concern you are printed here as they happen."
      />
    );
  } else {
    // Group by day ("Today", "Yesterday", "Sat 14 Nov"), keeping newest first.
    const groups = [];
    for (const n of items) {
      const label = day(n.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    body = (
      <div className="space-y-8">
        {groups.map((g, i) => (
          <section key={g.label} aria-labelledby={`alerts-${i}`}>
            <h2
              id={`alerts-${i}`}
              ref={i === 0 ? firstHeading : undefined}
              tabIndex={i === 0 ? -1 : undefined}
              className="border-b-2 border-ink pb-2 t-title-lg text-ink"
            >
              {g.label}
            </h2>
            <ul>
              {g.items.map((n) => (
                <AlertLine
                  key={n.id}
                  alert={n}
                  target={alertTarget(n.type, user.role)}
                  onOpen={() => notifications.markRead(n.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  let caption = null;
  if (items?.length) caption = unread === 0 ? 'All read. New ones print here as they happen.' : `${unread} unread. Select a line to open it.`;

  return (
    <PageFrame
      title="Alerts"
      maxWidth="max-w-[720px]"
      caption={caption}
      actions={
        unread > 0 && (
          <Button variant="outline" icon={ChecksIcon} loading={marking} loadingLabel="Marking" onClick={markAll}>
            Mark all read
          </Button>
        )
      }
    >
      {body}
    </PageFrame>
  );
}

/**
 * One alert. It is a link when it leads to a page, a button while it is
 * unread and leads nowhere (selecting it marks it read), and plain text once
 * it is read with nowhere to go.
 */
function AlertLine({ alert: n, target, onOpen }) {
  const unread = !n.isRead;
  // "12 min ago" today; on older days the group heading already gives the
  // day, so only the time is printed.
  const when = day(n.createdAt) === 'Today' ? ago(n.createdAt) : time(n.createdAt);
  const inner = (
    <span className="flex gap-2">
      {/* The unread dot; the word NEW beside the kind says the same in text. */}
      <span className="w-5 shrink-0 pt-1.5" aria-hidden="true">
        <span
          className={`block size-2 rounded-full bg-chilli transition-opacity duration-[120ms] ease-fl-out ${unread ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-bold text-ink t-mono-sm">
            {alertWord(n.type)}
            {unread && <span className="text-chilli-deep"> · New</span>}
          </span>
          <time dateTime={n.createdAt} className="shrink-0 text-ink-soft t-mono-sm">
            {when}
          </time>
        </span>
        <span className={`mt-1 block max-w-[65ch] t-body-lg ${unread ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
          {n.message}
        </span>
        {/* The page it opens, printed under the message, so the line reads
            as a link without relying on colour. */}
        {target && (
          <span className="mt-1.5 inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-4 t-label-lg">
            Open {target.page}
            <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
          </span>
        )}
        {/* What selecting an unread line without a page does, for screen
            readers (sighted users see the dot go). */}
        {!target && unread && <span className="sr-only">Mark as read</span>}
      </span>
    </span>
  );

  const box =
    'block w-full rounded-stamp px-1 py-4 text-left transition-colors duration-[120ms] hover:bg-sunken min-h-12';
  // No aria-label: the line is named by its own text ("Request approved ·
  // New, 12 min ago, <message>, Open My requests"), so what is read is what
  // is shown (WCAG 2.5.3).

  let line;
  if (target) {
    line = (
      <Link to={target.path} onClick={onOpen} className={box}>
        {inner}
      </Link>
    );
  } else if (unread) {
    line = (
      <button type="button" onClick={onOpen} className={box}>
        {inner}
      </button>
    );
  } else {
    line = <div className="px-1 py-4">{inner}</div>;
  }

  return <li className="border-b border-line">{line}</li>;
}

/** Three grey lines in the shape of alerts while the list loads. */
function AlertsSkeleton() {
  const bar = 'rounded-stamp bg-line';
  return (
    <div role="status" aria-label="Loading alerts" className="pulse">
      <div className={`${bar} h-6 w-24`} aria-hidden="true" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-b border-line py-4 pl-7" aria-hidden="true">
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} mt-3 h-4 w-4/5`} />
        </div>
      ))}
    </div>
  );
}
