// The signature moment (DESIGN.md section 4): when a donor approves a
// request, the APPROVED stamp drops onto the slip like a rubber stamp
// hitting paper.
//
//   start: scale 1.9, invisible, turned an extra -10 degrees
//   end:   scale 1, fully inked, at the stamp's own -6 degrees
//
// It is used ONLY for claim approval, so it stays special. With reduced
// motion the stamp does not fall or turn: it fades in at rest (120ms).
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE } from '../lib/motion';

export default function StampDrop({ play, children }) {
  const reduced = useReducedMotion();

  // A light buzz on phones at the moment of impact, not on the button press.
  // (navigator.vibrate exists on Android browsers; elsewhere it is skipped.)
  useEffect(() => {
    if (!play || !navigator.vibrate) return undefined;
    const id = setTimeout(() => navigator.vibrate(12), reduced ? 0 : DURATION.stampDrop * 700);
    return () => clearTimeout(id);
  }, [play, reduced]);

  if (!play) return children;

  if (reduced) {
    return (
      <motion.span
        className="inline-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.fast }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, scale: 1.9, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        // The ink is fully visible a third of the way in, so the eye sees
        // the stamp while it lands, not a ghost that fades in at the end.
        opacity: { duration: DURATION.stampDrop * 0.35, ease: 'easeOut' },
        // Scale and turn overshoot a hair past flat, then settle.
        scale: { duration: DURATION.stampDrop, ease: EASE.stamp },
        rotate: { duration: DURATION.stampDrop, ease: EASE.stamp },
      }}
    >
      {children}
    </motion.span>
  );
}
