// The app's button. Looks:
//   ink     the default action (dark ink on paper)
//   accent  chilli red, for the ONE most important action on a screen
//   outline secondary actions
//   text    quiet actions ("Skip", "Sign in" links)
//   chalk   an outline button on the always-dark chalkboard
// While `loading` it keeps its colour and width, disables itself and shows a
// small printed "..." ticker instead of a spinner.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useReducedMotion } from 'motion/react';

// The label wraps rather than being cut off when the phone's text size is
// large (py-2 keeps a two-line label off the edges); max-w-full keeps the
// button inside its column.
const BASE =
  'press-scale inline-flex min-h-12 max-w-full select-none items-center justify-center gap-2 rounded-control py-2 text-center t-label-lg ' +
  'transition-[background-color,color,border-color,transform] duration-[120ms] ease-fl-out';

const LOOKS = {
  ink: 'bg-ink px-6 text-paper hover:bg-ink/88 active:scale-[0.98]',
  accent: 'bg-chilli-deep px-6 text-on-chilli hover:bg-chilli-deep/90 active:scale-[0.98]',
  outline: 'border-[1.5px] border-ink px-6 text-ink hover:bg-ink/6 active:scale-[0.98]',
  text: 'px-3 text-ink underline-offset-4 hover:underline',
  chalk: 'border-[1.5px] border-chalk px-6 text-chalk hover:bg-chalk/10 active:scale-[0.98]',
};

// Disabled is a sunken paper slot with soft ink text, never a faded fill.
const DISABLED = 'border border-control bg-sunken px-6 text-ink-soft';

export function buttonClasses(variant = 'ink', { expand = false, disabled = false } = {}) {
  let look = LOOKS[variant];
  if (disabled) look = variant === 'text' ? 'px-3 text-ink-soft' : DISABLED;
  return `${BASE} ${look} ${expand ? 'w-full' : ''}`;
}

export default function Button({
  variant = 'ink',
  loading = false,
  loadingLabel = 'Working',
  icon: Icon,
  expand = false,
  disabled = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses(variant, { expand, disabled: disabled && !loading })} ${className}`}
      {...props}
    >
      {loading ? (
        <Ticker label={loadingLabel} />
      ) : (
        <>
          {Icon && <Icon size={20} weight="bold" aria-hidden="true" className="shrink-0" />}
          <span className="min-w-0">{children}</span>
        </>
      )}
    </button>
  );
}

/** A react-router link that looks like a Button. */
export function ButtonLink({ variant = 'ink', expand = false, icon: Icon, className = '', children, ...props }) {
  return (
    <Link className={`${buttonClasses(variant, { expand })} ${className}`} {...props}>
      {Icon && <Icon size={20} weight="bold" aria-hidden="true" className="shrink-0" />}
      <span className="min-w-0">{children}</span>
    </Link>
  );
}

/** "Signing in." -> "Signing in.." -> "Signing in..." like a receipt printing. */
function Ticker({ label }) {
  const reduced = useReducedMotion();
  const [dots, setDots] = useState(3);

  useEffect(() => {
    if (reduced) return undefined; // the three dots simply stay still
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 320);
    return () => clearInterval(id);
  }, [reduced]);

  // Unused dots are kept but invisible, so the label does not shift.
  return (
    <span className="font-mono">
      {label}
      {'.'.repeat(dots)}
      <span className="invisible">{'.'.repeat(3 - dots)}</span>
    </span>
  );
}
