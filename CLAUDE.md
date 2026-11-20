# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FoodLoop is an MCA mini-project: a campus food-surplus redistribution app. A canteen (donor) posts surplus food, recipients request it, volunteers deliver it, an admin manages accounts and assignments. `backend/` is Node + Express + MongoDB; `frontend/` is React (Vite, JavaScript).

## Project rules (apply in every session)

1. **The stack is strictly MERN:** MongoDB, Express, React (Vite, JavaScript), Node. No TypeScript, no Next.js, no Redux. State is React Context + hooks.
2. **MERN only, everywhere in the project:** no files, folders, dependencies or mentions of the previous mobile toolkit, and no browser-automation setup (no screenshot or end-to-end tool, its config, MCP server or dependency). This covers docs, comments, README, code, `.gitignore` and `package.json`. Any screenshot script lives outside the repo (the session scratchpad), never in `frontend/` or `package.json`.
3. **The backend is not modified** by frontend work. (CORS needed no change: `app.use(cors())` already allows every origin. The final cleanup only reworded the comment beside it. After that, the user approved one change: `scripts/createAdmin.js` takes `--name/--email/--password/--phone` flags and runs the register route's express-validator rules on them. Each backend change needs the user's approval for that request.)

Read these before working:

- `PROMPT.md`: the build brief (scope, data models, business rules, API table, screens, design concept, React stack and folder layout). Do not add features outside it.
- `PROGRESS.md`: what each stage built, what is unverified, assumptions made, and the record of the final cleanup. Update it when a stage or checkpoint ends.
- `DESIGN.md`: the "Canteen Token" design system, implemented in `frontend/src/styles/index.css` and `frontend/src/lib/motion.js`.
- `VALIDATION.md`: every form, its rules and the file that holds them.
- `PRODUCT.md`: product context used by the `impeccable` skill.

**Current stage:** React rewrite, all 5 stages done (setup, auth, routing; food listings; claims; volunteers, alerts, live refresh, admin; audit, polish, code splitting, screenshots, docs). The final cleanup (MERN only) is done: the old app folder and the browser-automation setup are gone. The project is finished.

## Commands

Backend (from `backend/`; needs a local MongoDB on `127.0.0.1:27017` and a `.env` copied from `.env.example`):

```
npm start        # API on http://localhost:5000
npm run dev      # same, restarts on file changes (node --watch)
npm run seed     # WIPES the foodloop database, then inserts demo data
npm run test:api # runs postman/FoodLoop.postman_collection.json with newman (needs the API on :5000)
npm run create-admin -- --name "Admin Name" --email a@b.c --password "secret123" [--phone 9876543210]   # one approved admin, bcrypt-hashed
```

Frontend (from `frontend/`; needs a `.env` copied from `.env.example`):

```
npm run dev      # Vite dev server on http://localhost:5173 (strictPort)
npm run build    # production build into dist/ (must finish without errors)
npm run preview  # serve dist/ on http://localhost:4173
```

There is no linter and no frontend test runner. `npm run build` is the compile check.

The backend's tests are the Postman collection in `backend/postman/` (80 requests, 231 checks, negative tests for over-allocation, wrong role and invalid transitions). It is plain JSON; Postman and newman run the collection script and the request script in one scope, so every test script is wrapped in its own `{ }` block. Run it against another server with `--env-var baseUrl=http://localhost:5050/api`.

A second API copy can run beside the user's: `PORT=5050 MONGO_URI='mongodb://127.0.0.1:27017/foodloop_test' node src/server.js` (dotenv does not override a variable already set). Seed that database with the same `MONGO_URI` before `node seed/seed.js`, so seeding never wipes the user's data. Point Vite at it with `VITE_API_URL=http://localhost:5050/api npx vite` (an existing environment variable beats `.env`). `npm start` does not reload: restart after adding routes, or new endpoints answer 404.

If port 5173 is busy (the user's own dev server), run the test copy of Vite on another port (`npx vite --port 5174`; the CLI flag overrides `strictPort`'s port). Vite reloads the page the first time it optimises a new dependency, so a check that loads a page right after adding an import can read a stale URL; run it again.

Visual checks (outside the repo, see rule 2): a screenshot script in the session scratchpad captures pages at 360, 768 and 1440 wide in both themes and reports horizontal overflow and console errors. Sign in through the API and put the session in localStorage before loading a page: `foodloop_token` = the raw JWT, `foodloop_theme` = `light` or `dark`, `foodloop_seen_welcome` = `true` (plain strings, not JSON). Re-seeding creates new user ids, so old tokens stop working. `getByText` also finds hidden copies (the auth board panel is `display:none` on phones), so scope locators to `#main`. The installed Chromium build is 1254; launch it with `executablePath`.

