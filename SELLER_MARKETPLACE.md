# BioBazaar Seller Hub and Marketplace Boundary

## Existing architecture

- `backend/` is a CommonJS Express 4 API using Mongoose 8. `Biobazaar/` is a React 18/Vite application using React Router 6, Redux Toolkit, and a shared Axios API client.
- The existing routes are mounted at `/user`, `/profile`, `/cart`, `/wishlist`, `/products`, and `/admin` (there is no `/api` prefix in this application).
- Authentication uses a bearer JWT. The verified payload contains `user_id`; seller identity is always derived from that value, never from browser-submitted owner IDs.
- Admin authorization uses the existing `ADMIN_USER_IDS` server allowlist. The React link is not authorization.
- `Product.userId` already references `User`; `Cart` references the customer and products. `User` has no seller role. Seller profile status is separate, so an approved seller remains a customer.
- No Order, Payment, refund, payout, commission, or ledger model/route existed. The existing Cart Checkout button is a presentation-only toast and local Redux clear, not a checkout API. No payment provider SDK was installed.

## Implemented seller capabilities

- Separate SellerProfile application records with type-specific details, draft/pending/action-required/approved/rejected/suspended states, agreement version acceptance history, private verification-document metadata, review fields, and payout setup status.
- AdminAuditLog records for approve/reject/suspend/reinstate decisions. Admin decisions require the existing admin allowlist; rejection and suspension require a reason.
- Verification documents accept PDF/JPEG/PNG up to 5 MB each, are checked against file signatures, saved outside the public uploads tree, and served only to the document owner or an allowlisted admin. `backend/private-uploads/` is ignored by Git.
- Seller product operations are owner-scoped and require an approved profile. Inputs are allowlisted; client-provided seller IDs, ownership, payment status, commission, and moderation fields are not accepted. Product image upload accepts JPEG/PNG/WebP up to 5 MB and checks file signatures. Stock quantity is seller-managed metadata only; checkout does not decrement or reserve stock.
- Product gains optional seller profile, SKU, inventory quantity, shipping details, and status fields. Existing products with no `sellerProfile` or `status` remain discoverable as legacy products. New seller-managed products appear in public discovery only while published and their seller is approved. Editing or archiving an owned legacy product after approval adopts it into that seller profile rather than deleting it.
- Seller dashboard product counts are derived from owned products. Sales, order, commission, earnings, and payout balances are deliberately not fabricated.

## Route table

All endpoints below use the existing backend mount paths.

| Method and route | Authorization | Behavior |
|---|---|---|
| `GET /seller/me` | Authenticated | Current applicant profile and server agreement version |
| `POST /seller/applications` | Authenticated | Create/save an application draft; optional private document upload |
| `PATCH /seller/applications/draft` | Authenticated | Save a draft or requested changes on rejected/action-required applications |
| `GET /seller/applications/status` | Authenticated | Applicant's own status |
| `POST /seller/applications/submit` | Authenticated | Validated draft submission; requires current agreement and verification document by default |
| `POST /seller/applications/resubmit` | Authenticated | Resubmit a rejected or action-required application after updates |
| `GET /seller/documents/:storageKey` | Owner or admin allowlist | Private document download; otherwise `403` |
| `GET /seller/dashboard` | Approved seller | Product counts and explicit commerce-not-configured state |
| `PATCH /seller/settings` | Approved seller | Update store display name, description, and seller contact details only |
| `GET /seller/products` | Approved seller | Paginated owned products; optional status filter |
| `POST /seller/products` | Approved seller | Create an owned product |
| `GET /seller/products/:id` | Approved seller + owner | Read an owned product |
| `PATCH /seller/products/:id` | Approved seller + owner | Update allowlisted listing fields |
| `DELETE /seller/products/:id` | Approved seller + owner | Archive, never hard-delete, seller-managed listing |
| `PATCH /seller/products/:id/inventory` | Approved seller + owner | Set nonnegative integer inventory |
| `GET /seller/orders`, `GET /seller/orders/:id`, `PATCH /seller/orders/:id/fulfilment` | Approved seller | `503 MARKETPLACE_COMMERCE_NOT_CONFIGURED`; no order data exists |
| `GET /seller/earnings/summary`, `GET /seller/earnings/transactions` | Approved seller | `503 MARKETPLACE_COMMERCE_NOT_CONFIGURED`; no financial ledger exists |
| `GET /seller/payouts` | Approved seller | Current `setup_required` status, no bank/payment details returned |
| `POST /seller/payouts/onboarding` | Approved seller | `503`; no provider onboarding is initiated |
| `GET /admin/session` | Authenticated admin allowlist | Admin navigation capability check |
| `GET /admin/seller-applications` | Authenticated admin allowlist | Filtered, paginated application queue |
| `GET /admin/seller-applications/:id` | Authenticated admin allowlist | Application, related product count, and audit history |
| `PATCH /admin/seller-applications/:id/review` | Authenticated admin allowlist | Approve, reject, suspend, or reinstate with validated state transitions |
| Existing `POST /products/sell`, `PUT /products/:id`, `DELETE /products/:id` | Authenticated, approved seller; owner for mutation | Kept for the existing product form; new writes require approval |

