# FoodLoop — Build Prompt

You are building **FoodLoop**, a smart food waste reduction and redistribution web app for an MCA mini-project, on the MERN stack (MongoDB, Express, React, Node). A college canteen (donor) posts surplus food, registered recipients request it, volunteers collect and deliver it, and an admin manages everything.

The backend logic is intentionally simple (no payments, no GPS, no SMS, no cloud deployment, no AI). Because of that, **the UI/UX is the main way this project impresses**. It must look designed by a person with taste, not like a default AI-generated dashboard. Read the whole prompt before starting.

**How to work:**
1. First, show me a short plan, the folder structure, and the design direction you'll follow. Do not write code until I approve.
2. Build in the stages listed at the end. After each stage, tell me how to run and test it, then wait for me to say "continue".
3. Write clean, commented code a student can explain in a viva. Do not add features outside this scope.

---

## PART A — Design direction: "Canteen Token"

This is the creative concept. It wins over any generic default, including suggestions from the skills below.

**The idea:** Indian college canteens run on paper token slips, chalkboard menus, rubber stamps and printed receipts. FoodLoop's interface borrows that physical language. Every food listing is a **token slip**, every status change is a **stamp**, every pickup history is a **receipt**, and the donor's daily posting area is a **chalkboard**. It should feel warm, tactile, local and a little playful, while staying clean and easy to use.

### Palette (light mode: "paper")
- Background: warm paper `#F6F1E7`, with surfaces in slightly lighter `#FBF8F2`
- Ink (primary text): deep ink `#1E1B16`; secondary text `#6B6255`
- Primary accent: chilli/tomato red `#D9472B` (main actions, urgency)
- Secondary accent: curry-leaf green `#2F6B3F` (success, delivered, impact)
- Highlight: turmeric `#E8A33D` (closing soon, highlights, sparingly)
- Lines and dividers: `#E3DACB`; perforation dots in `#CFC4B2`

### Dark mode: "chalkboard"
- Background: slate chalkboard `#1F2422`, surfaces `#272D2A`
- Text: chalk white `#ECE8DF`, secondary `#A9A397`
- Same accents, slightly brightened for contrast

### Typography (self-hosted with `@fontsource-variable/*`, no Google Fonts request)
- Display and headings: **Bricolage Grotesque** (bold, characterful)
- Body and UI text: **Instrument Sans**
- Token numbers, times, quantities and receipts: **JetBrains Mono** (gives the "printed slip" feel)
- Use a strong type scale with big contrast between headline sizes and body text. Large editorial numbers for impact stats.
- **Do not** use Inter, Roboto, Poppins or Montserrat.

### Signature components (build these as reusable React components)
1. **TokenCard** — the food listing card. Shaped like a canteen token slip: notched semicircle cut-outs on both sides (use a CSS mask), a dotted perforation line separating the top (food title, donor, food-type marker) from the bottom stub (token number like `#FL-0042` in mono, quantity, deadline). Subtle paper texture or grain is optional; keep it light.
2. **PortionMeter** — instead of a generic progress bar, show available portions as a row of small plate or box icons that fill as they are reserved (collapse to "18 / 20" text when the count is large).
3. **DeadlineClock** — a small circular ring countdown to pickup deadline, like a kitchen timer. Ink by default, turmeric under 1 hour, chilli red under 15 minutes, crossed-out "EXPIRED" stamp after.
4. **StatusStamp** — statuses shown as rubber stamps: uppercase mono text inside a rounded rectangle border, rotated about -6 degrees, slightly uneven opacity. Colors: AVAILABLE (green), RESERVED (turmeric), APPROVED (green), REJECTED (red), PICKED UP (ink), DELIVERED (green, double border), EXPIRED (grey, crossed).
5. **ReceiptTimeline** — the claim and pickup history shown like a printed receipt: zigzag torn top and bottom edges, mono text, dotted leaders between label and time ("Requested ........ 12:40 PM").
6. **Chalkboard header** — the donor's "Today's Surplus" area uses the chalkboard dark surface even in light mode, with the posted items listed like a menu board.
7. **ImpactNumber** — big editorial number (e.g. "1,240 meals saved") in Bricolage Grotesque with a small mono caption, counting up when it appears.
8. **Veg / non-veg markers** — use the familiar Indian green-square-dot and red-square-triangle style markers on cards.

