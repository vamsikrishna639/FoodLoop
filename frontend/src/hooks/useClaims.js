// Claim requests for the signed-in user: a recipient's own requests, or the
// requests waiting on a donor's listings.
//
//   const claims = useClaims();                    // GET /claims/mine
//   const claims = useClaims({ incoming: true });  // GET /claims/incoming
//   claims.items           null until loaded, then the list in server order
//   claims.upsert(claim)   put a saved claim in the list (new ones first)
//   claims.openFor(id)     the recipient's pending/approved request for a listing
//   claims.load()          read the list again
import { useCallback, useEffect, useState } from 'react';
import { incoming as loadIncoming, mine } from '../api/claims';
import { isOpenRequest, listingIdOf } from '../lib/claim';

export default function useClaims({ incoming = false } = {}) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = incoming ? await loadIncoming() : await mine();
      setItems(data.claims);
    } catch (err) {
      setError(err.message);
    }
  }, [incoming]);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = useCallback((claim) => {
    setItems((current) => {
      if (!current) return [claim];
      const exists = current.some((c) => c.id === claim.id);
      return exists ? current.map((c) => (c.id === claim.id ? claim : c)) : [claim, ...current];
    });
  }, []);

  // Rule 7: a recipient has at most one open request per listing.
  const openFor = useCallback(
    (listingId) => (items || []).find((c) => listingIdOf(c) === listingId && isOpenRequest(c)) || null,
    [items]
  );

  return { items, error, load, upsert, openFor };
}
