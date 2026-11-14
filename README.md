# FoodLoop

A campus food-surplus redistribution app, built as an MCA mini-project.
The college canteen posts food left over after service, registered recipients
ask for a share, volunteers carry it over, and an admin approves accounts and
assigns pickups.

The interface follows one idea, "Canteen Token": every listing is a paper token
slip, every status is a rubber stamp, every history is a printed receipt, and
the canteen's own area is a chalkboard. The full design system is in
[DESIGN.md](DESIGN.md).

| Part | Stack |
|---|---|
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT + bcrypt |
| `frontend/` | Flutter (Android and Web), provider, go_router |

## Build status

The app is built in five stages. **Stages 1 and 2 are complete.**

| Stage | Contents | Status |
|---|---|---|
| 1 | Design system, component gallery, auth, role-based shell | Done |
| 2 | Food listings: post, edit, delete, browse, detail; welcome slides | Done |
| 3 | Claim workflow: request, approve, reject, cancel | Not started |
| 4 | Volunteers, notifications, dashboards | Not started |
| 5 | Testing and polish | Not started |

What works today:

- **First visit:** three welcome slides on phones; on wide screens a split
  page with the real "portions delivered" figure. Shown once per device.
- **Recipient:** "Today's Counter" with search and filter tags, soonest
  deadline first. Phones open a token's details as a page; tablets and
  desktops show them in a side panel. The raised **Browse** button puts the
  cursor in the search field. "Request food" is a stand-in until Stage 3.
- **Donor:** the chalkboard "Today's Surplus" with a printed tally, the
  **Post food** form (bottom sheet on phones, dialog on wider screens), and
  **Listings** with Open / Closed tabs, Edit and Delete.
- **Admin:** "All listings", with the same Edit and Delete.

Pages for later stages (requests, alerts, approvals, volunteer and admin
homes) still show a stand-in that names the stage where they arrive.

## What you need

- Node.js 20 or newer
- MongoDB Community Server running locally on `127.0.0.1:27017`
- Flutter 3.50 or newer (Dart 3.14), with Chrome for the web build
- An internet connection on first run: the three typefaces are downloaded from
  Google Fonts and then cached

## Setup

### 1. Backend

```
cd backend
npm install
copy .env.example .env
npm run seed
npm start
```

On macOS or Linux use `cp` instead of `copy`.

- `npm run seed` **deletes everything in the `foodloop` database** and then
  inserts the demo data. Run it once at the start, and again whenever you want
  a clean demo.
- `npm start` serves the API on `http://localhost:5000`. Open
  `http://localhost:5000/api/health` to check it is running.
- `npm run dev` does the same and restarts when a file changes.

The settings in `.env`:

| Name | Meaning | Default |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/foodloop` |
| `JWT_SECRET` | Secret used to sign login tokens. Change it. | placeholder |
| `JWT_EXPIRES_IN` | How long a login lasts | `7d` |

### 2. Frontend

Keep the backend running, then in a second terminal:

```
cd frontend
flutter pub get
flutter run -d chrome
```

To run on the Android emulator, start an emulator and use `flutter run`. The
app reaches the API at `10.0.2.2:5000` there, which is the emulator's address
for your computer.

To run on a real phone on the same Wi-Fi, pass your computer's address:

```
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:5000/api
```

The API address lives in one file, `frontend/lib/core/config.dart`.

## Test logins

Every seeded account uses the password `password123`.

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@foodloop.test` | Campus Admin |
| Donor | `canteen@foodloop.test` | Main Block Canteen |
| Recipient | `ananya@foodloop.test` | Asha Night Shelter |
| Recipient | `farhan@foodloop.test` | Boys Hostel C Mess |
| Volunteer | `kiran@foodloop.test` | NSS Unit 2 |
| Volunteer | `meera@foodloop.test` | NSS Unit 2 |
| Recipient, pending | `rohit@foodloop.test` | Sees only the "waiting for approval" screen |

A newly registered account is always pending until an admin approves it.
Admin accounts cannot be registered; they come only from the seed script.

## Component gallery

Open `http://localhost:<port>/#/gallery` in the running web app (no login
needed). It shows every signature widget with sample data: token cards, status
stamps, portion meters, deadline clocks, the chalkboard, impact numbers,
receipts, buttons, slips, empty states, the palette and the type scale. The
button at the top switches between the paper and chalkboard themes.

## Project layout

```
backend/
  src/
    app.js            Express app and route mounting
    server.js         loads .env, connects to MongoDB, listens
    config/           database connection
    models/           User, FoodListing, ClaimRequest, Pickup, Notification, Counter
    controllers/      request handlers
    routes/           routes and validation rules
    middleware/       auth (protect, requireApproved, requireRole), validate, errorHandler
    utils/            response envelope, ApiError, listing expiry sweep
  seed/seed.js        demo data

frontend/lib/
  core/               theme tokens, router, API client, config, breakpoints, date formats
  models/             data classes (user, food listing)
  services/           API calls (auth, food)
  providers/          app state (auth, theme, recipient feed, donor listings)
  screens/            auth, common (welcome, profile), recipient, donor
  widgets/            TokenCard, StatusStamp, ReceiptTimeline, ResponsiveShell and the rest
```

## API so far

Every response has the shape `{ success, message, data }`. Validation
failures also carry `data.errors`, a `{ field: message }` map.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | public |
| GET | `/api/impact` | public: portions delivered so far |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/foods` | approved user. Filters: `status` (comma list), `foodType`, `search`, `closingSoon=true` |
| POST | `/api/foods` | donor |
| GET | `/api/foods/mine` | donor |
| GET | `/api/foods/:id` | approved user |
| PATCH | `/api/foods/:id` | donor (own listing) or admin |
| DELETE | `/api/foods/:id` | donor (own, no approved requests) or admin |

Listing rules enforced by the API:

- The prepared time cannot be in the future; the pickup deadline must be in
  the future and after the prepared time.
- An open listing whose deadline has passed becomes `expired`. This is checked
  just before every listing read, so no background job is needed.
- The quantity cannot be lowered below what is already reserved.
- Expired and completed listings cannot be edited.
- `status`, `reservedQuantity`, `tokenNumber` and `donorId` cannot be set by
  the client; they are ignored if sent.

## Checks

```
cd frontend
flutter analyze
flutter build web
```

`flutter analyze` should report "No issues found". The backend has no test
runner yet; a Postman collection with negative tests is part of Stage 5.

### If the web build shows the wrong fonts or empty icon boxes

On Windows, run `flutter build web` from a path that starts with an upper-case
drive letter, for example `cd C:\FoodLoop\frontend`. With Flutter 3.50, a
build started from `c:\FoodLoop\frontend` (lower-case `c:`, which is how some
editors open the folder) leaves the fonts, icons and manifest files out of
`build/web`. To recover, delete `frontend/build/web` and
`frontend/.dart_tool/flutter_build`, then build again from `C:\`.

To look at the release build, serve the folder and open
`http://localhost:8080`:

```
python -m http.server 8080 --directory C:\FoodLoop\frontend\build\web
```
