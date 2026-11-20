// State for the recipient's "Today's Counter": the listings on offer, the
// search text and the filter tags.
//
// The counter shows tokens people can still look at: open ones and fully
// reserved ones (stamped RESERVED). Expired and completed are hidden.
// Typing waits for a 300ms pause before asking the server, and a reply that
// arrives after a newer one started is ignored.
import { useCallback, useEffect, useRef, useState } from 'react';
import { list } from '../api/foods';
import { useLiveBeat } from '../context/LiveContext';

const STATUSES = 'available,fully_reserved';

export default function useFeed() {
  const [items, setItems] = useState(null); // null until the first load finishes
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(''); // what is in the box
  const [query, setQuery] = useState(''); // what was last sent (after the pause)
  const [foodType, setFoodType] = useState(null); // 'veg' | 'non-veg' | 'mixed' | null
  const [closingSoon, setClosingSoon] = useState(false);
  const requestId = useRef(0);

  // Wait for a short pause in typing before searching.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    try {
      const data = await list({
        status: STATUSES,
        foodType,
        search: query,
        closingSoon: closingSoon ? 'true' : '',
      });
      if (id === requestId.current) setItems(data.listings);
    } catch (err) {
      if (id === requestId.current) setError(err.message);
    }
  }, [query, foodType, closingSoon]);

  // Load on open and whenever a filter changes.
  useEffect(() => {
    load();
  }, [load]);

  // And every 20 seconds while the tab is visible, so "portions left" and
  // new tokens keep up with the canteen (context/LiveContext.jsx).
  useLiveBeat(load);

  /** Tapping the selected type again clears it. */
  const toggleFoodType = (type) => setFoodType((current) => (current === type ? null : type));

  const clearFilters = () => {
    setSearch('');
    setQuery('');
    setFoodType(null);
    setClosingSoon(false);
  };

  /** Keeps a listing re-read on the detail page up to date in the list. */
  const replace = useCallback((listing) => {
    setItems((current) => current && current.map((l) => (l.id === listing.id ? listing : l)));
  }, []);

  return {
    items,
    error,
    load,
    search,
    setSearch,
    foodType,
    toggleFoodType,
    closingSoon,
    toggleClosingSoon: () => setClosingSoon((v) => !v),
    hasFilters: Boolean(query || foodType || closingSoon),
    query,
    clearFilters,
    replace,
  };
}
