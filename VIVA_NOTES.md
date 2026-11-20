# Viva Notes

Backend line numbers are for the code as of commit `d64288b` (the backend has not changed since). Frontend line numbers are for the React app at the end of Stage 5.

---

## 1. Stopping approval of more food than is available (the atomic quantity check)

**Files**
- [backend/src/controllers/claimController.js](backend/src/controllers/claimController.js), lines 163–227 (`exports.approve`)
  - Lines 176–181: Step 1, flip the claim `pending → approved` (guards against a double click)
  - Lines 188–198: Step 2, the atomic reserve (`findOneAndUpdate` + `$expr` + `$inc`)
  - Lines 200–213: undo step 1 if step 2 fails
  - Lines 216–218: mark the listing `fully_reserved` when nothing is left
- [backend/src/routes/claimRoutes.js](backend/src/routes/claimRoutes.js), line 32: route `PATCH /api/claims/:id/approve`

**Key function:** `exports.approve` (the claim controller's `approve` handler), using MongoDB's `FoodListing.findOneAndUpdate` with `$expr` and `$inc`.

**What to say**
> When a donor approves a request, we don't read the quantity and then write it back, because two approvals at the same moment could both pass the check. Instead we send MongoDB one `findOneAndUpdate`. Its filter matches only if `reservedQuantity + requested <= quantity` (using `$expr`), and its update is `$inc: { reservedQuantity: qty }`. MongoDB checks and updates a single document as one atomic step, so only an approval that fits can succeed. If nothing matches, we put the claim back to `pending` by hand (a single local MongoDB has no multi-document transactions) and return a 400 saying how much is left.

---

## 2. Login authentication with bcrypt and JWT

**Files**
- [backend/src/controllers/authController.js](backend/src/controllers/authController.js)
  - Lines 8–12: `signToken`, which creates the JWT (it carries only the user id and expires after `JWT_EXPIRES_IN`, 7 days by default)
  - Line 26: `bcrypt.hash(password, 10)` at registration (10 salt rounds)
  - Lines 49–61: `exports.login`
- [backend/src/models/User.js](backend/src/models/User.js), line 8: `passwordHash` with `select: false`, so the hash is never returned by normal queries
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js), lines 8–26: `protect`, which checks the token on every later request
- [backend/src/routes/authRoutes.js](backend/src/routes/authRoutes.js), lines 25–31: route `POST /api/auth/login`

**Key functions:** `login`, `signToken`, `bcrypt.compare`, and the `protect` middleware (`jwt.verify`).

**What to say**
> We never store the plain password. At registration bcrypt hashes it with a salt, and only `passwordHash` is saved. At login we load the user by email, explicitly selecting the hidden hash, and `bcrypt.compare` checks the typed password against it. A wrong email and a wrong password both give the same "Incorrect email or password" message, so attackers can't find out which emails exist. On success we sign a JWT holding the user id with our secret. The app sends it as `Authorization: Bearer <token>`, and the `protect` middleware verifies it with `jwt.verify` and loads the user into `req.user`.

---

## 3. Role-based access control (how a recipient is blocked from approving claims)

**Files**
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js)
  - Lines 8–26: `protect` (who are you?)
  - Lines 30–35: `requireApproved` (has an admin approved your account?)
  - Lines 38–47: `requireRole(...roles)` (is your role allowed?)
- [backend/src/routes/claimRoutes.js](backend/src/routes/claimRoutes.js)
  - Line 10: `router.use(protect, requireApproved)` for every claim route
  - Line 32: `router.patch('/:id/approve', requireRole('donor'), ...)`
- [backend/src/controllers/claimController.js](backend/src/controllers/claimController.js), lines 72–81: `findForDonor`, the ownership check (the donor must own this listing)

**Key middleware:** `protect` → `requireApproved` → `requireRole('donor')`, then `findForDonor` inside the controller.

**What to say**
> Every protected route runs a chain of Express middleware before the controller. `protect` verifies the JWT and sets `req.user`. `requireApproved` blocks accounts that are still pending or were rejected. Then `requireRole('donor')` is a small factory: it returns a middleware that checks whether `req.user.role` is in the allowed list. A recipient's role is `recipient`, so the request stops there with a 403 "Only donor accounts can do this" and the approve code never runs. As a second layer, `findForDonor` checks that the donor approving is the owner of that listing, so one donor can't approve another donor's claims.

