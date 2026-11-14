# FoodLoop — Progress

Updated on 2026-11-14 at the end of Stage 3.

## Current stage

**Stage 3 — Claim workflow: complete and committed**
("Stage 3: claim workflow, stamp drop, my requests"). Waiting for the user to
say "continue" before starting Stage 4.

## Done in Stage 3

**Backend**
- `/api/claims`: create (recipient), `mine` (recipient), `incoming` (donor),
  `:id/approve`, `:id/reject` (donor, own listing), `:id/cancel` (recipient,
  own request). Routes and validation in `routes/claimRoutes.js`, logic in
  `controllers/claimController.js`.
- Atomic reservation: approval first flips the claim `pending → approved` with
  the status in the filter (stops double approvals), then reserves with one
  `findOneAndUpdate` using `$expr` (`reserved + requested <= quantity`, listing
  still `available`, deadline in the future) and `$inc`. If the reservation
  matches nothing, the claim is put back to `pending` and the reply says how
  much is left.
- `fully_reserved` when everything is reserved; cancelling an approved claim
  `$inc`s the portions back and sets the listing `available` again.
- `utils/transitions.js`: one table each for claim and pickup status changes;
  anything else is a 400 with a plain message ("An approved request cannot be
  turned down").
- Rule 7: a second open request for the same listing is a 409. Asking for more
  than is left is refused at creation with a `requestedQuantity` field error.
- Expired listings: no new requests, no approvals (the expiry sweep runs
  first).
- Cancelling: allowed while the pickup is missing or `assigned` (that pickup is
  cancelled too); refused after `picked_up` / `delivered`.
- `utils/notify.js`; notifications written for `claim_submitted`,
  `claim_approved`, `claim_rejected`.
- `ClaimRequest` gained `cancelledAt` and sends `id` in JSON. Claim replies
  populate the listing (with its donor) and the recipient, and add a `pickup`
  summary (volunteer name and times).
- Seed: a second pending request on the sandwiches (6 + 8 asked of 12) for the
  over-allocation demo; the cancelled claim has a `cancelledAt`.

**Frontend**
- `ClaimRequest` / `ClaimPickup` models, `ClaimService`, `ClaimsProvider`
  (reset on sign-out). `ListingsProvider` gained `replace` and `byId`;
  `Fmt.ago` added.
- Listing detail: quantity stepper, optional note ("Note for the canteen"),
  "Request 3 kg" button with loading state; a server quantity error shows in
  red under the stepper. With an open request it shows "You asked for ...",
  the stamp, a one-line next step, "See my requests" and "Cancel request".
- Donor Board: the **Requests** queue (`screens/donor/request_queue.dart`),
  with "N WAITING" beside the heading, a slip per request (who, organisation,
  how long ago, amount in mono, token number and portions left, note), and
  Approve / Turn down. Approve is disabled with a turmeric explanation when
  too little is left or pickup has closed. Turn down asks for confirmation.
  Decided slips stay in place this visit; older ones are listed under
  "Decided earlier" (up to four). On wide content (900px or more) the queue is
  in the right column above the tally; otherwise it sits right under the board.
- `StampDrop` widget: APPROVED lands from scale 1.9, invisible and turned an
  extra -10°, to rest in 420ms on `stampCurve`, with the ink fully visible
  after the first third and a light haptic at impact. Reduced motion shows the
  final stamp at once. Used only on approval; a turned-down stamp just fades
  in over 200ms.
- My requests (`/requests`): Active / Past tags, one `ReceiptTimeline` per
  request that prints only the steps the request can still reach, the stamp
  for the furthest step reached (PENDING, APPROVED, ASSIGNED, PICKED UP,
  DELIVERED, REJECTED, CANCELLED), a one-line next step, and Cancel where the
  server allows it. One column under 620px of content, otherwise two
  staggered columns. Empty states for both tags. Fade-up on first load only.

## Verified in Stage 3

- API: 32 checks in a Node script against a second server on port 5050, all
  passing. They cover: incoming order and population; wrong-role, pending and
  no-token blocks; empty-body field errors; duplicate open request (409);
  asking above available; re-request after rejection; approve 6 of 12 then 8
  refused with the claim rolled back to pending; approve twice; reject an
  approved claim; **two approvals fired in parallel on a 5-portion listing
  (3 + 3): exactly one 200, reserved = 3**; fully_reserved; release on cancel;
  other recipient / donor cannot cancel; cancel twice; pickup details in
  `mine`; cancel with an assigned pickup cancels the pickup; cancel after
  pick-up refused; approve and request on an expired listing; bad and unknown
  ids; notifications written.
- Playwright screenshots of the release build at 360, 768 and 1440 in paper
  and chalkboard: Board with the queue, My requests. Detail with the request
  form and with "You asked for" at 360 in both themes. My requests two-column
  at 1440 (light) and 768 (dark).
- Clicked Approve on the Board (1440): the slip got APPROVED, "6 left", the
  slip message, and Farhan's 8-packet slip switched to the turmeric warning
  with Approve disabled.
- The stamp drop was recorded with a CDP screencast: the stamp appears large,
  faint and steeply turned, then settles at its normal size and angle within
  about 400ms.
- `flutter analyze`: no issues. `flutter build web` from `C:\FoodLoop\frontend`.

From `/impeccable critique` (in the conversation, Flutter canvas so no
detector):
- P2: at 1440 the Board stacks the queue under the board rather than in the
  right column the user chose (see assumptions).
- P3 (left for Stage 5): counter cards do not show that the recipient has
  already requested a token; only the detail page does.

## Known issues / not verified

- **The user's own API on port 5000 was started before Stage 3 with
  `node src/server.js` (no reload), so it has no `/api/claims` routes.**
  It must be restarted. It was not stopped from here.
- Not tried by hand: the reduced-motion path of the stamp drop, the haptic on
  a real phone, the cancel dialog clicked in the browser (cancel was verified
  through the API), and typing a note in the form.
- The concurrency test fires two simultaneous HTTP requests; it is not a
  load test.
- Still open from earlier stages: the Hero flight not seen frame by frame,
  the date pickers not screenshotted, no Android run yet, no Flutter tests,
  Google Fonts need internet on first load.

## Assumptions made

- **Approval is two atomic steps with a manual undo**, because a single local
  MongoDB (not a replica set) has no multi-document transactions.
- **Requests above what is left are refused when they are sent**, as well as at
  approval. The brief only requires the approval check; the early check gives
  clearer feedback.
- **Approve is disabled in the UI when it cannot succeed**; the server still
  enforces the rule (shown by the API tests). The visible demo of the guard is
  the disabled button with its reason.
- **Cancel is allowed until the volunteer picks the food up** (user's choice);
  an `assigned` pickup is cancelled with the request.
- **Turning a request down asks for confirmation**, because it cannot be undone.
  Approving does not, because the stamp moment should follow the tap directly.
- **The donor is not notified when a recipient cancels**; rule 8 does not list
  it.
- **Notification messages are stored now; the Alerts screen is Stage 4.**
- **Board layout at 1440:** the user chose "right column", but the sidebar and
  the activity rail leave about 690px for the Board, and a right column there
  would squeeze the chalkboard to phone width. The queue goes to the right
  column at 900px of content (wider screens) and sits straight under the
  board below that, where its first request is still above the fold.
- **The receipt's footer is the canteen's name**; the pickup place is in the
  next-step line under the receipt.
- **The note is limited to 200 characters** and is optional.
- **"Active"** means pending, or approved and not yet delivered; **"Past"**
  means delivered, turned down or cancelled.

## Exact next step to resume

Wait for "continue", then start **Stage 4 — Volunteers, notifications,
dashboards** (`PROMPT.md` Part J):

1. `/impeccable shape` for the volunteer dashboard, Alerts, admin overview and
   approvals.
2. Backend: `POST /api/pickups/assign` (admin, approved claims only),
   `GET /api/pickups/mine`, `PATCH /api/pickups/:id/status` using
   `assertPickupTransition`; mark the listing `completed` when every reserved
   portion is delivered; `volunteer_assigned` / `delivered` / `account_approved`
   notifications; `/api/notifications` (list, read, read-all); `/api/users`
   (pending list, verify); `/api/dashboard`; `/api/activity`.
3. Frontend: volunteer home (tabs Assigned / On the way / Delivered), Alerts
   with the bell badge, admin overview (ImpactNumber block, 7-day chart),
   approvals (table on desktop, cards on phones), volunteer assignment dialog,
   activity rail feed that stops polling when the tab is hidden. Replace the
   remaining `ComingSoonScreen` stand-ins.
4. Screenshots at 360, 768 and 1440 in both themes, then `/impeccable critique`.
