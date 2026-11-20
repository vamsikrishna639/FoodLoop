// The listings a donor manages (their own), or every listing for an admin.
// Used by the donor's Board and by the Listings page.
//
//   const listings = useListings({ all: false });
//   listings.items   null until loaded
//   listings.open    still on the counter      (lib/listing.js isOpen)
//   listings.closed  expired or completed
//   listings.upsert(listing)  put a saved listing in the list (new ones first)
//   listings.removeById(id)
import { useCallback, useEffect, useMemo, useState } from 'react';
import { list, mine } from '../api/foods';
import { isOpen } from '../lib/listing';

export default function useListings({ all = false } = {}) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = all ? await list() : await mine();
      // Newest first, like the donor's own list (GET /foods sorts by deadline).
      const sorted = [...data.listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(sorted);
    } catch (err) {
      setError(err.message);
    }
  }, [all]);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = useCallback((listing) => {
    setItems((current) => {
      if (!current) return current; // not loaded yet: the page loads it with the new one
      const exists = current.some((l) => l.id === listing.id);
      return exists ? current.map((l) => (l.id === listing.id ? listing : l)) : [listing, ...current];
    });
  }, []);

  const removeById = useCallback((id) => {
    setItems((current) => current && current.filter((l) => l.id !== id));
  }, []);

  const open = useMemo(() => (items || []).filter(isOpen), [items]);
  const closed = useMemo(() => (items || []).filter((l) => !isOpen(l)), [items]);

  return { items, error, load, open, closed, upsert, removeById };
}
