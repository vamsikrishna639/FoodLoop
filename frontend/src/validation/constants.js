// Shared validation values. They copy the backend's rules exactly
// (backend/src/routes/*.js express-validator rules, the Mongoose models and
// the checks inside the controllers). The backend stays the source of truth:
// these only give early, friendlier feedback.

// express-validator's isEmail() is stricter in rare corners; anything this
// lets through that the server refuses comes back as a field error.
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const NAME_MIN = 2; // authRoutes: name isLength({ min: 2 })
export const PASSWORD_MIN = 6; // authRoutes: password isLength({ min: 6 })
export const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/; // authRoutes: phone matches(...)
export const ORGANIZATION_MAX = 80; // authRoutes: organization isLength({ max: 80 })
export const REGISTER_ROLES = ['donor', 'recipient', 'volunteer']; // "admin" is never accepted

// Listings (foodRoutes listingRules + foodController checkTimes).
export const TITLE_MIN = 2;
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 500;
export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 1000;
export const UNITS = ['boxes', 'plates', 'kg', 'packets'];
export const LOCATION_MIN = 2;
export const LOCATION_MAX = 120;
export const FOOD_TYPE_VALUES = ['veg', 'non-veg', 'mixed'];
export const ALLERGENS_MAX = 300;
export const IMAGE_URL_PATTERN = /^https?:\/\/\S+$/i;
// "Prepared time cannot be in the future" allows a phone clock a few
// minutes fast (controller: leeway = 5 minutes).
export const PREPARED_LEEWAY_MS = 5 * 60 * 1000;

// Claims (claimRoutes createRules).
export const REQUEST_MAX = 1000;
export const NOTE_MAX = 200;

/** Used as setValueAs on text fields: the backend trims them too. */
export const trim = (value) => (typeof value === 'string' ? value.trim() : value);
