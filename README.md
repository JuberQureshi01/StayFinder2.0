# StayFinder 2.0

A full-stack vacation rental marketplace (Airbnb-style) built with **Express.js + TypeScript** (backend) and **React 18 + Vite + Redux Toolkit** (frontend). Features real-time chat with typing indicators, AI-powered itinerary generation (3 per booking), multi-level recommendation engine, complete Razorpay refund flow, host verification workflow, visual calendar availability, skeleton loaders, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (CommonJS) |
| **Backend Framework** | Express.js 5 (TypeScript) |
| **Database** | MongoDB (Mongoose 9) |
| **Cache** | Redis (ioredis) |
| **Real-Time** | Socket.IO |
| **Frontend** | React 18, Vite, TypeScript |
| **State** | Redux Toolkit |
| **Styling** | Tailwind CSS 3, Custom CSS variables |
| **Payments** | Razorpay |
| **AI** | Google Gemini (`gemini-2.0-flash` via `@google/genai`) |
| **Auth** | JWT + Google OAuth |
| **Email** | Nodemailer (Gmail SMTP) |
| **File Upload** | Multer (memory storage) + Cloudinary |
| **Validation** | Zod |
| **PDF Generation** | PDFKit |

---

## Project Structure

```
StayFinder2.0/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.ts              # App entry — Express + Socket.IO + cron
│       ├── config/
│       │   ├── db.ts              # MongoDB connection with auto-reconnect
│       │   ├── redis.ts           # Redis cache connection
│       │   ├── multer.ts          # Multer memory storage (5MB limit)
│       │   └── validations.ts     # Zod schemas for all routes
│       ├── middlewares/
│       │   ├── async.middleware.ts # Async error wrapper
│       │   ├── auth.middleware.ts  # JWT verify + role-based access
│       │   ├── cache.middleware.ts # Redis response caching
│       │   └── validate.middleware.ts # Zod request validation
│       ├── modules/
│       │   ├── admin/             # Admin dashboard, user/listing/booking mgmt
│       │   ├── auth/              # Register, login, Google OAuth, password reset
│       │   ├── booking/           # Create, cancel (full refund flow), user/host bookings
│       │   ├── chat/              # Real-time messaging per booking + typing indicator
│       │   ├── host-application/  # Host verification application flow
│       │   ├── itinerary/         # AI travel plan generation (public + booking-based, 3 max)
│       │   ├── listing/           # CRUD, search, geospatial, AI description, availability
│       │   ├── notification/      # CRUD + real-time push via Socket.IO
│       │   ├── payment/           # Razorpay orders, verification, refund webhooks
│       │   ├── recommendation/    # 4-level recommendation engine + analytics
│       │   ├── refund/            # Full refund tracking (processing/completed/failed)
│       │   ├── review/            # Create, update (48h window), listing reviews
│       │   └── user/              # Profile, wishlist, role upgrade
│       ├── services/
│       │   ├── ai.service.ts      # Gemini: descriptions, smart search, reviews, itinerary, recommendations
│       │   ├── cloudinary.service.ts # Image upload
│       │   ├── email.service.ts   # Invoice, password reset, refund confirmation emails
│       │   ├── notification.service.ts # DB + Socket push
│       │   ├── payment.service.ts # Razorpay refund initiation + fetch
│       │   ├── pdf.service.ts     # Invoice PDF generation
│       │   ├── recommendation.service.ts # Multi-level recommendation engine
│       │   └── socket.service.ts  # Socket.IO real-time events + typing indicator
│       ├── utils/
│       │   └── AppError.ts        # Structured error class
│       └── script/
│           └── seed.ts            # DB seed (admin user + sample data)
├── frontend/
│   ├── package.json
│   └── src/
│       ├── main.tsx               # Entry — Redux + Google OAuth
│       ├── App.tsx                # Router + ErrorBoundary + Navbar + Footer
│       ├── app/store.ts           # Redux store
│       ├── features/auth/         # authSlice (user, token, login/logout)
│       ├── services/
│       │   ├── apiFetch.ts        # Axios instance with auth interceptor
│       │   ├── paths.ts           # API URL constants
│       │   └── socket.ts          # Socket.IO client
│       ├── hooks/
│       │   └── useNotifications.ts # Real-time notification hook
│       ├── components/
│       │   ├── Navbar.tsx         # Navigation + user menu + wishlist badge
│       │   ├── Footer.tsx         # Site footer with links
│       │   ├── AuthModal.tsx      # Login/register modal (legacy, kept for inline prompts)
│       │   ├── ListingCard.tsx    # Listing card with image carousel
│       │   ├── ErrorBoundary.tsx  # React error boundary
│       │   ├── ProtectedRoute.tsx # Auth + role guard
│       │   ├── NotificationBell.tsx
│       │   ├── WishlistButton.tsx
│       │   ├── ReviewForm.tsx / ReviewModal.tsx / ReviewSummary.tsx
│       │   ├── SearchFilters.tsx
│       │   ├── AvailabilityCalendar.tsx  # Host date blocking/unblocking
│       │   ├── BookingDatePicker.tsx     # Guest visual date picker
│       │   ├── MapContainer.tsx
│       │   └── ui/               # shadcn primitives (button, card, dialog, skeleton, etc.)
│       └── pages/
│           ├── Home.tsx           # Hero + categories + recommended for you + skeleton loaders
│           ├── SearchPage.tsx     # Map + listing grid + filters + skeleton loaders
│           ├── ListingDetails.tsx # Full listing + booking calendar + reviews + similar stays + public AI itinerary
│           ├── Trips.tsx          # User bookings + cancel modal + AI itinerary (3 generations)
│           ├── Login.tsx          # Dedicated login/signup page (split layout)
│           ├── Wishlist.tsx       # Saved listings + skeleton loaders
│           ├── Chat.tsx           # Real-time messaging + typing indicator bubbles
│           ├── Profile.tsx        # User profile settings
│           ├── BecomeHost.tsx     # Host application form / status + skeleton loaders
│           ├── CreateListing.tsx  # Host: create new listing
│           ├── EditListing.tsx    # Host: edit listing + availability calendar + skeleton loaders
│           ├── HostDashboard.tsx  # Host: earnings chart + KPIs + recent bookings + skeleton loaders
│           ├── HostBookings.tsx   # Host: booking management + cancel modal
│           ├── ForgotPassword.tsx
│           ├── ResetPassword.tsx
│           └── admin/
│               ├── AdminDashboard.tsx  # Revenue chart + booking chart + category stats + skeleton loaders
│               ├── AdminUsers.tsx      # User CRUD + ban/unban + skeleton loaders
│               ├── AdminListings.tsx   # Listing moderation + skeleton loaders
│               ├── AdminBookings.tsx   # Booking monitor + skeleton loaders
│               └── AdminHosts.tsx      # Host application review + skeleton loaders
└── .env.example
```

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/stayfinder

