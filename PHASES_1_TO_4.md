# BioBazaar — Phase 1 + 2 + 3 + 4 package

This package builds on the existing MERN project and preserves the current API/store foundation.

## Phase 1 — Storefront and foundation
- Warm ivory, forest/sage green and terracotta editorial design system.
- Responsive storefront, category discovery, navigation and existing account/cart/wishlist/profile pages.
- Existing Express/Mongoose APIs and uploaded product images retained.
- Fixed the circular Redux/API import in `Biobazaar/src/api.js` and adjusted Helmet's resource policy so the frontend can display cross-origin images from the API.

## Phase 2 — Smart shopping
- Collection browsing with search, category, price and sorting filters.
- BioMatch preference chips and product shortlist comparison from the current catalogue.
- Product evidence fields are used only when supplied; missing details should remain unknown rather than being treated as proof of sustainability.
- Fixed the undefined `matchFiltered` reference and added `matchNeeds` to the filter memo dependencies.

## Phase 3 — Personal impact
- `/impact` (My impact) page for manually logging refill and reusable habits.
- Editable monthly intention and progress meter.
- Product-details count based on the current catalogue's supplied metadata.
- Data is stored in browser localStorage only; it is not order history, account-synced data, or a verified environmental impact calculation.

## Phase 4 — Admin and production foundations
- `/admin` admin console for listing products, editing sustainability evidence text, and deleting products.
- Backend access control is enforced by `ADMIN_USER_IDS` in `backend/.env`; the frontend route alone does not grant access.
- New product metadata fields: certification, ingredients/materials, packaging, reuse/refill, recycling and evidence notes.
- Security/resource policy adjustment for images and environment template for configuration.

## Required setup
1. Install Node.js 18+ and run MongoDB or configure a hosted MongoDB URI.
2. In `backend/`, copy `.env.example` to `.env`, then set `MONGO_URI`, a long random `JWT_SECRET`, and `CORS_WHITELIST` for your frontend origin.
3. To allow an admin, set `ADMIN_USER_IDS` to the exact authenticated user ID(s), comma-separated. Obtain the ID from the account data/JWT payload or `localStorage` only after verifying the account. Keep `.env` private. Restart the backend after changing it.
4. Run `npm install` and `npm run dev` in `backend/`.
5. In `Biobazaar/`, copy `.env.example` to `.env.local` if needed, set `VITE_API_BASE_URL=http://localhost:8001`, run `npm install`, then `npm run dev`.
6. Use `npm run build` inside `Biobazaar/` to create a production frontend build.

## Important production limitations
- The impact tracker is currently browser-local and manually entered. It does not read completed orders or calculate validated carbon/water savings.
- Admin account IDs are configured manually in the server environment; there is no admin role-management UI.
- The existing API's seller update/delete endpoints remain owner-scoped; admin moderation is provided through the new `/admin` endpoints.
- Review image records in MongoDB if any still reference missing files. The Helmet resource-policy change fixes cross-origin blocking for existing files, but it cannot restore a file that returns HTTP 404.
- Configure production `CORS_WHITELIST`, `MONGO_URI`, `JWT_SECRET`, API URL and hosting/rewrite rules before deployment.
- This package was assembled from the current Phase 1 + 2 checkpoint and extended with Phase 3 + 4 foundations. Environment-specific integration (MongoDB, admin IDs and deployment) still needs to be configured and tested on your machine.
