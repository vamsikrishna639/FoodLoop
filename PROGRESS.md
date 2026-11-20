# FoodLoop — Progress

Updated on 2026-11-20 at the end of React Stage 3.

## Current stage

The frontend is being rebuilt in **React (Vite, JavaScript)** against the
existing, unchanged backend. **Stages 1 to 3 of 5 are complete, committed
and pushed to origin.** Stages 1 and 2 were tested and approved by the
user; waiting for the user to test Stage 3. Each stage is pushed when it is
committed (after a secret check).

| Stage | Contents | Status |
|---|---|---|
| 1 | Setup, design tokens, component gallery, auth + routing, responsive shell | Done, approved |
| 2 | Food listings: recipient counter + detail, donor board, post / edit / delete, Listings | Done, approved |
| 3 | Claims: request form, approve with stamp drop, turn down, cancel, My requests receipts | Done |
| 4 | Volunteer pickups, alerts + badge, live activity refresh, dashboards + Recharts chart, admin approvals and assign dialog | Next |
| 5 | `/impeccable audit` + `polish`, `review-animations`, screenshots, VALIDATION.md complete, README | Planned |

The backend is complete (all five stages of the original build). It has not
been changed in the rewrite. CORS: `app.use(cors())` already allows
`http://localhost:5173`, so the one allowed backend change was not needed.

## Impeccable setup (before Stage 2)

`/impeccable doctor` (asked by the user; setup only, no design changes)
found two things: DESIGN.md's colour section was not recognised (the heading
was "## 1. Colour"; now "## 1. Colors", nothing else changed), and no design
hook was installed (`impeccable hooks on`: `.impeccable/config.json` is
committed; the consent file and `.claude/settings.local.json` are
git-ignored). Doctor now reports nothing. Impeccable was not updated (the
user said not to).

## Done in Stage 3

`/impeccable shape` asked one question (where the queue goes on the Board);
the user chose "right under the board", then the tally.

- **Request food** (`pages/recipient/RequestFood.jsx`, in the listing
  detail on the phone page and in the side panel): `QuantityStepper`
  (`components/QuantityStepper.jsx`; minus / plus stop at 1 and at what is
  left, the number can be typed), optional note, accent "Request 3 plates".
  Rules in `validation/requestRules.js` (VALIDATION.md). Once asked (one
  open request per token, from `/claims/mine`), the area shows "You asked
  for ..." with the stamp, the next step, the pickup deadline, See my
  requests and Cancel request. Server refusals: "Only 2 plates left" under
  the quantity (and the listing is read again); 409 duplicate and 400 closed
  as slips (and the requests are read again).
- **Request queue** (`pages/donor/RequestQueue.jsx`, on the Board under the
  chalkboard): "Requests · N waiting"; each request with who, how long ago,
  the amount in mono, the dish, token and portions left, the note; Approve
  and Turn down (asks first). Approve is not offered when the request asks
  for more than is left or pickup closed; a turmeric note says why. The
  APPROVED stamp drops (`StampDrop`) only on the slip just approved; slips
  decided on this visit stay in place with their decision line; older ones
  are compact lines under "Decided earlier" (4). Approve refusals (stale
  board) show the server's sentence and re-read listings and requests. The
  Board's caption says "3 requests are waiting" (a button that scrolls to
  and focuses the queue) while any wait; the tally adds "Requests waiting".
- **Cancel** (`pages/recipient/CancelRequest.jsx`): a confirmation dialog
  used by the detail and by My requests.
- **My requests** (`pages/recipient/MyRequests.jsx`, `/requests`): Active /
  Past tags with counts; each request a ReceiptTimeline (asked for,
  requested, approved / turned down / cancelled, pickup by, volunteer,
  picked up, delivered), stamp (APPROVED moves on to ASSIGNED, PICKED UP,
  DELIVERED from the pickup), next step, the note and Cancel. One list in
  date order; from a 620px container two columns with every second receipt
  lowered (`@container`, transform only).
- **Shared:** `api/claims.js`, `lib/claim.js` (open, active, can cancel,
  stamp, next step), `hooks/useClaims.js` (mine or incoming, `upsert`,
  `openFor`), `hooks/useFocusWhen.js`.
