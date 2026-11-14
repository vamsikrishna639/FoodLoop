# FoodLoop — Progress

Updated on 2026-11-14 at the end of Stage 2.

## Current stage

**Stage 2 — Food listings: complete and committed**
("Stage 2: food listings, feed, donor board, welcome"). Waiting for the user
to say "continue" before starting Stage 3.

## Done in Stage 2

**Backend**
- `/api/foods` CRUD: list (filters `status` as a comma list, `foodType`,
  `search`, `closingSoon`), `mine`, get one, create, patch, delete.
- Validation: format rules with express-validator in `routes/foodRoutes.js`;
  date rules (prepared not in future, deadline in future and after prepared)
  in `controllers/foodController.js`, sent back as field errors.
- Ownership: donors manage only their own listings; admin can manage all.
- Expiry: `utils/listingStatus.js` sweeps overdue `available` listings to
  `expired` before every read. Closed listings cannot be edited.
- Edits cannot lower quantity below `reservedQuantity`; the status is
  recomputed after an edit. Only whitelisted fields are accepted.
- Delete is refused (409) while a listing has approved claims; other claims
  for it are removed with it.
- `availableQuantity` virtual on FoodListing; `id` included in JSON.
- Public `GET /api/impact` (portions delivered) for the welcome screen.
- CastError message now says "Invalid id" instead of "Invalid _id".

**Frontend**
- `FoodListing` model, `FoodService`, `FeedProvider` (recipient),
  `ListingsProvider` (donor/admin). Both providers reset on sign-out.
- Welcome (`/welcome`): three slides on phones; split layout at 900px and
  wider with the real impact number. Shown once per device (flag in
  shared_preferences, also set on any sign-in).
- Recipient "Today's Counter": search (300ms debounce), filter tags
  (veg / non-veg / mixed / closing soon), token count, skeletons, empty,
  no-match and error states, fade-up on first load only. Phones open
  `/home/listing/:id` with a Hero; tablet and desktop use a side panel.
- Listing detail: receipt of facts, allergens, quantity stepper capped at
  what is left, "Request food" (stand-in until Stage 3), food-safety note,
  closed/fully-reserved wording.
- Browse button: focuses the counter's search field from any page.
- Donor Board: chalkboard "Today's Surplus" (soonest deadline first, tap a
  line to edit) and a printed "Counter tally" receipt.
- Post/edit form: bottom sheet on phones, dialog on wider screens; date and
  time pickers, "Pickup in +1h/+2h/+4h" shortcuts, client checks that mirror
  the server, server field errors shown under the matching field.
- Listings page (donor) / All listings (admin): Open and Closed tabs, Edit,
  Delete with confirmation. Delete is hidden when portions are reserved.
- New widgets: `FilterTag`, `QuantityStepper`, `FadeUp`; `TokenCard` gained
  a `selected` state. `core/format.dart` holds date/quantity formatting.

## Verified in Stage 2

- API: 22 curl checks (filters, regex-safe search, pending/no-token/wrong-role
  blocks, empty-body field errors, the three date rules, quantity below
  reserved, editing an expired listing, delete with approved claims, bad id,
  admin edit, delete then 404, ignored `status`/`reservedQuantity`). The
  seeded Samosa (deadline +12 min) was confirmed `expired` after its deadline.
- Playwright screenshots of the release build at 360, 768 and 1440 in paper
  and chalkboard: welcome, counter feed, detail page (360) and side panel
  (768/1440), donor board, donor listings, admin all listings, post form.