# Redis
REDIS_URL=redis://default:<pass>@<host>:<port>

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

**Frontend** `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Redis (optional — cache degrades gracefully)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm run seed             # creates admin user + sample listings
npm run dev              # starts on :5000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev              # starts on :5173
```

### Default Admin Credentials (after seed)

```
Email:    admin@stayfinder.com
Password: Password123!
```

---

## Feature Flows

### 1. Authentication & Authorization

**Backend flow:**
1. User sends `POST /api/auth/register` with `{ name, email, password }`
2. Zod middleware validates input, hashes password with bcrypt (10 rounds)
3. Mongoose saves user, JWT signed with `{ id, role }` (expires 7d)
4. Response: `{ token, data: { id, email, role, name, wishlist } }`
5. Login (`/auth/login`) selects `+password` (field is `select: false`), compares bcrypt hash
6. Google OAuth (`/auth/google`): verifies Google ID token via `google-auth-library`, creates user if new, issues JWT
7. Password reset: `POST /auth/forgot-password` generates crypto token, saves SHA256 hash + 10min expiry, sends email. `PUT /auth/reset-password/:token` hashes URL token, compares, saves new password.

**Auth middleware:**
- Extracts `Bearer` token, decodes JWT
- Fetches user (only `_id email role banned profile.verified`) — lightweight query
- Checks `user.banned` — rejects with 403 if true
- `authorizeRoles(...roles)` checks `req.user.role` is in allowed list
- Host routes additionally require `req.user.profile.verified === true` — unverified hosts get 403

