// The FoodLoop logo: a tiny chilli-red token slip (with its notches,
// perforation and a turmeric "loop") next to the wordmark.
export default function BrandMark({ onBoard = false, size = 30, showWordmark = true }) {
  const cut = onBoard ? 'var(--fl-board)' : 'var(--fl-paper)';
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.3 }}>
      <svg width={size * 0.82} height={size} viewBox="0 0 26 32" aria-hidden="true">
        <rect width="26" height="32" rx="5" fill="var(--fl-chilli)" />
        <circle cx="0" cy="20.5" r="3.4" fill={cut} />
        <circle cx="26" cy="20.5" r="3.4" fill={cut} />
        <circle cx="8.3" cy="20.5" r="0.9" fill={cut} />
        <circle cx="13" cy="20.5" r="0.9" fill={cut} />
        <circle cx="17.7" cy="20.5" r="0.9" fill={cut} />
        <circle cx="13" cy="10.9" r="4.4" fill="none" stroke="var(--fl-turmeric)" strokeWidth="2.6" />
      </svg>
      {showWordmark ? (
        <span
          className={`font-display font-bold leading-none tracking-[-0.014em] ${onBoard ? 'text-chalk' : 'text-ink'}`}
          style={{ fontSize: size * 0.72 }}
        >
          FoodLoop
        </span>
      ) : (
        <span className="sr-only">FoodLoop</span>
      )}
    </span>
  );
}
