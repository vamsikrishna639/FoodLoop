# FoodLoop — Progress

Checkpoint written on 2026-11-12, paused part-way through Stage 1 at the user's request.

## Current stage

**Stage 1 — Design system and setup** (of 5). Code is written; visual
verification and the stage wrap-up are not done.

## Done

**Design**
- `DESIGN.md`: full "Canteen Token" design system (colour, type, spacing, radii,
  elevation, motion, component states, components, layout, charts, accessibility).
  Produced with `ui-ux-pro-max`; contrast ratios measured and three palette rules
  added (see Assumptions).
- `PRODUCT.md`: product context required by the `impeccable` skill, written from
  `PROMPT.md`.

**Backend** (`backend/`) — verified by running it
- Express app, MongoDB connection, central error handler, `{ success, message, data }` responses.
- Models: User, FoodListing (auto token number via Counter), ClaimRequest, Pickup, Notification.
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (JWT + bcrypt, express-validator).
- Middleware: `protect`, `requireApproved`, `requireRole`.
- `npm run seed`: 1 admin, 1 donor, 2 recipients, 2 volunteers, 1 pending user,
  8 listings in every state, 8 claims, 4 pickups, 7 notifications.
- Tested with curl: health, login success, wrong password (401), bad register
  input (400 with per-field errors), missing token (401), unknown route (404).

**Frontend** (`frontend/`) — `flutter analyze` clean, `flutter build web` succeeds
- Theme: `core/theme/tokens.dart` (ThemeExtension, spacing, radii, motion) and
  `core/theme/app_theme.dart` (paper + chalkboard ThemeData).
- Signature widgets: TokenCard, PortionMeter, DeadlineClock, StatusStamp,
  ReceiptTimeline, Chalkboard, ImpactNumber, VegMarker, SkeletonToken, EmptyState,
  slip snackbar, FlButton, Pressable, BrandMark, PageFrame, ResponsiveShell.
- Core: API client (JWT, 401 logout, envelope parsing), token store
  (secure storage / shared_preferences on web), config (API base URL), breakpoints.
- Auth state: AuthProvider (session restore on start), ThemeProvider (persisted).
- Router: go_router with auth, pending and role-based redirects.
- Screens: splash, login, register (four role slips), pending approval, profile
  (role stamp, theme toggle, sign out), component gallery, stand-in screens for
  pages that belong to later stages.
- Android: INTERNET permission and cleartext HTTP enabled for the local API.

## In progress (started, not finished)

- **Visual verification.** The web build exists but **no screenshot has been
  taken and nobody has looked at any screen yet.** Layout, overflow and visual
  quality at 360 / 768 / 1440 are unverified.

## Left in Stage 1

1. Serve the web build and take Playwright screenshots of gallery, login,
   register, pending, shell (each role) and profile at 360, 768 and 1440, in
   paper and chalkboard themes. Fix whatever they show.
2. Click through login, register, pending, sign out and theme toggle in the
   browser against the live API.
3. Run `/impeccable critique` on the Stage 1 screens and fix its findings.
4. Write `README.md` (setup steps and test logins).
5. Stage 1 commit ("Stage 1: design system, auth, shell") and the stage report.

## Known bugs / unverified

- No bugs are known, but nothing in the UI has been seen running. Treat every
  screen as unverified. Likeliest trouble spots:
  - TokenCard stub height (fixed, scaled with text size) with long content.
  - The raised centre action on the mobile bottom bar (drawn outside the bar's bounds).
  - Register role slips at 360 wide (two per row, fixed height).
  - Google Fonts are fetched at run time; the first load needs internet.
- `flutter analyze`: no issues. Backend start check: starts and answers `/api/health`.
- The template's `test/widget_test.dart` was deleted (it tested the counter demo
  app that no longer exists). There are no Flutter tests yet.

## Assumptions made

- **Chilli red for text and button fills is `#B93A21`, not `#D9472B`.** The brief's
  red fails WCAG AA as text on paper (3.82:1) and under white labels (4.30:1).
  `#D9472B` stays as the brand red for large display, rings and borders.
- **Turmeric is a fill only on paper** (1.92:1 as text); text uses `#8A5A0B`.
- **Impact numbers top out at 96px**, not larger.
- **Admin cannot be registered.** The register screen shows four role slips as
  the brief asks, but Admin is disabled with "Set up by the campus office". The
  API rejects `role: admin` too. Admins come only from the seed script.
- **`package:material_ui`** is imported instead of `package:flutter/material.dart`,
  because Flutter 3.50 deprecates the old import and its project template uses the new one.
- **Token numbers** come from a small `counters` collection (atomic `$inc`).
- **`decidedAt`** was added to claim requests so receipts can show when a claim
  was approved or rejected.
- **Splash and onboarding slides** are not in any stage list; a plain splash exists
  now and the onboarding slides are planned for Stage 2.
- **impeccable `shape`** normally stops for a confirmation interview. The brief
  already answered its questions, so it was not run as a separate stop.
- Its craft rules changed three details: captions sit under headings, not above
  them; the snackbar slip has a boxed word instead of a coloured edge; hover uses
  a short soft shadow instead of a hard offset one.
- `.claude/` (installed skills) is left untracked and is not in this commit.
- The seed script wipes the `foodloop` database before inserting. It was empty
  when first run.

## Exact next step to resume

From `c:\FoodLoop`:

1. Start the API: `cd backend; npm start`
2. Serve the existing web build: `cd frontend; flutter build web` (if code changed),
   then serve `frontend/build/web` on a local port.
3. Open `/#/gallery` with the Playwright MCP at 360, 768 and 1440 wide, take
   screenshots, and fix what they show. Then continue down "Left in Stage 1".