**Frontend:**
- `authSlice` stores `user` + `token` in Redux + localStorage
- `apiFetch.ts` interceptor auto-attaches `Authorization: Bearer <token>` header
- On 401 response, interceptor auto-dispatches `logout()`, clears storage, redirects to `/`
- `ProtectedRoute.tsx` checks `isAuthenticated` and optional `allowedRoles` array
- Dedicated `/login` page with split layout (rose gradient hero + form card); AuthModal kept for inline prompts

### 2. Listing Search & Discovery

**Public `GET /api/listings`** supports:
- `lng, lat, radius` — geospatial `$near` query (sorted by distance)
- `category` — exact match (default "Trending")
- `search` — regex on `title` (case-insensitive)
- `minPrice, maxPrice` — range filter
- `amenities` — `$all` match (comma-separated)
- `page, pageSize` — pagination (+ count with `$geoWithin` alternative for safe counting)
- **Redis cache**: 300s TTL via `cacheInterceptor` middleware. Responses serialized to JSON, served from RAM on hit.

**AI Smart Search** `POST /api/listings/smart-search`: sends natural language prompt to Gemini → extracts structured JSON `{ location, minPrice, maxPrice, amenities }` → executes MongoDB query.

**`GET /api/listings/:id`**: populates `host` (name, email), cached 300s.

### 3. Booking Flow

**Creation** `POST /api/bookings/create`:
- Requires: `{ listingId, checkIn, checkOut }`
- Validates checkOut > checkIn via Zod `.refine()`
- Checks listing exists, host !== guest
- Checks no overlapping confirmed booking (date range intersection query)
- Calculates `totalPrice = listing.price * nights` (all-inclusive, no hidden fees)
- Status: `"pending"` until payment

**Payment flow:**
1. `POST /api/payments/create-order` → Razorpay `orders.create({ amount, currency: "INR" })` → returns `order_id`
2. Frontend opens Razorpay checkout with `order_id`
3. On success, `POST /api/payments/verify` → Razorpay signature verification (HMAC SHA256)
4. Booking status → `"confirmed"`, invoice PDF emailed, notification sent to host
5. Razorpay webhook (`POST /api/payments/webhook`) handles async events (raw body middleware before `express.json`)
6. Cancel: `PATCH /api/bookings/:id/cancel` → full refund flow (see Refund Flow below)
7. Auto-complete: cron job runs at midnight, sets `status: "completed"` for bookings where `checkOut <= today`

**Host cancellation** `PATCH /api/bookings/:id/host-cancel`:
- Host-initiated cancellation with full refund to guest
- Releases blocked dates on listing
- Refund notification + email sent to guest

**Booking statuses**: `pending → confirmed → completed` (auto-completed via cron)

### 4. Cancel & Refund Flow (Production-Level)

```
User clicks Cancel → Confirmation modal → PATCH /bookings/:id/cancel
  → Validate ownership (403 if not owner)
  → Validate status (completed/cancelled = 400)
  → Check refunded flag (prevents double refund)
  → Calculate days until check-in → Lookup listing's cancellationPolicy
  → Compute refundAmount + deductionAmount via policy rules
  → Call Razorpay API with exact refund amount (in paise)
  → Update booking: status="cancelled", refunded=true
  → Release blocked dates on listing (removes booking date range)
  → Create Refund record (status="processing")
  → NOTIFY user (refund amount, 5-7 business days)
  → EMAIL user (HTML table: booking ID, refund amount, refund ID)
  → NOTIFY host (booking cancelled at their listing)
  → Webhook → refund.processed → Refund.status="completed" + notify user
  → Webhook → refund.failed → Refund.status="failed" + notify user to contact support
```

**Cancellation Policy Rules:**

| Policy | 7+ days before | 3-7 days before | 1-3 days before | <24h |
|--------|---------------|----------------|----------------|------|
| **Flexible** | 100% | 50% | 0% | 0% |
| **Moderate** | 100% | 50% | 50% | 0% |
| **Strict** | 50% | 25% | 0% | 0% |

