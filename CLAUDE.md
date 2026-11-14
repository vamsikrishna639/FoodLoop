# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FoodLoop is an MCA mini-project: a campus food-surplus redistribution app. A canteen (donor) posts surplus food, recipients request it, volunteers deliver it, an admin manages accounts and assignments. `backend/` is Node + Express + MongoDB; `frontend/` is Flutter targeting Android and Web.

Read these before working:

- `PROMPT.md` — the full build brief: scope, data models, business rules, API table, screens, and the five build stages. It is the spec. Do not add features outside it.
- `PROGRESS.md` — which stage is in progress, what is unverified, assumptions made, and the exact next step. Update it when a stage or checkpoint ends.
- `DESIGN.md` — the "Canteen Token" design system. It is a fixed brief, and it is implemented in `frontend/lib/core/theme/`.
- `PRODUCT.md` — product context used by the `impeccable` skill.

**Current stage:** Stages 1–3 are done (design system and auth; food listings; claim workflow). Stage 4 (volunteers, notifications UI, activity feed, dashboards, admin approvals) is next.

## Commands

Backend (from `backend/`; needs a local MongoDB on `127.0.0.1:27017` and a `.env` copied from `.env.example`):

```
npm start        # API on http://localhost:5000
npm run dev      # same, restarts on file changes (node --watch)
npm run seed     # WIPES the foodloop database, then inserts demo data
```

Frontend (from `frontend/`):

```
flutter analyze            # must stay at "No issues found"
flutter run -d chrome      # run against the local API
flutter build web          # release build into build/web
flutter test               # no tests exist yet (the test/ folder is absent)
flutter test test/some_test.dart   # single test file
```

On Windows, run `flutter build web` from `C:\FoodLoop\frontend` (upper-case drive letter). From a lower-case `c:` path, Flutter 3.50 leaves fonts, icons and manifests out of `build/web`; the fix is to delete `build/web` and `.dart_tool/flutter_build` and rebuild from `C:\`.

There is no backend test runner or linter. Backend endpoints are checked with curl or a throwaway Node script against a running server; a second copy can run beside the user's with `$env:PORT='5050'; node src/server.js` (dotenv does not override a variable already set). A Postman collection with negative tests is planned for Stage 5.

`npm start` does not reload. After adding routes, restart the server, or new endpoints answer 404 ("Route not found"). Use `npm run dev` while working on the backend.

To point a web build at another API port: `flutter build web --dart-define=API_BASE_URL=http://localhost:5050/api`. Rebuild without it before handing over, because `build/web` keeps whatever URL it was built with.

For Playwright checks, sign in through the API and put the session in local storage instead of typing (shared_preferences on web stores JSON-encoded values): `flutter.foodloop_token` = `"<jwt>"`, `flutter.foodloop_theme` = `"light"` or `"dark"`, `flutter.foodloop_seen_welcome` = `true`. Then load `/#/<route>`. Canvas clicks work after a fresh navigation; to see an animation frame by frame, use a CDP `Page.startScreencast` (per-call screenshots are too slow).

Seeded logins all use `password123`: `admin@`, `canteen@` (donor), `ananya@` / `farhan@` (recipients), `kiran@` / `meera@` (volunteers), `rohit@` (pending recipient), all at `foodloop.test`.

## How the user wants work done

- Build in the stages listed in `PROMPT.md` Part J. Stop after each stage and wait for "continue".
- Commit at the end of each stage with a message like `Stage 1: design system, auth, shell`, then push to `origin main` (never force-push).
- Before every commit, including WIP checkpoints, update `CLAUDE.md`, `README.md` and `PROGRESS.md` so they match the code, and commit them together with the work.
- Each `impeccable shape` round may ask one short question; the user answers it and expects the stage to continue without another stop.
- End each stage with: the commands to run, a checklist of exactly what to click and what should appear, and a list of assumptions made.
- Code must be clean and commented so a student can explain it in a viva. Prefer plain, readable code over clever abstractions.
- Skills are part of the process (`PROMPT.md` Part B): `ui-ux-pro-max` for the design system, `/impeccable shape` before and `/impeccable critique` after each major screen, `emil-design-eng` for motion decisions, and `review-animations` at the end. These skills give web examples; apply the principles with Flutter APIs and never add web/CSS code.
- After building a screen, verify it with Playwright MCP screenshots of the web build at 360, 768 and 1440 wide, in both themes.

## Backend architecture

