# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FoodLoop is an MCA mini-project: a campus food-surplus redistribution app. A canteen (donor) posts surplus food, recipients request it, volunteers deliver it, an admin manages accounts and assignments. `backend/` is Node + Express + MongoDB; `frontend/` is Flutter targeting Android and Web.

Read these before working:

- `PROMPT.md` — the full build brief: scope, data models, business rules, API table, screens, and the five build stages. It is the spec. Do not add features outside it.
- `PROGRESS.md` — which stage is in progress, what is unverified, assumptions made, and the exact next step. Update it when a stage or checkpoint ends.
- `DESIGN.md` — the "Canteen Token" design system. It is a fixed brief, and it is implemented in `frontend/lib/core/theme/`.
- `PRODUCT.md` — product context used by the `impeccable` skill.

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

There is no backend test runner or linter. Backend endpoints are checked with curl against a running server. A Postman collection with negative tests is planned for Stage 5.

Seeded logins all use `password123`: `admin@`, `canteen@` (donor), `ananya@` / `farhan@` (recipients), `kiran@` / `meera@` (volunteers), `rohit@` (pending recipient), all at `foodloop.test`.

## How the user wants work done

- Build in the stages listed in `PROMPT.md` Part J. Stop after each stage and wait for "continue".
- Commit at the end of each stage with a message like `Stage 1: design system, auth, shell`.
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

## Frontend architecture

- Import `package:material_ui/material_ui.dart`, not `package:flutter/material.dart`. Flutter 3.50 deprecates the old import and the analyzer flags it.
- `lib/main.dart` creates one `ApiClient`, the `AuthProvider` and the `ThemeProvider`, then builds the router once.
- `core/api/api_client.dart` is the only HTTP entry point. It attaches the JWT, unwraps the response envelope, throws `ApiException` (with `fieldErrors`), and calls `onUnauthorized` on a 401, which logs the user out.
- Layering: `services/` call the API and know nothing about UI; `providers/` hold state as `ChangeNotifier`s; `screens/` read providers.
- `core/router/app_router.dart` owns navigation rules. Its `redirect` runs on every navigation and whenever `AuthProvider` notifies, so screens never navigate after login or logout; they change auth state and the router moves the user. The same file holds each role's allowed paths and navigation destinations. Add a new shell page in three places there: the `_allowed` map, `destinationsFor`, and the `ShellRoute` routes.
- `widgets/responsive_shell.dart` is the single frame for signed-in screens: bottom bar under 600px, rail from 600 to 1024px, sidebar plus activity rail above. `core/responsive/breakpoints.dart` holds the breakpoints.
- `ComingSoonScreen` stands in for pages that belong to later stages; replace these as stages land.
- `core/config.dart` is the only place with the API base URL (`localhost` on web, `10.0.2.2` on the Android emulator, overridable with `--dart-define=API_BASE_URL=...`).

## Design rules that are easy to break

- No hard-coded colours, text styles or durations in widgets. Raw hex exists only in `core/theme/app_theme.dart`. Read colours and mono/stamp/impact styles from `context.fl` (the `FoodLoopTokens` ThemeExtension), Material text styles from `context.text`, and use `FlSpace`, `FlRadius`, `FlMotion`.
- Use `chilliDeep` for red text and red button fills; `chilli` fails AA contrast there and is for large display, rings and borders. Turmeric is a fill only; text uses `turmericDeep`.
- The chalkboard (`fl.board`, `fl.chalk`) stays dark in both themes. This covers the sidebar, the auth panel and the donor's "Today's Surplus".
- Status is always a `StatusStamp` with a word, never colour alone.
- `TokenCard` must look complete with an empty `imageUrl`; the printed ticket block is the default.
- Do not put a small label or kicker above a heading; captions go beside or below.
- Motion: 120–280ms with `FlMotion.easeOut`, wrapped in `FlMotion.of(context, ...)` or guarded by `FlMotion.reduced(context)` so reduced motion is respected. The stamp-drop animation is reserved for claim approval only.
- Layouts are left-aligned and differ per role. The banned patterns are listed in `PROMPT.md` Part A.
- Tap targets are at least 48px; custom tappables use the `Pressable` widget for press, hover, focus and semantics.
- The activity feed (Stage 4) must stop polling when the app or browser tab is not in the foreground.
