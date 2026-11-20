// The canteen menu board. It keeps its dark slate surface in BOTH themes,
// so the donor's "Today's Surplus" always reads as a chalkboard.
// The class "on-board" switches focus rings to chalk inside it.

export default function Chalkboard({ title, caption, trailing, children, headingLevel = 2, className = '' }) {
  const Heading = `h${headingLevel}`;
  return (
    <section className={`chalkboard on-board p-6 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Heading className="t-headline-md text-chalk">{title}</Heading>
        {trailing}
      </div>
      <ChalkUnderline />
      {/* Any date or count sits below the heading, never as a label above it. */}
      {caption && <p className="mt-2 text-chalk-soft t-mono-sm">{caption}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A hand-drawn chalk underline in turmeric: slightly wavy. */
export function ChalkUnderline() {
  return (
    <svg width="160" height="8" viewBox="0 0 160 8" aria-hidden="true" className="mt-2 block text-turmeric">
      <path
        d="M1.5 5 Q40 0 80 4 T158.5 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** One menu line: "Chicken Biryani ........ 12 boxes". */
export function ChalkItem({ name, trailing, note }) {
  return (
    <div className="flex items-end gap-2 py-2">
      <div className="min-w-0 max-w-[62%]">
        <p className="t-title-lg text-chalk [overflow-wrap:anywhere]">{name}</p>
        {note && <p className="text-chalk-soft t-mono-sm">{note}</p>}
      </div>
      <span className="leader mb-1.5 min-w-4 flex-1 [--dot:rgb(169_163_151_/_0.5)]" aria-hidden="true" />
      <p className="shrink-0 text-right text-chalk t-mono font-bold">{trailing}</p>
    </div>
  );
}
