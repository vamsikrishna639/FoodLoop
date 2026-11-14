# FoodLoop — Progress

Updated on 2026-11-15 after the animation review that followed Stage 5.

## Current stage

**Stage 5 — Testing and polish: complete and committed**, including the
`/review-animations` pass, which the user started after the Stage 5 commit
(committed as "Animation review: reduced motion, frequency, switcher
anchoring"). All five stages of `PROMPT.md` Part J are built. Waiting for the
user.

## Animation review (after Stage 5)

Every animation in the app was checked against the review-animations
standards (Emil Kowalski's). Kept as they were: the page cross-fade (200ms in,
120ms back), the first-load list stagger (40ms steps, 8px rise, 200ms), the
activity rail's new-line fade, the press scale (0.98, 120ms), filter tag and
sidebar colour fades, the skeleton pulse (a loading signal, still under
reduced motion), the button's printing dots, and the stamp drop (420ms, over
the 300ms rule on purpose: it is the one rare, signature moment).

Fixed:
- **Reduced motion removed fades as well as movement.** The standard (and
  DESIGN.md) says gentler, not none. New `FlMotion.fade` keeps opacity and
  colour changes (capped at 120ms); `FlMotion.of` is now only for things
  that move or scale. Under reduced motion: the page cross-fade stays (it was
  cut), list items fade in together without rising (they appeared at once),
  the APPROVED stamp fades in at rest over 120ms (it popped in), the
  decision-line and run-button cross-fades stay.
- **The press scale jumped under reduced motion** (a zero duration still
  snapped to 0.98). Now there is no press scale at all then.
- **Cross-fades jumped sideways at the end.** `AnimatedSwitcher` centres the
  old and new child by default, so on approval the narrower "6 packets
  reserved ..." line appeared centred and jumped left when the buttons left;
  the volunteer's button-to-closing-line swap and the stamp swap did the same.
  New `FlMotion.topLeft` / `topRight` layout builders anchor them.
- **The bottom-bar tab dash animated its width on every tab tap** (a layout
  property on a many-times-a-day action). It now changes instantly.
- **The assign picker's rows animated a border width** (1px to 2px, which
  pushed the text while it ran). Selection now answers instantly, and the
  padding gives back the extra pixel so nothing shifts.
