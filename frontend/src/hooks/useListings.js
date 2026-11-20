// The listings a donor manages (their own), or every listing for an admin.
// Used by the donor's Board and by the Listings page.
//
//   const listings = useListings({ all: false });
//   listings.items   null until loaded
//   listings.open    still on the counter      (lib/listing.js isOpen)
//   listings.closed  expired or completed
//   listings.upsert(listing)  put a saved listing in the list (new ones first)
//   listings.removeById(id)
//
// A reply to a load that started before this page changed a listing
// (upsert, removeById) is dropped, so a background refresh (the Board's
// live beat) cannot bring back the listing as it was before an approval.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { list, mine } from '../api/foods';
import { isOpen } from '../lib/listing';

export default function useListings({ all = false } = {}) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const changes = useRef(0);

  const load = useCallback(async () => {
    const startedAt = changes.current;
    try {
      const data = all ? await list() : await mine();
      if (startedAt !== changes.current) return; // out of date
      setError(null);
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
    changes.current += 1;
    setItems((current) => {
      if (!current) return current; // not loaded yet: the page loads it with the new one
      const exists = current.some((l) => l.id === listing.id);
      return exists ? current.map((l) => (l.id === listing.id ? listing : l)) : [listing, ...current];
    });
  }, []);

  const removeById = useCallback((id) => {
    changes.current += 1;
    setItems((current) => current && current.filter((l) => l.id !== id));
  }, []);

  const open = useMemo(() => (items || []).filter(isOpen), [items]);
  const closed = useMemo(() => (items || []).filter((l) => !isOpen(l)), [items]);

  return { items, error, load, open, closed, upsert, removeById };
}
