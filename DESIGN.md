# FoodLoop Design System — "Canteen Token"

FoodLoop borrows the physical language of an Indian college canteen: paper token
slips, chalkboard menus, rubber stamps and printed receipts. Every food listing is
a **token slip**, every status is a **stamp**, every history is a **receipt**, and
the donor's posting area is a **chalkboard**.

This document is the single source of truth for the UI. It is implemented in
`frontend/src/styles/index.css` (CSS variables, the Tailwind `@theme`, the type
utilities and the paper shapes) and `frontend/src/lib/motion.js` (motion
tokens). Components never hard-code a colour, a font size or a duration; they
use the Tailwind names generated from these tokens (`bg-paper`, `text-ink`,
`t-headline-sm`, `rounded-slip`, `ease-fl-out`).

How this document was produced: the concept, palette and fonts are a fixed brief.
The `ui-ux-pro-max` skill was used to complete the system (states, scales,
accessibility rules, chart and web-stack guidance) and to check it. Its generic
style suggestion (Swiss minimalism, Outfit / Work Sans, a red-on-pink palette) was
rejected because the brief takes priority. Its accessibility rules were kept, and
they changed three things in the palette — see "Contrast findings" below.

---

## 1. Colour

### 1.1 Light theme — "paper"

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F6F1E7` | App background |
| `surface` | `#FBF8F2` | Token slips, receipts, sheets, dialogs |
| `surfaceSunken` | `#EFE8DA` | Token stubs, input fills, table headers |
| `ink` | `#1E1B16` | Primary text, primary icon, ink buttons |
| `inkSoft` | `#6B6255` | Secondary text, captions |
| `line` | `#E3DACB` | Dividers, card outlines (decorative) |
| `perforation` | `#CFC4B2` | Perforation dots, dotted leaders (decorative) |
| `controlBorder` | `#8C8272` | Input and control outlines (must be 3:1) |
| `chilli` | `#D9472B` | Brand accent: large display, stamp borders, rings, urgency marks |
| `chilliDeep` | `#B93A21` | Chilli used as **text** or as a **button fill** |
| `leaf` | `#2F6B3F` | Success, delivered, impact, veg marker |
| `turmeric` | `#E8A33D` | Highlight fill, "closing soon" ring. Never text on paper |
| `turmericDeep` | `#8A5A0B` | Turmeric used as **text** or a stamp |
| `stampGrey` | `#6B6255` | EXPIRED stamp |
| `nonVeg` | `#B93A21` | Non-veg marker |

### 1.2 Dark theme — "chalkboard"

| Token | Hex | Use |
|---|---|---|
| `paper` | `#1F2422` | App background (slate) |
| `surface` | `#272D2A` | Token slips, receipts, sheets |
| `surfaceSunken` | `#1A1F1D` | Stubs, input fills |
| `ink` | `#ECE8DF` | Primary text (chalk white) |
| `inkSoft` | `#A9A397` | Secondary text |
| `line` | `#3A423E` | Dividers |
| `perforation` | `#4B544F` | Perforation dots, leaders |
| `controlBorder` | `#7C857F` | Input outlines |
| `chilli` | `#F0674B` | Brightened accent; also safe as text here |
| `chilliDeep` | `#F0674B` | Same as `chilli` in dark; button label is ink `#1E1B16` |
| `leaf` | `#6FBF83` | Brightened green |
| `turmeric` | `#F2B65A` | Brightened turmeric; safe as text here |
| `turmericDeep` | `#F2B65A` | Same as `turmeric` in dark |
| `stampGrey` | `#8E958F` | EXPIRED stamp |

### 1.3 Chalkboard block (same in both themes)

The donor's "Today's Surplus" block and the desktop sidebar are always dark.

| Token | Hex |
|---|---|
| `board` | `#232927` |
| `boardFrame` | `#3A2E22` (wooden frame edge) |
| `chalk` | `#ECE8DF` |
| `chalkSoft` | `#A9A397` |
| `chalkLine` | `#3A423E` |

### 1.4 Contrast findings (WCAG AA)

Measured ratios, text 4.5:1 and non-text 3:1 required.