**Refund models:**
- `Refund`: `{ booking, user, paymentId, originalAmount, refundAmount, deductionAmount, cancellationPolicy, status (processing/completed/failed), razorpayRefundId, processedAt, failedAt, failureReason }`
- `Booking.refunded: boolean` — prevents duplicate refunds at database level

**Frontend (Trips.tsx):**
- "Cancel Booking" button shown only for `confirmed` bookings
- Confirmation modal: warning text + "Keep Booking" / "Yes, Cancel" buttons
- Result modal: refund breakdown table (Original Amount / Refund Amount / Deduction / Policy)
- Loading spinner during cancellation

### 5. Reviews

- `POST /api/reviews/:listingId` — requires booking ownership + `status: "confirmed"` or `"completed"`
- `booking` field is mandatory on Review schema (prevents ghost reviews)
- Zod validation: `rating` (1-5), `comment` (10-1000 chars)
- Update within 48h via `PUT /api/reviews/:id` (ownership + time window check)
- Delete only by review author or admin
- Listing's `rating` and `numReviews` calculated via aggregation pipeline on write
- AI review summary: `GET /api/reviews/listing/:listingId/summary` → Gemini analyzes all reviews

**Frontend behavior (ListingDetails.tsx):**
- If user already reviewed → shows "Your Review" card with edit button
- If no review yet → shows inline "Write a Review" form with star rating + comment
- User's review is filtered out from the "All Reviews" list to avoid duplication

### 6. Wishlist

- `POST /api/users/wishlist/:listingId` — toggles listing ID in user's `wishlist` array
- `GET /api/users/wishlist` — returns populated listing cards (title, price, location, images, rating)
- Redux `user.wishlist.length` displayed as badge on Navbar heart icon

### 7. Real-Time Chat + Typing Indicator

**Socket.IO** on main server (no separate namespace):

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `bookingId: string` | Join chat room |
| `join_user_room` | `userId: string` | Join personal notification room |
| `send_message` | `{ bookingId, senderId, text }` | Send chat message |
| `typing` | `{ bookingId, userName }` | User is typing |
| `stop_typing` | `{ bookingId }` | User stopped typing |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `Message` object | New chat message |
| `new_notification` | `Notification` object | New notification |
| `user_typing` | `{ userName }` | Other user is typing |
| `user_stopped_typing` | (none) | Other user stopped typing |

**Message flow:**
1. Each booking is a room identified by `bookingId`
2. Messages stored in `Message` model `{ booking, sender, receiver, text }`
3. Receiver identified by comparing `senderId` against `booking.user/host`
4. Messages populated with sender name on send
5. `send_message` also emits `new_notification` to receiver's user room

**Typing indicator flow (frontend Chat.tsx):**
1. On every keystroke, emits `typing` with `{ bookingId, userName }`
2. 2-second inactivity timer: on expiry, emits `stop_typing`
3. Listens for `user_typing`/`user_stopped_typing` events
4. Shows typing bubble with 3 bouncing dots

### 8. Host Verification Flow

1. **User applies** at `/become-host`: fills form (name, email, phone, address, city, state, property type, reason, ID proof via multer → Cloudinary). `POST /api/host-application/apply`
2. **Admin reviews** at `/admin/hosts`: three tabs (Pending/Approved/Rejected), approve → sets `role: "host"` + `profile.verified: true`, reject → sets admin note
3. **Status pages**: No application → form; Pending → "Under Review"; Approved → redirect to `/host/dashboard`; Rejected → shows admin note + "Submit New"
4. **Route protection**: `authorizeRoles("host")` checks `req.user.profile?.verified === true`

### 9. Admin Panel

Protected behind `authorizeRoles("admin")`:
- **Dashboard** (`/admin`): 5 KPI cards + monthly revenue area chart + booking bar chart + category stats
- **Users** (`/admin/users`): search, role filter, pagination, ban/unban
- **Listings** (`/admin/listings`): approve/reject listings, pagination
- **Bookings** (`/admin/bookings`): filter by status, pagination
- **Hosts** (`/admin/hosts`): three tabs, approve/reject, download ID proof

### 10. Host Dashboard

