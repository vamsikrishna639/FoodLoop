// A very large editorial number with a small mono caption, e.g.
//   1,240
//   PORTIONS DELIVERED
//
// It counts up from 0 the first time a figure appears in a session. After
// that it starts from the value it last showed, so coming back to a page
// shows the number standing still, and a figure that grew (112 -> 116)
// counts only the difference, which is the change worth seeing.
// Under reduced motion the number simply appears.
import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { number } from '../lib/format';
import { DURATION, EASE } from '../lib/motion';

// The value each figure (by caption) last showed in this session. Kept in
// memory only: a page reload counts from 0 again.
const shown = new Map();

/** Called on sign-out, so the next user's figures count up from 0. */
export function forgetImpactNumbers() {
  shown.clear();
}

export default function ImpactNumber({ value, caption, suffix, onBoard = false, className = '' }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? value : (shown.get(caption) ?? 0)));

  useEffect(() => {
    const from = shown.get(caption) ?? 0;
    if (reduced || from === value) {
      setDisplay(value);
      shown.set(caption, value);
      return undefined;
    }
    const controls = animate(from, value, {
      duration: DURATION.count,
      ease: EASE.out,
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => shown.set(caption, value),
    });
    // If the page is left mid-count, remember the final value anyway.
    return () => {
      controls.stop();
      shown.set(caption, value);
    };
  }, [value, caption, reduced]);

  return (
    <div className={className}>
      {/* Screen readers get the final figure once, not every frame. */}
      <p className="sr-only">
        {number(value)} {suffix} {caption}
      </p>
      <p aria-hidden="true" className={`t-impact tabular-nums ${onBoard ? 'text-chalk' : 'text-ink'}`}>
        {number(display)}
        {suffix && <span className="ml-2 text-[0.4em] tracking-normal">{suffix}</span>}
      </p>
      <p aria-hidden="true" className={`mt-2 t-mono-sm ${onBoard ? 'text-chalk-soft' : 'text-ink-soft'}`}>
        {caption}
      </p>
    </div>
  );
}
