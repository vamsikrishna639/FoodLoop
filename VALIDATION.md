# Form validation

Every form in the React app checks its fields before sending them, with the
same rules as the backend. **The backend is the source of truth**: its
express-validator rules (`backend/src/routes/*.js`), Mongoose models and
controller checks decide. The frontend only gives earlier, friendlier
feedback, and it never assumes its own checks are enough.

## How it works

- **Library:** react-hook-form only. No zod, yup or resolvers. Rules are the
  built-in `register()` options (`required`, `minLength`, `maxLength`, `min`,
  `max`, `pattern`) plus `validate` for custom and cross-field rules (which
  read other fields with `getValues()`).
- **Where the rules live:** one file per form in `frontend/src/validation/`,
  exported as plain objects. Shared values (email pattern, password length,
  allowed units...) are in `validation/constants.js`, copied from the backend.
- **When fields are checked** (`frontend/src/hooks/useValidatedForm.js`):
  - `mode: 'onBlur'`: a field is checked when the user leaves it.
  - `reValidateMode: 'onChange'`: after a submit, fields re-check as they change.
  - While a field shows an error, it is also re-checked on every change, even
    before the first submit, so the message disappears as soon as the value
    is right. (react-hook-form's `reValidateMode` only starts after a submit;
    `field()` in the hook adds this.)
  - `shouldFocusError: true`: a failed submit focuses the first wrong field.
- **How errors look** (`frontend/src/components/Field.jsx`): under the field,
  small mono text in `chilliDeep` (the red that passes contrast as text)
  with a warning icon, so colour is never the only signal. The input gets
  `aria-invalid="true"` and `aria-describedby` pointing at the message.
- **Submitting:** the submit button is disabled and shows a printed "..."
  ticker while `formState.isSubmitting` is true.
- **Password fields** have a show / hide button (`PasswordField`).

## Server errors

`frontend/src/validation/serverErrors.js` (`handleServerError`):

- A **400 or 409 with field errors** (`data.errors = { field: message }`)
  for fields on this form: each message is put under its field with
  `setError()`, and the first is focused. Example: registering with an email
  that is already used returns 409 `{ email: 'An account with this email
  already exists' }`.
- **Anything else** (wrong password, 403, 404, a 409 without a field, the
  server being off): the message is shown as a slip at the bottom of the
  screen (`ToastContext`), styled like a printed slip with a NOT DONE mark.

## Forms

### Sign in (Stage 1)
File: `frontend/src/validation/loginRules.js`. Backend: `authRoutes.js`, `POST /auth/login`.

| Field | Rule | Message |
|---|---|---|
| email | required; trimmed; email pattern | "Enter your email" / "Enter a valid email" |
| password | required (not trimmed) | "Enter your password" |

A wrong email or password (401 "Incorrect email or password") has no field,
so it is shown as a slip.

### Create account (Stage 1)
File: `frontend/src/validation/registerRules.js`. Backend: `authRoutes.js`, `POST /auth/register`.

| Field | Rule | Message |
|---|---|---|
| role | required; one of `donor`, `recipient`, `volunteer` (admin is shown but disabled) | "Choose donor, recipient or volunteer" |
| name | required; trimmed; at least 2 characters | "Enter your name" |
| organization | optional; trimmed; at most 80 characters | "Organization name is too long" |
| email | required; trimmed; email pattern | "Enter your email" / "Enter a valid email" |
| phone | required; trimmed; `^[0-9+\- ]{7,15}$` (7 to 15 digits, spaces, + or -) | "Enter your phone number" / "Enter a valid phone number" |
| password | required; at least 6 characters (not trimmed) | "Choose a password" / "Password must be at least 6 characters" |

Server-only check: a used email (409) is shown under the email field.

### Post food / edit a listing (Stage 2)
File: `frontend/src/validation/postFoodRules.js` (added in Stage 2).
Backend: `foodRoutes.js` `listingRules` and `foodController.js` `checkTimes`.
The values are already in `constants.js`:

| Field | Rule |
|---|---|
| title | required; 2 to 80 characters |
| description | optional; at most 500 characters |
| quantity | required; whole number from 1 to 1000 |
| unit | one of boxes, plates, kg, packets |
| location | required; 2 to 120 characters |
| foodType | one of veg, non-veg, mixed |
| preparedAt | required; not in the future (5 minutes of leeway, as the backend allows) |
| pickupDeadline | required; in the future; after the prepared time (custom `validate` using `getValues('preparedAt')`) |
| allergenNotes | optional; at most 300 characters |
| imageUrl | optional; must start with http:// or https:// |

### Request food (Stage 3)
File: `frontend/src/validation/requestRules.js` (added in Stage 3).
Backend: `claimRoutes.js` `createRules` and `claimController.js` `create`.

| Field | Rule |
|---|---|
| requestedQuantity | whole number from 1 up to the amount still available (and never above 1000) |
| note | optional; at most 200 characters |

Server-only checks shown to the user: "Only 3 boxes left", "You already have
a request for this token", "Pickup for this token has closed".

### Assign a volunteer (Stage 4)
File: `frontend/src/validation/assignRules.js` (added in Stage 4).
Backend: `pickupRoutes.js` `assignRules`.

| Field | Rule |
|---|---|
| volunteerId | required: a volunteer must be chosen ("Choose a volunteer") |
