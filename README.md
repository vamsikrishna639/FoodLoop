# FoodLoop

A campus food-surplus redistribution app, built as an MCA mini-project.
The college canteen posts food left over after service, registered recipients
ask for a share, volunteers carry it over, and an admin approves accounts and
assigns pickups.

The interface follows one idea, "Canteen Token": every listing is a paper token
slip, every status is a rubber stamp, every history is a printed receipt, and
the canteen's own area is a chalkboard. The full design system is in
[DESIGN.md](DESIGN.md).

| Part | Stack |
|---|---|
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT + bcrypt |
| `frontend/` | Flutter (Android and Web), provider, go_router |

## Build status

The app is built in five stages. **All five stages are complete.**

| Stage | Contents | Status |
|---|---|---|
| 1 | Design system, component gallery, auth, role-based shell | Done |
| 2 | Food listings: post, edit, delete, browse, detail; welcome slides | Done |
| 3 | Claim workflow: request, approve, reject, cancel; My requests | Done |
| 4 | Volunteers, notifications, dashboards, approvals | Done |
| 5 | Testing and polish: Postman collection, screenshots, audit, demo script | Done |

What works today:

- **First visit:** three welcome slides on phones; on wide screens a split
  page with the real "portions delivered" figure. Shown once per device.
- **Recipient:** "Today's Counter" with search and filter tags, soonest
  deadline first. Phones open a token's details as a page; tablets and
  desktops show them in a side panel. The raised **Browse** button puts the
  cursor in the search field.
- **Requesting food:** on a token's details, pick a quantity (capped at what
  is left), add an optional note for the canteen and send the request. Once
  sent, the area shows "You asked for ..." with its stamp, a link to My
  requests and a Cancel button; a second request for the same token is not
  possible while one is pending or approved.
- **My requests (recipient):** every request printed as a receipt
  (Requested, Approved / Turned down / Cancelled, Pickup by, Volunteer,
  Picked up, Delivered) with Active and Past tabs and Cancel where allowed.
- **Donor:** the chalkboard "Today's Surplus", the **Requests** queue with
  Approve and Turn down, a printed tally, the **Post food** form (bottom
  sheet on phones, dialog on wider screens), and **Listings** with Open /
  Closed tabs, Edit and Delete. Approving a request drops an APPROVED rubber
  stamp onto it (when the device asks for reduced motion, the stamp just fades
  in at rest).
- **Volunteer (Pickups):** every run printed as a pickup slip (what to
  carry, from where, to whom, their phone, pickup deadline, and the
  assigned / picked up / delivered times). One large button per run:
  **I've collected it**, then **Mark delivered**. An assigned run can be
  handed back ("Can't do this run"); it returns to the admin's list.
  Tabs: Assigned, On the way, Delivered.
- **Admin (Overview):** portions delivered so far as one large figure, a
  7-day bar chart of portions delivered per day, the **Needs a volunteer**
  list of approved requests with **Assign volunteer** (a dialog, or a bottom
  sheet on phones, listing volunteers with how many runs each has on), and a
  printed "Right now" tally.
- **Admin (Approvals):** new accounts with Approve and Reject; a table on
  wide screens, slips on phones. Approved users are notified.