- **Critique fixes** (`/impeccable critique`, 28/40, the user chose "all
  five plus the minor ones"): focus follows every action (decision line
  after Approve / Turn down, "You asked for" after sending, the form heading
  after cancelling, the Past tag after cancelling on My requests); the "N
  waiting" link to the queue; receipts in reading order; heading levels
  without gaps (TokenCard and ReceiptTimeline take a `headingLevel`; the
  phone detail page has the token as its h1; lists use h2); stepper buttons
  "Fewer plates" / "More plates" and the label "Number of plates"; Turn
  down's confirm is chilli like the other irreversible confirms; "fewer than
  this request asks for, so it can only be turned down" instead of "cannot
  be approved in full"; no repeated canteen footer on receipts; the waiting
  count no longer re-announces; more room between See my requests and
  Cancel. One suggestion was declined: moving decided slips below the
  waiting ones would carry the slip away during its stamp drop.
- **Also fixed from screenshots:** the receipt reference broke mid-number
  ("#FL-" / "0006"); "8 boxes ... goes back" grammar.

## Verified in Stage 3

Test API on 5050 with `foodloop_test` (reseeded before each run); Vite on
**5175** (5173 and 5174 were both in use, left alone). The user's API and
database were not touched.

- `npm run build` succeeds; `impeccable detect` over `frontend/src`: no
  findings.
- Screenshots of the Board with the queue, the request form, "You asked
  for", My requests (Active, Past), the turn-down and cancel dialogs, at
  360 / 768 / 1440 in both themes: no horizontal overflow, no console
  errors (except the browser logging the expected 400 answers).
- Flows (Playwright script in the session scratchpad):
  - Approve Ananya's 6 sandwiches: slip "Approved 6 packets of Veg Grilled
    Sandwiches", APPROVED stamp drops on that slip only (sampled per frame:
    scale 1.87 -> 0.96 -> 1, settled at about 450ms), focus on its decision
    line; Farhan's 8 now says "Only 6 packets left, fewer than this request
    asks for" with no Approve.
  - Stale board: the biryani quantity lowered behind the page, Approve on
    Farhan's 5: "Only 2 boxes left, but this request asks for 5 boxes",
    the queue re-reads and shows the note.
  - Turn down: dialog, "Request turned down", REJECTED stamp, focus on the
    decision line.
  - Request: 99 on blur shows "Only 25 plates left"; fixing it clears the
    error at once; the listing shrunk behind the page, Request 3: the
    server's "Only 2 plates left" appears under the quantity and the limit
    becomes 2; Request 2: "Request sent for 2 plates of Samosa and Chutney",
    the area becomes "You asked for 2 plates" (focused).
  - 409: a request sent from another tab, then Request on the stale form:
    "You already have a request for this token..." and the area switches to
    "You asked for 1 kg".
  - Cancel (approved, volunteer assigned) on My requests: dialog, "Request
    cancelled. The portions are back on the counter", Active 3 / Past 4,
    focus on the Past tag.
  - Reduced motion: the approved stamp is at rest (no transform) while it
    fades in.

## Done in Stage 2

- **Recipient counter** (`pages/recipient/Counter.jsx`, `hooks/useFeed.js`):
  search with a 300ms pause (stale replies ignored), Veg / Non-veg / Mixed /
  Closing soon tags, token count, skeletons, error with retry, "No tokens
  match" with Clear filters, "The counter's clear". First load staggers in
  (`FadeUp`, 40ms steps, once). Phones open `/home/listing/:id` as a page
  with the card flying there (View Transition); 600px and up shows a sticky
  side panel, with the URL naming the token (replace, not push). Browse
  focuses the search box.
- **Listing detail** (`pages/recipient/ListingDetail.jsx`): token (or panel
  heading with clock and portions), description, "Collect from" receipt,
  allergens, why it cannot be requested when closed or fully reserved,
  food-safety note. The request area says requesting comes in Stage 3.
- **Donor Board** (`pages/donor/Board.jsx`): chalkboard lines (tap to edit),
  counter tally with "Delivered, ever" from `/api/dashboard`; `@container`
  puts the tally beside the board only at 900px of content.
- **Post / edit form** (`pages/donor/ListingForm.jsx`,
  `validation/postFoodRules.js`): every backend rule, cross-field deadline
  check, quick +1/+2/+4 h, server field errors under fields. In a `Modal`
  (native `<dialog>`): sheet on phones, dialog wider.
- **Listings** (`pages/donor/ManageListings.jsx`): Open / Closed tabs, Edit,
  Delete with a confirmation (not offered when portions are reserved);
  admin sees "All listings".