- Clicked through: welcome slides → sign in; feed → detail (phone); Veg tag;
  Browse from Profile (desktop) and from the counter (phone) focuses search;
  search with no match → "Clear filters"; empty form submit → inline errors;
  post a token (#FL-0010, slip "is on the counter"); edit its quantity
  (slip "updated"); delete it; delete blocked for a listing with approved
  claims (slip shows the server reason).
- `flutter analyze`: no issues. `flutter build web` from `C:\FoodLoop\frontend`.

Fixed during the screenshot pass:
- Filter tags stretched to the full row width (a `Container` with an alignment
  expands); they now hug their text.
- The side panel repeated the selected token card; it now opens with a plain
  heading, clock and portion meter.
- The list column was too narrow at 768/1440 (portion icons wrapped); it now
  takes 54% of the width, between 320 and 400px.
- Chalkboard lines wrapped into three lines at 360 and "0/10 plates" was
  ambiguous; each line now reads "12 left" with a one-line note underneath.
- The tally receipt wrapped "Portions left" when placed beside the requests
  note at 768; side-by-side now starts at 640px of content width.
- Welcome: the logo jumped when Skip disappeared; "Next" had a leading arrow;
  the APPROVED stamp wrapped on the wide layout.

Fixed from `/impeccable critique` (design review; native platform, so no
detector run):
- Form fields were announced only by their hint text; `LabeledField` now
  gives each field its label (also fixes login and register).
- Two "Post food" buttons on wide screens (board/listings header plus the
  sidebar); the shell's button is now the only one.
- Left for Stage 5 polish: a receipt title can leave one word on its own line
  ("Counter 2" → "2").

## Known issues / not verified

- **The Hero flight was not seen frame by frame.** Navigation from card to
  detail works on a phone width; the animation itself was not recorded.
- **Playwright canvas clicks stop working after resizing the window in
  place**; a fresh navigation fixes it. Typing into fields after a reload also
  failed once, so the later checks signed in through the API (as the app
  does) instead of typing. Login by typing was checked at the start.
- The date and time pickers use Material's dialogs, themed only through the
  colour scheme. They were not screenshotted.
- Not run on an Android emulator or device yet.
- Stage 1 items still open: focus ring not seen in a screenshot, helper text
  indent, Google Fonts need internet on first load, no Flutter tests.

## Assumptions made

- **Only `available` listings are swept to `expired`.** A fully reserved
  listing is already handed out and its pickups carry on; if a claim is later
  cancelled it becomes `available` and the next sweep expires it.
- **Expiry is a sweep before each read**, not a timer or cron job.
- **Delete is refused with 409 Conflict** when approved claims exist; other
  claims for the listing are deleted with it.
- **Expired and completed listings cannot be edited.**
- **`closingSoon` is a server-side filter** (deadline within one hour), added
  next to the brief's `status`, `foodType` and `search` filters.
- **`GET /api/impact` is a new public endpoint** so the welcome screen's
  ImpactNumber shows a real figure before login (brief: "large ImpactNumber"
  on desktop onboarding; PRODUCT.md: never invented numbers).
- **The counter shows `available` and `fully_reserved` listings** (the latter
  stamped RESERVED); expired and completed are hidden from recipients.
- **Tablet and desktop both use the list + side panel**; only phones open a
  separate detail page with the Hero.
- **The listing detail route is recipient-only** (`/home/listing/:id`).
- **"Request food" shows a NOTE slip** until the claim workflow in Stage 3.
- **The welcome slides show once per device** and are skipped after any
  sign-in. The split layout starts at 900px, the same as sign in.
- **The admin's Listings page lists every listing** with Edit and Delete; the
  full "listing review" belongs to the Stage 4 admin dashboard.
- **impeccable `shape`** was written as a short brief in the chat and the
  build went ahead without a separate confirmation stop, because the user
  asked for the whole stage before stopping.
- **impeccable `critique`** ends by asking which findings to fix. As in
  Stage 1, the P1/P2 findings were fixed without asking.
- `.playwright-mcp/` (screenshots and helper scripts) is git-ignored.

## Exact next step to resume

Wait for "continue", then start **Stage 3 — Claim workflow** (`PROMPT.md` Part J):

1. Run `/impeccable shape` for the request flow, the donor's incoming
   requests and "My requests".
2. Backend: `/api/claims` (create, mine, incoming, approve, reject, cancel)
   with the atomic `findOneAndUpdate` (`$expr` + `$inc`) reservation,
   transition checks, the no-duplicate rule, and claim notifications.
3. Frontend: wire "Request food" in `screens/recipient/listing_detail.dart`;
   replace the "Incoming requests" note in `screens/donor/board_screen.dart`;
   the APPROVED stamp-drop animation; My Requests with ReceiptTimeline
   (replace the `/requests` stand-in in `core/router/app_router.dart`).
4. Screenshot at 360, 768 and 1440 in both themes, then `/impeccable critique`.