Protected behind `authorizeRoles("host", "admin")`:
- 4 KPI cards: Total Earnings, Active Properties, Total Bookings, Pending Reservations
- SVG Earnings Area Chart: monthly revenue trend with gradient fill
- Summary sidebar: This Month, Best Month, Average/Month, Bookings/Month
- Monthly Breakdown table
- Recent Bookings section (5 latest) with guest avatars, status badges, price
- Create/Edit/Delete listings

### 11. AI Itinerary Generator

**Public (listing-based) generation** `POST /api/itineraries/listing/:listingId/generate`:
- 1 free itinerary per property per user
- Blocks if user has a booking for this property (redirects to Trips page)
- Returns `limitReached: true` on repeat call (shows saved itinerary)
- Body: `{ people, groupType, style, budget, days }`

**Booking-based generation** `POST /api/itineraries/:bookingId/generate`:
- Booked users can generate up to **3 versions** per booking
- Each regeneration increments `version` (1→2→3)
- Blocked with error message when max reached
- Body: `{ people, groupType, style, budget, days }`

**Frontend (Trips.tsx):**
- Clicking "AI Itinerary" opens **generation form modal** with fields: people, group, style, budget, days (pre-filled from booking)
- Shows "Regenerations left: N/3" badge
- Submit → loading → opens **beautified view modal** with gradient header, ReactMarkdown, sticky "Regenerate" bar
- Manual edit via `PUT /api/itineraries/:id`

**Frontend (ListingDetails.tsx):**
- Clicking "Generate AI Itinerary" opens generation form modal
- Non-booked users: 1 free, shows "Free plan" badge when limit reached
- After generation, shows saved itinerary in view modal

**Itinerary model:** `{ user, booking?, listing, location, totalDays, preferences, content (markdown), version }`

### 12. Recommendation Engine (4-Level)

**Level 1 — Geospatial Nearby:** `$near` GeoJSON query within 50km.

**Level 2 — Content-Based Scoring:** category (+30), same city (+25), shared amenities (+8 each, max 25), price proximity (+15/+10/+5).

**Level 3 — Collaborative Filtering:** users who booked this listing → aggregated by co-occurrence count.

**Level 4 — User Preference Personalization:** `UserPreference` model built from booking history. Falls back to trending.

**Redis Caching:**
| Cache Key | TTL |
|-----------|-----|
| `recommend:similar:{listingId}` | 10 min |
| `recommend:foryou:{userId}` | 10 min |
| `recommend:trending` | 20 min |
| `recommend:collab:{listingId}` | 20 min |

**AI Enhancement:** Gemini generates short recommendation explanation text.

### 13. Calendar Availability UI

**Backend — `GET /api/listings/:id/availability`:**
Returns unavailable dates merged from:
1. `listing.blockedDates` — manually blocked by host
2. Dates covered by `confirmed`/`completed` bookings

**Host view (AvailabilityCalendar.tsx):** Month grid, click to toggle blocked dates, rose indicators.
**Guest view (BookingDatePicker.tsx):** 2-month side-by-side, gray unavailable dates, range highlighting, legend.

### 14. Host Listing Management

- **CreateListing.tsx**: Title, description, price, category, location (Mapbox geocoder), amenities (toggle), images (up to 10, Cloudinary), AI description generator
- **EditListing.tsx**: Pre-populated form + image management + AvailabilityCalendar
- `cancellationPolicy`: `"flexible" | "moderate" | "strict"`

### 15. Skeleton Loaders

| Component | Usage |
|-----------|-------|
| `Skeleton` | Base `animate-pulse` gray block |
| `SkeletonCard` | Listing card skeleton |
| `SkeletonTable` | Configurable admin table |
| `SkeletonChart` | 12-column bar chart |
| `SkeletonKPICard` | KPI metric card |
| `SkeletonReviewCard` | Review skeleton |
| `SkeletonLineGroup` | `n` progressively shorter lines |

Every page with async data uses matching skeleton loaders.

---

## Theme

The app uses a minimal black/white theme with gray-900 as the primary brand color:

