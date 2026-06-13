# StayFinder 2.0

A full-stack vacation rental marketplace (Airbnb-style) built with **Express.js + TypeScript** and **React 18 + Vite + Redux Toolkit**.

> Paid features: real-time chat + typing indicators, AI itinerary generation, multi-level recommendations, Razorpay refunds, host verification, calendar availability, skeleton loaders, admin panel.

---

## Tech Stack

| Layer              | Technology                                                  |
| ------------------ | ----------------------------------------------------------- |
| Runtime            | Node.js (CommonJS)                                          |
| Backend            | Express.js 5 (TypeScript)                                   |
| Database           | MongoDB (Mongoose 9)                                        |
| Cache              | Redis (ioredis)                                             |
| Real-Time          | Socket.IO                                                   |
| Frontend           | React 18, Vite, TypeScript                                  |
| State              | Redux Toolkit                                               |
| Styling            | Tailwind CSS 3                                              |
| Payments           | Razorpay                                                    |
| AI                 | Google Gemini (`gemini-2.0-flash` via `@google/genai`)      |
| Auth               | JWT + Google OAuth                                          |
| Email              | Nodemailer (Gmail SMTP)                                     |
| File Upload        | Multer + Cloudinary                                         |
| Validation         | Zod                                                         |
| PDF                | PDFKit                                                      |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)
- Redis (optional — cache degrades gracefully)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm run seed            # creates admin user + sample listings
npm run dev             # starts on :5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev             # starts on :5173
```

### Default Admin

```
Email:    admin@stayfinder.com
Password: Password123!
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/stayfinder
REDIS_URL=redis://default:<pass>@<host>:<port>
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

---

## Project Structure

```
StayFinder2.0/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.ts                  # Express + Socket.IO + graceful shutdown
│       ├── config/
│       │   ├── db.ts                  # MongoDB with auto-reconnect
│       │   ├── redis.ts               # Redis cache connection
│       │   ├── multer.ts              # Memory storage (5MB limit)
│       │   └── validations.ts         # Zod schemas
│       ├── middlewares/
│       │   ├── async.middleware.ts     # Async error wrapper
│       │   ├── auth.middleware.ts      # JWT + role-based access
│       │   ├── cache.middleware.ts     # Redis response caching
│       │   ├── error.middleware.ts     # Global error handler
│       │   └── validate.middleware.ts  # Zod validation
│       ├── modules/
│       │   ├── admin/                 # Dashboard, users, listings, bookings
│       │   ├── auth/                  # Register, login, Google OAuth, password reset (thin)
│       │   ├── booking/               # Create, cancel, refund flow (thin)
│       │   ├── chat/                  # Real-time messaging + typing
│       │   ├── host-application/      # Host verification
│       │   ├── itinerary/            # AI travel plans
│       │   ├── listing/              # CRUD, search, AI description (thin)
│       │   ├── notification/         # DB + Socket.IO push
│       │   ├── payment/             # Razorpay orders, verify, webhooks (thin)
│       │   ├── recommendation/      # 4-level engine
│       │   ├── refund/              # Refund tracking
│       │   ├── review/              # Create, update, listing reviews (thin)
│       │   └── user/               # Profile, wishlist, role upgrade
│       ├── services/
│       │   ├── ai.service.ts        # Gemini integration
│       │   ├── auth.service.ts      # Register, login, Google, password reset
│       │   ├── cloudinary.service.ts
│       │   ├── email.service.ts     # Invoice, reset, refund emails
│       │   ├── listing.service.ts   # Search queries, availability, earnings
│       │   ├── notification.service.ts
│       │   ├── payment.service.ts   # Order creation, verification, refunds
│       │   ├── pdf.service.ts
│       │   ├── recommendation.service.ts
│       │   ├── refund-policy.service.ts
│       │   ├── review.service.ts    # Listing rating recalculations
│       │   └── socket.service.ts
│       ├── utils/
│       │   └── AppError.ts
│       └── script/
│           └── seed.ts
├── frontend/
│   ├── package.json
│   └── src/
│       ├── main.tsx                  # Entry — Redux + Google OAuth
│       ├── App.tsx                   # BrowserRouter + Routes + lazy pages
│       ├── app/
│       │   └── store.ts
│       ├── assets/
│       ├── components/
│       │   ├── auth/                 # AuthModal, ProtectedRoute
│       │   ├── common/               # Navbar, Footer, ErrorBoundary, modals
│       │   ├── listing/              # ListingCard, SearchFilters, MapContainer
│       │   ├── review/               # ReviewForm, ReviewModal, ReviewSummary
│       │   └── ui/                   # shadcn primitives (skeleton, spinner, etc.)
│       ├── features/
│       │   └── auth/                 # authSlice
│       ├── hooks/
│       │   └── useNotifications.ts
│       ├── lib/
│       │   └── utils.ts              # cn() helper
│       ├── pages/
│       │   ├── public/               # Home, SearchPage, ListingDetails, Login, etc.
│       │   ├── user/                 # Trips, Wishlist, Chat, Profile, BecomeHost
│       │   ├── host/                 # HostDashboard, HostBookings, Create/EditListing
│       │   └── admin/               # AdminDashboard, Users, Listings, Bookings, Hosts
│       └── services/
│           ├── apiFetch.ts           # Axios + auth interceptor
│           ├── paths.ts
│           └── socket.ts
└── .env.example
```

