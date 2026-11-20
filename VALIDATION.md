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
File: `frontend/src/validation/postFoodRules.js`, used by
`frontend/src/pages/donor/ListingForm.jsx`.
Backend: `foodRoutes.js` `listingRules` and `foodController.js` (`checkTimes`,
and the reserved-quantity check in `update`).

The rules are a function, `postFoodRules({ getValues, reserved, unit })`,
because two of them compare fields and one depends on the listing being
edited.

| Field | Rule | Message |
|---|---|---|
| title | required; trimmed; 2 to 80 characters | "Give the food a name (2 to 80 characters)" |
| foodType | one of veg, non-veg, mixed (radio tags) | "Choose veg, non-veg or mixed" |
| quantity | whole number from 1 to 1000 (`validate`) | "Quantity must be a whole number from 1 to 1000" |
| quantity (edit) | not below what approved requests reserved | "8 boxes are already reserved, so the quantity cannot go below that" |
| unit | one of boxes, plates, kg, packets (radio tags) | "Choose boxes, plates, kg or packets" |
| location | required; trimmed; 2 to 120 characters | "Say where to collect it from" |
| preparedAt | required; not more than 5 minutes in the future (the backend's leeway) | "Prepared time cannot be in the future" |
| pickupDeadline | required; in the future | "Pickup deadline must be in the future" |
| pickupDeadline | after the prepared time (cross-field: `getValues('preparedAt')`) | "Pickup deadline must be after the prepared time" |
| allergenNotes | optional; at most 300 characters | "Keep allergen notes under 300 characters" |
| description (Notes) | optional; at most 500 characters | "Keep the description under 500 characters" |
| imageUrl (Photo link) | optional; empty or `http(s)://...` | "Image link must start with http:// or https://" |

Details:
- The two times are native `datetime-local` inputs (local time); they are
  sent to the server as ISO dates.
- Changing **Prepared at** re-checks **Pickup by** (once the user has been
  to it), because the "after the prepared time" rule depends on both.
- The **+1 h / +2 h / +4 h** buttons set Pickup by with `setValue(...,
  { shouldValidate: true })`, so the rule runs at once.
- Server errors for any of these fields (`data.errors`) are put under the
  field; other refusals (403 "You can only manage your own listings", 400
  "This listing has closed and can no longer be edited") are shown as a slip.

Deleting a listing has no form, but the server can still refuse it (409
"This listing has approved requests, so it cannot be deleted"); that is
shown as a slip, and the Delete button is not offered for listings with
reserved portions in the first place.

### Request food (Stage 3)
File: `frontend/src/validation/requestRules.js`, used by
`frontend/src/pages/recipient/RequestFood.jsx` (the request area in a
listing's details). Backend: `claimRoutes.js` `createRules` and
`claimController.js` `create`.

The rules are a function, `requestRules({ left, unit })`, because the upper
limit is how much of this listing is still free.

| Field | Rule | Message |
|---|---|---|
| requestedQuantity | whole number, at least 1 | "Ask for at least 1 plate" |
| requestedQuantity | not more than what is left (and never above 1000, the server's limit) | "Only 25 plates left" |
| note | optional; trimmed; at most 200 characters | "Keep the note under 200 characters" |

Details:
- The quantity is a `QuantityStepper` (`components/QuantityStepper.jsx`):
  minus and plus buttons call `setValue(..., { shouldValidate: true })` and
  stop at 1 and at the limit; the number can also be typed, and a typed
  value past the limit is caught by the rule. It starts at 1.
- The button names the amount ("Request 3 plates"), or says "Request food"
  while the number is not valid.
- The form is only offered when the token can be requested (open, portions
  left) and the recipient has no pending or approved request for it (rule 7).
  Otherwise the area shows "You asked for ..." with Cancel, or why the token
  is closed.

Server-only checks shown to the user:
- 400 "Only 2 plates left" (someone else's request was approved meanwhile):
  comes with a field error, so it is shown under the quantity; the listing
  is read again, so the limit updates.
- 409 "You already have a request for this token. Cancel it first to ask
  again" (sent from another tab): a slip; the recipient's requests are read
  again, so the area switches to "You asked for ...".
- 400 "Pickup for this token has closed" / "This token has already been
  handed out": a slip; the listing is read again and the area says why.

### Approve, turn down, cancel (Stage 3)
No form fields, but the server can refuse. Each refusal is a slip with the
server's own sentence, and the page reads its data again:
- Approve (donor, `pages/donor/RequestQueue.jsx`): 400 "Only 2 boxes left,
  but this request asks for 5 boxes" (the atomic reservation failed), "This
  request has already been decided", "Pickup for this token has closed, so
  the request cannot be approved". Approve is not offered when the request
  already asks for more than is left or pickup has closed; a note says why.
- Turn down asks first ("Turn this request down?").
- Cancel (recipient, `pages/recipient/CancelRequest.jsx`) asks first; 400
  "The food has already been collected, so this request cannot be
  cancelled", 403 "You can only cancel your own requests".

### Assign a volunteer (Stage 4)
File: `frontend/src/validation/assignRules.js`, used by
`frontend/src/pages/admin/AssignVolunteer.jsx` (the "Who collects it?"
dialog on the admin's Overview). Backend: `pickupRoutes.js` `assignRules`
and `pickupController.js` `assign`.

| Field | Rule | Message |
|---|---|---|
| volunteerId | required: one of the approved volunteers listed (radio rows) | "Choose a volunteer" |

Details:
- The request being assigned (`claimRequestId`) is not a field: it is the
  slip the dialog was opened from.
- The volunteers are read again each time the dialog opens
  (`GET /users?role=volunteer&status=approved`), quietest first, each with
  "Free" or "Carrying 1 run". The quietest is chosen already (the admin can
  pick another); arrow keys move between them (real radio inputs).
- The rule still guards the form: with no choice (e.g. the list was empty
  when it loaded) a submit shows "Choose a volunteer" under the list and
  focuses the first option; choosing one clears it at once. The button
  names the person ("Assign Meera").
- The form does not close on a click outside (Escape and Not now do).

Server-only checks shown to the user:
- 400 "Choose a volunteer" (field error): under the list.
- 409 "This request already has a volunteer", 400 "Pickup time for this
  token has passed, so no run can be assigned", 400 "Only approved requests
  can be given to a volunteer", 400 "<name>'s account is not approved yet":
  a slip; the dialog closes and the queue and figures are read again.

### Pickup steps, account decisions (Stage 4)
No form fields, but the server can refuse. Each refusal is a slip with the
server's own sentence, and the page reads its data again:
- Volunteer steps (`pages/volunteer/Pickups.jsx`): "I've collected it"
  (`picked_up`), "Mark delivered" (`delivered`), "Can't do this run"
  (`cancelled`, asks first). 400 "This pickup changed a moment ago. Refresh
  and try again" (a double tap, or a change elsewhere), 400 for a step the
  transition table does not allow, 403 "You can only update your own
  pickups".
- Approvals (`pages/admin/Approvals.jsx`): Approve and Reject (asks first).
  400 "This account is already approved" (decided in another tab).
- Alerts: marking read cannot fail visibly; if the server refuses, the list
  is read again so the screen shows the truth. "Mark all read" failures are
  a slip.
