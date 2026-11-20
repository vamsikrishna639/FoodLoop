# FoodLoop

A campus food-surplus redistribution app, built as an MCA mini-project.
The college canteen posts food left over after service, registered recipients
ask for a share, volunteers carry it over, and an admin approves accounts and
assigns pickups.

The interface follows one idea, "Canteen Token": every listing is a paper token
slip, every status is a rubber stamp, every history is a printed receipt, and
the canteen's own area is a chalkboard. The full design system is in
[DESIGN.md](DESIGN.md); the form rules are listed in [VALIDATION.md](VALIDATION.md).

The stack is MERN:

| Part | Stack |
|---|---|
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT + bcrypt, express-validator |
| `frontend/` | React 19 (Vite, JavaScript), React Router, Tailwind CSS v4, motion, Recharts, react-hook-form |

## Build status

The backend and the React frontend are complete. The frontend was built in
five stages.

| Stage | Contents | Status |
|---|---|---|
| 1 | Setup, design tokens, component gallery, sign in / register / waiting page, role-based routing, responsive shell | Done |
| 2 | Food listings: recipient counter and detail, donor board, post / edit / delete | Done |
| 3 | Claims: request, approve (stamp drop), turn down, cancel; My requests | Done |
| 4 | Volunteer pickups, alerts and the 20-second refresh, activity feed, admin overview with chart, approvals and assignment | Done |
| 5 | Code splitting by route, accessibility and design audit and fixes, keyboard and contrast checks, screenshots, docs | Done |

What the app does:

- **First visit:** three welcome slides on phones; from 900px wide a split
  page with the real "portions delivered" figure from the API. Shown once per
  browser.
- **Sign in and create an account**, with checks that match the backend
  (see VALIDATION.md): errors appear under each field when you leave it,
  the first wrong field is focused on submit, and server answers (a used
  email, a wrong password, the server being off) are shown too.
- **Waiting for approval:** new and pending accounts see only this page, with
  their account slip and a **Check again** button.
- **Signed-in frame per role:** a bottom bar with a raised action on phones,
  a dark rail on tablets, a menu-board sidebar plus the **Activity** rail on
  desktops. Each role sees only its own pages.
- **Live updates:** every 20 seconds, while the tab is visible, the app asks
  again for the bell's unread count, the Activity rail and the list the page
  shows (the donor's requests, the recipient's counter and receipts, the
  volunteer's runs, the admin's queue). A hidden tab stops asking and
  catches up as soon as it is shown again. New Activity lines fade in at
  the top.
- **Recipient, Today's Counter:** every open or reserved token, soonest
  deadline first, with search (dishes or pickup places), Veg / Non-veg /
  Mixed / Closing soon tags and a token count. Phones open a token as its
  own page (the card flies there); tablets and desktops show it in a side
  panel, and the address bar names the chosen token
  (`/home/listing/<id>`). The detail has the pickup receipt (place,
  prepared time, pickup by, posted, left), the allergens and the
  food-safety note. **Browse** puts the cursor in the search box.
- **Recipient, requesting food:** under a token's details, a quantity
  stepper (1 up to what is left), an optional note and **Request N plates**.
  Once asked, the area shows "You asked for ..." with the request's stamp,
  what happens next and **Cancel request** (asks first). The server's
  refusals are shown in place ("Only 2 plates left" under the quantity; a
  duplicate or a closed token as a slip).
- **Recipient, My requests:** Active and Past tags; each request is a
  printed receipt (asked for, requested, approved or turned down, pickup by,
  volunteer, picked up, delivered) with a stamp, the next step and Cancel
  while the food has not been collected. Two columns when there is room.
- **Donor, Board:** the chalkboard "Today's Surplus" (one line per open
  token, closing first; tap a line to edit it), then **Requests**: each
  waiting request with **Approve** (the APPROVED stamp drops onto that slip)
  and **Turn down** (asks first). Approve is not offered when a request asks
  for more than is left; a note says why. Decisions made on this visit stay
  in place; older ones are listed under "Decided earlier". Then a printed
  counter tally.
  **Post food** opens the form: a bottom sheet on phones, a dialog wider.
  Every field is checked as in VALIDATION.md; the +1 h / +2 h / +4 h buttons
  set the pickup time.
