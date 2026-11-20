// "Who collects it?": the admin picks a volunteer for an approved request.
// A bottom sheet on phones, a dialog wider (components/Modal.jsx).
//
//   Who collects it?
//   8 boxes of Chicken Biryani for Ananya Rao. Pickup by Today, 4:30 PM.
//   (*) Meera Nair       NSS Unit 2        FREE
//   ( ) Kiran Kumar      NSS Unit 2        CARRYING 1 RUN
//   [ Assign Meera ]  Not now
//
// The volunteers are read again each time it opens, so the "carrying"
// counts are current. The quietest come first and the first is already
// chosen, so spreading the work is the easy choice (the admin can pick
// someone else). Rules: validation/assignRules.js (VALIDATION.md).
import { useEffect, useRef, useState } from 'react';
import { BicycleIcon, CircleIcon, RadioButtonIcon } from '@phosphor-icons/react';
import * as pickupsApi from '../../api/pickups';
import * as usersApi from '../../api/users';
import Button from '../../components/Button';
import { FieldError } from '../../components/Field';
import Modal from '../../components/Modal';
import { useSlip } from '../../context/ToastContext';
import useValidatedForm from '../../hooks/useValidatedForm';
import { listingOf, recipientName } from '../../lib/claim';
import { dayTime, quantity } from '../../lib/format';
import { ASSIGN_FIELDS, assignRules } from '../../validation/assignRules';
import { handleServerError } from '../../validation/serverErrors';

/**
 * claim:       the approved request to assign, or null when closed
 * onAssigned:  (pickup, message) after the server accepted it
 * onStale:     the request changed elsewhere (already assigned, closed): read the queue again
 */
export default function AssignVolunteer({ claim, onClose, onAssigned, onStale }) {
  return (
    <Modal open={Boolean(claim)} onClose={onClose} labelledBy="assign-title" closeOnBackdrop={false}>
      {claim && <AssignForm claim={claim} onClose={onClose} onAssigned={onAssigned} onStale={onStale} />}
    </Modal>
  );
}

function AssignForm({ claim: c, onClose, onAssigned, onStale }) {
  const showSlip = useSlip();
  const [volunteers, setVolunteers] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const {
    field,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useValidatedForm({ defaultValues: { volunteerId: '' } });
  const l = listingOf(c);

  const loadVolunteers = () => {
    setLoadError(null);
    usersApi
      .list({ role: 'volunteer', status: 'approved' })
      .then((data) => {
        const quietestFirst = [...data.users].sort((a, b) => a.activeRuns - b.activeRuns);
        setVolunteers(quietestFirst);
        if (quietestFirst.length > 0) setValue('volunteerId', quietestFirst[0].id);
      })
      .catch((err) => setLoadError(err.message));
  };
  useEffect(loadVolunteers, []);

  // The dialog opens before the list arrives, so the browser first puts
  // focus on the only ready control (Not now). Once the volunteers are
  // shown, focus moves to the chosen one: Enter assigns them, the arrow
  // keys pick someone else.
  const groupRef = useRef(null);
  useEffect(() => {
    if (volunteers?.length) groupRef.current?.querySelector('input:checked')?.focus();
  }, [volunteers]);

  const chosenId = watch('volunteerId');
  const chosen = volunteers?.find((v) => v.id === chosenId);

  async function submit({ volunteerId }) {
    try {
      const data = await pickupsApi.assign({ claimRequestId: c.id, volunteerId });
      onAssigned(data.pickup, data.message); // "Meera Nair will collect 8 boxes of Chicken Biryani"
    } catch (err) {
      handleServerError(err, { setError, fields: ASSIGN_FIELDS, showSlip });
      // Not about the choice (already assigned, pickup time passed): the
      // queue is out of date, so it is read again and the dialog closes.
      if (!Object.keys(err.fieldErrors || {}).some((name) => ASSIGN_FIELDS.includes(name))) {
        onStale();
        onClose();
      }
    }
  }

  let list;
  if (volunteers === null && loadError) {
    list = (
      <div>
        <p className="text-chilli-deep t-body">{loadError}</p>
        <Button variant="text" className="-ml-3" onClick={loadVolunteers}>
          Try again
        </Button>
      </div>
    );
  } else if (volunteers === null) {
    list = <p className="py-3 text-ink-soft t-mono-sm">Reading the list...</p>;
  } else if (volunteers.length === 0) {
    list = (
      <p className="text-ink-soft t-body">There are no approved volunteers yet. Approve one on the Approvals page first.</p>
    );
  } else {
    const inputProps = field('volunteerId', assignRules.volunteerId);
    list = (
      <fieldset ref={groupRef} aria-invalid={errors.volunteerId ? true : undefined} aria-describedby={errors.volunteerId ? 'volunteer-error' : undefined}>
        <legend className="sr-only">Volunteer</legend>
        <ul className="space-y-2">
          {volunteers.map((v) => (
            <li key={v.id}>
              <VolunteerOption volunteer={v} selected={chosenId === v.id} inputProps={inputProps} disabled={isSubmitting} />
            </li>
          ))}
        </ul>
        <FieldError id="volunteer-error" error={errors.volunteerId} />
      </fieldset>
    );
  }

  const first = chosen?.name.split(' ')[0];

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
      <h2 id="assign-title" className="t-headline-md text-ink">
        Who collects it?
      </h2>
      <p className="mt-2 text-ink-soft t-body">
        {quantity(c.requestedQuantity, l.unit)} of {l.title} for {recipientName(c)}. Pickup by {dayTime(l.pickupDeadline)}.
      </p>
      <div className="mt-5">{list}</div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="accent"
          icon={BicycleIcon}
          loading={isSubmitting}
          loadingLabel="Assigning"
          disabled={!volunteers?.length}
        >
          {first ? `Assign ${first}` : 'Assign volunteer'}
        </Button>
        <Button variant="text" disabled={isSubmitting} onClick={onClose}>
          Not now
        </Button>
      </div>
    </form>
  );
}

/**
 * One volunteer to choose, with how busy they are. A real radio input
 * (hidden) inside a label, so arrow keys move between volunteers. The
 * chosen row gets an inset ink edge (no layout shift) and a filled radio
 * mark, so the choice shows by shape as well as colour. Not animated:
 * picking an option should answer at once.
 */
function VolunteerOption({ volunteer: v, selected, inputProps, disabled }) {
  const load = v.activeRuns === 0 ? 'Free' : `Carrying ${v.activeRuns} ${v.activeRuns === 1 ? 'run' : 'runs'}`;
  const Mark = selected ? RadioButtonIcon : CircleIcon;
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-control border border-control px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
        selected ? 'bg-sunken shadow-[inset_0_0_0_1px_var(--fl-ink)]' : 'bg-surface hover:bg-sunken'
      }`}
    >
      <input type="radio" value={v.id} className="sr-only" disabled={disabled} {...inputProps} />
      <Mark size={22} weight={selected ? 'fill' : 'regular'} aria-hidden="true" className="shrink-0 text-ink" />
      <span className="min-w-0 flex-1">
        <span className="block text-ink t-title-md [overflow-wrap:anywhere]">{v.name}</span>
        {v.organization && <span className="block text-ink-soft t-body-sm">{v.organization}</span>}
      </span>
      <span className={`shrink-0 t-mono-sm ${v.activeRuns === 0 ? 'text-leaf' : 'text-ink-soft'}`}>{load}</span>
    </label>
  );
}
