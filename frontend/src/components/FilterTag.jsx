// Filter options styled like small paper tags.
//
//   <FilterTag>   a toggle button (aria-pressed), used for list filters
//   <ChoiceTags>  a radio group of tags, used inside forms with register()
//
// When a tag is on it turns ink and shows a tick, so "selected" never
// depends on colour alone. The tap area is 48px tall; the visible tag is a
// little smaller inside it. Only colours change (no movement): these are
// tapped often.
import { CheckIcon } from '@phosphor-icons/react';
import { FieldError } from './Field';

const PILL =
  'inline-flex min-h-[38px] items-center gap-2 rounded-pill border px-3 t-label-lg transition-colors duration-[120ms]';
const ON = 'border-ink bg-ink text-paper';
const OFF = 'border-control bg-surface text-ink';

// ref (React 19 passes it as a prop) lets a page move focus to a tag.
export default function FilterTag({ label, selected, onClick, leading, ref }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="group inline-flex min-h-12 items-center rounded-pill focus-visible:outline-offset-[-3px]"
    >
      <span className={`${PILL} ${selected ? ON : `${OFF} group-hover:bg-sunken`}`}>
        {selected ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : leading}
        {label}
      </span>
    </button>
  );
}

/**
 * A radio group drawn as tags, for forms.
 *   options: [{ value, label, leading? }]
 *   inputProps: the result of register('unit', rules)
 */
export function ChoiceTags({ legend, options, value, inputProps, error, errorId }) {
  return (
    <fieldset
      className="mb-4"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-1 text-ink t-title-sm">{legend}</legend>
      <div className="flex flex-wrap gap-x-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              className="group inline-flex min-h-12 items-center rounded-pill has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-3px] has-[:focus-visible]:outline-ink"
            >
              <input type="radio" value={o.value} className="sr-only" {...inputProps} />
              <span className={`${PILL} ${selected ? ON : `${OFF} group-hover:bg-sunken`}`}>
                {selected ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : o.leading}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} error={error} />
    </fieldset>
  );
}