---

## Architecture

### Backend — Thin Controller Pattern

Controllers receive the request, call a service, return a response. All business logic lives in `services/`.

| Module      | Controller (thin)        | Service                          |
|------------|--------------------------|----------------------------------|
| Auth       | `auth.controller.ts`     | `services/auth.service.ts`       |
| Listing    | `listing.controller.ts`  | `services/listing.service.ts`    |
| Booking    | `booking.controllers.ts` | `modules/booking/booking.service.ts` |
| Review     | `review.controller.ts`   | `services/review.service.ts`     |
| Payment    | `payment.controller.ts`  | `services/payment.service.ts`    |

Error handling uses `asyncHandler` (wraps every controller), `AppError`, and a global error handler in `middlewares/error.middleware.ts`.

### Frontend — Component-Based Routing

`App.tsx` uses `BrowserRouter` + `Routes` + `Route` with lazy-loaded pages:

- `Navbar` is shown on all pages except auth pages (login, forgot-password, reset-password)
- Content has `pt-16 sm:pt-20` to sit below the fixed navbar
- `ProtectedRoute` wraps pages that require authentication (uses `children` pattern)
- Role-based access via `allowedRoles` prop

---

## Feature Flows

### 1. Authentication & Authorization

**Backend:**
1. `POST /api/auth/register` — Zod validates `{ name, email, password }`, service hashes with bcrypt (10 rounds), signs JWT (7d)
2. `POST /api/auth/login` — selects `+password` (field is `select: false`), compares hash via service
3. `POST /api/auth/google` — verifies Google ID token, creates user if new, issues JWT
4. Password reset — crypto token, SHA256 hash + 10min expiry, email sent

**Auth middleware:**
- Extracts `Bearer` token, verifies JWT (returns 401 on expired/invalid)
- Fetches user — lightweight query
- Rejects banned users with 403
- `authorizeRoles(...roles)` — checks role in allowed list

**Frontend:**
- `authSlice` stores `user` + `token` in Redux + localStorage
- `apiFetch.ts` interceptor auto-attaches `Authorization: Bearer <token>`
- On 401 response, auto-logout + redirect to `/`
- `ProtectedRoute` checks `isAuthenticated` and optional `allowedRoles`

### 2. Listing Search & Discovery

**`GET /api/listings`** supports:
- `lng, lat, radius` — geospatial `$near` query
- `category` — exact match
- `search` — regex on title (case-insensitive)
- `minPrice, maxPrice` — range filter
- `amenities` — `$all` match (comma-separated)
- `page, pageSize` — pagination
- Redis cache: 300s TTL

**AI Smart Search** `POST /api/listings/smart-search` — sends natural language prompt to Gemini, extracts structured JSON, executes MongoDB query via `listing.service.ts`.

### 3. Booking Flow

1. `POST /api/bookings/create` — validates dates, checks availability, calculates price
2. `POST /api/payments/create-order` — Razorpay order created via `payment.service.ts`
3. Frontend opens Razorpay checkout
4. `POST /api/payments/verify` — HMAC SHA256 signature verification via `payment.service.ts`
5. Booking → `"confirmed"`, invoice emailed, host notified
6. `PATCH /bookings/:id/cancel` — refund via `booking.service.ts`
7. Cron: auto-complete past bookings

**Booking statuses:** `pending → confirmed → completed`

### 4. Cancellation & Refund Flow

Cancellation logic lives in `booking.service.ts` with shared refund policy from `refund-policy.service.ts`:

```
Cancel → PATCH /bookings/:id/cancel
  → Ownership check
  → Status check (not completed/cancelled)
  → Prevent double refund
  → Compute refund via calculateRefundAmount()
  → Razorpay refund API via payment.service.ts
  → Booking: status="cancelled", refunded=true
  → Release blocked dates
  → Create Refund record
  → Email + notification to guest + host
```