- **Listings** (donor: their own; admin: "All listings"): Open and Closed
  tabs, each token with **Edit** (open ones) and **Delete** (only when no
  portion is reserved, after a confirmation).
- **Volunteer, Pickups:** Assigned / On the way / Delivered tags; each run
  is a printed pickup slip (carry, from, to, phone, pickup by, assigned,
  picked up, delivered) with one large button for the next step:
  **I've collected it**, then **Mark delivered**. **Can't do this run**
  hands it back (asks first). A run moved on during the visit stays where
  it was, with its new stamp. A note warns when the counter closes within
  the hour. Portions carried, as a big figure beside the runs when there is
  room.
- **Alerts** (every role): notifications grouped by day, unread ones with a
  red dot, the word NEW and bold text; selecting one marks it read and opens
  the page it is about (a recipient's approval opens My requests).
  **Mark all read**. The unread count is a badge on the bell in the bottom
  bar, rail and sidebar.
- **Admin, Overview:** the portions delivered (counted only once
  delivered) with the 7-day bar chart (today in red, the value printed
  above each bar), then **Needs a volunteer**: approved requests with no
  run yet, each with **Assign volunteer** (a dialog listing the approved
  volunteers, quietest first), and a printed "Right now" tally with a link
  to the accounts waiting.
- **Admin, Approvals:** Waiting and Decided tags; a table from a 640px wide
  window (stacked slips on phones) with **Approve** and **Reject** (asks
  first). Decisions stay in place, stamped, for the visit.
- **Profile:** the member slip, the paper / chalkboard theme switch (saved in
  the browser) and Sign out.
- **Component gallery** at `/gallery`, open without signing in.
- **Keyboard and screen readers:** every control is reachable with Tab and
  shows a focus ring; dialogs keep focus inside and close with Escape;
  after an action, focus moves to its result; status is always a word.
  Every screen passes an automated WCAG 2.2 AA check (axe-core) in both
  themes at 360, 768 and 1440 px (see Testing).

## What you need

- Node.js 20 or newer
- MongoDB Community Server running locally on `127.0.0.1:27017`
- A modern browser (Chrome, Edge, Firefox or Safari)

The fonts (Bricolage Grotesque, Instrument Sans, JetBrains Mono) are installed
with npm and served by the app, so no internet connection is needed after
`npm install`.

## How to run (two terminals)

### Terminal 1: the API

```
cd backend
npm install
copy .env.example .env
npm run seed
npm start
```

On macOS or Linux use `cp` instead of `copy`.

- `npm run seed` **deletes everything in the `foodloop` database** and then
  inserts the demo data. Run it once at the start, and again whenever you want
  a clean demo.
- `npm start` serves the API on `http://localhost:5000`. Open
  `http://localhost:5000/api/health` to check it is running.
- `npm run dev` does the same and restarts when a file changes.
- After pulling new code, stop and start the server again (`npm start` does
  not reload). An old server answers new endpoints with "Route not found".

The settings in `backend/.env`:

| Name | Meaning | Default |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/foodloop` |
| `JWT_SECRET` | Secret used to sign login tokens. Change it. | placeholder |
| `JWT_EXPIRES_IN` | How long a login lasts | `7d` |

### Terminal 2: the web app

Keep the API running, then:

```
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API address lives in one place,
`frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Change it if the API runs elsewhere (for a phone on the same Wi-Fi, use your
computer's address, e.g. `http://192.168.1.5:5000/api`, and start Vite with
`npm run dev -- --host`). Restart `npm run dev` after editing `.env`.

`npm run build` makes a production build in `frontend/dist`;
`npm run preview` serves that build on `http://localhost:4173`.

## Test logins