- **The impact number counted up for 900ms every time the page opened** (the
  admin's home page, many times a day). It now counts up once per figure per
  session, then starts from the value it last showed: still on a return
  visit, counting only the difference when a delivery added to it.
  `ImpactNumber.forget()` on sign-out.
- **The recipient's side panel cross-faded for 200ms** when switching tokens,
  long enough to show two panels of text on top of each other; now 120ms.
- **The Hero used Material's curve** (fastOutSlowIn); it now uses the app's
  movement curve, `FlMotion.easeInOut`.
- **Bottom sheets slid up under reduced motion**; they now just appear.
- DESIGN.md's reduced-motion and ImpactNumber lines updated to match.

Verified: `flutter analyze` clean; in the browser at 1440 the approval ends
with the decision line on the left (no jump) and the stamp landed, with and
without reduced motion (`emulateMedia({ reducedMotion: 'reduce' })`, which
Flutter web reads). Not verified frame by frame: here a screenshot takes
seconds and the CDP screencast sent no frames on the second try, so the
in-between frames of the fades and the count-up were not seen.

## Done in Stage 5

**Postman collection** (`backend/postman/FoodLoop.postman_collection.json`)
- 80 requests, 231 checks, six folders; a collection-level check that every
  response uses the `{ success, message, data }` envelope.
- Negative tests: over-allocation (second approval refused, listing still
  6 reserved, request back to pending), wrong role (8 cases), invalid claim
  and pickup transitions (7 cases), duplicate request (409), double assign
  (409), expired listing, registering as admin, bad ids and filters, field
  errors.
- Self-contained: it posts its own listing, so it needs only the seeded
  logins and can run more than once. `npm run test:api` runs it with newman.

**Stage 4 leftovers**
- Alerts link to their page (`alertTarget` in `alerts_screen.dart`): tap marks
  read and opens Board / My requests / Pickups / Counter by type and role; the
  page name is printed under the line with an arrow; the screen-reader label
  says "Open My requests". Read lines that lead somewhere stay tappable.
- Disabled buttons: a sunken paper slot with soft ink text and an outline, in
  the theme for every filled button and in `FlButton`'s accent variant. The
  "Choose a volunteer" button no longer shows as a pale chilli.

**Audit** (`/impeccable audit`, report in `docs/stage5-audit.md`, 16/20 Good,
no P0/P1). The platform line in PRODUCT.md (`adaptive — Flutter, ...`) is read
by the launcher as unknown and treated as web; the native audit reference was
used, as in Stage 4. The launcher has no `audit-storage` command, so the report
was saved in `docs/`. Fixed from it:
- The TokenCard Hero no longer flies when reduced motion is on.
- Filter tags and the nav badge use minimum heights, so large text fits.
- Listing photos decode at the size shown (`cacheWidth`).
Left as P3: lists are Columns, not lazy builders (fine at tens of items); the
8px printed "TOKEN" caption in the empty-photo block (decorative).

**Polish** (`/impeccable polish`, from the full screenshot pass)
- The volunteer's Pickups opened on an empty "Assigned 0" tab while a run was
  "On the way". It now opens on the first tab with work, once per visit.
- No other defects found across 19 screens x 3 widths x 2 themes plus the
  Post food form and the assign picker: no overflow, dark mode correct
  everywhere (chalkboard stays dark, stamps readable, chart colours brightened).

**README**: demo script (canteen posts → recipient requests → canteen approves
→ admin assigns → volunteer collects and delivers → what each role sees), the
Testing section (collection, screenshots, audit), Stage 5 marked done.

## Verified in Stage 5

All against a second API on port 5050 with its own database
(`foodloop_stage5`); the user's `foodloop` database was not touched.
- newman: 80 requests, 231 assertions, 0 failures, twice in a row on the
  same database.
- Screenshots: 126 files of the release web build in `docs/screenshots/`
  (19 screens and 2 overlays, each at 3 widths x 2 themes; the volunteer's 6
  retaken after the tab fix), reviewed as contact sheets. Browser console: no errors
  from the app.
- Clicked in Playwright: an alert line → lands on `/#/requests`; Meera opens on
  "On the way 1" with **Mark delivered**; the assign picker shows the new
  disabled button in light and dark.
- **The demo flow through the UI** on a fresh seed: Ananya at 360 steps to 4
  and taps **Request 4 plates** → the canteen taps **Approve** on that slip →
  the admin taps **Assign volunteer**, picks Kiran, **Assign Kiran** → Kiran at
  360 taps **I've collected it**, then **Mark delivered** (DELIVERED stamp,
  "Delivered. Thank you for the run") → the API shows the request delivered by
  Kiran Kumar, impact 112 → 116, and Ananya's My requests says 52 portions
  received. The posting step was done through `POST /api/foods` (the same
  call the form makes) because Playwright cannot type reliably into Flutter
  web text fields; the form itself was clicked through in Stage 2.
- `flutter analyze`: no issues. `flutter build web` from `C:\FoodLoop\frontend`.

## Stage 4 (summary kept for reference)

### Done in Stage 4

**Shape round** (`/impeccable shape`): one question, answered: the activity
feed is **scoped per role** (admin everything; donor their own listings;
recipient and volunteer only events involving them, plus newly posted food
for recipients).

**Backend**
- `/api/pickups`: `unassigned` (admin: approved requests with no live run),
  `assign` (admin), `mine` (volunteer), `:id/status` (volunteer, own run).
  Status changes use `assertPickupTransition` and flip with the current
  status in the filter, so a double tap changes a run once. A volunteer can
  hand back a run (`cancelled`); the request returns to the admin's list.
- Listing completion: after each delivery, `completeIfDone` marks the listing
  `completed` when nothing more can be given (all reserved, or pickup time
  passed) and every approved request on it is delivered.
- `/api/users` (admin): list with `status` / `role` filters, volunteers with
  `activeRuns`; `:id/verify` approves or rejects (never an admin).
- `/api/notifications`: list (50, newest first, with `unreadCount`),
  `:id/read` (own only), `read-all`.
- `/api/dashboard`: the role's figures and a 7-day series of delivered
  portions. `/api/activity`: up to 25 recent events written as sentences
  ("You requested ...", "Meera Nair delivered ..."). Both are worked out from
  the dates already stored; nothing new is saved. Role scoping lives in one
  function, `scopeFor`.
