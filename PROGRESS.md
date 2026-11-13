# FoodLoop — Progress

Updated on 2026-11-13 at the end of Stage 1.

## Current stage

**Stage 1 — Design system and setup: complete and committed**
("Stage 1: design system, auth, shell"). Waiting for the user to say
"continue" before starting Stage 2.

## Done in Stage 1

**Design**
- `DESIGN.md`: the "Canteen Token" design system, produced with `ui-ux-pro-max`.
- `PRODUCT.md`: product context for the `impeccable` skill.

**Backend** (`backend/`)
- Express app, MongoDB connection, central error handler, `{ success, message, data }` responses.
- Models: User, FoodListing (auto token number via Counter), ClaimRequest, Pickup, Notification.
- Auth: register, login, me (JWT + bcrypt, express-validator). A duplicate email
  is returned as a field error (`data.errors.email`).
- Middleware: `protect`, `requireApproved`, `requireRole`.
- `npm run seed`: 1 admin, 1 donor, 2 recipients, 2 volunteers, 1 pending user,
  8 listings in every state, 8 claims, 4 pickups, 7 notifications.

**Frontend** (`frontend/`)
- Theme tokens and paper + chalkboard `ThemeData`.
- Signature widgets: TokenCard, PortionMeter, DeadlineClock, StatusStamp,
  ReceiptTimeline, Chalkboard, ImpactNumber, VegMarker, SkeletonToken, EmptyState,
  slip snackbar, FlButton, Pressable, BrandMark, PageFrame, ResponsiveShell.
- API client, token store, config, breakpoints, AuthProvider, ThemeProvider.
- Router with auth, pending and role redirects. A browser refresh keeps the
  current page (the splash route carries a `from` parameter).
- Screens: splash, login, register, pending, profile, component gallery, and
  stand-in screens for pages that belong to later stages.

**Docs**
- `README.md`: setup steps, test logins, gallery, project layout.

## Verified in Stage 1

Checked with the Playwright MCP against the release web build and the live API.

- Screenshots looked at: gallery, login, register, pending, each role's shell
  and profile at 360, 768 and 1440 wide. The gallery, login, register, pending,
  donor shell and profile were also checked in the chalkboard theme. No overflow
  at any width.
- Clicked through: empty-form validation, wrong password, sign in, sidebar
  navigation, theme toggle (persists), sign out, register with a duplicate
  email, register a new donor, pending screen, "Check again", refresh on the
  pending screen, sign out. A recipient opening `/approvals` is sent to `/home`.
- `flutter analyze`: no issues. `flutter build web`: succeeds.

Fixed during the screenshot pass:
- Receipt rows and chalkboard menu lines now run their dotted leader to the
  right edge; long names no longer break mid-word at 360.
- A long receipt title ran under its stamp; the stamp now sits beside it.
- Refreshing the browser on any signed-in page used to land on `/home`.
- The desktop login form was vertically centred by accident; it is top-aligned.
- The login/register form was centred between 600 and 900 wide; it is left-aligned.
- Expired token cards showed the EXPIRED stamp twice.
- The raised centre action label on the mobile bar sat lower than its neighbours.
- Role slips on the register screen had touching notches.
- The token card stamp now sits in the top-right corner, as the code comment said.

Fixed from `/impeccable critique` (design review, 31/40):
- Information slips said "DONE"; there is now a neutral "NOTE" slip.
- A duplicate email appeared in a banner far from the field; it now shows under
  the email input and clears when the email is edited.
- The desktop activity rail repeated a full empty state next to every page;
  it is now a quiet title, rule and caption.
- The keyboard focus ring was ink on the dark sidebar; it is turmeric there.

## Known issues / not verified

- **The focus ring was not seen in a screenshot.** Playwright's Tab key did not
  show a ring on the Flutter canvas, so the turmeric ring on the sidebar is
  changed in code but unconfirmed. Check by hand with the Tab key; revisit in
  the Stage 5 audit.
- **`flutter build web` must be run from a path with an upper-case drive
  letter** (`C:\FoodLoop\frontend`). Run from `c:\FoodLoop\frontend` (how VS Code
  opens the folder), Flutter 3.50 leaves fonts, icons and manifests out of
  `build/web`, and the app shows Roboto and empty icon boxes. If that happens,
  delete `build/web` and `.dart_tool/flutter_build` and rebuild from `C:\`.
  `flutter run -d chrome` was not tested for this problem.
- Not run on an Android emulator or device yet. Only the web build was looked at.
- Chalkboard theme at 768 for the role shells was not screenshotted (the same
  rail was checked in paper at 768 and in chalkboard at 1440).
- Token cards in a two-column row have unequal heights when one title wraps.
  The recipient feed in Stage 2 should decide the grid.
- Helper text under inputs is indented by Material's default rather than
  aligned with the label.
- Stand-in pages say "Built in Stage N". They are replaced as stages land.
- Google Fonts are fetched at run time; the first load needs internet.
- There are no Flutter tests.

## Assumptions made

- **Chilli red for text and button fills is `#B93A21`, not `#D9472B`** (AA contrast).
  `#D9472B` stays for large display, rings and borders.
- **Turmeric is a fill only on paper**; text uses `#8A5A0B`.
- **Impact numbers top out at 96px.**
- **Admin cannot be registered.** The register screen shows four role slips;
  Admin is disabled with "Set up by the campus office". The API rejects it too.
- **`package:material_ui`** is imported instead of `package:flutter/material.dart`.
- **Token numbers** come from a `counters` collection (atomic `$inc`).
- **`decidedAt`** was added to claim requests for the receipts.
- **Splash and onboarding slides**: a plain splash exists; the onboarding slides
  are planned for Stage 2.
- **impeccable `shape`** was not run as a separate stop in Stage 1 because the
  brief already answered its questions.
- **impeccable `critique`** ends by asking which findings to fix. The user had
  already asked for the findings to be fixed, so they were fixed without asking.
  On Flutter the skill runs its design review only; its web detector does not apply.
- Captions sit under headings, the snackbar slip has a boxed word, and hover
  uses a short soft shadow (impeccable craft rules).
- **The recipient's raised "Browse" action opens the same page as the Counter
  tab.** The brief asks for both; in Stage 2 it should focus the search field.
- **Slips have three words**: DONE, NOT DONE and NOTE.
- `CLAUDE.md` is committed. `.claude/` (installed skills) stays untracked.
- The seed script wipes the `foodloop` database before inserting.

## Exact next step to resume

Wait for "continue", then start **Stage 2 — Food listings** (`PROMPT.md` Part J):

1. Run `/impeccable shape` for the recipient feed, listing detail and the
   donor post/manage screens.
2. Backend: `/api/foods` CRUD with validation and expiry handling.
3. Frontend: FoodListing model, service and provider; recipient feed
   ("Today's Counter") and detail; donor post form and manage screen; replace
   the matching `ComingSoonScreen` routes in `core/router/app_router.dart`.
4. Screenshot each screen at 360, 768 and 1440 in both themes, then
   `/impeccable critique`.