The admin evidence console remains at `/admin`; seller application review is integrated into its existing admin navigation at `/admin/sellers`.

## Data and compatibility

- Added `SellerProfile` and `AdminAuditLog`. `SellerProfile.userId` is unique; status and creation time are indexed. Store slug is unique. Audit records index entity and actor lookup.
- Extended Product with optional `sellerProfile`, `sku`, `inventoryQuantity`, `shippingDetails`, and lifecycle `status`. Existing documents need no immediate destructive migration; records without seller fields are handled as legacy published listings.
- Mongoose creates configured indexes on startup according to the deployment's index policy. For production, review index creation against the actual MongoDB dataset and use a controlled migration if automatic index creation is disabled.
- Cart and User schemas/authentication are unchanged. No Order/Payment/Payout models were added because there is no verified checkout lifecycle to populate them from.
- Inventory is not decremented or reserved by the current Cart API. No order is accepted by this implementation.

## Payments, commission, and payout status

**Not implemented and not live.** No customer payment creation, signature verification, webhook handler, order creation, commission ledger, refund operation, or payout transfer exists. The UI and API report setup-required/503 states rather than simulating success. There are no Razorpay secrets or provider account IDs in `.env.example`.

Razorpay Route is the evaluated India-first marketplace product, not standard single-merchant Checkout. Current official documentation says Route uses Linked Accounts and its India access has eligibility and compliance prerequisites. The Route overview lists minimum turnover of more than ₹40 lakh domestic or more than ₹5 lakh export in FY25/FY26, plus payer-payee transparency evidence reviewed by Razorpay. Linked Accounts require business/contact and settlement destination details, KYC and bank-account verification (including penny testing); transfer initiation requires a 24-hour linked-account cooling period, and direct transfers must be enabled for the platform account. Transfers-via-order are INR-only in the cited documentation and require captured/paid provider orders and transfer webhooks. Account approval, applicable current terms, and implementation details must be confirmed directly with Razorpay before launch.

Official references:

