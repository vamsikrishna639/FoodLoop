# Audit: FoodLoop React app (whole frontend), 2026-11-20

Stage 5 of the React rewrite: `/impeccable audit` across every screen, then
the fixes (`/impeccable polish`). Platform: web (responsive).

## How it was checked

- **Rendered pages, not just code.** Each of the 21 screens (public pages,
  the waiting page, every role's pages, the Post food and Assign volunteer
  dialogs) was opened in headless Chrome, signed in as the right role, at
  360, 768 and 1440 px wide, in the paper and chalkboard themes (126
  renders). Test API on a separate database; the real one was not touched.
- **axe-core 4.14** on every render: WCAG 2.0 / 2.1 / 2.2 A and AA rules
  plus best practice (colour contrast, names, ARIA, landmarks, headings).
- **Horizontal overflow** (`scrollWidth > innerWidth`) and **console
  errors** on every render.
- **Keyboard walk** at 1440 and 360: Tab from the top of the document to
  the end, recording every stop; flagged stops without a focus ring,
  invisible stops, visible controls never reached, and focus leaving a
  dialog. Focus rings that a script cannot judge (radio tags, date boxes)
  were checked by eye in screenshots.
- **Large text:** root font size doubled (200%) at 360 and 768 px on 11
  pages; flagged sideways scroll and cut-off text.
- **Bundle:** `npm run build` output.
- **Detector:** `impeccable detect frontend/src` (regex rules): no findings
  before or after.
- **Flow:** the README demo script (post, request, approve, assign,
  collect, deliver) run through the UI on a fresh seed.

## Audit health score

| # | Dimension | Found | After fixes | Key finding |
|---|---|---|---|---|
| 1 | Accessibility | 3 | 4 | aria-labels that did not match the visible text (WCAG 2.5.3), one dark-theme contrast failure, an unfocusable scrolling rail |
| 2 | Performance | 2 | 3 | All JavaScript in one 733 kB file; now split by route (60 kB app + cached libraries + 2-23 kB per page) |
| 3 | Theming | 4 | 4 | One raw `rgb()` dot colour in two files; date segments highlighted in system blue |
| 4 | Responsive design | 3 | 4 | At 200% text, 5 pages scrolled sideways at 360 px (truncating buttons, non-wrapping rows, a fixed 2-column grid) |
| 5 | Implementation integrity | 4 | 4 | Coherent Canteen Token system; detector clean; no drift found |
| **Total** | | **16/20** | **19/20** | **Good, now Excellent** |

**Implementation integrity verdict: pass.** The app expresses one
product-specific system (token slips, stamps, receipts, chalkboard) through
tokens in `styles/index.css`; screens differ per role; status is always a
word; the detector found nothing and no hard-coded colour remains outside
`index.css`.

Issues found: P0 0, P1 4, P2 5, P3 2. All fixed except where noted.

## P1 (WCAG AA failures)