- **Shared:** `api/foods.js`, `lib/listing.js`, `hooks/useListings.js`,
  `FilterTag` / `ChoiceTags`, `Modal`, `FadeUp`; `api/client.js` now also
  returns the server's `message`; TokenCard takes a `transitionName`.
- **Fixes found in screenshots:** the sidebar and the activity rail's line
  stopped at the bottom of the first screen on long pages (the sticky
  column painted the colour; now an outer column does); the quantity box
  was too narrow for its error and had a placeholder that looked like a
  value; Browse's focus was taken back by the shell (the shell now leaves
  focus alone when the page already put it inside `<main>`).

## Verified in Stage 2

Same setup as Stage 1 (API on 5050 with `foodloop_test`, freshly seeded).
Vite ran on **5174**, because 5173 was in use by another process (most likely
the user's own dev server, left alone).

- `npm run build` succeeds; `impeccable detect` over `frontend/src`: no
  findings (the hook also scanned every edited file: none).
- Screenshots of the counter, a token's detail (phone page and side panel),
  a fully reserved token, the donor Board, donor and admin Listings, the
  Post food form (empty and with errors) at 360 / 768 / 1440, both themes
  where it matters: no horizontal overflow, no console errors.
- Flows: a future prepared time and a deadline before it show both errors;
  fixing the prepared time clears the deadline error at once; an empty
  submit shows the title and quantity errors and focuses the title; a
  valid post closes the sheet, shows "DONE Token #FL-0011 is on the
  counter" and the line appears on the board; editing Chicken Biryani (8
  reserved) to 5 shows "8 boxes are already reserved..."; saving 24 shows
  "Token #FL-0005 updated"; deleting the new token asks first, then shows
  "Token #FL-0011 deleted"; the Closed tab lists 5 closed tokens.
  Counter: 5 tokens; Veg 3; Veg + Closing soon 2; "biryani" 1; "zzzz" shows
  No tokens match; Clear filters back to 5; at 1440 a click selects in the
  panel and the URL becomes `/home/listing/<id>`; at 360 it opens the page
  and the Counter link goes back to the list; Browse from Profile lands on
  the counter with the cursor in the search box; a donor typing
  `/home/listing/...` is sent to `/home`.
- Reduced motion (emulated): the form opens without sliding.

## Done in Stage 1

- **Move:** the previous app moved to `frontend-flutter-old/` with `git mv`
  (item by item, because the editor held a lock on the folder). Untouched since;
  reference only.
- **Setup:** Vite 8 + React 19, React Router 8 (`createBrowserRouter`),
  Tailwind CSS 4.3 (`@tailwindcss/vite`), motion 14, Recharts 3 (installed,
  used in Stage 4), react-hook-form 7, Phosphor icons, self-hosted variable
  fonts (`@fontsource-variable/*`). API URL in `frontend/.env`
  (`VITE_API_URL`, with `.env.example`).
- **Design tokens** (`src/styles/index.css`): the paper and chalkboard palettes
  as CSS variables switched by `html[data-theme]`; `@theme inline` maps them to
  Tailwind names, with Tailwind's default palette and breakpoints removed;
  breakpoints `tablet` 600, `split` 900, `desktop` 1025; radii and shadows;
  the type scale as `t-*` utilities; the token slip notch mask, perforation,
  receipt zigzag mask, chalkboard and skeleton pulse. Motion tokens in
  `src/lib/motion.js`. DESIGN.md refreshed for the web stack with
  `ui-ux-pro-max` (CSS token flow, breakpoints, component states, browser
  surfaces).
- **Components:** Button (ink / accent / outline / text / chalk, loading
  ticker, sunken disabled slot), StatusStamp (all statuses, double border for
  delivered, crossed expired), StampDrop, TokenCard (CSS-mask notches, outline
  that follows them, printed ticket block when there is no photo),
  SkeletonToken, PortionMeter, DeadlineClock (SVG ring), ReceiptTimeline,
  ImpactNumber (count-up once per session), VegMarker, Chalkboard + ChalkItem,
  EmptyState / ErrorState with SVG drawings, BrandMark, Field (TextField,
  TextArea, PasswordField, FieldError, FormNotice), ThemeSwitch, PageFrame,
  ResponsiveShell, ActivityRail.