| Pair | Ratio | Result |
|---|---|---|
| ink on paper | 15.25 | pass |
| inkSoft on paper / surface / sunken | 5.32 / 5.65 / 4.92 | pass |
| **chilli `#D9472B` on paper** | **3.82** | **fails for text** → use `chilliDeep` for text |
| **white on chilli `#D9472B`** | **4.30** | **fails for button labels** → button fill is `chilliDeep` |
| chilliDeep on paper; surface on chilliDeep | 5.06; 5.37 | pass |
| leaf on paper; surface on leaf | 5.66; 6.01 | pass |
| **turmeric on paper** | **1.92** | **fails** → turmeric is a fill only; text uses `turmericDeep` (5.26) |
| ink on turmeric | 7.96 | pass (turmeric chips carry ink text) |
| line / perforation on paper | 1.23 / 1.53 | decorative only, never the sole boundary of a control |
| controlBorder on paper | 3.36 | pass for control outlines |
| chalk on slate; inkSoft on dark surface | 12.88; 5.60 | pass |
| dark chilli / leaf / turmeric on dark surface | 4.51 / 6.32 / 7.77 | pass |
| ink on dark chilli (button label) | 5.51 | pass |

Rules that follow:
- `chilli` is the *brand* red. Anything a user must **read** in red uses `chilliDeep`.
- Turmeric never carries meaning as text on paper.
- Status is never colour-only: stamps always contain a word, the deadline ring
  always has a time label, veg markers have a shape and a semantic label.

### 1.5 How the tokens reach the code (React + Tailwind CSS v4)

Raw values exist only in `src/styles/index.css`:

1. `:root` holds the paper theme as CSS variables (`--fl-paper`, `--fl-ink`,
   `--fl-chilli-deep` ...). `[data-theme='dark']` on `<html>` redefines the same
   variables for the chalkboard theme. The chalkboard block (`--fl-board`,
   `--fl-chalk` ...) is defined once and never changes.
2. `@theme inline` maps every variable to a Tailwind colour (`--color-ink:
   var(--fl-ink)`), so `bg-ink`, `text-chilli-deep`, `border-line` and opacity
   forms like `bg-ink/6` follow the theme automatically. Tailwind's default
   palette is removed (`--color-*: initial`), so a stray `bg-blue-500` cannot
   appear.
3. The theme toggle (`ThemeContext`) sets `data-theme`; `index.html` applies the
   saved choice before the first paint, so there is no flash of the wrong theme.
4. `dark:` is a custom variant bound to `data-theme`, not to the operating
   system setting.

The slip toast is ink-coloured (dark on paper, light on the chalkboard), so its
DONE / NOT DONE marks use the opposite theme's accents (`--fl-slip-done`,
`--fl-slip-error`) to stay above 4.5:1.

---

## 2. Typography

| Family | Role |
|---|---|
| **Bricolage Grotesque** | Display and headings |
| **Instrument Sans** | Body and UI |
| **JetBrains Mono** | Token numbers, times, quantities, receipts, stamps |

Inter, Roboto, Poppins and Montserrat are not used.

The scale is deliberately steep: the jump from body (16) to headline (32) to
impact number (72–96) is what makes screens look editorial instead of uniform.

| Style | Font | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `impact` | Bricolage | 72 mobile, 88 tablet, 96 desktop / 0.95 | 800 | -2.0 | ImpactNumber |
| `displayLarge` | Bricolage | 56 / 1.0 | 800 | -1.5 | Onboarding headline |
| `displayMedium` | Bricolage | 44 / 1.05 | 700 | -1.0 | Screen hero titles (desktop) |
| `displaySmall` | Bricolage | 36 / 1.1 | 700 | -0.8 | Screen titles (mobile) |
| `headlineMedium` | Bricolage | 28 / 1.15 | 700 | -0.5 | Section titles |
| `headlineSmall` | Bricolage | 22 / 1.2 | 700 | -0.3 | Token title, dialog title |
| `titleLarge` | Bricolage | 19 / 1.25 | 600 | -0.2 | Card titles |
| `titleMedium` | Instrument | 16 / 1.35 | 600 | 0 | List titles, field labels |
| `titleSmall` | Instrument | 14 / 1.35 | 600 | 0.1 | Small headings |
| `bodyLarge` | Instrument | 16 / 1.5 | 400 | 0 | Body |
| `bodyMedium` | Instrument | 14 / 1.5 | 400 | 0 | Secondary body |
| `bodySmall` | Instrument | 12.5 / 1.45 | 400 | 0.1 | Captions |
| `labelLarge` | Instrument | 15 / 1.2 | 600 | 0.1 | Buttons |
| `labelMedium` | Instrument | 13 / 1.2 | 600 | 0.2 | Chips, nav labels |
| `monoLarge` | JetBrains | 18 / 1.3 | 700 | 0 | Token number |
| `mono` | JetBrains | 13.5 / 1.4 | 500 | 0 | Quantities, times, receipt rows |
| `monoSmall` | JetBrains | 11.5 / 1.3 | 500 | 0.6 | Captions under numbers, overlines (uppercase) |
| `stamp` | JetBrains | 12 / 1.0 | 800 | 1.6 | Stamp text (uppercase) |

