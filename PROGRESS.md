# FoodLoop — Progress

Updated on 2026-11-20 at the end of React Stage 1.

## Current stage

The frontend is being rebuilt in **React (Vite, JavaScript)** against the
existing, unchanged backend. **Stage 1 of 5 is complete and committed (not
pushed).** Waiting for the user to test it.

| Stage | Contents | Status |
|---|---|---|
| 1 | Setup, design tokens, component gallery, auth + routing, responsive shell | Done |
| 2 | Food listings: recipient counter + detail, donor board, post / edit / delete, Listings | Next |
| 3 | Claims: request form, approve with stamp drop, turn down, cancel, My requests receipts | Planned |
| 4 | Volunteer pickups, alerts + badge, live activity refresh, dashboards + Recharts chart, admin approvals and assign dialog | Planned |
| 5 | `/impeccable audit` + `polish`, `review-animations`, screenshots, VALIDATION.md complete, README | Planned |

The backend is complete (all five stages of the original build). It has not
been changed in the rewrite. CORS: `app.use(cors())` already allows
`http://localhost:5173`, so the one allowed backend change was not needed.

## Done in Stage 1

- **Move:** the previous app moved to `frontend-flutter-old/` with `git mv`
  (item by item, because the editor held a lock on the folder). Untouched since;
  reference only.
- **Setup:** Vite 8 + React 19, React Router 8 (`createBrowserRouter`),
  Tailwind CSS 4.3 (`@tailwindcss/vite`), motion 14, Recharts 3 (installed,
  used in Stage 4), react-hook-form 7, Phosphor icons, self-hosted variable
  fonts (`@fontsource-variable/*`). API URL in `frontend/.env`
  (`VITE_API_URL`, with `.env.example`).
- **Design tokens** (`src/styles/index.css`): the paper and chalkboard palettes
  as CSS variables switched by `html[data-theme]`; `@theme inline` maps them to
  Tailwind names, with Tailwind's default palette and breakpoints removed;
  breakpoints `tablet` 600, `split` 900, `desktop` 1025; radii and shadows;
  the type scale as `t-*` utilities; the token slip notch mask, perforation,
  receipt zigzag mask, chalkboard and skeleton pulse. Motion tokens in
  `src/lib/motion.js`. DESIGN.md refreshed for the web stack with
  `ui-ux-pro-max` (CSS token flow, breakpoints, component states, browser
  surfaces).
- **Components:** Button (ink / accent / outline / text / chalk, loading
  ticker, sunken disabled slot), StatusStamp (all statuses, double border for
  delivered, crossed expired), StampDrop, TokenCard (CSS-mask notches, outline
  that follows them, printed ticket block when there is no photo),
  SkeletonToken, PortionMeter, DeadlineClock (SVG ring), ReceiptTimeline,
  ImpactNumber (count-up once per session), VegMarker, Chalkboard + ChalkItem,
  EmptyState / ErrorState with SVG drawings, BrandMark, Field (TextField,
  TextArea, PasswordField, FieldError, FormNotice), ThemeSwitch, PageFrame,
  ResponsiveShell, ActivityRail.
- **App plumbing:** `api/client.js` (JWT, envelope, `ApiError` with
  `fieldErrors`, 12s timeout, 401 logout), AuthContext (restore session on
  load, login, register, logout, refresh), ThemeContext, ToastContext (slip
  messages), route gates (`routes/Gate.jsx`), roles and navigation
  (`lib/roles.js`).
- **Pages:** Welcome (slides under 900px, split with the live impact figure
  above), Sign in, Create account (role picker as four token slips, Admin
  disabled), Waiting for approval (account slip, Check again), Profile (member
  slip, theme switch, sign out), Component gallery (`/gallery`), and a
  "Built in Stage N" placeholder for each page later stages build.
- **Validation:** react-hook-form only; rules in `src/validation/`
  (`constants.js`, `loginRules.js`, `registerRules.js`, `serverErrors.js`);
  `useValidatedForm` hook; VALIDATION.md written (Stage 2-4 forms listed with
  their backend rules, files added in those stages).
- **Docs:** CLAUDE.md (with the MERN-only and cleanup rules), README (how to
  run both servers), PRODUCT.md (stack), DESIGN.md, VALIDATION.md, this file.

## Verified in Stage 1

Against a second API on port 5050 with its own database (`foodloop_test`,
seeded); the user's database on 5000 was not touched. Vite was pointed at it
with `VITE_API_URL=http://localhost:5050/api`.

- `npm run build` succeeds.
- Screenshots (Playwright script in the session scratchpad) of welcome, sign
  in, register, pending, profile, gallery, each role's home and the alerts
  placeholder at 360, 768 and 1440 in both themes: **no horizontal overflow and
  no console errors** at any size.