- **[P1] Accessible name did not match the visible text (WCAG 2.5.3 Label
  in Name).** `components/TokenCard.jsx` (card button),
  `components/ResponsiveShell.jsx` (Alerts link with its badge, the profile
  link on the rail), `pages/common/Alerts.jsx` (alert lines),
  `pages/donor/Board.jsx` (chalkboard lines). Each had an `aria-label` that
  replaced its visible text; a voice-control user saying what they see
  could miss, and the token card's label even left out the deadline and
  portions. **Fixed:** no `aria-label`; each control is named by its own
  text in reading order, plus hidden words where needed ("Alerts 2
  unread", "Edit", "Mark as read"). The token title now comes first in
  the code (the marker row is drawn above it with `order-first`), so the
  card reads "Chicken Biryani, Main Block Canteen, Non-veg food, Status:
  AVAILABLE, #FL-0005, 12 of 20 boxes left, Pickup closes in 3h 40m".
- **[P1] Contrast: "TOKEN" caption on the ticket block, dark theme 3.97:1**
  (8px, food-type colour on its own tint). `components/TokenCard.jsx`.
  **Fixed:** the caption is ink (above 9:1 in both themes); the rule beside
  it and the dish initials keep the food-type colour.
- **[P1] Scrolling region not reachable by keyboard (WCAG 2.1.1).** The
  desktop Activity rail scrolls on its own but held nothing focusable.
  **Fixed:** `tabIndex={0}` on the `<aside>` with an inset focus ring, so
  it can be focused and scrolled with the arrow keys.
- **[P1] Focus stop inside a hidden area (WCAG 4.1.2).** The 7-day chart
  is `aria-hidden` (its `figcaption` reads the numbers), but Chrome made one
  of Recharts' SVG layers focusable. `components/DeliveriesChart.jsx`.
  **Fixed:** the drawing is `inert` and `accessibilityLayer={false}`.

## P2

- **[P2] One 733 kB JavaScript file** (Vite warned above 500 kB). Every
  visitor downloaded every role's pages. **Fixed:** `React.lazy` for every
  page in `App.jsx`, a `<Suspense>` at the root (splash) and one inside the
  shell (a short "Opening the page..." line, the navigation stays), and
  named library chunks in `vite.config.js` (react 317 kB, motion 161 kB,
  forms 35 kB). The app's own shared code is 60 kB; pages are 2-23 kB; the
  chart (373 kB) loads only on the admin Overview. No size warning.
- **[P2] The Assign dialog opened with focus on "Not now".** The dialog
  opens before the volunteers arrive, so the browser focused the only ready
  control. `pages/admin/AssignVolunteer.jsx`. **Fixed:** once the list is
  shown, focus moves to the chosen volunteer (Enter assigns, arrows pick).
- **[P2] Sideways scroll at 200% text on phones.** `components/Button.jsx`
  truncated labels with `nowrap` ("Assign volun..."), the receipt title row
  and the alert kind/time row did not wrap, the role picker had a fixed
  2-column grid, and one long heading word could not break. **Fixed:**
  button labels wrap (with `py-2`, `max-w-full`), the rows wrap, the role
  grid is `repeat(auto-fit, minmax(max(9rem, half), 1fr))` (one column at
  large text, never more than two), page titles hyphenate.
- **[P2] Heading order.** The account slip (Pending) and member slip
  (Profile) printed an h3 straight under the page h1. **Fixed:**
  `headingLevel={2}`.
- **[P2] Date and time boxes highlighted the part being typed in system
  blue**, the one browser surface not in the palette. **Fixed:** turmeric
  with ink text, like text selection (`styles/index.css`).

## P3

- **[P3] Raw colour outside `index.css`:** the chalkboard's dotted leader
  was `rgb(169 163 151 / 0.5)` in `components/Chalkboard.jsx` and
  `pages/donor/Board.jsx`. **Fixed:** `color-mix()` of `--fl-chalk-soft`.
- **[P3] Not fixed, by design:** a native modal `<dialog>` lets Tab move
  from its last control to the browser's own toolbar (the page behind stays
  inert). This is how browsers implement modal dialogs; focus never
  reaches the page underneath.

## Patterns

- `aria-label` had been used to give rich controls a tidy name. The
  pattern now is: name a control by its visible text, add hidden words only
  for state ("2 unread") or the action ("Edit").
- Pixel-fixed layout choices (truncation, a fixed column count) were the
  cause of every large-text failure; rem-based minimums and wrapping fixed
  them all.

## Positive findings

- No horizontal scroll and no console errors on any of the 126 renders,
  before or after.
- Focus rings everywhere (2px ink, chalk on the board); focus moves to the
  result after each action; dialogs trap focus and close with Escape.
- Every form field has a visible label; errors are linked
  (`aria-describedby`, `aria-invalid`) and carry an icon, not only colour.
- Status is always a stamp with a word; the deadline ring always has text.
- Reduced motion is handled per component (`useReducedMotion`) and in CSS,
  keeping short fades instead of removing feedback.
- Tokens only: no hex outside `index.css`; both themes pass contrast.

## Still open

- **Motion review:** the `review-animations` skill can only be started by
  the user (`/review-animations`); it was not run in this stage.
- Not tried on a real phone (only emulated widths).
- The checks are automated plus screenshots read by eye; no screen-reader
  session (NVDA, TalkBack) was recorded.

## Recommended next steps

1. `/review-animations` (user-run) over `frontend/src`.
2. A short NVDA pass over the Counter, the Board's request queue and the
   Assign dialog, if time allows before the viva.
