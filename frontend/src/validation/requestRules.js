// Request food. Backend: backend/src/routes/claimRoutes.js (createRules) and
// the "Only N left" check in claimController.js create().
//
//   requestedQuantity  whole number from 1 up to what is still available
//                      (the server's own limit is 1000)
//                      "Ask for at least 1 box" / "Only 3 boxes left"
//   note               optional, at most 200 characters
//                      "Keep the note under 200 characters"
//
// The upper limit depends on the listing being requested, so the rules are
// a function of how much is left and the listing's unit.
import { quantity } from '../lib/format';
import { NOTE_MAX, QUANTITY_MIN, REQUEST_MAX, trim } from './constants';

export function requestRules({ left, unit }) {
  // Never more than the server accepts, even on a very large listing.
  const max = Math.min(left, REQUEST_MAX);
  return {
    requestedQuantity: {
      // The box is type="number"; an empty box becomes NaN.
      setValueAs: (v) => (v === '' || v === null ? NaN : Number(v)),
      validate: {
        whole: (v) => (Number.isInteger(v) && v >= QUANTITY_MIN) || `Ask for at least ${quantity(1, unit)}`,
        notAboveLeft: (v) => v <= max || `Only ${quantity(max, unit)} left`,
      },
    },
    note: {
      setValueAs: trim,
      maxLength: { value: NOTE_MAX, message: 'Keep the note under 200 characters' },
    },
  };
}

/** Field names on the form, for putting server errors under the right input. */
export const REQUEST_FIELDS = ['requestedQuantity', 'note'];