- **App plumbing:** `api/client.js` (JWT, envelope, `ApiError` with
  `fieldErrors`, 12s timeout, 401 logout), AuthContext (restore session on
  load, login, register, logout, refresh), ThemeContext, ToastContext (slip
  messages), route gates (`routes/Gate.jsx`), roles and navigation
  (`lib/roles.js`).
- **Pages:** Welcome (slides under 900px, split with the live impact figure
  above), Sign in, Create account (role picker as four token slips, Admin
  disabled), Waiting for approval (account slip, Check again), Profile (member
  slip, theme switch, sign out), Component gallery (`/gallery`), and a
  "Built in Stage N" placeholder for each page later stages build.
- **Validation:** react-hook-form only; rules in `src/validation/`
  (`constants.js`, `loginRules.js`, `registerRules.js`, `serverErrors.js`);
  `useValidatedForm` hook; VALIDATION.md written (Stage 2-4 forms listed with
  their backend rules, files added in those stages).
- **Docs:** CLAUDE.md (with the MERN-only and cleanup rules), README (how to
  run both servers), PRODUCT.md (stack), DESIGN.md, VALIDATION.md, this file.

## Verified in Stage 1

Against a second API on port 5050 with its own database (`foodloop_test`,
seeded); the user's database on 5000 was not touched. Vite was pointed at it
with `VITE_API_URL=http://localhost:5050/api`.

- `npm run build` succeeds.
- Screenshots (Playwright script in the session scratchpad) of welcome, sign
  in, register, pending, profile, gallery, each role's home and the alerts
  placeholder at 360, 768 and 1440 in both themes: **no horizontal overflow and
  no console errors** at any size.
- Flows: empty register submit shows five field errors and focuses the role
  group; a short password shows "Password must be at least 6 characters" on
  blur and clears as soon as it is fixed; a used email comes back from the
  server (409) and is shown under the email field; a wrong password shows a
  NOT DONE slip; a correct sign-in lands on `/home`; a recipient typing
  `/approvals` is sent to `/home`; reloading `/profile` stays on `/profile`;
  sign out goes to `/login`; the pending account lands on `/pending` and
  Check again shows a NOTE slip; a first visit to `/login` goes to `/welcome`
  and its Create an account button opens `/register`.
- Keyboard: Tab into the role picker and arrow keys pick a role; the focus
  ring shows on the slip; a field error clears while typing.
- Reduced motion (emulated): the gallery renders, the slip appears without
  movement.
- `impeccable detect` over `frontend/src`: no findings.

Fixed after looking at the screenshots (critique): the slip's DONE / NOT DONE
marks were below 4.5:1 (new `slip-done` / `slip-error` tokens); the sidebar's
red action used ink on brand chilli (now `chilli-deep` with its paper label);
the slip's close button was 40px (now 48); an error stayed after a value was
fixed until the next blur (now re-checked on change while shown).

## Known issues / not verified

- Not tried on a real phone (only emulated widths); `navigator.vibrate` for the
  stamp drop is untested on Android.
- The JavaScript bundle is about 625 kB before gzip (Vite warns above 500 kB).
  Route-level code splitting can be added in Stage 5 if wanted.
- The activity rail loads once per visit; the 20-second refresh arrives in
  Stage 4. The same goes for the donor's request queue and the
  recipient's requests: they are read when the page opens and after each
  action, not live (a new request appears on the Board after a reload or
  a visit to another page and back, until Stage 4).
- The 400 "Pickup for this token has closed" refusal on a request was not
  staged in a browser (it needs a deadline to pass while the form is open);
  it goes through the same slip path as the 409, which was checked.
- At 360 a slip message can cover the button of the next request for its 4
  to 6 seconds; it can be dismissed.
- Going back from a token's page on a phone (the Counter link) starts the
  list at the top; the browser's own Back button restores the scroll.
- The card-to-detail flight was checked to start (navigation with
  `viewTransition`), not inspected frame by frame.
- Small mono captions are uppercase by design, so "3m left" prints as
  "3M LEFT" on the board (the same as the previous app).
- `docs/screenshots/` still holds the previous app's images; they are
  replaced in Stage 5.
- Restart nothing on the user's side: the test API on 5050 and the Vite server
  used for checks were stopped (see the final message of the stage).

## Assumptions made (Stage 3)

- **Queue order:** the board, then the requests, then the tally (the user's
  answer in the shape round). Decided slips stay in place for the visit.
