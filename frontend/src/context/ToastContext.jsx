// Success and error messages, shown as a small printed slip near the bottom
// of the screen instead of a browser alert.
//
//   const showSlip = useSlip();
//   showSlip('Request sent');                          // DONE
//   showSlip('Only 3 boxes left', { kind: 'error' });  // NOT DONE
//   showSlip('Still in the queue', { kind: 'note' });  // NOTE
//
// The boxed word means the result never depends on colour alone. The slip
// sits in an aria-live region, so screen readers read it without moving focus.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { XIcon } from '@phosphor-icons/react';
import { DURATION, EASE } from '../lib/motion';

const ToastContext = createContext(() => {});

const WORDS = { done: 'DONE', error: 'NOT DONE', note: 'NOTE' };
const MARKS = { done: 'border-slip-done text-slip-done', error: 'border-slip-error text-slip-error', note: 'border-paper' };

export function ToastProvider({ children }) {
  const [slip, setSlip] = useState(null); // { id, message, kind }
  const timer = useRef(null);
  const reduced = useReducedMotion();

  const hide = useCallback(() => setSlip(null), []);

  const showSlip = useCallback((message, { kind = 'done' } = {}) => {
    clearTimeout(timer.current);
    setSlip({ id: Date.now(), message, kind });
    // Errors stay a little longer: they usually need reading twice.
    timer.current = setTimeout(() => setSlip(null), kind === 'error' ? 6000 : 4000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={showSlip}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 z-50 flex tablet:left-auto tablet:right-6 tablet:w-[420px]"
        style={{ bottom: 'calc(16px + var(--bottom-bar, 0px) + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence>
          {slip && (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } }}
              exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE.out } }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-sharp bg-ink py-3 pl-4 pr-2 text-paper shadow-floating"
            >
              <span className={`mt-0.5 shrink-0 rounded-stamp border-[1.5px] px-1.5 py-1 t-mono-sm ${MARKS[slip.kind]}`}>
                {WORDS[slip.kind]}
              </span>
              <p className="min-w-0 flex-1 py-0.5 t-mono [overflow-wrap:anywhere]">{slip.message}</p>
              <button
                type="button"
                onClick={hide}
                aria-label="Dismiss message"
                className="-my-2.5 grid size-12 shrink-0 place-items-center rounded-control text-paper/80 hover:text-paper"
              >
                <XIcon size={18} aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Returns showSlip(message, { kind }) */
export function useSlip() {
  return useContext(ToastContext);
}