Every seeded account uses the password `password123`.

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@foodloop.test` | Campus Admin |
| Donor | `canteen@foodloop.test` | Main Block Canteen |
| Recipient | `ananya@foodloop.test` | Asha Night Shelter |
| Recipient | `farhan@foodloop.test` | Boys Hostel C Mess |
| Volunteer | `kiran@foodloop.test` | NSS Unit 2 |
| Volunteer | `meera@foodloop.test` | NSS Unit 2 |
| Recipient, pending | `rohit@foodloop.test` | Sees only the "waiting for approval" screen |

A newly registered account is always pending until an admin approves it.
Admin accounts cannot be registered in the app; they come from the seed
script or from `npm run create-admin` (below).

### Creating your own admin

The seeded `admin@foodloop.test` is for the demo. To add a real admin
account, run this from `backend/` with your own details:

```
npm run create-admin -- "Full Name" you@college.edu "a-strong-password"
```

A phone number can follow as a fourth argument. The `--` is needed so npm
passes the values on to the script. The script checks the same rules as the
register form (name of 2+ characters, a valid email, a password of 6+
characters), hashes the password with bcrypt, and creates the account as an
**approved admin**, ready to sign in. It refuses an email that already exists
and never changes an existing account. It writes to the database in
`MONGO_URI` (from `.env`), so `npm run seed` would delete this admin too.

Keep these details out of the repository: do not put them in a file that is
committed. The command line, password included, may be saved in your
terminal's history; clear that history afterwards on a shared computer.

What the seed sets up for the claim workflow:

- **Veg Grilled Sandwiches** (12 packets) has two pending requests: Ananya
  for 6 and Farhan for 8. Approve one and the other can no longer be approved
  in full, which shows the over-allocation guard.
- **Chicken Biryani** has Ananya's approved request (a volunteer is assigned,
  so she can still cancel it) and Farhan's pending request for 5.
- **Mixed Lunch Thali** is fully reserved by Farhan, and the food is already
  picked up, so his request can no longer be cancelled.
- **Dal Tadka** has Farhan's turned-down request, Ananya's cancelled one,
  and Farhan's second request (3 kg), which is approved and has **no
  volunteer yet**. It is the item in the admin's "Needs a volunteer" list.
- **Kiran** has one assigned run (Ananya's biryani); **Meera** has one
  picked-up run (Farhan's thali). Mark Meera's delivered and the thali
  listing becomes completed.
- Four delivered runs over the past week (Rajma Chawal, Poha and Chai, Veg
  Pulao, Idli Sambar) fill the 7-day chart: 112 portions in all.
- **Rohit** is waiting in Approvals.

## Demo script

One full run from posting to delivery, about five minutes: donor posts,
recipient asks, donor approves, admin assigns, volunteer delivers. Start
from a fresh seed (`npm run seed`; the API can keep running) and open the
app in Chrome. Sign out between steps from **Profile**, or use a second
browser profile so two people are signed in side by side (the other
person's change then shows up within 20 seconds, without a reload).

This script was run step by step in the browser on a fresh seed at the end
of Stage 5; the numbers below are what it showed.

1. **Canteen posts food.** Sign in as `canteen@foodloop.test`. Press
   **Post food**. Enter "Veg Pulao" in *What is it?*, keep *Veg*, quantity
   `10`, *plates*, leave the times as they are (prepared now, pickup in three
   hours) and press **Print token**. The line appears on the chalkboard
   "Today's Surplus" with its own number: "Veg Pulao ... 10 left",
   "#FL-0011 · 10 plates".
2. **Recipient asks for a share.** Sign in as `ananya@foodloop.test`. On
   **Today's Counter** open the Veg Pulao token (scroll down: the list is
   soonest deadline first). Press the plus button (**More plates**) three
   times so it reads 4, and press **Request 4 plates**. The area changes to
   "You asked for 4 plates" with a PENDING stamp.
3. **Canteen approves.** Sign in as the canteen again. Under **Requests** on
   the Board, find Ananya's 4 plates of Veg Pulao and press **Approve**. The
   APPROVED stamp drops onto the slip (the one animation kept for this
   moment). The chalkboard line now shows 6 left.
   *To show the over-allocation guard here:* Ananya's 6 and Farhan's 8
   packets of Veg Grilled Sandwiches are both pending on a 12-packet token.
   Approve Ananya's: Farhan's slip no longer offers Approve and says "Only
   6 packets left, fewer than this request asks for, so it can only be
   turned down". The server refuses such an approval as well (a page left
   open from before gets "Only 6 packets left, but this request asks for 8
   packets"); the Postman collection proves it with a direct API call.
4. **Admin assigns a volunteer.** Sign in as `admin@foodloop.test`. On
   **Overview**, **Needs a volunteer** lists the Veg Pulao request (under
   Farhan's dal from the seed, oldest approval first). Press
   **Assign volunteer**. The dialog lists the approved volunteers, the
   least busy first and already chosen (the button reads **Assign Meera**).
   Choose **Kiran Kumar**; the button changes to **Assign Kiran**. Press it:
   the slip gets an ASSIGNED stamp and "Kiran Kumar will collect it".
5. **Volunteer collects and delivers.** Sign in as `kiran@foodloop.test`
   (works best at phone width: Chrome DevTools, device toolbar). On
   **Pickups** (the Assigned tab, newest first), the Veg Pulao slip shows
   what to carry (4 plates), the pickup deadline, from where, to whom and
   their phone. Press **I've collected it** (PICKED UP stamp), then
   **Mark delivered** (DELIVERED stamp, "Delivered. Thank you for the run").
6. **Everyone sees the result.**
   - Ananya: **My requests**, **Past** tag, prints the full receipt
     (Requested, Approved, Volunteer Kiran Kumar, Picked up, Delivered) with
     a DELIVERED stamp; **Alerts** has "Kiran Kumar will collect your Veg
     Pulao" and "Veg Pulao (4 plates) was delivered by Kiran Kumar"; select
     one to open My requests.
   - Admin: the portions-delivered figure goes from 112 to 116 and today's
     bar on the 7-day chart grows by 4.
   - Canteen: "Delivered, ever" on the Board tally goes from 112 to 116.

Food counts as delivered only at step 5. Until then every figure stays the
same, which is business rule 4.

## Testing

### API: Postman collection

`backend/postman/FoodLoop.postman_collection.json` holds 80 requests with 231
checks, in six folders: sign in, auth and access, listings, requests,
pickups, and admin / notifications / dashboards. The negative tests include:

- **Over-allocation:** two requests for 6 of a 10-box listing; approving the
  second is refused ("Only 4 boxes left"), the listing still has exactly 6
  reserved, and the refused request is back to pending.
- **Wrong role:** a recipient approving, an admin approving (donor only), a
  recipient posting food, a volunteer editing a listing, a donor assigning a
  volunteer, another volunteer updating someone's run, a recipient listing
  users, a pending account browsing food.
- **Invalid transitions:** approve or turn down an approved request, approve
  or cancel a turned-down one, a pickup from assigned straight to delivered,
  picked up twice, delivered to cancelled, cancelling after pick-up.
- **Duplicates and bad input:** a second open request for the same listing,
  assigning the same request twice, a request on an expired listing,
  registering as admin, bad ids, bad filters, missing fields (each with its
  field message).

To run it in Postman or Thunder Client: start the API on port 5000 with
fresh seed data, import the file, and run the whole collection in order with
the Collection Runner (later requests use tokens and ids saved by earlier
ones). From the command line:

```
cd backend
npm run test:api
```

This runs the same file with newman (downloaded by `npx` on first use). The
collection makes its own listing, so it passes on any seeded database and
can be run more than once, but it does add requests and a delivered run, so
run `npm run seed` again before a demo. To point it at another port:
`npx -y newman@6.2.1 run postman/FoodLoop.postman_collection.json --env-var baseUrl=http://localhost:5050/api`.

