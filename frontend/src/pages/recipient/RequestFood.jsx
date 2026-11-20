// The request area at the bottom of a listing's details. It follows the
// listing and the recipient's own requests:
//
//   still checking the recipient's requests  -> a short "checking" line
//   already asked (pending / approved)       -> "You asked for 6 packets" + Cancel (rule 7)
//   portions left                            -> the request form
//   nothing can be asked for                 -> null (ListingDetail says why)
//
// The server checks everything again. Its refusals are shown in place:
// "Only 3 boxes left" under the quantity (and the listing is read again so
// the limit updates); "You already have a request..." (409) and "Pickup for
// this token has closed" (400) as a slip.
import { useRef, useState } from 'react';
import { ReceiptIcon, XCircleIcon } from '@phosphor-icons/react';
import * as claimsApi from '../../api/claims';
import { get } from '../../api/foods';
import Button, { ButtonLink } from '../../components/Button';
import { TextArea } from '../../components/Field';
import QuantityStepper from '../../components/QuantityStepper';
import StatusStamp from '../../components/StatusStamp';
import { useSlip } from '../../context/ToastContext';
import useFocusWhen from '../../hooks/useFocusWhen';
import useValidatedForm from '../../hooks/useValidatedForm';
import { canCancel, claimStamp, listingOf, nextStep } from '../../lib/claim';
import { dayTime, quantity } from '../../lib/format';
import { available, canRequest } from '../../lib/listing';
import { REQUEST_MAX } from '../../validation/constants';
import { REQUEST_FIELDS, requestRules } from '../../validation/requestRules';
import { handleServerError } from '../../validation/serverErrors';
import CancelRequest from './CancelRequest';

/**
 * listing:          the listing on screen
 * claims:           useClaims() for the recipient (shared with the counter)
 * onListingChange:  called with a fresher copy of the listing
 * headingLevel:     2 on the phone page (under the token's h1), 3 in the side panel
 * Returns null when the token cannot be requested and nothing is open.
 */
export default function RequestFood({ listing: l, claims, onListingChange, headingLevel = 3 }) {
  const [cancelling, setCancelling] = useState(null);
  // After sending or cancelling, the area swaps its content; focus follows
  // to the new heading so keyboard users keep their place.
  const [moveFocus, setMoveFocus] = useState(false);

  // Read the listing again after a refusal: someone else's request may have
  // been approved, or the deadline passed.
  const refresh = () =>
    get(l.id)
      .then((data) => onListingChange(data.listing))
      .catch(() => {});

  if (claims.items === null && !claims.error) {
    return <p className="text-ink-soft t-mono">Checking your requests...</p>;
  }

  const open = claims.openFor(l.id);
  let body = null;
  if (open) {
    body = (
      <YourRequest claim={open} headingLevel={headingLevel} focus={moveFocus} onCancel={() => setCancelling(open)} />
    );
  } else if (canRequest(l)) {
    // Keyed by the listing, so another token in the side panel starts a fresh form.
    body = (
      <RequestForm
        key={l.id}
        listing={l}
        claims={claims}
        headingLevel={headingLevel}
        focus={moveFocus}
        onSent={() => setMoveFocus(true)}
        onRefused={refresh}
      />
    );
  }

  return (
    <>
      {body}
      <CancelRequest
        claim={cancelling}
        onClose={() => setCancelling(null)}
        onCancelled={(claim) => {
          claims.upsert(claim);
          setMoveFocus(true);
          // An approved request gave its portions back: the claim carries
          // the listing as it is now.
          if (claim.listingId?.id) onListingChange(claim.listingId);
        }}
      />
    </>
  );
}

/** Quantity stepper, optional note and the Request button. */
function RequestForm({ listing: l, claims, headingLevel, focus, onSent, onRefused }) {
  const Heading = `h${headingLevel}`;
  const headingRef = useRef(null);
  useFocusWhen(headingRef, focus);
  const showSlip = useSlip();
  const left = available(l);
  const max = Math.min(left, REQUEST_MAX);
  const rules = requestRules({ left, unit: l.unit });

  const {
    field,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useValidatedForm({ defaultValues: { requestedQuantity: 1, note: '' } });

  const asked = watch('requestedQuantity');
  const valid = Number.isInteger(asked) && asked >= 1 && asked <= max;

  async function submit(values) {
    try {
      const data = await claimsApi.create({
        listingId: l.id,
        requestedQuantity: values.requestedQuantity,
        note: values.note,
      });
      // The form is replaced by "You asked for ..." as soon as the claim is in the list.
      claims.upsert(data.claim);
      onSent();
      showSlip(data.message);
    } catch (error) {
      handleServerError(error, { setError, fields: REQUEST_FIELDS, showSlip });
      // A refusal means something changed: read the listing and the
      // recipient's requests again (a 409 means one already exists).
      if (error.status) {
        onRefused();
        claims.load();
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} aria-labelledby="request-title">
      <Heading id="request-title" ref={headingRef} tabIndex={-1} className="rounded-stamp t-title-lg text-ink">
        How much do you need?
      </Heading>
      <p className="mb-4 mt-1 text-ink-soft t-body">
        Ask only for what you can collect and serve before the pickup deadline.
      </p>

      <QuantityStepper
        label={`Number of ${l.unit}`}
        unit={l.unit}
        value={asked}
        max={max}
        onStep={(n) => setValue('requestedQuantity', n, { shouldValidate: true })}
        inputProps={field('requestedQuantity', rules.requestedQuantity)}
        error={errors.requestedQuantity}
      />

      <TextArea
        label="Note for the canteen"
        optional
        rows={2}
        helper="For example, when you will come or who will collect it."
        error={errors.note}
        {...field('note', rules.note)}
      />

      <Button type="submit" variant="accent" expand loading={isSubmitting} loadingLabel="Sending" className="tablet:w-auto">
        {valid ? `Request ${quantity(asked, l.unit)}` : 'Request food'}
      </Button>
    </form>
  );
}

/** The recipient already has an open request for this token (rule 7 allows only one). */
function YourRequest({ claim: c, headingLevel, focus, onCancel }) {
  const l = listingOf(c);
  const Heading = `h${headingLevel}`;
  const headingRef = useRef(null);
  useFocusWhen(headingRef, focus);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Heading ref={headingRef} tabIndex={-1} className="rounded-stamp t-title-lg text-ink">
          You asked for {quantity(c.requestedQuantity, l.unit)}
        </Heading>
        <StatusStamp kind={claimStamp(c)} />
      </div>
      <p className="mt-1 max-w-[60ch] text-ink-soft t-body-lg">{nextStep(c)}</p>
      {/* The deadline is the most important fact (PRODUCT.md), so it stays in view while waiting. */}
      {c.status !== 'cancelled' && c.status !== 'rejected' && !c.pickup?.deliveredAt && (
        <p className="mt-1 text-ink t-mono">Pickup by {dayTime(l.pickupDeadline)}</p>
      )}
      {c.note && <p className="mt-2 text-ink t-body">Your note: &ldquo;{c.note}&rdquo;</p>}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
        <ButtonLink to="/requests" variant="outline" icon={ReceiptIcon}>
          See my requests
        </ButtonLink>
        {canCancel(c) && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-chilli-deep t-label-lg underline-offset-4 hover:underline"
          >
            <XCircleIcon size={20} weight="bold" aria-hidden="true" />
            Cancel request
          </button>
        )}
      </div>
    </div>
  );
}
