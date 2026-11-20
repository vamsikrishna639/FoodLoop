// How many portions are left, as a row of small plate or box icons that are
// inked in as they get reserved. Large counts (and kg, which is a weight,
// not a count of things) collapse to a ten-segment bar. The text under it
// always says the number, so the meter never relies on the picture alone.
const MAX_ICONS = 12;

export default function PortionMeter({ total, reserved, unit, onBoard = false }) {
  const left = Math.max(0, Math.min(total, total - reserved));
  const ink = onBoard ? 'text-chalk' : 'text-ink';
  const soft = onBoard ? 'text-chalk-soft' : 'text-ink-soft';
  const useIcons = total <= MAX_ICONS && unit !== 'kg';
  const round = unit === 'plates';

  return (
    <div role="img" aria-label={`${left} of ${total} ${unit} left`} className="min-w-0">
      {useIcons ? (
        <div className={`flex flex-wrap gap-[3px] ${ink}`} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 12 12">
              {round ? (
                <>
                  <circle cx="6" cy="6" r="5.2" fill={i < reserved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
                  {i >= reserved && <circle cx="6" cy="6" r="2.6" fill="none" stroke="currentColor" strokeOpacity="0.35" />}
                </>
              ) : (
                <rect x="0.75" y="0.75" width="10.5" height="10.5" rx="2" fill={i < reserved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
          ))}
        </div>
      ) : (
        <SegmentBar fraction={total === 0 ? 0 : reserved / total} ink={ink} soft={soft} />
      )}
      <p className="mt-1 truncate" aria-hidden="true">
        <span className={`t-mono font-bold ${ink}`}>{left}</span>
        <span className={`t-mono-sm ${soft}`}>
          {' '}
          / {total} {unit} left
        </span>
      </p>
    </div>
  );
}

/** Ten small segments; the reserved share is filled. */
function SegmentBar({ fraction, ink, soft }) {
  const filled = Math.round(fraction * 10);
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-[9px] rounded-[1.5px] border-[1.5px] ${i < filled ? `${ink} border-current bg-current` : `${soft} border-current`}`}
        />
      ))}
    </div>
  );
}