- **Admin:** "All listings", with the same Edit and Delete.
- **Alerts (every role):** notifications grouped by day, unread ones marked
  with a dot and the word NEW. Tapping one marks it read and opens the page
  it is about (a canteen's news opens the Board, a recipient's My requests,
  a volunteer's Pickups); the page's name is printed under each line.
  **Mark all read** clears them all. The unread count shows on the bell.
- **Activity (desktop):** the right-hand rail lists recent events, limited to
  what each role may see (the admin sees everything; a donor sees their own
  listings; recipients and volunteers see their own requests or runs, plus
  newly posted food for recipients). It refreshes every 20 seconds, and stops
  while the browser tab or app is in the background.
- **Food counts only once delivered:** every "delivered" figure (the welcome
  page, the admin's number and chart, the donor's tally, "portions received"
  on My requests, the volunteer's "portions carried") counts delivered
  pickups only.

## What you need

- Node.js 20 or newer
- MongoDB Community Server running locally on `127.0.0.1:27017`
- Flutter 3.50 or newer (Dart 3.14), with Chrome for the web build
- An internet connection on first run: the three typefaces are downloaded from
  Google Fonts and then cached

## Setup

### 1. Backend

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

The settings in `.env`:

| Name | Meaning | Default |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/foodloop` |
| `JWT_SECRET` | Secret used to sign login tokens. Change it. | placeholder |
| `JWT_EXPIRES_IN` | How long a login lasts | `7d` |

### 2. Frontend

Keep the backend running, then in a second terminal:

```
cd frontend
flutter pub get
flutter run -d chrome
```

To run on the Android emulator, start an emulator and use `flutter run`. The
app reaches the API at `10.0.2.2:5000` there, which is the emulator's address
for your computer.

To run on a real phone on the same Wi-Fi, pass your computer's address:

```
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:5000/api
```

The API address lives in one file, `frontend/lib/core/config.dart`.

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
Admin accounts cannot be registered; they come only from the seed script.

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

One full run from posting to delivery, about five minutes. Start from a
fresh seed (`npm run seed`; the API can keep running) and open the app in
Chrome. Sign out between steps from **Profile**, or use a
second browser profile so two people are signed in side by side.

1. **Canteen posts food.** Sign in as `canteen@foodloop.test`. Press
   **Post food**. Enter "Veg Pulao" in *What is it?*, keep *Veg*, quantity
   `10`, *plates*, leave the times as they are (prepared now, pickup in three
   hours) and press **Print token**. The slip appears on the chalkboard
   "Today's Surplus" with its own number, e.g. `#FL-0011`.
2. **Recipient asks for a share.** Sign in as `ananya@foodloop.test`. On
   **Today's Counter** open the Veg Pulao token (scroll down: the list is
   soonest deadline first). Press the plus button three times so it reads 4,
   and press **Request 4 plates**. The area changes to "You asked for 4
   plates" with a PENDING stamp.
3. **Canteen approves.** Sign in as the canteen again. Under **Requests** on
   the Board, find Ananya's 4 plates of Veg Pulao and press **Approve**. The
   APPROVED stamp drops onto the slip (the one animation kept for this
   moment). The chalkboard line now shows 6 left.
   *To show the over-allocation guard here:* Ananya's 6 and Farhan's 8
   packets of Veg Grilled Sandwiches are both pending on a 12-packet token.
   Approve one, then the other: the second is refused ("Only 6 packets
   left, but this request asks for 8 packets" if Ananya's went first), and
   it stays pending.
4. **Admin assigns a volunteer.** Sign in as `admin@foodloop.test`. On
   **Overview**, **Needs a volunteer** lists the Veg Pulao request (under
   Farhan's dal from the seed, oldest approval first). Press
   **Assign volunteer**, choose **Kiran Kumar** (the button reads "Choose a
   volunteer" until you do) and press **Assign Kiran**. The slip gets an
   ASSIGNED stamp.
5. **Volunteer collects and delivers.** Sign in as `kiran@foodloop.test`
   (works best at phone width: Chrome DevTools, device toolbar). On
   **Pickups** (the Assigned tab, newest first), the Veg Pulao slip shows what to carry, from where,
   to whom and their phone. Press **I've collected it** (PICKED UP stamp),
   then **Mark delivered** (DELIVERED stamp).
6. **Everyone sees the result.**
   - Ananya: **My requests** prints the full receipt (Requested, Approved,
     Volunteer Kiran Kumar, Picked up, Delivered) and "52 portions received
     so far"; **Alerts** has "Kiran Kumar will collect your Veg Pulao" and
     "Veg Pulao (4 plates) was delivered by Kiran Kumar"; tap one to open My
     requests.
   - Admin: the portions-delivered figure goes from 112 to 116 and today's
     bar on the 7-day chart grows by 4.
   - Canteen: "Delivered, ever" on the Board tally goes up by 4.

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

### Screenshots

`docs/screenshots/` has every screen at 360, 768 and 1440 pixels wide, in the
paper (light) and chalkboard (dark) themes: welcome, sign in, register,
waiting for approval, component gallery, the recipient's counter, token
detail, My requests, alerts and profile, the donor's Board, Post food form,
listings and alerts, the volunteer's pickups and alerts, the admin's
overview, assign picker, approvals, listings and empty alerts. Names follow
`<role>-<screen>-<width>-<theme>.jpg`. They were taken from the release web
build with seeded data.

### Animation review

`/review-animations` (Emil Kowalski's animation standards) was run over every
animation after Stage 5. What it changed is listed in `PROGRESS.md`; in short:
reduced motion now keeps short fades and drops only movement, navigation tabs
and radio choices change instantly, the impact figures count up once per
session, and cross-fades no longer jump sideways at the end.

### Design audit

`docs/stage5-audit.md` is the `/impeccable audit` report from Stage 5
(16/20, "Good"), with what was found and fixed.

## Component gallery

Open `http://localhost:<port>/#/gallery` in the running web app (no login
needed). It shows every signature widget with sample data: token cards, status
stamps, portion meters, deadline clocks, the chalkboard, impact numbers,
receipts, buttons, slips, empty states, the palette and the type scale. The
button at the top switches between the paper and chalkboard themes.

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
  postman/            Postman collection with the API checks (npm run test:api)

frontend/lib/
  core/               theme tokens, router, API client, config, breakpoints, date formats
  models/             data classes (user, food listing, claim request, pickup,
                      notification, activity event, dashboard)
  services/           API calls (auth, food, claims, pickups, notifications,
                      admin, dashboard)
  providers/          app state (auth, theme, feed, listings, claims, pickups,
                      notifications, activity, dashboard, admin) and
                      live_updates.dart, the foreground-only poller
  screens/            auth, common (welcome, profile, alerts), recipient (counter,
                      detail, my requests), donor (board, request queue, listings,
                      form), volunteer (pickups), admin (overview, assign sheet,
                      approvals)
  widgets/            TokenCard, StatusStamp, StampDrop, ReceiptTimeline, ResponsiveShell,
                      ActivityRail, DeliveriesChart and the rest
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
flutter analyze
flutter build web
```

`flutter analyze` should report "No issues found". The backend is checked
with the Postman collection (see Testing).

### If the web build shows the wrong fonts or empty icon boxes

On Windows, run `flutter build web` from a path that starts with an upper-case
drive letter, for example `cd C:\FoodLoop\frontend`. With Flutter 3.50, a
build started from `c:\FoodLoop\frontend` (lower-case `c:`, which is how some
editors open the folder) leaves the fonts, icons and manifest files out of
`build/web`. To recover, delete `frontend/build/web` and
`frontend/.dart_tool/flutter_build`, then build again from `C:\`.

To look at the release build, serve the folder and open
`http://localhost:8080`:

```
python -m http.server 8080 --directory C:\FoodLoop\frontend\build\web
```
