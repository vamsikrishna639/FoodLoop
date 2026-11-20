// Post food / edit a listing. Backend: backend/src/routes/foodRoutes.js
// (listingRules) and the time checks in foodController.js (checkTimes).
//
//   title           2 to 80 characters        "Give the food a name (2 to 80 characters)"
//   description     at most 500               "Keep the description under 500 characters"
//   quantity        whole number 1 to 1000    "Quantity must be a whole number from 1 to 1000"
//                   (edit) not below reserved  "5 boxes are already reserved, ..."
//   unit            boxes|plates|kg|packets    "Choose boxes, plates, kg or packets"
//   location        2 to 120 characters        "Say where to collect it from"
//   foodType        veg|non-veg|mixed          "Choose veg, non-veg or mixed"
//   preparedAt      not in the future (5 min leeway)   "Prepared time cannot be in the future"
//   pickupDeadline  in the future              "Pickup deadline must be in the future"
//                   after the prepared time    "Pickup deadline must be after the prepared time"
//   allergenNotes   at most 300                "Keep allergen notes under 300 characters"
//   imageUrl        empty, or http(s)://...    "Image link must start with http:// or https://"
//
// The date rules compare two fields, so the rules are a function that gets
// react-hook-form's getValues and, when editing, how much is already reserved.
import {
  ALLERGENS_MAX,
  DESCRIPTION_MAX,
  FOOD_TYPE_VALUES,
  IMAGE_URL_PATTERN,
  LOCATION_MAX,
  LOCATION_MIN,
  PREPARED_LEEWAY_MS,
  QUANTITY_MAX,
  QUANTITY_MIN,
  TITLE_MAX,
  TITLE_MIN,
  UNITS,
  trim,
} from './constants';

const QUANTITY_MESSAGE = 'Quantity must be a whole number from 1 to 1000';

/** "2026-11-20T14:30" (a datetime-local value) -> milliseconds, or NaN. */
const toTime = (value) => (value ? new Date(value).getTime() : NaN);

export function postFoodRules({ getValues, reserved = 0, unit = 'portions' }) {
  return {
    title: {
      setValueAs: trim,
      required: 'Give the food a name (2 to 80 characters)',
      minLength: { value: TITLE_MIN, message: 'Give the food a name (2 to 80 characters)' },
      maxLength: { value: TITLE_MAX, message: 'Give the food a name (2 to 80 characters)' },
    },
    foodType: {
      required: 'Choose veg, non-veg or mixed',
      validate: (v) => FOOD_TYPE_VALUES.includes(v) || 'Choose veg, non-veg or mixed',
    },
    quantity: {
      // The input is type="number"; an empty box becomes NaN.
      setValueAs: (v) => (v === '' || v === null ? NaN : Number(v)),
      validate: {
        whole: (v) => (Number.isInteger(v) && v >= QUANTITY_MIN && v <= QUANTITY_MAX) || QUANTITY_MESSAGE,
        // Portions already promised to approved requests cannot be taken back.
        notBelowReserved: (v) =>
          v >= reserved || `${reserved} ${unit} are already reserved, so the quantity cannot go below that`,
      },
    },
    unit: {
      required: 'Choose boxes, plates, kg or packets',
      validate: (v) => UNITS.includes(v) || 'Choose boxes, plates, kg or packets',
    },
    location: {
      setValueAs: trim,
      required: 'Say where to collect it from',
      minLength: { value: LOCATION_MIN, message: 'Say where to collect it from' },
      maxLength: { value: LOCATION_MAX, message: 'Keep the place under 120 characters' },
    },
    preparedAt: {
      required: 'Enter when the food was prepared',
      validate: (v) => toTime(v) <= Date.now() + PREPARED_LEEWAY_MS || 'Prepared time cannot be in the future',
    },
    pickupDeadline: {
      required: 'Enter a pickup deadline',
      validate: {
        future: (v) => toTime(v) > Date.now() || 'Pickup deadline must be in the future',
        // Cross-field rule: read the other field with getValues().
        afterPrepared: (v) => {
          const prepared = toTime(getValues('preparedAt'));
          return Number.isNaN(prepared) || toTime(v) > prepared || 'Pickup deadline must be after the prepared time';
        },
      },
    },
    allergenNotes: {
      setValueAs: trim,
      maxLength: { value: ALLERGENS_MAX, message: 'Keep allergen notes under 300 characters' },
    },
    description: {
      setValueAs: trim,
      maxLength: { value: DESCRIPTION_MAX, message: 'Keep the description under 500 characters' },
    },
    imageUrl: {
      setValueAs: trim,
      validate: (v) => !v || IMAGE_URL_PATTERN.test(v) || 'Image link must start with http:// or https://',
    },
  };
}

/** Every field name on the form, for mapping server errors onto inputs. */
export const POST_FOOD_FIELDS = [
  'title',
  'foodType',
  'quantity',
  'unit',
  'location',
  'preparedAt',
  'pickupDeadline',
  'allergenNotes',
  'description',
  'imageUrl',
];
