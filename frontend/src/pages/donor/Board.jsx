// The donor's home: "Today's Surplus" on a chalkboard, like the menu board
// behind a canteen counter, with a printed tally of the counter.
//
//   Content 900px wide or more:  [ chalkboard (big) ] [ tally ]
//                                [ requests         ]
//   Narrower:                    chalkboard, requests, then tally, stacked.
//
// The switch is a container query (@container), so it depends on the room
// the page actually has, not the window: at 1440 the sidebar and activity
// rail leave about 690px, so the tally stacks under the board there.
// Requests come straight after the board: deciding them is the donor's job,
// so they come before the figures.
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { dashboard } from '../../api/dashboard';
import Chalkboard from '../../components/Chalkboard';
import { formatLeft } from '../../components/DeadlineClock';
import { ErrorState } from '../../components/EmptyState';
import PageFrame from '../../components/PageFrame';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import { useAuth } from '../../context/AuthContext';
import { useLiveBeat } from '../../context/LiveContext';
import { useSlip } from '../../context/ToastContext';
import useClaims from '../../hooks/useClaims';
import useListings from '../../hooks/useListings';
import { quantity, time } from '../../lib/format';
import { available, isClosingSoon } from '../../lib/listing';
import ListingForm from './ListingForm';
import RequestQueue from './RequestQueue';

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Board() {
  const { user } = useAuth();
  const listings = useListings();
  const claims = useClaims({ incoming: true });
  const showSlip = useSlip();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ open: false, existing: null });
  const [figures, setFigures] = useState(null);

  // "Delivered, ever" comes from the dashboard (rule 4: only delivered food counts).
  const loadFigures = useCallback(() => {
    dashboard()
      .then((data) => setFigures(data.figures))
      .catch(() => {}); // keep the last figures; the tally prints --:-- until one arrives
  }, []);
  useEffect(() => {
    loadFigures();
  }, [loadFigures]);

  // Every 20 seconds (while the tab is visible) the board, the tally and the
  // queue catch up with what happened elsewhere: new requests (the queue
  // refreshes itself through useClaims), cancellations that gave portions
  // back, deliveries.
  useLiveBeat(() => {
    listings.load();
    loadFigures();
  });

  // The shell's "Post food" button sends the donor here with a request to open the form.
  const postRequest = location.state?.postFood;
  useEffect(() => {
    if (!postRequest) return;
    setForm({ open: true, existing: null });
    navigate(location.pathname, { replace: true, state: null }); // do not reopen on reload
  }, [postRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  function saved(listing, message) {
    listings.upsert(listing);
    setForm({ open: false, existing: null });
    showSlip(message);
  }

  const title = user.organization || user.name;

  // The Board's copy of a listing is updated after every approval, so the
  // other slips in the queue show the right "left" count.
  const listingFor = useCallback((id) => listings.items?.find((l) => l.id === id), [listings.items]);
  const waiting = claims.items?.filter((c) => c.status === 'pending').length;

  // Scroll the queue's heading into view and move focus to it.
  function goToRequests() {
    const heading = document.getElementById('queue-title');
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus({ preventScroll: true });
  }

  const reloadAll = () => {
    listings.load();
    claims.load();
  };

  return (
    <PageFrame
      title={title}
      maxWidth="max-w-[1000px]"
      caption={
        <>
          Post what is left after each service. Tap a line on the board to change it.
          {/* The queue sits under the board, so on a phone it starts below the
              first screen. While someone is waiting, this jumps straight to it. */}
          {waiting > 0 && (
            <>
              {' '}
              <button
                type="button"
                onClick={goToRequests}
                className="inline-flex min-h-12 items-center font-semibold text-ink underline underline-offset-4 tablet:min-h-0"
              >
                {waiting === 1 ? '1 request is waiting' : `${waiting} requests are waiting`}
              </button>
            </>
          )}
        </>
      }
    >
      {listings.items === null && listings.error ? (
        <ErrorState message={listings.error} onRetry={listings.load} />
      ) : (
        <div className="@container">
          <div className="grid items-start gap-8 @[900px]:grid-cols-[3fr_2fr] @[900px]:gap-6">
            <div className="min-w-0 space-y-10">
              <SurplusBoard listings={listings} onEdit={(l) => setForm({ open: true, existing: l })} />
              <RequestQueue
                claims={claims}
                listingFor={listingFor}
                onListingChange={listings.upsert}
                onStale={reloadAll}
              />
            </div>
            {/* A receipt does not need the full width of a tablet. */}
            <Tally listings={listings} figures={figures} waiting={waiting} />
          </div>
        </div>
      )}

      <ListingForm
        open={form.open}
        existing={form.existing}
        onClose={() => setForm({ open: false, existing: null })}
        onSaved={saved}
      />
    </PageFrame>
  );
}

/** The chalkboard: one menu line per open token, the one closing first on top. */
function SurplusBoard({ listings, onEdit }) {
  const open = [...listings.open].sort((a, b) => new Date(a.pickupDeadline) - new Date(b.pickupDeadline));

  let body;
  if (listings.items === null) {
    body = <p className="py-4 text-chalk-soft t-mono">Reading the board...</p>;
  } else if (open.length === 0) {
    body = (
      <p className="py-3 text-chalk-soft t-body-lg">
        The board is blank. When service ends, post what is left so it reaches someone before it spoils.
      </p>
    );
  } else {
    body = (
      <ul>
        {open.map((l) => (
          <li key={l.id}>
            <BoardLine listing={l} onEdit={() => onEdit(l)} />
          </li>
        ))}
      </ul>
    );
  }

  // No "Post food" button here: the shell already shows one on every screen
  // size (raised in the bottom bar, red in the rail and sidebar).
  return (
    <Chalkboard title="Today's Surplus" caption={longDate.format(new Date())}>
      {body}
    </Chalkboard>
  );
}

/**
 * One line on the board. Tapping it opens the edit form.
 *
 *   Chicken Biryani .................. 12 left
 *   #FL-0003 · 20 BOXES · UNTIL 2:13 PM
 */
function BoardLine({ listing: l, onEdit }) {
  const left = available(l);
  const soon = isClosingSoon(l);
  const msLeft = new Date(l.pickupDeadline).getTime() - Date.now();
  const when = soon ? `${formatLeft(msLeft)} left` : `until ${time(l.pickupDeadline)}`;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="block w-full rounded-stamp px-1 py-2 text-left transition-colors duration-[120ms] hover:bg-chalk/6"
    >
      {/* Named by its own text plus a hidden "Edit", so what a screen
          reader says matches what is written on the board (WCAG 2.5.3). */}
      <span className="flex items-end gap-2">
        <span className="max-w-[65%] t-title-lg text-chalk [overflow-wrap:anywhere]">{l.title}</span>
        <span className="leader mb-1.5 min-w-4 flex-1 [--dot:color-mix(in_srgb,var(--fl-chalk-soft)_50%,transparent)]" aria-hidden="true" />
        {/* "none left" is in turmeric, so a fully reserved line stands out. */}
        <span className={`shrink-0 font-bold t-mono ${left === 0 ? 'text-turmeric' : 'text-chalk'}`}>
          {left === 0 ? 'none left' : `${left} left`}
        </span>
      </span>
      <span className="mt-0.5 block text-chalk-soft t-mono-sm">
        #{l.tokenNumber} · {quantity(l.quantity, l.unit)} · {when}
      </span>
      <span className="sr-only">Edit</span>
    </button>
  );
}

/** The printed tally of today's counter. */
function Tally({ listings, figures, waiting }) {
  const loaded = listings.items !== null;
  const open = listings.open;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const n = (value) => (loaded ? String(value) : null);
  const postedToday = (listings.items || []).filter((l) => new Date(l.createdAt) >= startOfToday).length;

  return (
    <ReceiptTimeline
      className="max-w-[420px]"
      title="Counter tally"
      heading={`Printed ${time(new Date())}`}
      entries={[
        { label: 'Open tokens', value: n(open.length), emphasis: true },
        { label: 'Portions left', value: n(open.reduce((sum, l) => sum + available(l), 0)) },
        { label: 'Reserved', value: n(open.reduce((sum, l) => sum + (l.reservedQuantity || 0), 0)) },
        { label: 'Closing < 1h', value: n(open.filter(isClosingSoon).length) },
        { label: 'Requests waiting', value: waiting === undefined ? null : String(waiting) },
        { label: 'Posted today', value: n(postedToday) },
        // Rule 4: only portions a volunteer has handed over count as given.
        { label: 'Delivered, ever', value: figures ? String(figures.portionsDelivered) : null, emphasis: true },
      ]}
      footer="All units added together"
    />
  );
}
