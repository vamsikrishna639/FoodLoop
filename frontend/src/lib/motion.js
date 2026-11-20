// Motion tokens (DESIGN.md section 4). Durations are in seconds because the
// `motion` library uses seconds. Most UI motion is 120-280ms with ease-out.
export const DURATION = {
  fast: 0.12, // press feedback, hover, exits
  base: 0.2, // most transitions
  slow: 0.28, // page and panel changes
  stagger: 0.04, // per item, first load only, capped at 8 items
  count: 0.9, // ImpactNumber count-up
  stampDrop: 0.42, // the approve stamp: the one motion allowed over 300ms
};

export const EASE = {
  out: [0.23, 1, 0.32, 1], // things arriving
  inOut: [0.77, 0, 0.175, 1], // things moving on screen
  stamp: [0.2, 0.9, 0.3, 1.15], // the stamp settles with a tiny overshoot
};

// For opacity-only changes under reduced motion: keep the fade, but never
// longer than `fast`. (Reduced motion means gentler, not none.)
export function fadeDuration(reduced, seconds) {
  return reduced ? Math.min(seconds, DURATION.fast) : seconds;
}
