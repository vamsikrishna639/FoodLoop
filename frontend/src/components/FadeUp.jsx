// A list item that fades in while rising 8px, 40ms after the item above it.
// Used only the first time a list appears (the page passes animate={true}
// once), so refreshing or filtering never replays it. Items past the sixth
// start together, so a long list never makes anyone wait. Under reduced
// motion every item simply fades in together, without rising.
import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE } from '../lib/motion';

const MAX_STAGGERED = 6;

export default function FadeUp({ index, animate, className = '', children }) {
  const reduced = useReducedMotion();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? DURATION.fast : DURATION.base,
        ease: EASE.out,
        delay: reduced ? 0 : Math.min(index, MAX_STAGGERED) * DURATION.stagger,
      }}
    >
      {children}
    </motion.div>
  );
}