| Element | Style |
|---------|-------|
| Primary buttons | `bg-gray-900 text-white rounded-xl` |
| Input fields | `rounded-xl border-gray-200 focus:border-gray-900` |
| Cards | `rounded-2xl border-gray-200 shadow-sm` |
| Modals | `rounded-3xl shadow-2xl` |
| AI features | `from-indigo-600 to-purple-600` gradient accent |
| Notifications/badges | `bg-rose-500` accent |
| Page background | `bg-gray-50` (alternating with white) |

---

## API Reference

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Create account |
| POST | `/login` | Public | Login |
| POST | `/google` | Public | Google OAuth |
| GET | `/profile` | Private | Get profile |
| POST | `/logout` | Private | Logout |
| POST | `/forgot-password` | Public | Send reset email |
| PUT | `/reset-password/:token` | Public | Reset password |

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Private | Get full profile |
| PUT | `/profile` | Private | Update name + avatar |
| GET | `/wishlist` | Private | Get populated wishlist |
| POST | `/wishlist/:listingId` | Private | Toggle wishlist |
| PUT | `/become-host` | Private | Upgrade to host (legacy) |

### Listings (`/api/listings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Search + filter + geospatial |
| POST | `/smart-search` | Public | AI natural language search |
| GET | `/:id` | Public | Listing detail |
| POST | `/create` | Host/Admin | Create listing |
| PUT | `/:id` | Host/Admin | Update listing |
| DELETE | `/:id` | Host/Admin | Delete listing |
| POST | `/ai-description` | Host/Admin | Generate AI description |
| GET | `/host` | Host/Admin | My listings |
| GET | `/analytics/earnings` | Host/Admin | Earnings data |
| GET | `/:id/blocked-dates` | Private | Get blocked dates |
| POST | `/:id/blocked-dates` | Host/Admin | Toggle blocked date |
| GET | `/:id/availability` | Public | All unavailable dates |

### Bookings (`/api/bookings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | Private | Create booking |
| GET | `/` | Private | My trips |
| GET | `/host` | Host | Host's bookings |
| GET | `/:id` | Private | Booking detail |
| PATCH | `/:id/cancel` | Private | Cancel booking (full refund) |
| PATCH | `/:id/host-cancel` | Host/Admin | Host cancel (full refund) |
| GET | `/chat/:bookingId` | Private | Get chat messages |

### Payments (`/api/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-order` | Private | Create Razorpay order |
| POST | `/verify` | Private | Verify payment signature |
| POST | `/cancel` | Private | Cancel pending payment |
| POST | `/webhook` | Public | Razorpay webhook (refund events) |

### Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listing/:listingId` | Public | Listing reviews |
| POST | `/:listingId` | Private | Create review |
| PUT | `/:id` | Private | Update review (48h window) |
| DELETE | `/:id` | Private | Delete review |
| POST | `/:id/reply` | Host | Host reply to review |
| GET | `/listing/:listingId/summary` | Public | AI review summary |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Private | Get notifications |
| PATCH | `/:id/read` | Private | Mark one read |
| PATCH | `/read-all` | Private | Mark all read |

### Host Applications (`/api/host-application`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/apply` | Private | Submit application |
| GET | `/my-status` | Private | My application status |
| GET | `/all` | Admin | All applications |
| PATCH | `/:id/approve` | Admin | Approve application |
| PATCH | `/:id/reject` | Admin | Reject application |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Admin | Stats + charts |
| GET | `/users` | Admin | List users |
| PATCH | `/users/:id/ban` | Admin | Ban user |
| PATCH | `/users/:id/unban` | Admin | Unban user |
| GET | `/listings` | Admin | All listings |
| PATCH | `/listings/:id/approve` | Admin | Approve listing |
| PATCH | `/listings/:id/reject` | Admin | Reject listing |
| GET | `/bookings` | Admin | All bookings |

### Itineraries (`/api/itineraries`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/listing/:listingId/generate` | Private | Public itinerary (1 free) |
| GET | `/listing/:listingId` | Private | Get saved public itinerary |
| POST | `/:bookingId/generate` | Private | Booking itinerary (max 3) |
| GET | `/:bookingId` | Private | Get booking itinerary |
| PUT | `/:id` | Private | Update itinerary content |