#### Cancellation Policy

| Policy    | 7+ days | 3-7 days | 1-3 days | <24h |
| --------- | ------- | -------- | -------- | ---- |
| Flexible  | 100%    | 50%      | 0%       | 0%   |
| Moderate  | 100%    | 50%      | 50%      | 0%   |
| Strict    | 50%     | 25%      | 0%       | 0%   |

### 5. Reviews

- `POST /api/reviews/:listingId` — requires completed booking ownership
- `PUT /api/reviews/:id` — 48h edit window
- Listing rating/numReviews recomputed via `recalculateListingStats()` in `review.service.ts`
- AI summary: `GET /reviews/listing/:id/summary`

### 6. Wishlist

- `POST /api/users/wishlist/:listingId` — toggles listing in user's `wishlist` array
- Navbar displays `wishlist.length` badge

### 7. Real-Time Chat

**Socket.IO** events via `socket.service.ts`:

| Client → Server          | Server → Client          |
| ------------------------ | ------------------------ |
| `join_room`              | `receive_message`        |
| `join_user_room`         | `new_notification`       |
| `send_message`           | `user_typing`            |
| `typing` / `stop_typing` | `user_stopped_typing`    |

### 8. Host Verification

1. Apply at `/become-host` → `POST /api/host-application/apply`
2. Admin reviews at `/admin/hosts`
3. Approved → `role: "host"` + `profile.verified: true`

### 9. Admin Panel

Protected behind `authorizeRoles("admin")`:
- **Dashboard** — 5 KPIs + revenue chart + booking chart
- **Users** — search, ban/unban
- **Listings** — approve/reject
- **Bookings** — filter by status
- **Hosts** — approve/reject applications

### 10. Host Dashboard

- 4 KPI cards: Earnings, Properties, Bookings, Pending
- SVG earnings area chart
- Summary sidebar + monthly breakdown
- Recent bookings (5 latest)
- Create/edit/delete listings

### 11. AI Itinerary Generator

- **Listing-based:** `POST /api/itineraries/listing/:id/generate` (1 free per listing)
- **Booking-based:** `POST /api/itineraries/:bookingId/generate` (up to 3 versions)
- Form modal: people, group, style, budget, days
- Markdown output rendered with ReactMarkdown

### 12. Recommendation Engine (4-Level)

| Level | Method                              |
| ----- | ----------------------------------- |
| 1     | Geospatial `$near` within 50km      |
| 2     | Content-based scoring               |
| 3     | Collaborative filtering             |
| 4     | User preference personalization     |

### 13. Calendar Availability

- `GET /api/listings/:id/availability` — returns unavailable dates from `blockedDates` + bookings
- Host: month grid, click to toggle blocked dates
- Guest: 2-month side-by-side, grey unavailable dates

### 14. Loading States

| Component       | Usage              |
| --------------- | ------------------ |
| `Skeleton`      | Base animate-pulse |
| `SkeletonCard`  | Listing card       |
| `SkeletonTable` | Admin tables       |
| `SkeletonChart` | 12-column bars     |
| `SkeletonKPICard` | KPI metric cards |
| `SkeletonLineGroup` | n progressively shorter lines |
| `Spinner`       | Inline (sm/md/lg)  |
| `PageSpinner`   | Full-page loading  |

---

## Theme

| Element            | Style                                             |
| ------------------ | ------------------------------------------------- |
| Primary buttons    | `bg-gray-900 text-white rounded-xl`               |
| Input fields       | `rounded-xl border-gray-200 focus:border-gray-900` |
| Cards              | `rounded-2xl border-gray-200 shadow-sm`            |
| Modals             | `rounded-3xl shadow-2xl`                           |
| AI accent          | `from-indigo-600 to-purple-600` gradient           |
| Notifications      | `bg-rose-500`                                      |
| Page background    | `bg-gray-50` (alternating)                         |

---

## API Reference

### Auth (`/api/auth`)

| Method | Endpoint              | Auth    | Description        |
| ------ | --------------------- | ------- | ------------------ |
| POST   | `/register`           | Public  | Create account     |
| POST   | `/login`              | Public  | Login              |
| POST   | `/google`             | Public  | Google OAuth       |
| GET    | `/profile`            | Private | Get profile        |
| POST   | `/logout`             | Private | Logout             |
| POST   | `/forgot-password`    | Public  | Send reset email   |
| PUT    | `/reset-password/:token` | Public | Reset password   |

### Users (`/api/users`)