Rules: body text is never below 12.5; numbers that change (countdowns, counters)
use mono with tabular figures so they do not shift; text wraps before it
truncates, and titles truncate at two lines with an ellipsis.

---

## 3. Spacing, radii, elevation

**Spacing** (4-point rhythm): `xxs 2`, `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`,
`xxl 32`, `xxxl 48`, `huge 72`.
Page gutters: 16 mobile, 24 tablet, 40 desktop. Section gap: 32 mobile, 48 desktop.

**Radii** vary by object, on purpose — a uniform radius is what makes UIs look
templated:

| Token | Value | Object |
|---|---|---|
| `rSharp` | 2 | Receipts, chalkboard, table cells (printed things are square) |
| `rStamp` | 4 | Stamps, veg markers, mono chips |
| `rControl` | 6 | Buttons, inputs |
| `rSlip` | 10 | Token slips |
| `rSheet` | 20 | Bottom sheet top corners, dialogs |
| `rPill` | 999 | Filter chips, user chip |
| `notch` | 9 | Radius of the semicircle cut-outs on a token slip |

**Elevation** is ink and paper, not blur. There are three levels:

| Level | Treatment | Use |
|---|---|---|
| 0 flat | 1px `line` outline | Slips, receipts, tables at rest |
| 1 lifted | outline + short soft shadow `(0, 4)`, blur 10, `ink` at 10% | Hovered slip, raised nav action |
| 2 floating | soft shadow `(0, 12)`, blur 32, `ink` at 14% | Dialogs, sheets, snackbar slips |

No glassmorphism, no glows, no gradients except the faint chalk dust on the board.

---

## 4. Motion

Motion must confirm an action, show where something came from, or draw attention
to a change. If it does none of these it is removed.

| Token | Value | Use |
|---|---|---|
| `fast` | 120ms | Press feedback, hover |
| `base` | 200ms | Most transitions: fades, chip selection, theme-aware colour changes |
| `slow` | 280ms | Page and Hero transitions, sheets |
| `stagger` | 40ms per item, capped at 8 items | First-load list entrance only |
| `count` | 900ms | ImpactNumber count-up |
| `stampDrop` | 420ms | The approve stamp (signature moment, used once) |
| `easeOut` | `cubic-bezier(0.23, 1, 0.32, 1)` (`ease-fl-out`) | Default: things arriving |
| `easeInOut` | `cubic-bezier(0.77, 0, 0.175, 1)` (`ease-fl-in-out`) | Things moving on screen |
| `stampCurve` | `cubic-bezier(0.2, 0.9, 0.3, 1.15)` | Stamp settle with a small overshoot |

- No bouncy springs on everyday UI. Exits are faster than entrances.
- Press feedback is a scale to 0.98 on slips and buttons, never a layout shift.
- Only transform and opacity are animated.
- **Stamp drop:** the APPROVED stamp starts at scale 1.9, opacity 0, rotation -16°,
  and lands at scale 1, rotation -6° with a light haptic. Used only when a donor
  approves a claim.
