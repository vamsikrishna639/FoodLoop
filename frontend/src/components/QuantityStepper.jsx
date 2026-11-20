// How many portions to ask for: a minus button, the number (which can also
// be typed), a plus button and the unit, printed in mono like a token stub.
//
//   Number of boxes
//   [ - ]  [  6  ]  [ + ]   up to 12
//
// It works with react-hook-form: `inputProps` is the result of field() /
// register(), `value` is the current value (from watch()), and `onStep`
// gets the new number when a button is pressed (the page calls setValue
// with shouldValidate, so the rule runs at once). The buttons stop at
// min and max; typing past them is caught by the validation rule instead.
import { useId } from 'react';
import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import { describedBy, FieldShell, inputState } from './Field';

const STEP =
  'grid size-12 shrink-0 place-items-center rounded-control border border-control bg-surface text-ink ' +
  'transition-[background-color,transform] duration-[120ms] ease-fl-out hover:bg-sunken active:scale-[0.96] ' +
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-soft disabled:active:scale-100';

export default function QuantityStepper({ label, unit, value, min = 1, max, onStep, inputProps, error, helper }) {
  const id = useId();
  const n = Number.isFinite(value) ? value : Number(value) || 0;

  return (
    <FieldShell id={id} label={label} helper={helper} error={error}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <button
          type="button"
          className={`press-scale ${STEP}`}
          onClick={() => onStep(Math.max(min, Math.min(max, n - 1)))}
          disabled={n <= min}
          aria-label={`Fewer ${unit}`}
          aria-controls={id}
        >
          <MinusIcon size={20} weight="bold" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { helper, error })}
          className={`block min-h-12 w-[5.5rem] rounded-control border bg-sunken px-2 text-center text-ink t-mono-lg tabular-nums transition-[border-color,box-shadow] duration-[120ms] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${inputState(Boolean(error))}`}
          {...inputProps}
        />
        <button
          type="button"
          className={`press-scale ${STEP}`}
          onClick={() => onStep(Math.max(min, Math.min(max, n + 1)))}
          disabled={n >= max}
          aria-label={`More ${unit}`}
          aria-controls={id}
        >
          <PlusIcon size={20} weight="bold" aria-hidden="true" />
        </button>
        {/* The limit, beside the number it applies to (the label names the unit). */}
        <span className="ml-1 text-ink-soft t-mono-sm">up to {max}</span>
      </div>
    </FieldShell>
  );
}