- Flows: empty register submit shows five field errors and focuses the role
  group; a short password shows "Password must be at least 6 characters" on
  blur and clears as soon as it is fixed; a used email comes back from the
  server (409) and is shown under the email field; a wrong password shows a
  NOT DONE slip; a correct sign-in lands on `/home`; a recipient typing
  `/approvals` is sent to `/home`; reloading `/profile` stays on `/profile`;
  sign out goes to `/login`; the pending account lands on `/pending` and
  Check again shows a NOTE slip; a first visit to `/login` goes to `/welcome`
  and its Create an account button opens `/register`.
- Keyboard: Tab into the role picker and arrow keys pick a role; the focus
  ring shows on the slip; a field error clears while typing.
- Reduced motion (emulated): the gallery renders, the slip appears without
  movement.
- `impeccable detect` over `frontend/src`: no findings.

Fixed after looking at the screenshots (critique): the slip's DONE / NOT DONE
marks were below 4.5:1 (new `slip-done` / `slip-error` tokens); the sidebar's
red action used ink on brand chilli (now `chilli-deep` with its paper label);
the slip's close button was 40px (now 48); an error stayed after a value was
fixed until the next blur (now re-checked on change while shown).

## Known issues / not verified

- Not tried on a real phone (only emulated widths); `navigator.vibrate` for the
  stamp drop is untested on Android.
- The JavaScript bundle is about 625 kB before gzip (Vite warns above 500 kB).
  Route-level code splitting can be added in Stage 5 if wanted.
- The activity rail loads once per visit; the 20-second refresh arrives in
  Stage 4.
- `docs/screenshots/` still holds the previous app's images; they are
  replaced in Stage 5.
- Restart nothing on the user's side: the test API on 5050 and the Vite server
  used for checks were stopped (see the final message of the stage).

## Assumptions made (Stage 1)

- **Port fidelity:** layouts and copy follow the previous app, with web fixes
  (real links, skip link, focus moves to the page on navigation, autofill
  hints, native form submit). The user chose this in the shape question.
- **Error text colour:** the brief says "chilli red"; it uses `chilli-deep`,
  the red that passes AA as small text (DESIGN.md 1.4).
- **Login failures** ("Incorrect email or password") are shown as a slip, as
  the brief asks for non-field server errors, not as a box above the form.
- **Re-validation:** `useForm({ mode: 'onBlur', reValidateMode: 'onChange' })`
  as asked; `useValidatedForm` adds re-checking on change while a field shows
  an error, because react-hook-form only starts `reValidateMode` after a
  submit.
- **Phone rule:** "phone format if the backend checks it": it does
  (`^[0-9+\- ]{7,15}$`), so the form checks the same pattern.
- **Email pattern:** a simple `x@y.z` pattern; express-validator's `isEmail`
  is stricter in rare cases, which then come back as a server field error.
- **Placeholders:** pages built in later stages show "Built in Stage N"
  instead of being hidden, so every navigation item works now.
- **Activity rail in Stage 1:** it loads real events once, since the shell
  needs it; live refresh is Stage 4.
- **Fonts self-hosted** through npm instead of a Google Fonts link (works
  offline at the viva).
- **Icons:** Phosphor (the `ui-ux-pro-max` default), not emoji.
- The step dots on the welcome slides change length instantly (widths are
  never animated); the slide content is the motion.

## Exact next step to resume

Stage 2 (food listings): run `/impeccable shape` for the recipient counter
and detail and the donor board / post form / listings; add
`src/api/foods.js`, `src/validation/postFoodRules.js` (prepared time not in
the future with 5 minutes of leeway, deadline in the future and after the
prepared time via `getValues`), the Feed, ListingDetail (side panel from
600px), Board (chalkboard + post form as a bottom sheet under 600px, a dialog
above) and ManageListings pages; replace the Stage 2 placeholders in
`App.jsx`; read `location.state.postFood` / `focusSearch` from the shell's
action button.

## Final task (only when the user says the project is finished)

Remove every trace of the previous mobile toolkit and the screenshot tooling:

1. Delete `frontend-flutter-old/` (`git rm -r`).
2. Search the repo (docs, comments, README, CLAUDE.md, PROGRESS.md,
   PROMPT.md, PRODUCT.md, DESIGN.md, `docs/`) for "Flutter", "Dart", "fl_chart",
   "go_router", "pubspec" and similar, and rewrite or remove those passages.
   This includes the CORS comment in `backend/src/app.js` (it is on the CORS
   line, the one backend change allowed) and the previous app's audit and
   screenshot files in `docs/`.
3. Make sure no Playwright setup is in the repo (no `playwright` dependency,
   config or script); remove the Playwright notes from CLAUDE.md.
4. Remove project rule 2 from CLAUDE.md once it is satisfied.