| Method | Endpoint                  | Auth    | Description           |
| ------ | ------------------------- | ------- | --------------------- |
| GET    | `/profile`                | Private | Full profile          |
| PUT    | `/profile`                | Private | Update name + avatar  |
| GET    | `/wishlist`               | Private | Populated wishlist    |
| POST   | `/wishlist/:listingId`    | Private | Toggle wishlist       |

### Listings (`/api/listings`)

| Method | Endpoint                    | Auth       | Description             |
| ------ | --------------------------- | ---------- | ----------------------- |
| GET    | `/`                         | Public     | Search + filter         |
| POST   | `/smart-search`             | Public     | AI search               |
| GET    | `/:id`                      | Public     | Listing detail          |
| POST   | `/create`                   | Host/Admin | Create listing          |
| PUT    | `/:id`                      | Host/Admin | Update listing          |
| DELETE | `/:id`                      | Host/Admin | Delete listing          |
| POST   | `/ai-description`           | Host/Admin | AI description          |
| GET    | `/host`                     | Host/Admin | My listings             |
| GET    | `/:id/blocked-dates`        | Private    | Blocked dates           |
| POST   | `/:id/blocked-dates`        | Host/Admin | Toggle blocked date     |
| GET    | `/:id/availability`         | Public     | Unavailable dates       |
| GET    | `/:id/similar`              | Public     | Similar listings        |
| GET    | `/analytics/earnings`       | Host/Admin | Earnings data           |

### Bookings (`/api/bookings`)

| Method | Endpoint               | Auth       | Description              |
| ------ | ---------------------- | ---------- | ------------------------ |
| POST   | `/create`              | Private    | Create booking           |
| GET    | `/`                    | Private    | My trips                 |
| GET    | `/host`                | Host       | Host's bookings          |
| GET    | `/:id`                 | Private    | Booking detail           |
| PATCH  | `/:id/cancel`          | Private    | Cancel + refund          |
| PATCH  | `/:id/host-cancel`     | Host/Admin | Host cancel + refund     |

### Payments (`/api/payments`)

| Method | Endpoint         | Auth    | Description               |
| ------ | ---------------- | ------- | ------------------------- |
| POST   | `/create-order`  | Private | Create Razorpay order     |
| POST   | `/verify`        | Private | Verify payment signature  |
| POST   | `/cancel`        | Private | Cancel pending payment    |
| POST   | `/webhook`       | Public  | Razorpay webhook          |

### Reviews (`/api/reviews`)

| Method | Endpoint                       | Auth    | Description          |
| ------ | ------------------------------ | ------- | -------------------- |
| GET    | `/listing/:listingId`          | Public  | Listing reviews      |
| POST   | `/:listingId`                  | Private | Create review        |
| PUT    | `/:id`                         | Private | Update (48h window)  |
| DELETE | `/:id`                         | Private | Delete review        |
| POST   | `/:id/reply`                   | Host    | Host reply           |
| GET    | `/listing/:listingId/summary`  | Public  | AI summary           |

### Notifications (`/api/notifications`)

| Method | Endpoint         | Auth    | Description     |
| ------ | ---------------- | ------- | --------------- |
| GET    | `/`              | Private | Get all         |
| PATCH  | `/:id/read`      | Private | Mark one read   |
| PATCH  | `/read-all`      | Private | Mark all read   |

### Host Applications (`/api/host-application`)

| Method | Endpoint           | Auth    | Description           |
| ------ | ------------------ | ------- | --------------------- |
| POST   | `/apply`           | Private | Submit application    |
| GET    | `/my-status`       | Private | My status             |
| GET    | `/all`             | Admin   | All applications      |
| PATCH  | `/:id/approve`     | Admin   | Approve               |
| PATCH  | `/:id/reject`      | Admin   | Reject                |

### Admin (`/api/admin`)

| Method | Endpoint                  | Auth  | Description     |
| ------ | ------------------------- | ----- | --------------- |
| GET    | `/dashboard`              | Admin | Stats + charts  |
| GET    | `/users`                  | Admin | List users      |
| PATCH  | `/users/:id/ban`          | Admin | Ban user        |
| PATCH  | `/users/:id/unban`        | Admin | Unban user      |
| GET    | `/listings`               | Admin | All listings    |
| PATCH  | `/listings/:id/approve`   | Admin | Approve listing |
| PATCH  | `/listings/:id/reject`    | Admin | Reject listing  |
| GET    | `/bookings`               | Admin | All bookings    |

### Itineraries (`/api/itineraries`)