Screenshots for the record live in `docs/screenshots/` as `<role>-<screen>-<width>-<theme>.jpg` (21 screens x 3 widths x 2 themes, taken from the React app in Stage 5; phone shots size the window to the page so the fixed bottom bar sits at the bottom; dialog shots are the viewport only). The Stage 5 audit (axe-core on every render, keyboard walk, 200% text) is `docs/stage5-audit.md`; axe-core is in the npx cache, loaded by the scratchpad script, never added to `package.json`.

Seeded logins all use `password123`: `admin@`, `canteen@` (donor), `ananya@` / `farhan@` (recipients), `kiran@` / `meera@` (volunteers), `rohit@` (pending recipient), all at `foodloop.test`.

## How the user wants work done

- Build in the five stages of the React rewrite (listed in `PROGRESS.md`). Stop after each stage and wait for the user to test it.
- Commit at the end of each stage (e.g. `React Stage 1: setup, design tokens, gallery, auth and routing`), then **commit and push to origin (`https://github.com/vamsikrishna639/FoodLoop`) after every completed stage, never use `--force`, and check for secrets before each push**: `git ls-files` shows no `.env` (only `.env.example`), and no real `JWT_SECRET` or database password is in a tracked file or in the commits being pushed. If origin has commits the local branch lacks, ask before merging.
- Before every commit, update `CLAUDE.md`, `README.md`, `PROGRESS.md` (and `VALIDATION.md` when a form changes) so they match the code, and commit them together with the work. `VIVA_NOTES.md` is the user's viva script; it was committed in Stage 5 at the user's request. Keep its line references true when the code they point at changes, and keep it free of the old toolkit.
- The Impeccable design hook is installed (`.impeccable/config.json`, committed; `config.local.json` and `.claude/settings.local.json` are git-ignored). It scans each edited UI file and reports deterministic design issues; act on them. Do not run `npx impeccable update` unless the user asks.
- Each `impeccable shape` round may ask one short question; the user answers it and expects the stage to continue without another stop.
- End each stage with: the commands to run, a checklist of exactly what to click and what should appear, and a list of assumptions made.
- Code must be clean and commented so a student can explain it in a viva. Prefer plain, readable code over clever abstractions.
- Skills are part of the process: `ui-ux-pro-max` for the design system, `/impeccable shape` before and `/impeccable critique` after each screen, `emil-design-eng` and `review-animations` for motion (with `prefers-reduced-motion`), `/impeccable audit` and `polish` at the end.
- After building a screen, run the dev server and screenshot it at 360, 768 and 1440 wide in both themes; fix what the screenshots show.

## Backend architecture

- `src/app.js` builds the Express app; `src/server.js` loads `.env`, connects and listens. Routes are mounted in `app.js` under `/api/<resource>`.
- Every response is `{ success, message, data }`. Use `ok(res, data, message, status)` to send one and `throw new ApiError(status, message, data)` to fail. Both are in `src/utils/apiResponse.js`. Wrap async handlers in `asyncHandler`.
- `src/middleware/errorHandler.js` is the only place that formats errors. It also maps Mongoose cast, validation and duplicate-key errors.
- Request validation is `express-validator` rules in the route file followed by the `validate` middleware, which returns `data.errors` as a `{ field: message }` map. The React forms put these under the matching inputs.
- Auth chain for protected routes: `protect` (JWT → `req.user`), then `requireApproved` (blocks pending/rejected accounts), then `requireRole(...)`. `/auth/me` uses only `protect` so pending users can read their status.
- New accounts are always `pending`. `admin` is not an accepted registration role; admins come only from the seed or from `scripts/createAdmin.js` (`npm run create-admin`). Never commit real admin details.
- `FoodListing` gets its `tokenNumber` (`FL-0042`) in a `pre('save')` hook from the atomic `Counter` model, so create listings with `create`/`save`, not `insertMany`.
- Business rules in `PROMPT.md` Part F are enforced on the backend. Claim approval (`controllers/claimController.js`) has two atomic steps: (1) flip the claim `pending → approved` with the status in the filter; (2) reserve with `findOneAndUpdate` + `$expr` + `$inc`. If step 2 matches nothing, step 1 is undone by hand. A single local MongoDB has no multi-document transactions, so keep this compensate-on-failure pattern.
- Allowed status changes live in `utils/transitions.js` (`assertClaimTransition`, `assertPickupTransition`). A disallowed change returns 400.
- Notifications are created with `utils/notify.js`. Types: `claim_submitted`, `claim_approved` / `claim_rejected`, `volunteer_assigned`, `delivered`, `account_approved`. `utils/amount.js` writes quantities ("1 box", "5 boxes"); `frontend/src/lib/format.js` `quantity()` copies it.
- Pickups: the admin assigns an approved claim that has no live pickup; a cancelled pickup does not count. After `delivered`, `completeIfDone` marks the listing `completed` when nothing more can be given.
- `/api/dashboard` and `/api/activity` are worked out from listings, claims and pickups and scoped by role in `scopeFor`. `/api/impact` (public) is the welcome page's "portions delivered" figure. Activity events are `{ id, kind, at, text }`.
- Listing expiry is a sweep (`expireOverdueListings`) run before reads and before claim create/approve.
- Claim responses populate `listingId` (with its `donorId`) and `recipientId`, and add a `pickup` summary.
- Auth responses: login and register return `{ token, user }`; `/auth/me` returns `{ user }`. `user` is `{ id, name, email, role, phone, organization, verificationStatus, createdAt }`.

