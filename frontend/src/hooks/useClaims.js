// Claim requests for the signed-in user: a recipient's own requests, or the
// requests waiting on a donor's listings.
//
//   const claims = useClaims();                    // GET /claims/mine
//   const claims = useClaims({ incoming: true });  // GET /claims/incoming
//   claims.items           null until loaded, then the list in server order
//   claims.upsert(claim)   put a saved claim in the list (new ones first)
//   claims.openFor(id)     the recipient's pending/approved request for a listing
//   claims.load()          read the list again
//
// The list refreshes itself every 20 seconds while the page is open
// (useLiveList), so a new request appears on the donor's Board, and an
// approval on the recipient's receipts, without a reload.
import { useCallback } from 'react';
import { incoming as loadIncoming, mine } from '../api/claims';
import { isOpenRequest, listingIdOf } from '../lib/claim';
import useLiveList from './useLiveList';

export default function useClaims({ incoming = false } = {}) {
  const fetchClaims = useCallback(async () => {
    const data = incoming ? await loadIncoming() : await mine();
    return data.claims;
  }, [incoming]);

  const { items, error, load, upsert } = useLiveList(fetchClaims);

  // Rule 7: a recipient has at most one open request per listing.
  const openFor = useCallback(
    (listingId) => (items || []).find((c) => listingIdOf(c) === listingId && isOpenRequest(c)) || null,
    [items]
  );

  return { items, error, load, upsert, openFor };
}