- Notifications now cover every type in rule 8: volunteer assigned (to the
  volunteer and the recipient), delivered (to the recipient and the canteen),
  account approved.
- `Pickup` gained `cancelledAt`; `Notification` sends `id`. `utils/amount.js`
  is shared by every message.
- Seed: two more delivered lunches in the past week (chart data, 112
  portions over four deliveries), Farhan's approved 3 kg of dal with no
  volunteer (the admin's to-do), posting times set to when the food was
  prepared, notifications with realistic times and a mix of read and unread.

**Frontend**
- Models: `Pickup`, `AppNotification`, `ActivityEvent`, `DashboardStats`;
  `AppUser` gained `createdAt` and `activeRuns`.
- Services: pickups, notifications, admin (users), dashboard (dashboard and
  activity). Providers: `PickupsProvider`, `NotificationsProvider`,
  `ActivityProvider`, `DashboardProvider`, `AdminProvider`, all reset on
  sign-out.
- `LiveUpdates`: one 20-second poller for the bell badge and (only while the
  desktop rail is on screen) the activity feed. An `AppLifecycleListener`
  stops it when the tab or app is hidden and refreshes at once on return.
- **Volunteer Pickups** (`screens/volunteer/pickups_screen.dart`): tabs
  Assigned / On the way / Delivered, each run a pickup-slip receipt, one
  large button ("I've collected it", then "Mark delivered"), a turmeric note
  when the counter closes within an hour, "Can't do this run" with a
  confirmation. A run moved on this visit stays in its tab with the new
  stamp (plain 200ms fade). Wide screens show "Portions you carried" beside
  the runs; phones print the tally under Delivered only.
- **Alerts** (`screens/common/alerts_screen.dart`): grouped by day; unread
  lines have a chilli dot, the word NEW and a bolder message; tapping marks
  read (optimistic); "Mark all read" beside the heading. The bell shows the
  unread count on the bottom bar, rail and sidebar.
- **Admin Overview** (`screens/admin/overview_screen.dart`): an impact block
  (96px "portions delivered" with one printed sentence beside it, not stat
  tiles) and the 7-day chart (`widgets/deliveries_chart.dart`: leaf bars,
  today in chilli, square tops, values printed on the bars, dotted grid, mono
  labels, a screen-reader summary, no animation). Then **Needs a volunteer**
  (slips with "Assign volunteer"; ASSIGNED stamp in place after assigning)
  and a "Right now" receipt with a link to Approvals.
- **Assign sheet** (`screens/admin/assign_sheet.dart`): a dialog on wider
  screens, a bottom sheet on phones; volunteers listed least busy first with
  "FREE" / "1 RUN ON"; "Assign Meera" button; server errors shown inside.
- **Approvals** (`screens/admin/approvals_screen.dart`): Waiting / Decided
  tags; a printed table when the content is 640px or wider, slips below
  that; Approve, and Reject with confirmation; decided rows keep their stamp
  in place this visit.
- **Activity rail** (`widgets/activity_rail.dart`) replaces the placeholder;
  new lines fade in and settle 6px (200ms), the first load does not animate.
- Donor tally gained "Delivered, ever"; My requests shows "N portions
  received so far". `ComingSoonScreen` is gone. `FadeIn` moved to
  `widgets/fade_in.dart` and is shared.

### Verified in Stage 4

- API: 63 checks in a Node script against a second server on port 5050 with
  its own database (`foodloop_stage4`), all passing after the last change.
  They cover: dashboard figures for all four roles; pending and no-token
  blocks; activity sorted newest first, recipient sees no other recipient,
  volunteer sees only own runs; notifications list, unread count, mark read,
  someone else's (404), bad id, read-all; users list, wrong role, bad
  filter, admins never listed, volunteer loads, approve, approve twice,
  verify an admin; unassigned list; assign by a donor (403), empty body
  field errors, assign to a recipient, assign a pending request, assign,
  assign twice (409), notifications to volunteer and recipient; runs carry
  phone and token; other volunteer (403), assigned → delivered (400), bad
  status, **two "picked up" taps in parallel: exactly one 200**; cancel after
  pick-up refused; delivered; delivered → cancelled refused; partial listing
  not completed; fully reserved and delivered → completed; donor told;
  impact grows; hand back → back in the queue → reassigned; receipt shows the
  new volunteer.
- **Polling pause**, measured in the browser on the release build (admin at
  1440): visible for 45s → 2 notification and 2 activity requests; tab hidden
  for 45s → **0 and 0**; shown again → 1 and 1 within 2 seconds.
- Clicked through in Playwright (semantics tree): admin assigns Meera from
  the dialog → ASSIGNED stamp, slip, "NONE WAITING", the rail shows the new
  line on its next load; Meera taps "I've collected it" then "Mark delivered"
  at 360 → PICKED UP then DELIVERED stamps, tally 58 → 61; Farhan taps an
  unread alert → badge 4 → 3.
- Screenshots of the release build: Overview at 1440 / 768 dark / 360 light
  and 360 dark (lower half), assign dialog, Approvals at 1440 light (table) /
  1440 dark and 768 dark (slips before the fix; table width fixed after) /
  360 light, Pickups at 1440 light / 360 dark / 360 light, Alerts at 768 /
  1440 dark / 360 empty, My requests at 768, Board at 1440 (tally).
- `flutter analyze`: no issues. `flutter build web` from `C:\FoodLoop\frontend`.

From the critique (`/impeccable critique`; the platform is `adaptive`, so it
is a design review without the web detector):
- P1, fixed: on a 360px phone the volunteer's button was below the fold.
  The lede is hidden on phones and the tally line moved to the Delivered tab.
- P2, fixed: Overview at 1440 stacked the impact block so tall that the
  volunteer queue started below the fold; number and sentence now share a row.
- P2, fixed: Approvals showed slips at 1440 because of the activity rail;
  the table now fits the ~690px.
- P3, fixed: the Alerts lede repeated the empty state; "Accounts waiting"
  wrapped on phones (now "To approve").
- P3, left for Stage 5: alerts are not links to the page they are about;
  the disabled "Choose a volunteer" button is a pale chilli.

## Known issues / not verified

- Animation in-between frames not inspected (see the animation review).
- **Restart the API on port 5000 and run `npm run seed`** before the demo:
  the user's database was not touched from here.
- **`frontend/build/web` was last built for port 5050** during testing and is
  rebuilt for the default API before the commit; if in doubt, run
  `flutter build web` again from `C:\FoodLoop\frontend`.
- The Postman collection was run with newman, not inside the Postman or
  Thunder Client apps (same file format, v2.1).
- Not tried by hand: the bottom-sheet assign picker's Assign button (only
  shown in a screenshot at 360), on a real Android device the lifecycle pause
  and the app in general (no Android run yet), the stamp drop's
  reduced-motion path, text scaling at 200% on a device.