The concurrent case (two approvals arriving at the same instant) cannot be
expressed in a collection that runs one request at a time. It was checked in
Stages 3 and 4 with a Node script that fired both requests together: exactly
one succeeds.

Thunder Client imports the same file (Collections > Import) and can send
every request; the checks are Postman scripts (`pm.test`), so run them in
Postman or with `npm run test:api`.

### Accessibility, keyboard and screenshots (Stage 5)

At the end of Stage 5 every screen (21, including the Post food and
Assign volunteer dialogs) was opened in headless Chrome as each role, at
360, 768 and 1440 px wide, in both themes, and checked automatically:

- **axe-core 4.14** (WCAG 2.0 / 2.1 / 2.2 A and AA rules plus best
  practice, including colour contrast): **0 violations** on every screen.
- **No horizontal scroll** and **no console errors** at any size.
- **Keyboard walk:** Tab from the top of each page to the end: every
  visible control is reached, in reading order, and each shows a focus
  ring; in the dialogs focus stays inside and Escape closes them.
- **Large text:** with the text size doubled (200%) at 360 and 768 px, no
  page scrolls sideways; buttons and headings wrap instead of being cut.

The fixes this found are listed in `docs/stage5-audit.md`. The screenshots
are in `docs/screenshots/`, named `<role>-<screen>-<width>-<theme>.jpg`
(for example `donor-board-360-dark.jpg`).