### Layout (fully responsive, avoid the "same card grid everywhere" look)
Create one `ResponsiveShell` with three breakpoints:
- **Mobile (< 600px):** bottom navigation bar with a raised center action ("Post food" for donor, "Browse" for recipient). Single column of TokenCards. Forms open as bottom sheets. Thumb-friendly.
- **Tablet (600–1024px):** navigation rail on the left, two-column layout. Listing detail opens as a side panel next to the list.
- **Desktop (> 1024px):** three-zone editorial layout — a left sidebar styled like a menu board (logo, nav, user chip), a main content area, and a right rail with a live activity feed ("Ananya requested 5 meals · 2 min ago"). Max content width around 1320px. Dialogs instead of bottom sheets.
- Vary layouts between screens on purpose. The admin dashboard should not look like the recipient feed. Use asymmetry, one large feature block plus smaller supporting blocks, instead of four identical stat cards in a row.
- No overflow errors at 360px, 768px or 1440px width.

### Motion (follow Emil Kowalski's principles)
- Motion must have a purpose: confirm an action, show where something came from, or draw attention to change. If it does none of those, don't animate.
- Keep most transitions 150–250ms with ease-out curves (one shared `cubic-bezier` ease-out, used by CSS and the `motion` library). No bouncy springs on everyday UI.
- **Signature moment:** when a donor approves a claim, the APPROVED stamp drops onto the token with a quick scale-down and slight rotation settle. Use it only here, so it stays special.
- On phones, the TokenCard flies into the listing detail page (View Transitions API).
- Staggered fade-up for list items on first load only, not on every re-render.
- Respect reduced motion (`prefers-reduced-motion`, `useReducedMotion()`): drop movement and scale, keep only short fades.

### Other UX details
- Skeleton loaders shaped like TokenCards, not spinners.
- Empty states with warm, specific copy and a simple illustration drawn with inline SVG or icons (e.g. "The counter's clear. Check back after lunch service.").
- Error states with a retry button.
- Success and error feedback via snackbars styled like a small printed slip.
- Food-safety notice on listing detail: a small note reminding recipients to check freshness and allergens, and that a deadline alone doesn't guarantee food is safe.
- Accessible: WCAG AA contrast, tap targets at least 48px, semantic labels on icons, never rely on color alone (stamps always have text).
- Light/dark toggle in settings (paper ↔ chalkboard).

### Banned generic patterns
Do not use: purple/blue gradients, glassmorphism, neon glows, generic hero sections with a stock illustration, four identical stat cards with an icon in a colored circle, default Material blue, uniform 8px-radius cards everywhere, emoji as icons, or centered-everything layouts. If a screen starts to look like a template, stop and rethink it with the Canteen Token concept.

---

## PART B — Use the installed skills in this order