**Tip:** these checks run on the server. Hiding the button in the React app is only for convenience. Even if someone calls the API directly with Postman, the backend still refuses. The Postman collection in `backend/postman/` includes negative tests for this ("wrong role").

---

## 4. Why the backend is split into routes, middleware, controllers, models and utils

### The short answer for the examiner
> Each folder has **one job**. This is called *separation of concerns*. Routes say **which URL goes where**, middleware does the **checks that many routes share**, controllers hold the **business logic** for one action, models describe **how data is stored** in MongoDB, and utils are **small helper functions** used everywhere. Because each piece does one thing, the code is easier to read, test and change. A login rule changes in one file, not in twenty.

### Restaurant comparison (easy to remember)
| Backend part | Restaurant | Job |
|---|---|---|
| `server.js` / `app.js` | The building opening its doors | Starts the server, connects to the database, plugs everything in |
| **Routes** | The menu / waiter | "This order goes to this kitchen station" |
| **Middleware** | The security guard at the door | "Show your ID. Are you allowed in this room?" |
| **Controller** | The chef | Actually cooks the order (the business logic) |
| **Model** | The store room with labelled shelves | What the ingredients (data) look like and where they are kept |
| **Utils** | Kitchen tools (knife, scale) | Small tools that every chef uses |
| **Error handler** | The manager | Handles every complaint in one standard way |

---

### What each part does, and what goes in it

#### `server.js` and `app.js`: setup
- [server.js](backend/src/server.js) loads `.env`, checks that `JWT_SECRET` exists, connects to MongoDB ([config/db.js](backend/src/config/db.js)), then starts listening on port 5000.
- [app.js](backend/src/app.js) builds the Express app:
  - Lines 12–14: global middleware for every request: `cors()` (lets the React app on another port call us), `express.json()` (turns the JSON body into `req.body`), `morgan` (logs each request).
  - Lines 19–24: mounts each router under its URL prefix, for example `app.use('/api/claims', claimRoutes)`.
  - Lines 33–34: `notFound` and `errorHandler` come **last**, so they catch anything that wasn't handled.
- They are two files so the app can be tested without starting a real server.