- **Reduced motion:** when the system asks for reduced motion
  (`prefers-reduced-motion: reduce`, read with motion's `useReducedMotion()` in
  components and a media query in CSS), everything that moves or scales is
  skipped: the list stagger and rise, the count-up,
  the Hero flight, the press scale, bottom-sheet slides and the stamp's fall
  and turn. Short opacity fades remain (at most 120ms) because they aid
  comprehension: list items fade in together, page and panel cross-fades stay,
  and the APPROVED stamp fades in at rest.
- **Frequency:** things tapped many times a day (navigation tabs, radio
  choices) change instantly; the page cross-fade is their only motion.

---

## 5. Component states

Every interactive component defines all of these states.

| State | Treatment |
|---|---|
| Default | As specified |
| Hover | Slip lifts to elevation 1 (an extra soft `drop-shadow`, outline darkens to `controlBorder`); buttons darken ~10%; cursor becomes a pointer |
| Pressed | `active:scale-[0.98]` on slips and buttons (transform only, no layout shift; off under reduced motion) |
| Focused | `:focus-visible` gets a 2px `ink` outline with a 2px offset (chalk on the board, `.on-board`). Inputs show a 2px ink edge instead. Never removed |
| Disabled | Buttons become a sunken paper slot (`sunken` fill, `controlBorder` outline, `inkSoft` label), never a faded fill; `cursor: not-allowed`. The Admin role slip is 60% opacity with "Not here" printed on it |
| Loading | Button keeps its width; label is replaced by a small mono "..." ticker and the button is disabled |
| Error | `chilliDeep` border, `aria-invalid`, and a small mono message in `chilliDeep` below the field with a warning icon, linked by `aria-describedby` |
| Selected | Ink fill with paper text for chips; a stamp-style check for role slips |

Minimum tap target is 48×48 (`min-h-12`). Targets are at least 8 apart.
Browser surfaces follow the palette too: text selection is turmeric with ink
text, the caret is ink, scrollbars use `perforation`, and Chrome's autofill
keeps the sunken paper fill.

### Buttons
- **Primary (ink):** `ink` fill, `paper` label. The default action on most screens.
- **Accent (chilli):** `chilliDeep` fill, `surface` label. Reserved for the single
  most important action on a screen (Request food, Post food).
- **Outline:** 1.5px `ink` border, ink label.
- **Text:** ink label with an underline on hover.
- Height 48 (52 on mobile primary actions), radius `rControl`, label `labelLarge`.

### Inputs
Sunken fill `surfaceSunken`, 1px `controlBorder`, radius `rControl`, 16px text
(so phones do not zoom in), visible `<label>` above the field (never
placeholder-only), helper or error text below. Validation runs on blur, on
submit, and on every change while a field shows an error (see VALIDATION.md).
Password fields have a show/hide button (`aria-pressed`).

---

## 6. Signature components

### TokenCard
The food listing. A slip of `surface` paper with:
- A semicircle notch cut from each side (a CSS `mask` of two radial
  gradients on `.slip-paper`; the parent `.slip` draws the 1px outline with
  four `drop-shadow` filters, so the outline follows the notches), placed on the
  perforation line.
- **Top:** veg marker, title (`headlineSmall`), donor name, StatusStamp in the
  top-right corner.
- **Perforation:** a dotted line in `perforation`.
- **Stub:** `surfaceSunken`, with the token number (`monoLarge`), PortionMeter and
  DeadlineClock.
- **With no image** (the normal case): the top section shows a "ticket block" —
  a food-type tinted panel with a large mono initial of the dish and a faint
  repeating token pattern. The card is designed around this; a photo is the
  exception, not the default, so an empty `imageUrl` never leaves a hole.
- A compact variant drops the ticket block for dense lists.

### PortionMeter
A row of small plate icons that fill as portions are reserved. Up to 12 portions
are drawn as icons; above that it collapses to mono text "18 / 20 left" with a
thin segmented bar. Always carries a semantic label "18 of 20 plates left".

### DeadlineClock
A circular ring like a kitchen timer with the time left in mono beside or inside
it. The ring spans up to 6 hours. Ink by default, turmeric under 1 hour, chilli
under 15 minutes, and a crossed-out EXPIRED stamp after. Updates once a minute
(once a second in the last minute).

