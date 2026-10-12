# BioBazaar — The Smart Sustainable Marketplace

BioBazaar is being redesigned as a thoughtful, modern sustainable marketplace. The new visual direction uses warm ivory, forest green, sage and terracotta, with editorial typography and natural product photography.

## Current redesign checkpoint

- Replaced the old homepage with a responsive editorial storefront.
- Introduced the new BioBazaar brand header, navigation and mobile menu.
- Added category discovery, a smart-shopping introduction, product listing integration and a newsletter UI placeholder.
- Kept the existing React Router, Redux store and Express/Mongoose backend as the foundation.
- Added safe environment templates and setup documentation.

The homepage uses live products from the existing Redux product store when the API responds. The editorial category cards are fallback navigation, not claims about actual inventory. Phase 2 includes evidence-aware product detail filtering and comparison; Phase 3 adds a personal, browser-local habit tracker; Phase 4 adds a server-authorised admin console for product evidence records and moderation.

## Project structure

- `Biobazaar/` — React + Vite frontend
- `backend/` — Express API and MongoDB models/routes
- `backend/uploads/` — existing uploaded product images
- `backend/private-uploads/` — private seller verification files; never served as static content
- `.env.example` — environment variable template

## Requirements

- Node.js 18 or newer
- npm
- MongoDB local instance or a MongoDB connection string

## Run locally

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Edit `backend/.env` and set `MONGO_URI` and `JWT_SECRET` for your own environment. Never share or commit the real `.env` file.

### 2. Configure the frontend

In a second terminal:

```bash
cd Biobazaar
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. The frontend API defaults to `http://localhost:8001`; override it with `VITE_API_BASE_URL` in `Biobazaar/.env.local` if needed.

### 3. Build the frontend

```bash
cd Biobazaar
npm run build
```

## Four-phase roadmap

1. **Foundation and design:** finish the shared visual system and restyle shop, category, product, auth, cart, wishlist and profile experiences while retaining useful API behaviour.
2. **Smart shopping:** evidence-aware Bio Score, BioCompare, personalised BioMatch, alternatives and basket suggestions.
3. **Personal impact:** purchase history, goals, refill/reuse tracking and clearly labelled estimates based on available data.
4. **Admin and production:** product/evidence management, permissions, tests, deployment configuration and operational documentation.

## Phase 3 — Personal impact

Open **My impact** after signing in. Refill/reusable actions and the monthly intention are saved to local browser storage. They are not connected to order history or synced to an account. Counts represent user-entered habits; the app does not estimate verified carbon, water or lifecycle savings.

## Phase 4 — Admin console and Seller Hub

Admin access is enforced by the backend against the registered user's MongoDB `role`. Public registration always creates a regular user. To promote an existing account, first register it and configure `backend/.env`, then run from the repository root:

```bash
cd backend
npm run promote-admin -- your-registered-email@example.com
```

The command requires `MONGO_URI` in `backend/.env`, only updates a matching existing account, and can be safely rerun. Then sign in again and open `/admin`; seller application review is at `/admin/sellers`. The frontend route is for navigation only; every admin API checks the current database role.

Seller applications and product management are available from the signed-in header. Applicants remain customers; only server-approved profiles can use seller product endpoints. Seller documents are stored outside public `/uploads`. Order, payment, earnings, refunds, and payouts are not operational because this repository has no checkout/order/payment system. Seller finance screens state this directly and do not report fake transactions or balances. See [SELLER_MARKETPLACE.md](SELLER_MARKETPLACE.md) for the current API, security boundary, payment-provider prerequisites, testing, and production checklist.

## Important notes

- The project includes practical Phase 1–4 foundations, but production deployment, automated tests, order-linked impact reporting, analytics and full role-management still require project-specific setup and verification.
- Sustainability scoring must disclose its criteria, missing data and limitations. It must not imply third-party certification unless verified.
- AI keys belong on the server and must never be placed in frontend code.
- The project ZIP intentionally excludes `.env`, `.git`, `node_modules` and build output.