- **Approve is hidden, not disabled,** when it cannot succeed (asks for
  more than is left, or pickup closed), with a note saying why; the server
  checks again either way. There is no partial approval (the backend has
  none): such a request can only be turned down.
- **Turn down and Cancel ask first;** Approve does not (it is the common,
  wanted action, and the stamp is its confirmation).
- **Active vs Past:** Active is approved-not-delivered, or pending on a
  token still open; a pending request whose pickup closed before the
  canteen decided is Past ("lapsed"), since nothing can happen to it.
- **Cancel** is offered while the request is pending or approved and no
  volunteer has collected the food (the server's rule).
- **"Decided earlier"** shows the 4 most recent decisions; the full history
  is not a page in the brief.
- **The quantity starts at 1** and the note is optional, as the backend
  allows.

## Assumptions made (Stage 2)

- **Requesting food is Stage 3.** The detail shows how much is left and says
  requesting comes in Stage 3; the request queue joins the Board then too.
- **Date and time** use the browser's native `datetime-local` inputs
  (accessible, keyboard-friendly, no extra library).
- **The URL names the chosen token on wide screens too**, so a side-panel
  selection can be bookmarked; selecting replaces history instead of adding
  to it.
- **No Post food button on the Board or Listings header**: the shell has one
  on every screen size (as before); the empty Listings state offers it.
- **Forms do not close on a click outside** (Escape and the close button do),
  so a half-filled form is not lost by accident.
- **Admin edits** use the same form; a new token's "Collect from" starts
  with the account's organisation.

## Assumptions made (Stage 1)

- **Port fidelity:** layouts and copy follow the previous app, with web fixes
  (real links, skip link, focus moves to the page on navigation, autofill
  hints, native form submit). The user chose this in the shape question.
- **Error text colour:** the brief says "chilli red"; it uses `chilli-deep`,
  the red that passes AA as small text (DESIGN.md 1.4).
- **Login failures** ("Incorrect email or password") are shown as a slip, as
  the brief asks for non-field server errors, not as a box above the form.
- **Re-validation:** `useForm({ mode: 'onBlur', reValidateMode: 'onChange' })`
  as asked; `useValidatedForm` adds re-checking on change while a field shows
  an error, because react-hook-form only starts `reValidateMode` after a
  submit.
- **Phone rule:** "phone format if the backend checks it": it does
  (`^[0-9+\- ]{7,15}$`), so the form checks the same pattern.
- **Email pattern:** a simple `x@y.z` pattern; express-validator's `isEmail`
  is stricter in rare cases, which then come back as a server field error.
- **Placeholders:** pages built in later stages show "Built in Stage N"
  instead of being hidden, so every navigation item works now.
- **Activity rail in Stage 1:** it loads real events once, since the shell
  needs it; live refresh is Stage 4.
- **Fonts self-hosted** through npm instead of a Google Fonts link (works
  offline at the viva).
- **Icons:** Phosphor (the `ui-ux-pro-max` default), not emoji.
- The step dots on the welcome slides change length instantly (widths are
  never animated); the slide content is the motion.

## Exact next step to resume

Wait for the user to test Stage 3. Then Stage 4: volunteer pickups (Assigned
/ On the way / Delivered tabs, one large status button, pickup receipt),
notifications page and bell badge, the single 20-second refresh (badge,
activity rail, and the request lists; paused while the tab is hidden),
dashboards with the Recharts 7-day chart, admin approvals and the assign
dialog (`validation/assignRules.js`). Replace the remaining placeholders
(volunteer and admin home, `/approvals`, `/notifications`).

## Final task (only when the user says the project is finished)

Remove every trace of the previous mobile toolkit and the screenshot tooling:

1. Delete `frontend-flutter-old/` (`git rm -r`).
2. Search the repo (docs, comments, README, CLAUDE.md, PROGRESS.md,
   PROMPT.md, PRODUCT.md, DESIGN.md, `docs/`) for "Flutter", "Dart", "fl_chart",
   "go_router", "pubspec" and similar, and rewrite or remove those passages.
   This includes the CORS comment in `backend/src/app.js` (it is on the CORS
   line, the one backend change allowed) and the previous app's audit and
   screenshot files in `docs/`.
3. Make sure no Playwright setup is in the repo (no `playwright` dependency,
   config or script); remove the Playwright notes from CLAUDE.md.
4. Remove project rule 2 from CLAUDE.md once it is satisfied.