#### Routes (`src/routes/`): "which URL goes to which function"
- Only map **HTTP method + URL → middleware chain → controller function**. No business logic.
- Example, [claimRoutes.js:32](backend/src/routes/claimRoutes.js#L32):
  ```js
  router.patch('/:id/approve', requireRole('donor'), idRule, validate, claims.approve);
  ```
  You can read the whole security and validation story of an endpoint on one line.
- Also hold the **validation rules** (`express-validator`), for example `createRules` at lines 12–23: "requestedQuantity must be a whole number from 1 to 1000".

#### Middleware (`src/middleware/`): checks shared by many routes
- A middleware is a function `(req, res, next)`. It either calls `next()` to pass the request on, or stops it with an error.
- [auth.js](backend/src/middleware/auth.js): `protect` (valid JWT? sets `req.user`), `requireApproved` (account approved by admin?), `requireRole(...)` (right role?).
- [validate.js](backend/src/middleware/validate.js): reads the express-validator results. If any rule failed, it stops with a 400 and a `{ field: message }` map that the React form shows under each input.
- [errorHandler.js](backend/src/middleware/errorHandler.js): `notFound` (unknown URL → 404) and `errorHandler`, the **only place** that turns errors into JSON. It also translates database errors, for example a bad id → 400, a duplicate email → 409.
- **Why not put these in the controller?** Almost every route needs "is the user logged in?". In middleware it is written once and reused. Copied into every controller, one forgotten copy would be a security hole.

#### Controllers (`src/controllers/`): the business logic
- One function per action: `register`, `login`, `create`, `approve`, `reject`, `cancel`...
- This is where the **rules of FoodLoop** live: "you can't approve more than is left", "only the owner of the listing can decide", "send a notification to the recipient".
- A controller assumes the request has **already** been checked (logged in, right role, valid input), so it can focus on the logic.
- It talks to the database **through models**, and it finishes with `ok(res, ...)` or `throw new ApiError(...)`.

#### Models (`src/models/`): the shape of the data
- Mongoose schemas: `User`, `FoodListing`, `ClaimRequest`, `Pickup`, `Notification`, `Counter`.
- They define fields, types, required fields, allowed values and defaults. Example: [ClaimRequest.js](backend/src/models/ClaimRequest.js) says `status` can only be `pending | approved | rejected | cancelled`, defaulting to `pending`.
- They can also hold data rules: `passwordHash` has `select: false` (never sent back by accident), and `FoodListing` creates its token number (`FL-0042`) in a `pre('save')` hook.
- They give us the database functions: `find`, `create`, `findOneAndUpdate`...
- **Models know nothing about HTTP.** No `req`, no `res`. They only know data.

#### Utils (`src/utils/`): small helpers used everywhere
| File | What it does |
|---|---|
| [apiResponse.js](backend/src/utils/apiResponse.js) | `ok()` sends `{ success, message, data }`; `ApiError` is an error with a status code; `asyncHandler` catches errors from `async` functions and passes them to the error handler |
| [transitions.js](backend/src/utils/transitions.js) | One table of allowed status changes (`pending → approved` is fine, `rejected → approved` is not); `assertClaimTransition` throws a 400 otherwise |
| [notify.js](backend/src/utils/notify.js) | `notify(userId, type, message)` saves a notification |
| [amount.js](backend/src/utils/amount.js) | Writes quantities nicely: "1 box", "5 boxes" |
| [listingStatus.js](backend/src/utils/listingStatus.js) | Expiry sweep, and "mark the listing completed when everything is delivered" |

Utils don't handle requests themselves. They are plain functions that controllers and middleware call.

---

### "Can't the controller just do the router's work?"
> **Technically, yes.** Express would let us write everything in one big file. We don't, for three reasons:
> 1. **Readability.** The routes file is a table of contents for the API. You can see every endpoint, who may call it and what is checked, without reading any logic.
> 2. **Reuse.** The same middleware or helper is used by many routes. For example, `protect` runs on almost every route.
> 3. **Safety and easy changes.** If a URL changes, only the route file changes. If a business rule changes, only the controller changes. A small change can't accidentally break something unrelated.
>
> This follows the **MVC idea** (Model–View–Controller). Here the "View" is the React app, which receives the JSON.

---

### How one request flows: a donor approves a claim

**Request from the React app:**
```
PATCH http://localhost:5000/api/claims/665f.../approve
Authorization: Bearer eyJhbGciOi...
```

```
React app (browser)
   │  HTTP request
   ▼
server.js ── listening on port 5000
   ▼
app.js  global middleware: cors() → express.json() → morgan()     (lines 12–14)
   │  URL starts with /api/claims → go to claimRoutes             (line 21)
   ▼
claimRoutes.js
   │  router.use(protect, requireApproved)                        (line 10)
   │  matches PATCH /:id/approve                                  (line 32)
   ▼
MIDDLEWARE CHAIN (each one calls next() or stops with an error)
   1. protect              → checks the JWT, loads the user → req.user
   2. requireApproved      → is req.user approved?          (403 if not)
   3. requireRole('donor') → is req.user a donor?           (403 for a recipient)
   4. idRule + validate    → is :id a valid MongoDB id?     (400 if not)
   ▼
CONTROLLER  claimController.approve                               (lines 164–227)
   │  uses UTILS:  expireOverdueListings(), assertClaimTransition()
   │  uses MODELS: ClaimRequest.findOneAndUpdate()  (pending → approved)
   │               FoodListing.findOneAndUpdate()   (atomic reserve)
   │  uses UTILS:  notify(recipient, 'claim_approved', ...), amount()
   ▼
MODELS ⇄ MongoDB   (read and write the documents)
   ▼
ok(res, data, 'Approved 5 boxes of Veg Biryani')   ← utils/apiResponse.js
   ▼
JSON back to the React app: { "success": true, "message": "...", "data": { "claim": {...} } }
```

**If something goes wrong at any step** (for example a recipient tries this, or there isn't enough food left):
```
throw new ApiError(403, 'Only donor accounts can do this')
   ▼
asyncHandler / next(err) skips every remaining step
   ▼
errorHandler.js → { "success": false, "message": "Only donor accounts can do this", "data": null }
   ▼
the React page shows the message in a slip
```

### What is available at which place
| Place | What it has | What it adds |
|---|---|---|
| After `express.json()` | `req.body`, `req.params`, `req.headers` | the parsed JSON body |
| After `protect` | everything above | `req.user` (the logged-in user from the database) |
| After `validate` | everything above | a guarantee that the input is valid |
| In the controller | everything above | does the work and calls `ok(res, ...)` |
| In the error handler | the `err` object (`status`, `message`, `data`) | sends the one standard error JSON |

### One-line summary to finish with
> "**Routes** decide where a request goes, **middleware** decides whether it may go there, the **controller** decides what happens, the **model** decides how the data is stored, **utils** are shared tools, and the **error handler** makes sure every failure looks the same to the app."

---

## 5. How the React app connects to the backend

### The short answer for the examiner
> The React app and the Node backend are two separate programs that talk over **HTTP using JSON**. The browser sends a request like `PATCH http://localhost:5000/api/claims/<id>/approve` with the login token in the `Authorization` header. The backend answers with `{ success, message, data }`. Inside React the work is split into layers, like the backend: **pages** (UI) → **hooks and context** (state) → **api files** (which endpoint) → **`api/client.js`** (the one place that does HTTP) → backend.

### The layers in React
| Layer | Folder / file | Job | Backend counterpart |
|---|---|---|---|
| **Config** | [src/config.js](frontend/src/config.js) | The only place with the server address (`VITE_API_URL` from `frontend/.env`) | `.env` / `PORT` |
| **API client** | [src/api/client.js](frontend/src/api/client.js) | The **only** code that sends HTTP. Adds the token, unwraps the envelope, turns failures into `ApiError` | `app.js` + `apiResponse.js` (the envelope) |
| **API files** | `src/api/` (e.g. [claims.js](frontend/src/api/claims.js)) | One function per endpoint. No UI. | routes |
| **Storage** | [src/lib/storage.js](frontend/src/lib/storage.js) | Saves the JWT in localStorage so a login survives a page reload | — |
| **Context** | `src/context/` ([AuthContext.jsx](frontend/src/context/AuthContext.jsx), LiveContext, ThemeContext, ToastContext) | App-wide state: who is signed in, the 20-second refresh, the theme, slip messages | — |
| **Hooks** | `src/hooks/` (e.g. [useClaims.js](frontend/src/hooks/useClaims.js)) | A page's data: load a list, keep it fresh, put a saved item back in it | controllers |
| **Pages** | `src/pages/` | What the user sees and clicks. They call api functions and hooks | — |
| **Router + gates** | [src/App.jsx](frontend/src/App.jsx), [src/routes/Gate.jsx](frontend/src/routes/Gate.jsx) | Which page shows, based on login state and role | the auth middleware |

Libraries: `fetch` (built into the browser, no axios), React Context + hooks for state (no Redux), React Router (navigation), react-hook-form (forms).

---

### Step 1: Where is the server? `src/config.js` (line 3)
```js
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
```
> Vite copies variables that start with `VITE_` from `frontend/.env` into the code at build time. To use the app from a phone on the same Wi-Fi, put the computer's address there (`http://192.168.1.5:5000/api`).

### Step 2: Wiring everything once, `src/main.jsx`
```jsx
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <RouterProvider router={router} />
```
- Each provider makes its state available to every page below it with `useContext` (`useAuth()`, `useSlip()` ...).
- `AuthProvider` restores a saved login when the app opens ([AuthContext.jsx](frontend/src/context/AuthContext.jsx), lines 46–67).
- On sign-out (lines 31–38) the token is cleared from memory and storage and the user is set to `null`, so the next user never sees the previous user's data.

### Step 3: The one HTTP function, `request()` ([api/client.js](frontend/src/api/client.js), lines 32–86)
| Lines | What happens |
|---|---|
| 34–38 | Builds the URL: `API_URL + path` plus any filters, e.g. `http://localhost:5000/api` + `/claims/123/approve` |
| 40–41 | Sets `Accept` and `Content-Type: application/json` |
| **42** | **`Authorization: Bearer <token>`**, the JWT the backend's `protect` middleware checks |
| 45–46, 57–58 | Gives up after 12 seconds ("The server took too long to answer") |
| 50–55 | `fetch(...)` with `JSON.stringify(body)` |
| 60–61 | No server or network: "Could not reach the FoodLoop server" |
| **76** | Success: returns `data` plus the server's `message` ("Approved 6 packets of ...") |
| **80** | **401 while signed in → `onUnauthorized()`**, which logs the user out (expired or invalid token) |
| 82–85 | Otherwise throws `ApiError(message, { status, fieldErrors })`, taking `fieldErrors` from the backend's `data.errors` |

> This matches the backend: the backend **always** sends `{ success, message, data }` (`ok()` / `errorHandler`), and `client.js` is the one place that **unwraps** it. No page ever looks at raw HTTP.

### Step 4: API files, one function per endpoint ([api/claims.js](frontend/src/api/claims.js), line 17)
```js
export const approve = (id) => api.patch(`/claims/${id}/approve`);
```

### Step 5: Hooks hold a page's data ([hooks/useClaims.js](frontend/src/hooks/useClaims.js), lines 19–34)
```js
const { items, error, load, upsert } = useLiveList(fetchClaims);
```
- `items` is the list (null until loaded), `load()` reads it again, `upsert(claim)` puts a saved claim back into the list so the page redraws at once.
- `useLiveList` re-reads the list every 20 seconds (section 9).

### Step 6: The page ([pages/donor/RequestQueue.jsx](frontend/src/pages/donor/RequestQueue.jsx), lines 60–77)
```js
async function approve(c) {
  setBusy({ id: c.id, action: 'approve' });          // the button shows a "..." ticker
  try {
    const data = await claimsApi.approve(c.id);      // PATCH /claims/:id/approve
    claims.upsert(data.claim);                       // the slip now says APPROVED
    onListingChange(data.claim.listingId);           // fewer portions left on the board
    setDropId(c.id);                                 // the stamp drops on this slip only
    showSlip(data.message);                          // "Approved 6 packets of ..."
  } catch (error) {
    showSlip(error.message, { kind: 'error' });      // e.g. "Only 2 boxes left, ..."
    onStale();                                       // re-read the truth
  } finally {
    setBusy(null);
  }
}
```
The message shown to the user comes **from the backend**, so the server and the app always agree.

---

### Full round trip: the donor clicks "Approve"
```
[Page]     RequestQueue approve(c)                         RequestQueue.jsx:60
   ▼
[API file] claimsApi.approve(id) → api.patch('/claims/' + id + '/approve')   api/claims.js:17
   ▼
[Client]   request(): URL + headers + "Authorization: Bearer <JWT>"          api/client.js:32
   │
   │  ════ HTTP over the network (JSON) ════►
   ▼
[Backend] app.js (cors, express.json) → claimRoutes → protect → requireApproved
          → requireRole('donor') → validate → claimController.approve → MongoDB
          → ok(res, { claim }, 'Approved 6 packets of Veg Grilled Sandwiches')
   │
   │  ◄════ { "success": true, "message": "...", "data": { "claim": {...} } } ════
   ▼
[Client]   response.ok && json.success → return { ...json.data, message }    api/client.js:76
   ▼
[Page]     claims.upsert(data.claim) → React re-renders: APPROVED stamp drops, slip message shows
```

**If the backend refuses** (for example not enough food left, 400):
```
errorHandler → { success: false, message: "Only 2 boxes left, but this request asks for 5 boxes" }
   ▼
client.js throws ApiError(message, { status: 400 })                          api/client.js:82
   ▼
the page's catch (error) → red NOT DONE slip with error.message, then the lists are read again
```

---

### Login workflow (how the token gets there)
```
Login page: onSubmit → login(email, password)                         pages/auth/Login.jsx:23-25
   ▼
authApi.login → POST /auth/login { email, password }
   ▼
Backend: bcrypt.compare → jwt.sign → { token, user }
   ▼
AuthContext start({ token, user })                                    AuthContext.jsx:70-80
   ├─ setToken(token)            → every later request sends it (client.js line 42)
   ├─ write(KEYS.token, token)   → saved in localStorage
   ├─ setUser(user); setStatus('signedIn')
   ▼
React re-renders; the gate around /login (PublicOnly) now sees "signedIn"   Gate.jsx:11-24
   ├─ pending account   → <Navigate to="/pending" />
   └─ approved          → <Navigate to="/home" />  (Counter, Board, Pickups or Overview by role)
```
- **The page never navigates by itself after login.** It changes the auth state, and the gates move the user. This avoids bugs where a page and the router disagree.
- **Page reload:** `AuthContext` (lines 46–67) reads the saved token and calls `GET /auth/me`. If it works, the user is still signed in, on the same page. If it returns 401, the token is deleted and the login page shows.
- **Session expired mid-use:** any 401 → `client.js` calls `onUnauthorized` → `logout(true)` (set up at lines 40–44) → the gates send the user to `/login`, which says the session ended.
- **Wrong input:** the backend's `validate` sends `data.errors = { email: "..." }`. `ApiError.fieldErrors` carries it, and `handleServerError` puts each message under its input (section 8).

### Two security layers (good viva point)
| Check | React (`routes/Gate.jsx`) | Backend (`middleware/auth.js`) |
|---|---|---|
| Not logged in | sent to `/login` (line 44) | `protect` → 401 |
| Account pending | sent to `/pending` (line 47) | `requireApproved` → 403 |
| Wrong role (recipient opens `/approvals`) | sent to `/home` (line 49, `canOpen` in `lib/roles.js`) | `requireRole` → 403 |

> "The React checks are for **user experience**: the user never sees a page they can't use. The backend checks are for **security**, because anyone can call the API directly with Postman. That's why the rules are on both sides, and the backend is the one that really decides."

### Other connection details
- **CORS:** the web app runs on port 5173 and the API on 5000, so the browser would block the call. `app.use(cors())` in the backend's `app.js` (line 12) allows it.
- **Live updates:** there are no WebSockets. The app re-asks the backend every 20 seconds (section 9).

### One-line summary to finish with
> "The **page** calls an **api function**, which goes through **`client.js`**, which sends HTTP with the JWT to the backend. The JSON answer comes back the same way, the page puts it into its **state**, and React redraws the screen."

---

## 6. Where the JWT is stored in the frontend

The token is kept in **two places**: in **memory** while the app runs, and in the browser's **localStorage** so the login survives a page reload.

### 1. In localStorage: [frontend/src/lib/storage.js](frontend/src/lib/storage.js)
Saved under the key `foodloop_token` (line 5). `read()`, `write()` and `remove()` (lines 10–32) wrap `localStorage` in `try/catch`, because storage can be blocked (private windows, strict settings); the app then simply forgets between visits.

### 2. In memory: [frontend/src/api/client.js](frontend/src/api/client.js), line 19
```js
let token = null; // set by AuthContext after login, cleared on logout
```
This is the copy used for requests. Line 42 adds it to every request as `Authorization: Bearer <token>`.

### Who puts it there and removes it: [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
| When | Lines | What happens |
|---|---|---|
| Login or register | 70–80 | `setToken(token)` then `write(KEYS.token, token)` |
| Page reload | 46–67 | `read(KEYS.token)`, `setToken(saved)`, then `/auth/me` checks it still works |
| Logout | 31–38 | `setToken(null)` then `remove(KEYS.token)` |
| Token rejected (401) | 63, and 40–44 | during restore it is removed; any 401 later triggers `logout(true)` |

### What to say
> "After login, the JWT is kept in memory in `client.js`, which attaches it to every request. It is also saved in the browser's localStorage, so a reload keeps you signed in. On reload the saved token is read back and checked with `/auth/me`. On logout or a 401, it is deleted from both places."

### If the examiner asks "isn't localStorage unsafe?"
> "Any JavaScript running on the page can read localStorage, so an XSS bug could steal the token. An httpOnly cookie set by the server is safer. For this project the risk is limited: React escapes everything it renders (we never use `dangerouslySetInnerHTML`), the token expires after 7 days, and it carries only the user id. Moving to an httpOnly cookie would be the next step for a real deployment."

---

## 7. Code splitting by route (Stage 5)

**Files:** [frontend/src/App.jsx](frontend/src/App.jsx), lines 15–34 (the `lazy()` pages) and 52–68 (`Root` with `<Suspense>`); [frontend/src/components/ResponsiveShell.jsx](frontend/src/components/ResponsiveShell.jsx), lines 92–97 (the second `<Suspense>`); [frontend/vite.config.js](frontend/vite.config.js) (named library chunks).

**What to say**
> "Before Stage 5 the whole app was one 733 kB JavaScript file, so a recipient also downloaded the admin's chart library. Now every page is loaded with `React.lazy(() => import('./pages/...'))`. Vite sees each `import()` and makes that page a separate file, downloaded the first time the page is opened. `<Suspense>` shows a fallback while it downloads: the splash outside the app frame, and a short 'Opening the page...' line inside it, so the navigation stays on screen. React Router navigates inside a React transition, so once a page is showing, going to a page that is still loading keeps the old page until the new one is ready instead of flashing the fallback."

| File | Size | Loaded |
|---|---|---|
| the app's own shared code | about 60 kB | always |
| React + React Router | about 317 kB | always (cached separately) |
| motion | about 161 kB | always |
| react-hook-form | about 35 kB | pages with a form |
| each page | 2 to 23 kB | that page only |
| the 7-day chart (Recharts) | about 373 kB | only the admin's Overview |

---

## 8. Form validation (react-hook-form)

**Files:** [frontend/src/hooks/useValidatedForm.js](frontend/src/hooks/useValidatedForm.js) (line 18: the settings), `frontend/src/validation/<form>Rules.js` (the rules), [frontend/src/validation/serverErrors.js](frontend/src/validation/serverErrors.js) (`handleServerError`, line 10), [VALIDATION.md](VALIDATION.md) (every rule and message).

**What to say**
> "Every form uses one hook, `useValidatedForm`, which sets up react-hook-form with `mode: 'onBlur'` (a field is checked when you leave it), `reValidateMode: 'onChange'` and `shouldFocusError` (a failed submit focuses the first wrong field). The rules are plain objects in `src/validation/`, one file per form, copied from the backend's express-validator rules, never written inside the components. The backend is still the source of truth: if it refuses, `handleServerError` puts each `data.errors` message under its field with `setError`, and anything without a field (wrong password, server off) becomes a slip message. Errors are red text **with an icon**, and the input gets `aria-invalid` and `aria-describedby`, so screen readers read the message too."

Example rule that compares two fields ([validation/postFoodRules.js](frontend/src/validation/postFoodRules.js)): "Pickup deadline must be after the prepared time" reads the other field with `getValues('preparedAt')`.

---

## 9. Live refresh every 20 seconds

**Files:** [frontend/src/context/LiveContext.jsx](frontend/src/context/LiveContext.jsx) (line 22 `BEAT_MS = 20000`; lines 60–80 the timer and `visibilitychange`; line 130 `useLiveBeat`), [frontend/src/hooks/useLiveList.js](frontend/src/hooks/useLiveList.js).

**What to say**
> "There are no WebSockets. One timer for the whole app, in `LiveContext`, 'beats' every 20 seconds. Each open page joins with `useLiveBeat(load)`, so on each beat the bell's unread count, the activity rail and the page's own list are read again. When the tab is hidden (`document.hidden`), the timer stops, so a forgotten tab makes no requests; when the tab is shown again it catches up at once. `useLiveList` ignores a reply that left before a local change, so a refresh can never undo something the user just did."

---

## 10. Accessibility and testing (Stage 5)

**What to say**
> "At the end of the project every screen, 21 of them including the two dialogs, was opened in headless Chrome as each role, at 360, 768 and 1440 pixels wide, in light and dark themes, and checked with **axe-core** against WCAG 2.2 AA, including colour contrast. The final result is zero violations, no sideways scrolling and no console errors. A keyboard walk pressed Tab through every page: every control is reached in order and shows a focus ring, and dialogs keep focus inside and close with Escape."

What the audit found and we fixed (details in [docs/stage5-audit.md](docs/stage5-audit.md)):
- **Label in name (WCAG 2.5.3):** token cards, alert lines and board lines had an `aria-label` that did not match their visible text (and the token's label left out the deadline). They are now named by their own text.
- **Contrast:** the tiny "TOKEN" caption on the ticket block was 3.97:1 in the dark theme; now ink (above 9:1).
- **Keyboard:** the Activity rail scrolled but could not be focused; the hidden chart had a stray focus stop; the Assign dialog opened with focus on "Not now" (now on the chosen volunteer).
- **Large text:** at 200% text size some pages scrolled sideways; buttons now wrap their label instead of cutting it off, and the role picker drops to one column.

**Backend tests:** [backend/postman/FoodLoop.postman_collection.json](backend/postman/FoodLoop.postman_collection.json), 80 requests and 231 checks, run with `npm run test:api`. Negative tests: **over-allocation** (approving 6 when only 4 are left is refused and nothing is reserved), **wrong role** (a recipient approving, a donor assigning ...), **invalid status changes** (assigned straight to delivered, approving a turned-down request ...) and **no token** (401).

> "The Postman tests prove the backend rules hold even when someone skips the app and calls the API directly, which is exactly what an attacker would do."
