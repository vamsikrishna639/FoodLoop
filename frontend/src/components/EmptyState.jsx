// Shown when a list has nothing in it, or when loading failed.
// The drawings are plain SVG geometry (an empty plate, a clear counter, a
// blank slip, a kitchen timer). Left-aligned on purpose: the app avoids
// centred-everything layouts.
import Button from './Button';

export default function EmptyState({ art = 'plate', title, message, actionLabel, onAction, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="max-w-[420px]">
      <EmptyArt art={art} />
      <Heading className="mt-6 t-headline-md text-ink">{title}</Heading>
      <p className="mt-2 max-w-[60ch] text-ink-soft t-body-lg">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** A failed load, with a retry button. */
export function ErrorState({ message, onRetry }) {
  return <EmptyState art="slip" title="That did not go through" message={message} actionLabel="Try again" onAction={onRetry} />;
}

/** Just the drawing, for screens that lay out their own text around it. */
export function EmptyArt({ art = 'plate', className = '' }) {
  const line = { fill: 'none', stroke: 'var(--fl-ink)', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const faint = { fill: 'none', stroke: 'var(--fl-perforation)', strokeWidth: 2, strokeLinecap: 'round' };
  const paper = 'var(--fl-surface)';
  const accent = 'var(--fl-turmeric)';

  return (
    <svg width="132" height="96" viewBox="0 0 132 96" aria-hidden="true" className={`block ${className}`}>
      {art === 'plate' && (
        // An empty plate seen from above, with a spoon beside it.
        <>
          <circle cx="55" cy="50" r="40" fill={paper} {...line} />
          <circle cx="55" cy="50" r="26" {...faint} />
          <line x1="116" y1="29" x2="116" y2="88" {...line} />
          <ellipse cx="116" cy="19" rx="7" ry="11" {...line} />
          <circle cx="26" cy="12" r="4" fill={accent} />
        </>
      )}
      {art === 'counter' && (
        // A clear counter top with a service bell.
        <>
          <line x1="0" y1="75" x2="132" y2="75" {...line} />
          <line x1="11" y1="75" x2="11" y2="96" {...faint} />
          <line x1="121" y1="75" x2="121" y2="96" {...faint} />
          <path d="M45 67 A21 21 0 0 1 87 67 Z" fill={paper} {...line} />
          <line x1="66" y1="29" x2="66" y2="37" {...line} />
          <circle cx="66" cy="23" r="4" fill={accent} />
        </>
      )}
      {art === 'slip' && (
        // A blank token slip with a perforation.
        <>
          <rect x="18" y="10" width="82" height="77" rx="8" fill={paper} {...line} />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={26 + i * 9} cy="60" r="1.6" fill="var(--fl-ink)" />
          ))}
          <line x1="32" y1="27" x2="79" y2="27" {...faint} />
          <line x1="32" y1="40" x2="63" y2="40" {...faint} />
          <circle cx="116" cy="23" r="5" fill={accent} />
        </>
      )}
      {art === 'clock' && (
        // A kitchen timer, for "waiting" screens.
        <>
          <circle cx="55" cy="53" r="38" fill={paper} {...line} />
          <path d="M55 25 A28 28 0 1 1 27.7 59.4" fill="none" stroke={accent} strokeWidth="6" />
          <line x1="55" y1="53" x2="55" y2="35" {...line} />
          <line x1="55" y1="53" x2="67" y2="59" {...line} />
          <line x1="47" y1="6" x2="63" y2="6" {...line} />
          <line x1="55" y1="6" x2="55" y2="14" {...line} />
        </>
      )}
    </svg>
  );
}