- [Razorpay Route overview and eligibility](https://razorpay.com/docs/payments/route/)
- [Razorpay Linked Accounts and KYC](https://razorpay.com/docs/payments/route/linked-account)
- [Razorpay transfers to Linked Accounts](https://razorpay.com/docs/payments/route/transfer-funds-to-linked-accounts)
- [Razorpay Linked Account refunds](https://razorpay.com/docs/payments/route/linked-account/initiate-refund)

Before activation, implement a real server-side Razorpay adapter and provider-approved Route flow, test credentials, order/payment association, raw-body webhook signature validation, unique provider event/idempotency keys, retries/out-of-order webhooks, captured-payment reconciliation, reversals, partial/full refund reconciliation, and payout status reconciliation. Store provider secrets only in the deployment secret manager. The existing MongoDB connection does not establish that transactions are available; production checkout should require a replica set/sharded deployment with tested transaction support or a separately reviewed idempotent outbox/compensation design.

### Proposed accounting contract (not active code)

Use integer paise and explicit `INR` for any future order and ledger record. Snapshot item title/SKU, quantity, unit price, discounts, taxes/shipping allocations, seller ID, commission policy/rate, and calculated amounts when creating the order. A ₹1,000 commissionable item subtotal at a configured 10% rate yields ₹100 platform commission and ₹900 seller amount before other adjustments. This is an example only, not a configured BioBazaar fee.

Define policy explicitly before implementation: allocate discounts before commission; identify whether tax/shipping are commissionable; record provider/payment fees separately; calculate partial refunds against original item/discount/tax allocation; reverse prior seller/platform ledger entries instead of rewriting history; never allow a seller to set totals, commission, payment status, or refund state. Use unique payment/webhook/refund/transfer IDs and idempotency keys. Reserve inventory atomically before payment, expire and release timed-out reservations, decrement only under server control, and compensate reservation/order state for failed or late payment callbacks.

## Environment and local commands

New backend variables (safe values shown in `backend/.env.example`):

- `SELLER_ALLOWED_COUNTRIES=IN` — comma-separated seller registration country codes. Defaults to India; the same configured list is returned to the form and enforced at submission.
- `SELLER_DOCUMENT_REQUIRED=true` — submission requires at least one verification file unless explicitly disabled for a controlled test environment.
- `SELLER_AGREEMENT_VERSION=2026-01` — server-owned version stored with acceptance; changing it requires fresh consent.
- `SELLER_LOW_STOCK_THRESHOLD=5` — display threshold only; it does not reserve stock.
- `PRIVATE_UPLOAD_DIR=` — optional absolute path outside the public web root; default is `backend/private-uploads/seller-verification`.

The linked agreement file is explicitly a working draft: `Biobazaar/public/seller-agreement-2026-01.html`. Legal review and jurisdiction-specific approved terms are required before production applications are accepted.

```powershell
cd backend
npm install
npm test
npm run dev
```

```powershell
cd Biobazaar
npm install
npm run build
npm run dev
```

The backend has no configured database fixture/integration test harness. `npm test` runs Node's built-in unit tests and does not claim MongoDB or browser integration coverage. Production frontend build verifies JSX/module resolution only.

## Manual QA checklist

- Register a normal customer; confirm customer shopping remains available and Seller Hub offers Apply to Sell.
- Save an incomplete individual draft, reload, and confirm it persists without gaining seller permissions.
- Save a registered-business draft with required legal/registration details; test malformed email, missing address, unsupported country, and missing verification file.
- Upload valid and mismatched PDF/image signatures; confirm private documents are not available under `/uploads` and are downloadable only by owner/admin.
- Submit a valid application; confirm status is pending and direct product APIs return `403`.
- As an authorized admin, inspect an application, download its document, request more information with a note, reject with a reason, approve a pending application, suspend an approved seller, and reinstate a suspended seller. Confirm each action appears in audit history.
- As approved seller A, create/edit/archive products and change inventory. As seller B, try seller A's product IDs and confirm no data access. Try forged `userId`, `sellerProfile`, payment, and review fields and confirm they are ignored.
- Confirm published approved-seller products appear in Shop All/category pages; drafts/archived products and suspended sellers' products do not. Confirm legacy products remain visible.
- Confirm orders/earnings/payout views show setup-required errors and never claim a successful payment, order, refund, or payout.
- Re-run customer product discovery, add/remove cart and wishlist items, profile, and admin evidence flows.

## Deployment checklist and unfinished work

- HTTPS everywhere; configure exact frontend origins in `CORS_WHITELIST`; set high-entropy `JWT_SECRET`; configure `ADMIN_USER_IDS` with controlled account IDs; review rate limits and production request logging for PII.
- Persist private verification files in durable encrypted private storage with backup, retention, access audit, malware scanning, and deletion/retention policy. The current local private directory is not an object-storage lifecycle solution.
- Legal review seller agreement, privacy notice, accepted document types, retention, country coverage, business/tax requirements, seller terms, shipping/consumer obligations, and applicant appeal flow.
- Confirm Razorpay Route eligibility/account approval, Linked Account KYC/penny testing, transfer features, settlement rules, refund responsibilities, webhook endpoint/signing secret, and payout permissions with Razorpay.
- Enable MongoDB replica-set/sharded transactions or formally approve and test a retry-safe outbox/compensation design before orders/payments. Test concurrent inventory reservation and callback retries.
- Implement Order/OrderItem snapshots, customer order history, multi-seller fulfillment grouping, stock reservations/restoration, actual provider checkout, webhook payment truth, commission policies/ledger, partial/full refunds, payout requests/transfers, reconciliation, and dispute handling.
- Add Mongo-backed integration tests, payment-provider test-mode tests, frontend component/route tests, and deployment smoke tests. Existing backend unit tests do not cover HTTP/database integration; the repository has no frontend test runner.
- Add admin workflows for product moderation and commission policies, seller settings editing, operational email/status notifications, and privacy-safe customer shipping detail access once orders exist.