- No Flutter tests; Google Fonts need internet on first load.

## Assumptions made

Stage 5:
- **Screenshots are kept in the repo** (`docs/screenshots/`, JPEG, about 7 MB)
  as the record the brief asks for.
- **"Every screen"** means every route plus the two overlays (Post food form,
  assign picker); the listing detail is shown for a token with an open request.
- **Alerts link to a page, not to one item**: notifications store no ids
  (Part E lists only userId, message, type, isRead, createdAt).
- **The collection creates its own listing** instead of relying on seed ids,
  so it can run on any seeded database; it is meant for a test run, then a
  re-seed before the demo.
- **The concurrent-approval case** stays covered by the Stage 3/4 Node script;
  a Postman runner sends one request at a time.

Earlier stages (unchanged):
- Activity is scoped per role; recipients also see "posted" lines.
- The feed and badge poll every 20 seconds, only while the app is in front.
- No activity rail on phones and tablets.
- Activity and dashboard figures are computed, not stored.
- The chart shows portions delivered per day.
- A volunteer can hand back an assigned run; it returns to the admin's list
  and keeps its portions reserved.
- Assigning is refused after the pickup deadline.
- Rejected accounts and the admin get no notifications.
- Only one admin assigns, so "one live run per request" is a check before
  create.
- The seed has ten listings.

## Exact next step to resume

Nothing is left in `PROMPT.md` Part J. Before the viva: `npm run seed`,
restart the API, follow the README demo script once, and try the approval
once with the system's reduce-motion setting on to see the gentler path.