### Refunds (`/api/refunds`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/:bookingId/initiate` | Private | Initiate refund |
| GET | `/:bookingId/status` | Private | Get refund status |
| GET | `/` | Admin | All refunds |

### Recommendations (`/api/recommendations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listing/:listingId` | Public | Similar + collaborative |
| GET | `/for-you` | Private | Personalized by user history |
| GET | `/trending` | Public | Top-rated listings |
| POST | `/analytics` | Public | Track view/click/booking |
| POST | `/preferences/update` | Private | Rebuild preferences |
| GET | `/preferences` | Private | Get user preferences |

---

## Real-Time Events (Socket.IO)

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `bookingId: string` | Join chat room |
| `join_user_room` | `userId: string` | Join notification room |
| `send_message` | `{ bookingId, senderId, text }` | Send chat message |
| `typing` | `{ bookingId, userName }` | User is typing |
| `stop_typing` | `{ bookingId }` | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `Message` object | New chat message |
| `new_notification` | `Notification` object | New notification |
| `user_typing` | `{ userName }` | Other user typing |
| `user_stopped_typing` | (none) | Other user stopped typing |

---

## Production Considerations

### Error Resilience
- `uncaughtException` + `unhandledRejection` handlers (no `process.exit()`)
- SIGTERM/SIGINT: graceful shutdown (HTTP → MongoDB → exit)
- Socket.IO `safeOn()` catches errors, emits `"error"` to client
- DB: auto-reconnect with 5 retry limit + exponential backoff
- Cron job (midnight auto-complete) wrapped in try/catch
- Multer errors return 400 with user-friendly messages
- Lazy factory pattern (`getAI()`, `getRazorpay()`) — services init on first call
- Notification/email/analytics failures never block primary flow

### Rate Limiting
- Global: 100 requests per 15-minute window per IP
- Uses `express-rate-limit`

### CORS
- Reads `ALLOWED_ORIGINS` from env (comma-separated)
- `*` disables credentials; specific origins enable credentials

### Security
- Password: `select: false`, bcrypt 10 rounds
- JWT: 7-day expiry, verified on every protected route
- Zod validation on all mutation endpoints
- Admin self-ban prevention
- Host routes require `profile.verified === true`
- All secrets via env vars
- Razorpay HMAC SHA256 on webhooks + payment verify
- AI API: `callWithRetry` with exponential backoff on 429/503; fallback generated locally when quota exhausted

---

## Scripts

### Backend
```bash
npm run dev      # ts-node-dev with hot-reload
npm run build    # tsc compile
npm start        # node dist/server.js
npm run seed     # seed database with admin + sample data
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
email, password (select: false), profile { name, profilePicture, contactNumber, verified },
role (user|host|admin), banned, wishlist [Listing], resetPasswordToken, resetPasswordExpire
```

### Listing
```
title, description, amenities [], price, category, locationName,
location { type: "Point", coordinates [lng, lat] },
images [], host (ref User), status (pending|approved|rejected),
blockedDates [Date], cancellationPolicy (flexible|moderate|strict)
```

### Booking
```
listing (ref Listing), user (ref User), host (ref User),
checkIn, checkOut, totalPrice, status (pending|confirmed|cancelled|completed),
razorpayOrderId, razorpayPaymentId, cancellationReason, refunded
```

### Refund
```
booking (ref Booking), user (ref User), paymentId,
originalAmount, refundAmount, deductionAmount, cancellationPolicy,
reason, status (processing|completed|failed),
razorpayRefundId, processedAt, failedAt, failureReason
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
user (ref User), type (booking_confirmed, booking_cancelled, new_message,
  new_booking, review_received, refund_processed, refund_failed),
title, message, link, read
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
location, totalDays, preferences { people, groupType, style, budget },
content (markdown), version (1-3, increments on regenerate)
```

### UserPreference
```
user (ref User, unique), cities [], categories [], amenities [],
avgBudget, priceRange { min, max }
```

### RecommendationAnalytics
```
user (ref User), listing (ref Listing), recommendedListing (ref Listing),
source (home|listing_details|booking_success|trips|wishlist),
action (view|click|booking), sessionId
```
#   S t a y F i n d e r 2 . 0  
 