1. **ui-ux-pro-max** — Before writing UI code, use it to build a complete design system (color tokens, type scale, spacing, radii, elevation, component states) for this concept and the React stack. Treat Part A as a fixed brief: use the skill to refine, complete and check it, not to replace it with a different style. Save the result as `DESIGN.md` in the repo root and implement it as CSS custom properties and Tailwind `@theme` tokens in `frontend/src/styles/index.css`, with the motion values in `frontend/src/lib/motion.js`.
2. **impeccable** — Run `/impeccable shape` before building each major screen to plan its hierarchy and responsive layout. Run `/impeccable critique` after each screen is built and fix what it finds. At the end of Stage 5, run `/impeccable audit` and `/impeccable polish` across the whole app.
3. **emil-design-eng** (and Emil's related animation skills) — Follow it for every animation and interaction decision. At the end, run **review-animations** on the app and fix its findings.

**Visual verification:** After building each screen, run the Vite dev server and check the screen at 360px, 768px and 1440px widths in both themes. Fix overflow, spacing or alignment problems, and confirm the screen matches the Canteen Token concept. `npm run build` must finish without errors.

---

## PART C — Tech stack

The stack is strictly MERN. No TypeScript, no Next.js, no Redux.

**Frontend: React (Vite, JavaScript), in the browser**
- State: React Context + hooks
- Routing: `react-router` (`createBrowserRouter`) with role-based gates; every page loaded with `React.lazy`
- HTTP: one `fetch` wrapper; the token in `localStorage`
- Forms: `react-hook-form`, with the rules in separate files
- Styling: Tailwind CSS v4 with the design tokens in `@theme`; Tailwind's default palette removed
- Motion: `motion` (Framer Motion) plus CSS transitions
- `recharts` (styled to match the concept, not default chart colors), `@phosphor-icons/react`, `@fontsource-variable/*`

**Backend: Node.js + Express.js + MongoDB (Mongoose)**
- JWT + bcrypt auth, express-validator, cors, dotenv, morgan
- Centralized error handler; all responses as `{ success, message, data }`

Repo structure:
```
foodloop/
  backend/
  frontend/
  DESIGN.md
  README.md
```

---

## PART D — Roles

- **Donor** (canteen): posts surplus food, approves/rejects requests, tracks pickups
- **Recipient**: browses food, requests a quantity, tracks requests
- **Volunteer**: views assigned pickups, updates pickup status
- **Admin**: approves accounts, reviews listings, assigns volunteers, views statistics

New users (except the seeded admin) start as `pending`. Pending users can log in but only see a friendly "waiting for approval" screen.

---

## PART E — Data models

- **users**: name, email (unique), passwordHash, role (donor | recipient | volunteer | admin), phone, organization (optional), verificationStatus (pending | approved | rejected), timestamps
- **foodListings**: donorId, tokenNumber (auto, e.g. FL-0042), title, description, quantity, unit (boxes | plates | kg | packets), reservedQuantity (default 0), location (text), preparedAt, pickupDeadline, foodType (veg | non-veg | mixed), allergenNotes, imageUrl (optional), status (available | fully_reserved | expired | completed), timestamps
- **claimRequests**: listingId, recipientId, requestedQuantity, note, status (pending | approved | rejected | cancelled), timestamps
- **pickups**: claimRequestId, volunteerId, pickupStatus (assigned | picked_up | delivered | cancelled), assignedAt, pickedUpAt, deliveredAt
- **notifications**: userId, message, type, isRead, createdAt

---

## PART F — Business rules (enforce on the backend)

1. **No over-allocation.** Available = quantity − reservedQuantity. Approval fails if requestedQuantity exceeds available. Use an atomic conditional update (`findOneAndUpdate` with `$expr` + `$inc`) so simultaneous approvals can't over-reserve.
2. When reservedQuantity equals quantity → `fully_reserved`. Cancelling an approved claim releases its quantity and sets the listing back to `available`.
3. Listings past pickupDeadline are `expired`; block new claims and approvals on them.
4. Food counts as redistributed **only** when a pickup is `delivered`.
5. Valid transitions only — Claim: pending → approved / rejected / cancelled; approved → cancelled. Pickup: assigned → picked_up → delivered; assigned / picked_up → cancelled. Anything else returns 400.
6. Role middleware on every protected route: recipients can't approve claims, donors only manage their own listings, volunteers only update their own pickups.
7. A recipient can't request the same listing twice while a request is pending or approved.
8. In-app notifications for: claim submitted, approved/rejected, volunteer assigned, delivered, account approved.

---

## PART G — API

| Method | Endpoint | Role |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | any |
| GET | /api/foods | any (filters: status, foodType, search) |
| POST | /api/foods | donor |
| GET | /api/foods/mine | donor |
| GET | /api/foods/:id | any |
| PATCH | /api/foods/:id | donor (own) / admin |
| DELETE | /api/foods/:id | donor (own, no approved claims) / admin |
| POST | /api/claims | recipient |
| GET | /api/claims/mine | recipient |
| GET | /api/claims/incoming | donor |
| PATCH | /api/claims/:id/approve | donor (own listing) |
| PATCH | /api/claims/:id/reject | donor (own listing) |
| PATCH | /api/claims/:id/cancel | recipient (own) |
| POST | /api/pickups/assign | admin |
| GET | /api/pickups/mine | volunteer |
| PATCH | /api/pickups/:id/status | volunteer (assigned) |
| GET | /api/users?status=pending | admin |
| PATCH | /api/users/:id/verify | admin |
| GET | /api/notifications | any |
| PATCH | /api/notifications/:id/read | any |
| PATCH | /api/notifications/read-all | any |
| GET | /api/dashboard | any (role-specific stats) |
| GET | /api/activity | any (recent events for the activity feed) |

Seed script (`npm run seed`): one admin, one approved donor ("Main Block Canteen"), two recipients, two volunteers, one pending user, about eight listings across all states, plus some claims and pickups. Put all test logins in the README.

---

## PART H — Screens

1. **Splash and onboarding:** logo plus three short slides on mobile; split layout on desktop with a large ImpactNumber on one side.
2. **Login and register:** role picker as four token-slip style options; inline validation; password visibility toggle; loading state on buttons.
3. **Pending approval:** friendly illustration and copy.
4. **Recipient feed ("Today's Counter"):** search, filter chips (veg / non-veg / mixed / closing soon), TokenCards with PortionMeter, DeadlineClock and StatusStamp.
5. **Listing detail:** full details, prepared time, allergens, food-safety note, quantity stepper capped at available, "Request food" button.
6. **Donor dashboard:** chalkboard "Today's Surplus" block, incoming requests with approve/reject (approve triggers the stamp animation), "Post food" form with date-time pickers (deadline must be in the future and after prepared time).
7. **Recipient "My requests":** ReceiptTimeline for each request.
8. **Volunteer dashboard:** tabs Assigned / On the way / Delivered; large clear status-update button; pickup details as a receipt.
9. **Admin dashboard:** large ImpactNumber feature block, 7-day deliveries chart styled in the palette, pending approvals (table on desktop, cards on mobile), listing review, volunteer assignment dialog.
10. **Notifications:** unread markers, mark all read, badge on bell icon.
11. **Profile and settings:** user info, role stamp, paper/chalkboard theme toggle, logout.

---

## PART I — Frontend architecture

```
src/
  api/         client.js (the only HTTP entry point) and one file per resource
  context/     AuthContext, ThemeContext, ToastContext, LiveContext
  hooks/       data and form hooks (useListings, useClaims, useValidatedForm ...)
  lib/         plain helpers (roles, format, listing, claim, motion, storage)
  routes/      Gate.jsx (PublicOnly, PendingOnly, RequireApproved)
  pages/       auth, recipient, donor, volunteer, admin, common
  components/  TokenCard, PortionMeter, DeadlineClock, StatusStamp, ReceiptTimeline,
               ImpactNumber, VegMarker, ResponsiveShell, EmptyState, SkeletonToken
  validation/  form rules, one file per form
  styles/      index.css (design tokens, Tailwind @theme)
```
- One API client that attaches the JWT, logs out on 401 and parses `{ success, message, data }`.
- API base URL in one config file (`src/config.js`, read from `VITE_API_URL` in `frontend/.env`, default `http://localhost:5000/api`).
- Restore the session on app start.
- No hard-coded colors or text styles in components; everything comes from the design tokens.

---

## PART J — Build stages

1. **Design system and setup:** run ui-ux-pro-max, write DESIGN.md, implement the tokens and all signature components in a simple "component gallery" page (`/gallery`). Backend scaffold, MongoDB connection, auth, role middleware, seed script. Login, register, pending screens, ResponsiveShell and router.
2. **Food listings:** listing CRUD with validation and expiry handling; recipient feed and detail; donor post and manage screens.
3. **Claim workflow:** atomic reservation, approve/reject/cancel, transition validation; stamp animation; My Requests with ReceiptTimeline.
4. **Volunteers, notifications, dashboards:** pickup assignment and status, notifications, activity feed, role dashboards and chart, admin approvals.
5. **Testing and polish:** Thunder Client/Postman collection (exported JSON) including negative tests (over-allocation, wrong role, invalid transition); screenshots at all three widths for every screen; dark mode check; accessibility audit; route code splitting; `/impeccable audit` + `/impeccable polish`; review-animations; README with setup steps, test logins and a demo script for one full donor → recipient → volunteer → delivered flow.
