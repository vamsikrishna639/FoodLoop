// The Indian food marking: a green square with a dot (veg), a red square
// with a triangle (non-veg). "Mixed" shows both side by side.

export const FOOD_TYPES = {
  veg: 'Veg',
  'non-veg': 'Non-veg',
  mixed: 'Mixed',
};

function Mark({ veg, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={veg ? 'text-leaf' : 'text-chilli-deep'}
    >
      <rect x="0.9" y="0.9" width="14.2" height="14.2" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {veg ? <circle cx="8" cy="8" r="3.5" fill="currentColor" /> : <path d="M8 4.3 11.8 11.2H4.2Z" fill="currentColor" />}
    </svg>
  );
}

export default function VegMarker({ type = 'veg', size = 16, showLabel = false }) {
  const label = FOOD_TYPES[type] || FOOD_TYPES.veg;
  return (
    <span role="img" aria-label={`${label} food`} className="inline-flex items-center gap-[3px]">
      {type !== 'non-veg' && <Mark veg size={size} />}
      {type !== 'veg' && <Mark veg={false} size={size} />}
      {showLabel && <span className="ml-1.5 text-ink-soft t-mono-sm">{label}</span>}
    </span>
  );
}