- `src/app.js` builds the Express app; `src/server.js` loads `.env`, connects and listens. Routes are mounted in `app.js` under `/api/<resource>`.
- Every response is `{ success, message, data }`. Use `ok(res, data, message, status)` to send one and `throw new ApiError(status, message, data)` to fail. Both are in `src/utils/apiResponse.js`. Wrap async handlers in `asyncHandler`.
- `src/middleware/errorHandler.js` is the only place that formats errors. It also maps Mongoose cast, validation and duplicate-key errors.
- Request validation is `express-validator` rules in the route file followed by the `validate` middleware, which returns `data.errors` as a `{ field: message }` map. The Flutter forms show these under the matching inputs.
- Auth chain for protected routes: `protect` (JWT → `req.user`), then `requireApproved` (blocks pending/rejected accounts), then `requireRole(...)`. `/auth/me` uses only `protect` so pending users can read their status.
- New accounts are always `pending`. `admin` is not an accepted registration role; admins come only from the seed.
- `FoodListing` gets its `tokenNumber` (`FL-0042`) in a `pre('save')` hook from the atomic `Counter` model, so create listings with `create`/`save`, not `insertMany`.
- Business rules in `PROMPT.md` Part F are enforced on the backend. The key one: claim approval must reserve quantity with a single conditional `findOneAndUpdate` (`$expr` + `$inc`) so concurrent approvals cannot over-allocate.
- Claim approval (`controllers/claimController.js`) has two atomic steps: (1) flip the claim `pending → approved` with the status in the filter, so a double click matches only once; (2) reserve with `findOneAndUpdate` + `$expr` + `$inc`. If step 2 matches nothing, step 1 is undone by hand (back to `pending`). A single local MongoDB has no multi-document transactions, so keep this compensate-on-failure pattern and do not "simplify" it into one read-then-write.
- Allowed status changes live in one table each in `utils/transitions.js` (`assertClaimTransition`, `assertPickupTransition`). A disallowed change returns 400. Use these helpers rather than ad-hoc `if`s.
- Notifications are created with `utils/notify.js` (`notify(userId, type, message)`). Stage 3 writes `claim_submitted`, `claim_approved`, `claim_rejected`; the Alerts screen arrives in Stage 4.
- Listing expiry is a sweep (`expireOverdueListings`) run before reads and before claim create/approve. Only `available` listings are swept.
- A recipient can cancel an approved claim only while its pickup is missing or still `assigned`; that pickup is cancelled with it. After `picked_up`, cancel returns 400. Cancelling an approved claim `$inc`s the reserved quantity back down and turns `fully_reserved` back into `available`.
- Claim responses always populate `listingId` (with its `donorId`) and `recipientId`, and add a `pickup` summary (`volunteerName`, times). The Flutter `ClaimRequest` model relies on this shape.

## Frontend architecture

- Import `package:material_ui/material_ui.dart`, not `package:flutter/material.dart`. Flutter 3.50 deprecates the old import and the analyzer flags it.
- `lib/main.dart` creates one `ApiClient`, the services and every provider (`AuthProvider`, `ThemeProvider`, `FeedProvider`, `ListingsProvider`, `ClaimsProvider`), then builds the router once. Every data provider has a `reset()` that runs on sign-out; add new providers to that listener.
- `ClaimsProvider` holds either the recipient's own claims (`load(incoming: false)`) or the donor's incoming ones (`load(incoming: true)`). The listing detail uses `openFor(listingId)` to enforce "one open request" in the UI. Providers do not know about each other, so screens pass fresh listings across (for example, after an approval the slip calls `ListingsProvider.replace(claim.listing)`).
- `core/api/api_client.dart` is the only HTTP entry point. It attaches the JWT, unwraps the response envelope, throws `ApiException` (with `fieldErrors`), and calls `onUnauthorized` on a 401, which logs the user out.
- Layering: `services/` call the API and know nothing about UI; `providers/` hold state as `ChangeNotifier`s; `screens/` read providers.
- `core/router/app_router.dart` owns navigation rules. Its `redirect` runs on every navigation and whenever `AuthProvider` notifies, so screens never navigate after login or logout; they change auth state and the router moves the user. The same file holds each role's allowed paths and navigation destinations. Add a new shell page in three places there: the `_allowed` map, `destinationsFor`, and the `ShellRoute` routes.
- `widgets/responsive_shell.dart` is the single frame for signed-in screens: bottom bar under 600px, rail from 600 to 1024px, sidebar plus activity rail above. `core/responsive/breakpoints.dart` holds the breakpoints.
- `ComingSoonScreen` stands in for pages that belong to later stages; replace these as stages land. It is still used for Alerts, Approvals, the volunteer home and the admin home (all Stage 4).
- `LabeledField` (visible label plus the semantic label on the field) lives in `screens/auth/auth_layout.dart` and is reused by every form.
- `core/config.dart` is the only place with the API base URL (`localhost` on web, `10.0.2.2` on the Android emulator, overridable with `--dart-define=API_BASE_URL=...`).

## Design rules that are easy to break

- No hard-coded colours, text styles or durations in widgets. Raw hex exists only in `core/theme/app_theme.dart`. Read colours and mono/stamp/impact styles from `context.fl` (the `FoodLoopTokens` ThemeExtension), Material text styles from `context.text`, and use `FlSpace`, `FlRadius`, `FlMotion`.
- Use `chilliDeep` for red text and red button fills; `chilli` fails AA contrast there and is for large display, rings and borders. Turmeric is a fill only; text uses `turmericDeep`.
- The chalkboard (`fl.board`, `fl.chalk`) stays dark in both themes. This covers the sidebar, the auth panel and the donor's "Today's Surplus".
- Status is always a `StatusStamp` with a word, never colour alone.
- `TokenCard` must look complete with an empty `imageUrl`; the printed ticket block is the default.
- Do not put a small label or kicker above a heading; captions go beside or below.
- Motion: 120–280ms with `FlMotion.easeOut`, wrapped in `FlMotion.of(context, ...)` or guarded by `FlMotion.reduced(context)` so reduced motion is respected. The stamp-drop animation (`widgets/stamp_drop.dart`) is reserved for claim approval only. It plays on the one slip whose id is `ClaimsProvider.justApproved`, which is cleared after the first frame so the drop never replays. Other stamps appear with a plain short fade.
- On the donor Board, slips decided during this visit stay in the queue where they were (`ClaimsProvider.decidedHere`), so the stamp lands where the donor is looking. They move to "Decided earlier" on the next load.
- The Board puts the queue in a right column only when its content is at least 900px wide. At 1440 the sidebar and activity rail leave about 690px, so the queue stacks under the chalkboard there.
- Layouts are left-aligned and differ per role. The banned patterns are listed in `PROMPT.md` Part A.
- Tap targets are at least 48px; custom tappables use the `Pressable` widget for press, hover, focus and semantics.
- The activity feed (Stage 4) must stop polling when the app or browser tab is not in the foreground.
