# FoodLoop — Progress

Updated on 2026-11-14 at the end of Stage 4.

## Current stage

**Stage 4 — Volunteers, notifications, dashboards: complete and committed**
("Stage 4: volunteers, notifications, dashboards, approvals"). Waiting for
the user to say "continue" before starting Stage 5.

## Done in Stage 4

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

## Verified in Stage 4

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

- **The user's own API on port 5000 must be restarted** (`npm start` does
  not reload): without a restart the new endpoints answer "Route not found"
  and the app shows error states on the new pages.
- **Run `npm run seed` once** for the Stage 4 demo data (it wipes the
  `foodloop` database). The user's database was not touched from here; all
  testing used `foodloop_stage4`.
- Not tried by hand: the bottom-sheet version of the assign picker (only
  the dialog was clicked), Reject on Approvals in the browser (verified
  through the API), "Can't do this run" in the browser (verified through the
  API), on a real Android device the lifecycle pause.
- The polling test hides the tab by overriding `document.visibilityState`
  and sending `visibilitychange`, which is what Flutter's engine listens to;
  a real background tab was not tried in headless Chrome.
- Still open from earlier stages: no Android run yet, no Flutter tests,
  Google Fonts need internet on first load, the stamp drop's reduced-motion
  path not tried by hand.

## Assumptions made

- **Activity is scoped per role** (user's choice). Recipients also see
  "posted" lines for new food, because the counter is public anyway.
- **The activity feed and the badge poll every 20 seconds.** "Not in the
  foreground" means the tab or app is hidden (`hidden` / `paused`); a visible
  but unfocused window (`inactive`) keeps polling.
- **On phones and tablets there is no activity rail**, so only the badge is
  polled there (the brief puts the feed on desktop).
- **Activity and dashboard figures are computed, not stored**, from dates
  that already exist. No new collection.
- **The chart shows portions delivered per day** (the deliveries count is in
  the screen-reader summary and the sentence), because counts of 0 to 2
  runs make a flat chart. Days use the server's local time.
- **A volunteer can hand back an assigned run**; the transition table also
  allows `picked_up → cancelled`, which the API accepts but the app does not
  offer (food in hand should be delivered or reported to the admin).
- **A handed-back run keeps the request approved** and its portions
  reserved; it goes back to the admin's list. No one is notified (rule 8
  does not list it); the admin sees it in the list and the activity feed.
- **Listing completion** as described above; a listing with open portions
  stays open after a delivery.
- **Assigning is refused after the pickup deadline**; such a request shows a
  turmeric note in the admin's list instead of a button.
- **Rejected accounts are not notified** (rule 8 lists only approval); their
  waiting screen already says the account was not approved.
- **The admin gets no notifications** (none are listed for the admin in rule
  8); their Alerts page shows the empty state.
- **Only one admin assigns**, so "one live run per request" is a check
  before create, not an atomic guard (unlike claim approval).
- **Seed has ten listings**, two more than "about eight", to give the 7-day
  chart something to show.

## Exact next step to resume

Wait for "continue", then start **Stage 5 — Testing and polish**
(`PROMPT.md` Part J):

1. Postman collection (exported JSON) with negative tests: over-allocation,
   wrong role, invalid claim and pickup transitions, double assign.
2. Playwright screenshots at 360 / 768 / 1440 for every screen in both
   themes; dark mode check.
3. `/impeccable audit` + `/impeccable polish` across the app; review-animations
   and fix its findings. Include the P3s above.
4. README: setup, test logins, and a demo script for one full donor →
   recipient → admin assigns → volunteer → delivered flow.
