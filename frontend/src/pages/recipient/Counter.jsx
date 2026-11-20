// "Today's Counter": what the canteen has on offer, soonest deadline first.
//
//   Phone:            search, tags, one column of tokens. Tapping a token
//                     opens /home/listing/:id as its own page; the card flies
//                     there (a View Transition).
//   Tablet / desktop: the list on the left and the chosen token's details in
//                     a side panel on the right. The URL still names the
//                     chosen token, so it can be bookmarked or shared.
//
// The route is /home/* so this page stays mounted while the URL changes
// between /home and /home/listing/:id; the list and filters are kept.
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { MagnifyingGlassIcon, TimerIcon, XIcon } from '@phosphor-icons/react';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import FadeUp from '../../components/FadeUp';
import FilterTag from '../../components/FilterTag';
import SkeletonToken from '../../components/SkeletonToken';
import TokenCard from '../../components/TokenCard';
import VegMarker, { FOOD_TYPES } from '../../components/VegMarker';
import useFeed from '../../hooks/useFeed';
import useMediaQuery from '../../hooks/useMediaQuery';
import { DURATION, EASE } from '../../lib/motion';
import { stampOf } from '../../lib/listing';
import { ListingDetailView, ListingPage } from './ListingDetail';

export default function Counter() {
  const feed = useFeed();
  const wide = useMediaQuery('(min-width: 600px)');
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const animatedIn = useRef(false); // the list fades up the first time only

  // "/home/listing/abc" -> "abc" (the route is /home/*).
  const splat = useParams()['*'] || '';
  const openId = splat.startsWith('listing/') ? splat.slice('listing/'.length) : null;

  // The shell's Browse button puts the cursor in the search field.
  const focusRequest = location.state?.focusSearch;
  useEffect(() => {
    if (!focusRequest) return;
    searchRef.current?.focus();
    navigate(location.pathname, { replace: true, state: null }); // do not repeat on reload
  }, [focusRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // The first render that has tokens animates them; after it, never again.
  const items = feed.items;
  const animate = !animatedIn.current && items !== null && items.length > 0;
  useEffect(() => {
    if (items?.length) animatedIn.current = true;
  }, [items]);

  // Phone with a token open: its own page.
  if (!wide && openId) {
    const cached = items?.find((l) => l.id === openId);
    return <ListingPage key={openId} id={openId} cached={cached} onFresh={feed.replace} />;
  }

  function open(listing) {
    if (wide) {
      // Selecting in the side panel replaces the URL instead of piling up history.
      navigate(`/home/listing/${listing.id}`, { replace: true });
    } else {
      navigate(`/home/listing/${listing.id}`, { viewTransition: !reduced });
    }
  }

  // Wide: the chosen token, or the first one when nothing (or a token no
  // longer in the filtered list) is chosen.
  const selected = items && items.length > 0 ? items.find((l) => l.id === openId) || items[0] : null;

  const list =
    items && items.length > 0 ? (
      <ul className="space-y-4">
        {items.map((l, i) => (
          <li key={l.id}>
            <FadeUp index={i} animate={animate}>
              <TokenCard
                as="div"
                listing={l}
                stamp={stampOf(l)}
                onOpen={() => open(l)}
                selected={wide && selected?.id === l.id}
                transitionName={wide ? undefined : `token-${l.id}`}
              />
            </FadeUp>
          </li>
        ))}
      </ul>
    ) : (
      <FeedStatus feed={feed} />
    );

  return (
    <div className="px-4 pb-12 pt-6 tablet:px-6 tablet:pt-8 desktop:px-10 desktop:pt-12">
      <Header feed={feed} searchRef={searchRef} />

      <div className="mt-6">
        {wide && selected ? (
          <div className="grid grid-cols-[clamp(300px,54%,400px)_minmax(0,1fr)] items-start gap-6">
            {list}
            {/* The side panel follows the page while the list scrolls. A
                120ms fade marks the change of token without moving anything:
                tokens are switched often. */}
            <div className="sticky top-6 max-h-[calc(100dvh-48px)] overflow-y-auto pb-8">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DURATION.fast, ease: EASE.out }}
              >
                <ListingDetailView listing={selected} inPanel />
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="max-w-[640px]">{list}</div>
        )}
      </div>
    </div>
  );
}

/** Title, search and filter tags. */
function Header({ feed, searchRef }) {
  const count = feed.items?.length;
  return (
    <div>
      <h1 className="t-display-sm text-ink desktop:t-display-md">Today&apos;s Counter</h1>
      <p className="mt-2 text-ink-soft t-body-lg">Surplus from the campus canteen, soonest pickup first.</p>

      <div role="search" className="relative mt-5 max-w-[480px]">
        <label htmlFor="counter-search" className="sr-only">
          Search dishes or pickup places
        </label>
        <MagnifyingGlassIcon
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          id="counter-search"
          ref={searchRef}
          type="search"
          value={feed.search}
          onChange={(e) => feed.setSearch(e.target.value)}
          placeholder="Search dishes or pickup places"
          className="block min-h-12 w-full rounded-control border border-control bg-sunken py-3 pl-12 pr-12 text-ink t-body-lg placeholder:text-ink-soft focus:border-ink focus:shadow-[inset_0_0_0_1px_var(--fl-ink)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {feed.search && (
          <button
            type="button"
            onClick={() => feed.setSearch('')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-soft hover:text-ink"
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2">
        {Object.entries(FOOD_TYPES).map(([type, label]) => (
          <FilterTag
            key={type}
            label={label}
            leading={<VegMarker type={type} size={14} />}
            selected={feed.foodType === type}
            onClick={() => feed.toggleFoodType(type)}
          />
        ))}
        <FilterTag
          label="Closing soon"
          leading={<TimerIcon size={16} aria-hidden="true" />}
          selected={feed.closingSoon}
          onClick={feed.toggleClosingSoon}
        />
        {/* The count sits beside the tags, in the slip's mono type. */}
        {count !== undefined && (
          <p role="status" className="ml-2 text-ink-soft t-mono-sm">
            {count === 1 ? '1 token' : `${count} tokens`}
          </p>
        )}
      </div>
    </div>
  );
}

/** Loading, error and empty states (anything that is not a list of tokens). */
function FeedStatus({ feed }) {
  if (feed.items === null && !feed.error) {
    // First load: skeletons shaped exactly like tokens.
    return (
      <div className="max-w-[640px] space-y-4">
        <SkeletonToken />
        <SkeletonToken />
        <SkeletonToken />
      </div>
    );
  }
  if (feed.error && !feed.items?.length) return <ErrorState message={feed.error} onRetry={feed.load} />;

  if (feed.hasFilters) {
    const parts = [
      feed.query && `"${feed.query}"`,
      feed.foodType && FOOD_TYPES[feed.foodType].toLowerCase(),
      feed.closingSoon && 'closing within the hour',
    ].filter(Boolean);
    return (
      <EmptyState
        art="slip"
        title="No tokens match"
        message={`Nothing on the counter fits ${parts.join(' and ')}. Try another word, or clear the filters to see everything.`}
        actionLabel="Clear filters"
        onAction={feed.clearFilters}
      />
    );
  }
  return (
    <EmptyState
      art="counter"
      title="The counter's clear"
      message="Nothing is on offer right now. Check back after lunch service."
    />
  );
}