| Method | Endpoint                        | Auth    | Description                    |
| ------ | ------------------------------- | ------- | ------------------------------ |
| POST   | `/listing/:listingId/generate`  | Private | Public itinerary (1 free)      |
| POST   | `/:bookingId/generate`          | Private | Booking itinerary (max 3)      |
| GET    | `/:bookingId`                   | Private | Get booking itinerary          |
| PUT    | `/:id`                          | Private | Update itinerary content       |

### Refunds (`/api/refunds`)

| Method | Endpoint                 | Auth    | Description          |
| ------ | ------------------------ | ------- | -------------------- |
| POST   | `/:bookingId/initiate`   | Private | Initiate refund      |
| GET    | `/:bookingId/status`     | Private | Refund status        |
| GET    | `/`                      | Admin   | All refunds          |

### Recommendations (`/api/recommendations`)

| Method | Endpoint                    | Auth    | Description               |
| ------ | --------------------------- | ------- | ------------------------- |
| GET    | `/listing/:listingId`       | Public  | Similar + collaborative   |
| GET    | `/for-you`                  | Private | Personalized              |
| GET    | `/trending`                 | Public  | Top-rated                 |
| POST   | `/analytics`                | Public  | Track event               |
| POST   | `/preferences/update`       | Private | Rebuild preferences       |
| GET    | `/preferences`              | Private | Get preferences           |

---

## Real-Time Events (Socket.IO)

### Client → Server

| Event           | Payload                       | Description            |
| --------------- | ----------------------------- | ---------------------- |
| `join_room`     | `bookingId: string`           | Join chat room         |
| `join_user_room`| `userId: string`              | Join notification room |
| `send_message`  | `{ bookingId, senderId, text }` | Send message         |
| `typing`        | `{ bookingId, userName }`     | User typing            |
| `stop_typing`   | `{ bookingId }`               | Stopped typing         |

### Server → Client

| Event                | Payload            | Description             |
| -------------------- | ------------------ | ----------------------- |
| `receive_message`    | `Message` object   | New chat message        |
| `new_notification`   | `Notification`     | New notification        |
| `user_typing`        | `{ userName }`     | Other user typing       |
| `user_stopped_typing`| (none)             | Other user stopped      |

---

## Production Considerations

### Error Resilience
- `uncaughtException` + `unhandledRejection` handlers
- Graceful shutdown: HTTP → MongoDB → Redis
- Socket.IO error catch per event (`safeOn` wrapper)
- DB auto-reconnect with retries
- Global error handler in `middlewares/error.middleware.ts`
- Email/notification failures never block primary flow

### Rate Limiting
| Route               | Limit                    |
| ------------------- | ------------------------ |
| `/api/*`            | 100 req / 15 min         |
| `/api/auth/login`   | 10 req / 15 min          |
| `/api/payments/verify` | 20 req / 15 min       |

### Security
- Passwords: `select: false`, bcrypt 10 rounds
- JWT: 7-day expiry, verified on every protected route
- Zod validation on all mutation endpoints
- Admin self-ban prevention
- Razorpay HMAC SHA256 on webhooks + verify
- AI: `callWithRetry` with exponential backoff on 429/503

---

## Scripts

### Backend

```bash
npm run dev      # ts-node-dev with hot-reload
npm run build    # tsc compile
npm start        # node dist/server.js
npm run seed     # seed database
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # tsc + vite build
npm run preview  # Preview production build
```

---

## Key Models

### User
```
email, password (select: false), profile { name, profilePicture,
contactNumber, verified }, role (user|host|admin), banned,
wishlist [Listing], resetPasswordToken, resetPasswordExpire
```

### Listing
```
title, description, amenities [], price, category, locationName,
location { type: "Point", coordinates [lng, lat] }, images [],
host (ref User), status, blockedDates [Date],
cancellationPolicy (flexible|moderate|strict)
```

### Booking
```
listing (ref Listing), user (ref User), host (ref User),
checkIn, checkOut, totalPrice, status (pending|confirmed|
cancelled|completed), razorpayOrderId, razorpayPaymentId,
cancellationReason, refunded
```

### Review
```
listing (ref Listing), user (ref User), booking (ref Booking),
rating (1-5), comment, reply { text, createdAt }
```

### Message
```
booking (ref Booking), sender (ref User), receiver (ref User), text
```

### Notification
```
user (ref User), type, title, message, link, read
```

### HostApplication
```
user (ref User), fullName, email, phone, address, city, state,
idProofUrl, propertyType, reason, status (pending|approved|rejected),
adminNote, reviewedBy (ref User), reviewedAt
```

### Itinerary
```
user (ref User), booking? (ref Booking), listing (ref Listing),
location, totalDays, preferences { people, groupType, style,
budget }, content (markdown), version (1-3)
```