### Component gallery

Open `http://localhost:5173/gallery` (no login needed). It shows every
signature component with sample data: token cards in each state, every status
stamp and the stamp drop, portion meters, deadline clocks, the veg markers,
the receipt, the chalkboard, the impact number, buttons, form fields with
their error messages, the slip messages and the empty and error states. The
switch at the top changes between the paper and chalkboard themes.

## Project layout

```
backend/
  src/
    app.js            Express app and route mounting
    server.js         loads .env, connects to MongoDB, listens
    config/           database connection
    models/           User, FoodListing, ClaimRequest, Pickup, Notification, Counter
    controllers/      request handlers (auth, foods, claims, pickups, users,
                      notifications, dashboard + activity, impact)
    routes/           routes and validation rules
    middleware/       auth (protect, requireApproved, requireRole), validate, errorHandler
    utils/            response envelope, ApiError, listing expiry and
                      completion, allowed status changes (transitions.js),
                      notifications, quantity wording
  seed/seed.js        demo data
  scripts/createAdmin.js   npm run create-admin: one approved admin account
  postman/            Postman collection with the API checks (npm run test:api)

frontend/
  .env                VITE_API_URL (copy from .env.example)
  index.html          applies the saved theme before the first paint
  src/
    main.jsx          providers (theme, slip messages, auth) around the router
    App.jsx           every route and the gate that guards it; each page is
                      loaded on its first visit (React.lazy, code splitting)
    config.js         reads VITE_API_URL
    api/              client.js (the one fetch wrapper) and one file per resource
    context/          AuthContext, ThemeContext, ToastContext (slip messages),
                      LiveContext (the one 20-second refresh and the notifications)
    routes/Gate.jsx   who may open which page (signed out, pending, role)
    hooks/            useValidatedForm (react-hook-form settings), useMediaQuery,
                      useFeed (the counter's list and filters), useListings,
                      useClaims (requests), useLiveList (a list that refreshes
                      itself), useFocusWhen
    validation/       the rules for each form, shared constants, server errors
    lib/              motion tokens, formatting, roles and navigation, storage,
                      facts about a listing (listing.js), a request (claim.js)
                      and a notification (notification.js)
    components/       TokenCard, StatusStamp, StampDrop, PortionMeter, DeadlineClock,
                      ReceiptTimeline, ImpactNumber, VegMarker, Chalkboard,
                      ResponsiveShell, ActivityRail, DeliveriesChart (Recharts),
                      Field, Button and the rest
    pages/            auth (login, register, pending), common (welcome, profile,
                      gallery), recipient (Counter, ListingDetail, RequestFood,
                      CancelRequest, MyRequests), donor (Board, RequestQueue,
                      ListingForm, ManageListings), volunteer (Pickups), admin
                      (Overview, AssignVolunteer, Approvals), common (Alerts)
    styles/index.css  the design tokens (CSS variables), Tailwind theme,
                      type scale and the paper shapes
  vite.config.js      dev server port and the named library chunks

docs/
  screenshots/        every screen, 360 / 768 / 1440, light and dark
  stage5-audit.md     the Stage 5 audit: what was checked, found and fixed
```

## API

