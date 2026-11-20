// The "Post food" / "Edit token" form, inside a Modal: a bottom sheet on
// phones, a dialog on wider screens (PROMPT.md Part A).
//
// Every rule the server checks is checked here first (validation/
// postFoodRules.js), and any error the server still sends back is shown
// under the matching field (validation/serverErrors.js).
//
//   <ListingForm open={open} existing={listingOrNull} onClose={...}
//                onSaved={(listing, message) => ...} />
import { useId } from 'react';
import { CheckIcon, TicketIcon, XIcon } from '@phosphor-icons/react';
import * as foods from '../../api/foods';
import Button from '../../components/Button';
import { TextArea, TextField } from '../../components/Field';
import { ChoiceTags } from '../../components/FilterTag';
import Modal from '../../components/Modal';
import VegMarker, { FOOD_TYPES } from '../../components/VegMarker';
import { useAuth } from '../../context/AuthContext';
import { useSlip } from '../../context/ToastContext';
import useValidatedForm from '../../hooks/useValidatedForm';
import { quantity as amount } from '../../lib/format';
import { UNITS } from '../../validation/constants';
import { POST_FOOD_FIELDS, postFoodRules } from '../../validation/postFoodRules';
import { handleServerError } from '../../validation/serverErrors';

export default function ListingForm({ open, existing = null, onClose, onSaved }) {
  const headingId = useId();
  return (
    <Modal open={open} onClose={onClose} labelledBy={headingId} closeOnBackdrop={false}>
      <FormBody existing={existing} headingId={headingId} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

// ---- Date helpers -----------------------------------------------------------

/** A Date -> "2026-11-20T14:30", the value a datetime-local input uses (local time). */
function toInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Now, rounded down to five minutes, plus `hours`. */
function roundedNow(hours = 0) {
  const d = new Date(Date.now() + hours * 3600000);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 5), 0, 0);
  return d;
}

// ---- The form ---------------------------------------------------------------

