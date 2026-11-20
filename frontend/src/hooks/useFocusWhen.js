// Moves keyboard focus to an element when `active` becomes true.
//
//   const ref = useRef(null);
//   useFocusWhen(ref, justDecided);
//   <p ref={ref} tabIndex={-1}>...</p>
//
// Used after an action replaces the control that had focus (Approve turns
// into the decision line, a sent request into "You asked for ..."), so
// keyboard and screen-reader users keep their place instead of being sent
// back to the top of the page.
//
// The focus waits one tick (setTimeout 0): when the action came from a
// dialog, the page is inert until the dialog has closed, and an inert
// element cannot take focus.
import { useEffect } from 'react';

export default function useFocusWhen(ref, active) {
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => ref.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [ref, active]);
}
