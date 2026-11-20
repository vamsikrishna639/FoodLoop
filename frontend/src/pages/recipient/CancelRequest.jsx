// "Cancel this request?" Asked before a recipient takes a request back,
// because an approved one gives its portions to someone else and cannot be
// restored. Used by the listing detail and by My requests.
//
//   <CancelRequest claim={claim} onClose={...} onCancelled={(claim) => ...} />
//   claim null = closed.
import { useState } from 'react';
import { XCircleIcon } from '@phosphor-icons/react';
import * as claimsApi from '../../api/claims';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useSlip } from '../../context/ToastContext';
import { listingOf } from '../../lib/claim';
import { quantity } from '../../lib/format';

export default function CancelRequest({ claim, onClose, onCancelled }) {
  const showSlip = useSlip();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const data = await claimsApi.cancel(claim.id);
      // "Request cancelled. The portions are back on the counter"
      showSlip(data.message);
      onCancelled(data.claim);
    } catch (error) {
      // e.g. 400 "The food has already been collected, so this request
      // cannot be cancelled", or 403 for someone else's request.
      showSlip(error.message, { kind: 'error' });
    } finally {
      setBusy(false);
      onClose();
    }
  }

  const l = claim ? listingOf(claim) : null;
  const what = claim ? `${quantity(claim.requestedQuantity, l.unit)} of ${l.title}` : '';

  return (
    <Modal open={Boolean(claim)} onClose={() => !busy && onClose()} labelledBy="cancel-request-title">
      {claim && (
        <div className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
          <h2 id="cancel-request-title" className="t-headline-md text-ink">
            Cancel this request?
          </h2>
          <p className="mt-2 max-w-[52ch] text-ink t-body-lg">
            {claim.status === 'approved'
              ? `The ${what} reserved for you will go back on the counter for someone else.`
              : `Your request for ${what} is withdrawn. You can ask again while the token is open.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="accent" icon={XCircleIcon} loading={busy} loadingLabel="Cancelling" onClick={confirm}>
              Cancel request
            </Button>
            <Button variant="text" disabled={busy} onClick={onClose}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
