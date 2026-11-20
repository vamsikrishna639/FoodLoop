// Form fields with a visible label above (never placeholder-only), helper
// text, and an error message below in the design's style: small mono text
// in chilli red WITH an icon, so the error never relies on colour alone.
//
// Each input gets aria-invalid when it has an error and aria-describedby
// pointing at its helper and error text, so screen readers read them.
//
//   <TextField label="Email" type="email" error={errors.email}
//              {...register('email', loginRules.email)} />
//
// (React 19 passes `ref` as an ordinary prop, so register()'s ref reaches
// the <input> without forwardRef.)
import { useId, useState } from 'react';
import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from '@phosphor-icons/react';

const INPUT =
  'block min-h-12 w-full rounded-control border bg-sunken px-4 py-3 text-ink t-body-lg placeholder:text-ink-soft ' +
  'transition-[border-color,box-shadow] duration-[120ms] focus:outline-none';

/** Border for the normal and error states; focus is a 2px ink (or red) edge. */
export function inputState(hasError) {
  return hasError
    ? 'border-chilli-deep shadow-[inset_0_0_0_0.5px_var(--fl-chilli-deep)] focus:shadow-[inset_0_0_0_1px_var(--fl-chilli-deep)]'
    : 'border-control focus:border-ink focus:shadow-[inset_0_0_0_1px_var(--fl-ink)]';
}

/** Label + control + helper + error. Use it to wrap any custom control. */
export function FieldShell({ id, label, optional, helper, error, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 flex items-baseline gap-2 text-ink t-title-sm">
        {label}
        {optional && <span className="font-normal text-ink-soft t-body-sm">optional</span>}
      </label>
      {children}
      {helper && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-ink-soft t-body-sm">
          {helper}
        </p>
      )}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

/** The red message under a field (renders nothing without an error). */
export function FieldError({ id, error }) {
  if (!error?.message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 font-mono text-[0.8125rem] font-medium leading-snug text-chilli-deep">
      <WarningCircleIcon size={16} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
      <span>{error.message}</span>
    </p>
  );
}

/** ids for aria-describedby: the helper while there is no error, else the error. */
export function describedBy(id, { helper, error }) {
  return [error ? `${id}-error` : helper ? `${id}-help` : null].filter(Boolean).join(' ') || undefined;
}

export function TextField({ label, optional, helper, error, className = '', id: givenId, ...inputProps }) {
  const autoId = useId();
  const id = givenId || autoId;
  return (
    <FieldShell id={id} label={label} optional={optional} helper={helper} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { helper, error })}
        className={`${INPUT} ${inputState(Boolean(error))} ${className}`}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function TextArea({ label, optional, helper, error, rows = 3, id: givenId, ...inputProps }) {
  const autoId = useId();
  const id = givenId || autoId;
  return (
    <FieldShell id={id} label={label} optional={optional} helper={helper} error={error}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { helper, error })}
        className={`${INPUT} ${inputState(Boolean(error))} resize-y`}
        {...inputProps}
      />
    </FieldShell>
  );
}

/** A password input with a show/hide toggle. */
export function PasswordField({ label = 'Password', helper, error, id: givenId, ...inputProps }) {
  const autoId = useId();
  const id = givenId || autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} helper={helper} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { helper, error })}
          className={`${INPUT} ${inputState(Boolean(error))} pr-14`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-control text-ink-soft hover:text-ink"
        >
          {visible ? <EyeSlashIcon size={22} aria-hidden="true" /> : <EyeIcon size={22} aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
}

/** An inline box above a form, e.g. "You were signed out. Please sign in again." */
export function FormNotice({ children, tone = 'info' }) {
  const colour = tone === 'error' ? 'border-chilli-deep text-chilli-deep' : 'border-control text-ink-soft';
  return (
    <div role="status" className={`mb-4 flex gap-2 rounded-control border-[1.5px] p-3 t-body font-semibold ${colour}`}>
      <WarningCircleIcon size={20} aria-hidden="true" className="mt-px shrink-0" />
      <p>{children}</p>
    </div>
  );
}