### StatusStamp
Uppercase mono text in a rounded rectangle border, rotated -6°, with slightly
uneven ink (a painted grain mask). Colours: AVAILABLE `leaf`, RESERVED
`turmericDeep`, PENDING `inkSoft`, APPROVED `leaf`, REJECTED `chilliDeep`,
CANCELLED `stampGrey`, ASSIGNED `ink`, PICKED UP `ink`, DELIVERED `leaf` with a
double border, EXPIRED `stampGrey` crossed out.

### ReceiptTimeline
A printed receipt: zigzag torn top and bottom edges (a CSS `mask` of two
repeating conic gradients, one 12px tooth per tile), mono text,
dotted leaders between label and time ("Requested ........ 12:40 PM"). Steps that
have not happened yet are printed in `inkSoft` with "--:--".

### Chalkboard
Always-dark `board` surface with a thin wooden frame, a chalk-underlined heading
(any date or count sits beside or below the heading, never as a label above it),
and items listed like a menu board: dish name, dotted leader, quantity in mono.

### ImpactNumber
A very large Bricolage number with a small uppercase mono caption. Counts up from
0 the first time a figure appears in a session; on later visits it starts from
the value it last showed, so it stands still, or counts only what was added.

### VegMarker
The Indian food marking: a green square outline with a green dot (veg), a red
square outline with a red triangle (non-veg), and a split marker for mixed. Has a
semantic label.

### Slip snackbar
Feedback appears as a small printed slip: `ink` background, mono text, and a
small boxed word (DONE / NOT DONE) so the result never depends on colour.

### SkeletonToken
A loader in the exact shape of a TokenCard with a slow opacity pulse (static when
reduced motion is on). No spinners for content.

### EmptyState
A simple illustration drawn as plain SVG geometry (an empty plate, a clear counter,
a blank slip), a warm specific line of copy, and one action.

---

## 7. Layout

One `ResponsiveShell`, three breakpoints, mobile first. Tailwind's own
`sm`/`md`/`lg` are removed; the app's breakpoints are named for what they mean:

| Tailwind variant | Width | Navigation | Content |
|---|---|---|---|
| (none) | `< 600` | Bottom bar (68px) with a raised centre action | One column; forms are bottom sheets |
| `tablet:` | `>= 600` | Dark navigation rail (92px), icons over labels | Two columns; detail opens as a side panel |
| `split:` | `>= 900` | — | Sign-in, register and welcome split into chalkboard + paper |
| `desktop:` | `> 1024` | Menu-board sidebar (248) | Main area + activity rail (304); max width 1320, left-aligned; dialogs |

The layout switches are CSS, so all three navigations exist in the markup and
the hidden ones are `display: none` (out of the accessibility tree). Only a
screen whose structure differs (the welcome slides) reads the width in
JavaScript (`useMediaQuery`). Gutters: 16 / 24 / 40. Heights use `dvh`, and the
bottom bar adds `env(safe-area-inset-bottom)`. There is no horizontal scroll at
360, 768 or 1440.

Screens differ on purpose:
- **Recipient feed** — a counter of token slips under a large title.
- **Donor dashboard** — a chalkboard block above a queue of requests.
- **Volunteer** — receipt-led pickup cards with one large action.
- **Admin** — asymmetric: one large impact block, a chart, then a table.

Never four identical stat cards in a row. Never centred-everything.

---

## 8. Charts (Recharts)

The 7-day deliveries chart (Recharts, styled with the CSS variables, animation
off) is a bar chart in the palette: `leaf` bars with square
tops, today's bar in `chilli`, mono axis labels, dotted `perforation` grid lines,
and the value printed directly above each bar so the chart does not depend on
colour or hover. A text summary is provided for screen readers.

---

## 9. Accessibility checklist

- Text contrast 4.5:1, non-text 3:1, in both themes (table in 1.4).
- Tap targets 48×48 minimum.
- Every icon-only control has a tooltip and semantic label.
- Status is always a word as well as a colour.
- Focus is visible on every control; tab order follows visual order.
- Text scales with the system setting; layouts wrap instead of clipping.
- Reduced motion is respected.

## 10. Banned

Purple or blue gradients, glassmorphism, neon glows, stock-illustration heroes,
four identical stat cards with an icon in a coloured circle, default framework
blue, uniform 8px radius everywhere, emoji as icons, centred-everything layouts.