## Frontend architecture

- `src/main.jsx` wraps the router in `ThemeProvider` > `ToastProvider` > `AuthProvider`. `src/App.jsx` holds every route; every page is `React.lazy(() => import(...))` (code splitting by route), with a `<Suspense>` in `Root` (fallback `Splash`) and one around the shell's `<Outlet />` (fallback `PageLoading`, so the navigation stays). A new page must be added as a `lazy()` import. `vite.config.js` names the library chunks (`react`, `motion`, `forms`) with `build.rolldownOptions.output.codeSplitting.groups`; Recharts stays in the lazily loaded chart. The build must not show the 500 kB warning. Routes use `createBrowserRouter`; each is wrapped in a gate from `src/routes/Gate.jsx`: `PublicOnly` (welcome, login, register), `PendingOnly` (/pending), `RequireApproved` (everything in the shell; also checks the role's allowed paths). `/gallery` is open to everyone.
- Pages never navigate after login or logout. They change `AuthContext`, and the gates redirect. `AuthContext.status` is `restoring` (splash at the same URL, so a refresh keeps the page), `signedOut` or `signedIn`. After sign-in, `PublicOnly` returns to `location.state.from` if a gate saved one.
- `src/api/client.js` is the only HTTP entry point. It attaches the JWT, unwraps the envelope, throws `ApiError` (`status`, `fieldErrors`), times out after 12s, and calls the unauthorized handler on a 401 when a token is set (AuthContext logs out with `sessionExpired`). One file per resource in `src/api/` (`auth.js`, `dashboard.js` ...).
- The token, theme and welcome flag are in localStorage (`src/lib/storage.js`, every access in try/catch). `index.html` applies the saved theme before the first paint.
- `src/lib/roles.js` holds the roles, each role's allowed paths (`canOpen`) and navigation (`destinationsFor`). A new shell page needs: its path in `ALLOWED`, a destination if it is in the navigation, and a route under the shell in `App.jsx`.
- `src/components/ResponsiveShell.jsx` is the single frame for signed-in pages: bottom bar under 600px, dark rail from 600 to 1024, sidebar plus `ActivityRail` above. The layouts switch with CSS breakpoints, not JavaScript. The page cross-fades on navigation (opacity only) and focus moves to `#main`. The role's action (`Post food` / `Browse`) navigates to `/home` with `location.state.postFood` / `focusSearch` (a timestamp); the Stage 2 pages read it.
- The home route is `/home/*`. `HomeForRole` picks the page; the recipient's `Counter` (`pages/recipient/Counter.jsx`) reads the rest of the path (`listing/<id>`), so it stays mounted while the URL moves between the list and a token and keeps its list and filters (`hooks/useFeed.js`). Below 600px an open token is its own page (`ListingPage`, the card flies there with `viewTransition` and `view-transition-name: token-<id>`); from 600px it is the side panel, and selecting replaces the URL. The shell's page fade is keyed by the first path segment, so `/home` and `/home/listing/x` are one page.
- Donor pages (`pages/donor/`): `Board` (chalkboard + tally; the tally moves beside the board only when its container is at least 900px wide, an `@container` query), `ManageListings` (also the admin's "All listings"), and `ListingForm` (post and edit). Listing data comes from `hooks/useListings.js` (`upsert`, `removeById` after a save or delete). Facts about a listing (`available`, `isOpen`, `isClosingSoon`, `stampOf`, `donorName`) are in `lib/listing.js`.
- Claims (Stage 3): `api/claims.js`, `lib/claim.js` (facts about a request: `isOpenRequest`, `isActive`, `canCancel`, `claimStamp` (APPROVED moves on to the pickup's status), `nextStep`), `hooks/useClaims.js` (`useClaims()` = `/claims/mine`, `useClaims({ incoming: true })` = the donor's queue; `upsert`, `openFor(listingId)`). The recipient's request area is `pages/recipient/RequestFood.jsx` inside `ListingDetailView` (the Counter owns one `useClaims()` and passes it down); `CancelRequest.jsx` is the shared confirm. The donor's queue is `pages/donor/RequestQueue.jsx` on the Board (under the chalkboard, then the tally); it plays `StampDrop` only for `dropId` and keeps slips decided this visit in place. My requests is `pages/recipient/MyRequests.jsx` (one list; two columns by `@container`, every second item lowered with a transform).
- After an action replaces the focused control (Approve, a sent or cancelled request), focus moves to the new text with `hooks/useFocusWhen.js` (`tabIndex={-1}` on the target). It waits one tick, because a page behind an open `<dialog>` is inert.
- Heading levels follow the page outline: `TokenCard` and `ReceiptTimeline` take `headingLevel` (h2 in lists under the page h1; the phone detail page makes the token its h1).
- `components/Modal.jsx` wraps the native `<dialog>` (focus trap, Escape, inert page): a bottom sheet under 600px, a dialog above, entrance via `@starting-style` in `styles/index.css` (`.modal`). `closeOnBackdrop={false}` for forms. `components/FilterTag.jsx` has `FilterTag` (toggle button, `aria-pressed`) and `ChoiceTags` (a radio group drawn as tags, for forms). `components/FadeUp.jsx` is the first-load stagger.
- `api/client.js` returns the response's `data` plus the server's `message` (`{ ...data, message }`), so a page can show "Token #FL-0042 is on the counter" in a slip.
- The shell moves focus to `#main` after navigation only if the page has not already put focus inside it (Browse focuses the search box).
- Forms use `useValidatedForm()` (`src/hooks/useValidatedForm.js`): react-hook-form with `mode: 'onBlur'`, `reValidateMode: 'onChange'`, `shouldFocusError`, plus `field(name, rules)`, which re-checks a field on change while it shows an error. Rules live in `src/validation/<form>Rules.js` (shared values in `constants.js`); never inline rules in components. Server errors go through `handleServerError` (`validation/serverErrors.js`): field errors with `setError`, anything else as a slip. See VALIDATION.md.
- Feedback messages: `useSlip()` from `ToastContext` (`showSlip(message, { kind: 'done' | 'error' | 'note' })`).
- Fields: `TextField`, `TextArea`, `PasswordField`, `FieldShell`, `FieldError`, `FormNotice` in `components/Field.jsx`. React 19 passes `ref` as a prop, so `register()`'s ref reaches the input without `forwardRef`.
- Icons are `@phosphor-icons/react`, using the `*Icon` names (`BellIcon`), always `aria-hidden` beside a text label.
- Fonts are self-hosted with `@fontsource-variable/*` (no Google Fonts request).
- Live refresh (Stage 4): `context/LiveContext.jsx` (`LiveProvider`, mounted around the shell in `App.jsx`) holds the ONLY timer: a beat every 20s (`BEAT_MS`), stopped while `document.hidden`, with an immediate catch-up when the tab is shown. It also holds the notifications (`useNotifications()`: `items`, `unread`, `markRead` (optimistic), `markAllRead`). A page joins with `useLiveBeat(load)` (runs on each beat, not on mount). Lists use `hooks/useLiveList.js` (`items`, `error`, `load`, `upsert`, `updatedAt`), which drops a reply that started before a local `upsert` or that is not the newest; `useClaims` is built on it, `useListings` has the same guard. Never add another `setInterval` for data.
- The bell badge reads `useNotifications().unread` in `ResponsiveShell`. The `ActivityRail` is mounted only from 1025px (`useMediaQuery`), so phones never fetch it; new lines fade in, and a separate `sr-only` live region reads only the new lines (never put `aria-live` on the whole list).
- Volunteer (`pages/volunteer/Pickups.jsx`): `RunTabs` (Assigned / On the way / Delivered as one strip, fits 360), each run a `ReceiptTimeline` pickup slip (Pickup by second), one 56px ink button per step, "Can't do this run" asks first. Runs moved on this visit stay in their tab (`movedHere`); old handed-back runs are hidden. Tally (`ImpactNumber`) beside from an 820px container.
- Alerts (`pages/common/Alerts.jsx`, `lib/notification.js` `alertWord`, `alertTarget(type, role)`): grouped by day; a line is a link when it leads somewhere, a button while unread, plain text otherwise.
- Admin: `pages/admin/Overview.jsx` (queue first when requests were waiting at load, decided once; `ImpactBlock` with the lazily loaded `components/DeliveriesChart.jsx` (Recharts, `lazy()` so it is a separate chunk); `RightNow` receipt), `AssignVolunteer.jsx` (radio rows, quietest preselected, `validation/assignRules.js`), `Approvals.jsx` (a real `<table>` from the `register:` breakpoint, 640px window; slips below; Reject asks first). API files: `api/pickups.js`, `api/users.js`, `api/notifications.js`.

## Accessibility rules (from the Stage 5 audit)

- Name a control by its visible text. Do not put an `aria-label` on a button or link that shows text (WCAG 2.5.3): add hidden words with `sr-only` only for state or the action ("Alerts 2 unread", "Edit"), without leading punctuation (a hidden span is its own block, so ", x" reads as " , x"). Icon-only controls keep their `aria-label`.
- Put the most important text first in the code (`TokenCard` has the title first and draws the marker row above it with `order-first`), so a button's name starts with it.
- A region that scrolls on its own needs `tabIndex={0}` (the Activity rail). Anything `aria-hidden` that contains SVG or third-party markup is also `inert` (the chart).
- A dialog whose content loads after it opens moves focus to the first real control once loaded (`AssignVolunteer`).
- Labels wrap, never truncate, on buttons (`Button` has `py-2 max-w-full`); grids that hold text use rem-based minimum columns so large text drops a column instead of scrolling sideways. Page titles hyphenate.
- Small text on a tinted fill uses `ink`; the food-type colours and `ink-soft` fall below 4.5:1 on their own tints in the dark theme.

## Design rules that are easy to break

- No hex colours outside `src/styles/index.css`. Use the Tailwind names from `@theme` (`bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-chilli-deep` ...); Tailwind's default palette is removed. Inline SVG may use `var(--fl-...)`.
- Use `chilli-deep` for red text and red button fills; `chilli` fails AA there and is for large display, rings and borders. Turmeric is a fill only; text uses `turmeric-deep`. The slip toast's marks use `slip-done` / `slip-error`.
- Type comes from the utilities `t-display-lg` ... `t-mono-sm`, `t-stamp`, `t-impact` (they set family, size, weight, line height, tracking). `t-mono-sm` is uppercase.
- Breakpoints are `tablet:` (600), `register:` (640, only the Approvals table), `split:` (900, the auth/welcome split) and `desktop:` (1025). There is no `sm:`/`md:`/`lg:`.
- The chalkboard (`bg-board`, `text-chalk`, class `on-board` for chalk focus rings) stays dark in both themes: sidebar, rail, the auth panel, the donor's "Today's Surplus".
- Status is always a `StatusStamp` with a word, never colour alone.
- Token slips: `.slip` (outline via drop-shadows, `--edge` colour, `--stub` height) around `.slip-paper` (the notch mask). Hover adds `slip-lifted`; the role picker's choice uses `slip-selected`. `TokenCard` must look complete with an empty `imageUrl`.
- Do not put a small label or kicker above a heading; captions go beside or below.
- Motion: 120-280ms with `EASE.out` (`src/lib/motion.js`) or `ease-fl-out` in CSS. Animate only transform and opacity; never width, height, padding or border width. Reduced motion means gentler, not none: drop movement and scale (`useReducedMotion()`), keep short fades (`DURATION.fast`). Do not animate things tapped many times a day (bottom-bar tabs).
- The stamp drop (`components/StampDrop.jsx`, 420ms, the one motion over 300ms) is reserved for claim approval; under reduced motion it is a 120ms fade at rest.
- `ImpactNumber` counts up from 0 once per caption per session, then starts from the last value it showed; `forgetImpactNumbers()` runs on sign-out.
- Layouts are left-aligned and differ per role. The banned patterns are in `PROMPT.md` Part A and DESIGN.md section 10.
- Tap targets are at least 48px (`min-h-12`, `size-12`). Use `min-h-*` rather than fixed heights on anything holding text.
- Red (`accent`) buttons are for the one main action of a form or for actions that cost something (Turn down, Reject, Hand back). Completing a step (Mark delivered) is ink.
- Disabled buttons are a sunken paper slot (`border-control bg-sunken text-ink-soft`), never a faded fill. While `loading`, `Button` keeps its real colour.