function FormBody({ existing, headingId, onClose, onSaved }) {
  const { user } = useAuth();
  const showSlip = useSlip();
  const editing = Boolean(existing);
  const reserved = existing?.reservedQuantity || 0;

  // New tokens start with sensible values: prepared now, collect within 3 hours.
  const {
    field,
    handleSubmit,
    setError,
    setValue,
    getValues,
    getFieldState,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useValidatedForm({
    defaultValues: {
      title: existing?.title ?? '',
      foodType: existing?.foodType ?? 'veg',
      quantity: existing ? String(existing.quantity) : '',
      unit: existing?.unit ?? 'plates',
      location: existing?.location ?? user?.organization ?? '',
      preparedAt: toInputValue(existing?.preparedAt ?? roundedNow()),
      pickupDeadline: toInputValue(existing?.pickupDeadline ?? roundedNow(3)),
      allergenNotes: existing?.allergenNotes ?? '',
      description: existing?.description ?? '',
      imageUrl: existing?.imageUrl ?? '',
    },
  });

  const unit = watch('unit');
  const foodType = watch('foodType');
  const rules = postFoodRules({ getValues, reserved, unit: existing?.unit });

  // Changing the prepared time can make the deadline right or wrong, so the
  // deadline is checked again once the user has been to it.
  const preparedRules = {
    ...rules.preparedAt,
    onChange: () => {
      if (getFieldState('pickupDeadline').isTouched) trigger('pickupDeadline');
    },
  };

  /** Quick deadlines: one tap sets "pickup by" to now + N hours. */
  function setDeadlineIn(hours) {
    setValue('pickupDeadline', toInputValue(roundedNow(hours)), { shouldValidate: true, shouldTouch: true });
  }

  async function onSubmit(values) {
    const body = {
      ...values,
      // datetime-local values are local times; the server stores ISO dates.
      preparedAt: new Date(values.preparedAt).toISOString(),
      pickupDeadline: new Date(values.pickupDeadline).toISOString(),
    };
    try {
      const data = editing ? await foods.update(existing.id, body) : await foods.create(body);
      onSaved(data.listing, data.message);
    } catch (error) {
      handleServerError(error, { setError, fields: POST_FOOD_FIELDS, showSlip });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
      {/* Heading row with a close button. */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="t-headline-md text-ink">
            {editing ? `Edit #${existing.tokenNumber}` : 'Post food'}
          </h2>
          <p className="mt-1 text-ink-soft t-body">
            {editing ? 'Changes show on the counter straight away.' : 'It goes on the counter as a token with its own number.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close"
          className="-mr-2 -mt-1 grid size-12 shrink-0 place-items-center rounded-control text-ink hover:bg-ink/6"
        >
          <XIcon size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-6">
        <TextField
          label="What is it?"
          placeholder="e.g. Veg Pulao with Raita"
          autoComplete="off"
          maxLength={80}
          error={errors.title}
          {...field('title', rules.title)}
        />

        <ChoiceTags
          legend="Food type"
          value={foodType}
          error={errors.foodType}
          errorId="foodType-error"
          inputProps={field('foodType', rules.foodType)}
          options={Object.entries(FOOD_TYPES).map(([value, label]) => ({
            value,
            label,
            leading: <VegMarker type={value} size={14} />,
          }))}
        />

        {/* Quantity and unit side by side; the unit tags wrap below on phones. */}
        <div className="flex flex-wrap items-start gap-x-4">
          <div className="w-40">
            <TextField
              label="Quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              step={1}
              className="font-mono font-bold"
              error={errors.quantity}
              {...field('quantity', rules.quantity)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <ChoiceTags
              legend="Counted in"
              value={unit}
              error={errors.unit}
              errorId="unit-error"
              inputProps={field('unit', rules.unit)}
              options={UNITS.map((u) => ({ value: u, label: u }))}
            />
          </div>
        </div>
        {reserved > 0 && (
          <p className="-mt-2 mb-4 text-ink-soft t-body-sm">
            {amount(reserved, existing.unit)} already promised to approved requests.
          </p>
        )}

        <TextField
          label="Collect from"
          placeholder="e.g. Main Block Canteen, Counter 2"
          error={errors.location}
          {...field('location', rules.location)}
        />

        {/* The two times; side by side once there is room. */}
        <div className="grid gap-x-4 min-[440px]:grid-cols-2">
          <TextField
            label="Prepared at"
            type="datetime-local"
            className="font-mono"
            error={errors.preparedAt}
            {...field('preparedAt', preparedRules)}
          />
          <TextField
            label="Pickup by"
            type="datetime-local"
            className="font-mono"
            error={errors.pickupDeadline}
            {...field('pickupDeadline', rules.pickupDeadline)}
          />
        </div>
        <div className="-mt-2 mb-4 flex flex-wrap items-center gap-x-2">
          <span className="mr-1 text-ink-soft t-body-sm">Pickup in:</span>
          {[1, 2, 4].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setDeadlineIn(h)}
              className="group inline-flex min-h-12 items-center rounded-pill"
            >
              <span className="inline-flex min-h-[34px] items-center rounded-pill border border-control bg-surface px-3 text-ink t-mono transition-colors duration-[120ms] group-hover:bg-sunken">
                +{h} h
              </span>
            </button>
          ))}
        </div>

        <TextField
          label="Allergens"
          optional
          placeholder="e.g. Contains nuts and dairy"
          maxLength={300}
          error={errors.allergenNotes}
          {...field('allergenNotes', rules.allergenNotes)}
        />
        <TextArea
          label="Notes"
          optional
          placeholder="Packing, containers, anything useful"
          maxLength={500}
          error={errors.description}
          {...field('description', rules.description)}
        />
        <TextField
          label="Photo link"
          optional
          type="url"
          inputMode="url"
          placeholder="https://..."
          error={errors.imageUrl}
          {...field('imageUrl', rules.imageUrl)}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="accent"
          icon={editing ? CheckIcon : TicketIcon}
          loading={isSubmitting}
          loadingLabel={editing ? 'Saving' : 'Printing'}
        >
          {editing ? 'Save changes' : 'Print token'}
        </Button>
        <Button variant="text" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