Every response has the shape `{ success, message, data }`. Validation
failures also carry `data.errors`, a `{ field: message }` map.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | public |
| GET | `/api/impact` | public: portions delivered so far |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/foods` | approved user. Filters: `status` (comma list), `foodType`, `search`, `closingSoon=true` |
| POST | `/api/foods` | donor |
| GET | `/api/foods/mine` | donor |
| GET | `/api/foods/:id` | approved user |
| PATCH | `/api/foods/:id` | donor (own listing) or admin |
| DELETE | `/api/foods/:id` | donor (own, no approved requests) or admin |
| POST | `/api/claims` | recipient. Body: `listingId`, `requestedQuantity`, `note` (optional) |
| GET | `/api/claims/mine` | recipient: own requests, newest first, with pickup details |
| GET | `/api/claims/incoming` | donor: requests for own listings, pending first |
| PATCH | `/api/claims/:id/approve` | donor (own listing) |
| PATCH | `/api/claims/:id/reject` | donor (own listing) |
| PATCH | `/api/claims/:id/cancel` | recipient (own request) |
| GET | `/api/pickups/unassigned` | admin: approved requests with no volunteer yet |
| POST | `/api/pickups/assign` | admin. Body: `claimRequestId`, `volunteerId` |
| GET | `/api/pickups/mine` | volunteer: own runs, newest first |
| PATCH | `/api/pickups/:id/status` | volunteer (own run). Body: `status` = `picked_up`, `delivered` or `cancelled` |
| GET | `/api/users` | admin. Filters: `status`, `role` (comma lists). Volunteers include `activeRuns` |
| PATCH | `/api/users/:id/verify` | admin. Body: `status` = `approved` or `rejected` |
| GET | `/api/notifications` | approved user: own, newest first (50), with `unreadCount` |
| PATCH | `/api/notifications/:id/read` | approved user (own) |
| PATCH | `/api/notifications/read-all` | approved user |
| GET | `/api/dashboard` | approved user: the role's figures and a 7-day series |
| GET | `/api/activity` | approved user: recent events, limited to what the role may see |

Claim rules enforced by the API:

- **No over-allocation.** Approval reserves portions with one conditional
  `findOneAndUpdate` (`$expr` checks `reserved + requested <= quantity`, `$inc`
  adds it), so two approvals at the same moment cannot both succeed. A refused
  approval leaves the request pending.
- When every portion is reserved, the listing becomes `fully_reserved`.
  Cancelling an approved request gives the portions back and the listing is
  `available` again.
- Expired listings accept no new requests and no approvals.
- Allowed changes only: pending → approved, rejected or cancelled; approved →
  cancelled. Anything else is a 400.
- One open (pending or approved) request per recipient per listing (409).
- Asking for more than is left is refused when the request is sent, and again
  at approval.
- A recipient cannot cancel once the volunteer has picked the food up.

Pickup and account rules enforced by the API:

- Only approved requests can be assigned, only to an approved volunteer, only
  before the pickup deadline, and only once (409) unless the earlier run was
  handed back.
- Allowed pickup changes only: assigned → picked_up → delivered; assigned or
  picked_up → cancelled. Anything else is a 400. A volunteer can change only
  their own runs, and a double tap changes a run once.
- Food counts as delivered only when a pickup is `delivered`. After each
  delivery, a listing whose portions are all given out (or whose pickup time
  has passed) and whose approved requests are all delivered becomes
  `completed`.
- Admin accounts never appear in `/api/users` and cannot be approved or
  rejected.
- Notifications: request submitted (to the canteen), approved / turned down
  (to the recipient), volunteer assigned (to the volunteer and the
  recipient), delivered (to the recipient and the canteen), account approved
  (to the new user).

Listing rules enforced by the API:

- The prepared time cannot be in the future; the pickup deadline must be in
  the future and after the prepared time.
- An open listing whose deadline has passed becomes `expired`. This is checked
  just before every listing read, so no background job is needed.
- The quantity cannot be lowered below what is already reserved.
- Expired and completed listings cannot be edited.
- `status`, `reservedQuantity`, `tokenNumber` and `donorId` cannot be set by
  the client; they are ignored if sent.

## Checks

```
cd frontend
npm run build
```

The build must finish without errors (and without the "chunk larger than
500 kB" warning). Each page is its own JavaScript file, loaded the first
time it is opened, so signing in downloads only what that page needs:

| File | Size (minified) | Loaded |
|---|---|---|
| `index-*.js` (the app's own shared code) | about 60 kB | always |
| `react-*.js` (React, React DOM, React Router) | about 317 kB | always |
| `motion-*.js` | about 161 kB | always |
| `forms-*.js` (react-hook-form) | about 35 kB | pages with a form |
| one file per page (`Counter-*.js`, `Board-*.js` ...) | 2 to 23 kB | that page |
| `DeliveriesChart-*.js` (Recharts) | about 373 kB | only the admin Overview |

Before the split everything was one 733 kB file. The backend is checked
with the Postman collection (see Testing).
