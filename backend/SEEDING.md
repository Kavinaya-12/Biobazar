# Development product samples

The development seeder defines 80 fictional listings: 20 each in Foods, PersonalCare, Household, and Lifestyle. `sample-products/price-comparison-demo.csv` assigns illustrative classifications and package sizes to these fictional records so the showcase can demonstrate fair comparison groups. **These values are fabricated demo data, not factual product claims, and must never be used for real products or copied into a production catalogue.** It reuses existing Product and User models and does not create or modify users or sellers.

## Configure and review

In `backend/.env`, explicitly configure all of the following for the development database. Do not copy production credentials or point these settings at production:

```dotenv
NODE_ENV=development
MONGO_URI=<leave your existing URI unchanged; its database path must be Updatedbiobazaar>
DEV_SEED_MONGODB_HOST=<exact hostname from your existing MONGO_URI>
DEV_SEED_DATABASE_NAME=Updatedbiobazaar
DEV_SEED_OWNER_EMAIL=your-existing-development-account@example.test
DEV_SEED_ALLOW_UPDATEDBIOBAZAAR=true
```

Set DEV_SEED_OWNER_EMAIL to an existing account in the target development database. The seeder reads its ID for the required Product.userId only. NODE_ENV=development remains mandatory. Hostname and database name are checked against MONGO_URI, and the connected database name is checked after connecting. The opt-in permits only the exact, case-sensitive name Updatedbiobazaar; it does not relax the existing dev/development-name rule for any other database. The script prints the host and database name but never URI credentials. It asks you to type SEED Updatedbiobazaar before writing.

From the repository root, review the target and planned inserts without writing:

```powershell
Set-Location .\backend
npm run seed:products:dev -- --dry-run
```

After reviewing that output and verifying the target is your development database, run:

```powershell
npm run seed:products:dev
```

The dry-run reports per-category and total counts for records that would be inserted and existing fictional samples whose comparison fields need refreshing. It connects read-only to inspect the selected account and sample IDs; it performs no writes. The write command requires the exact interactive confirmation above. The 80 sample IDs are fixed and unique; the eight original IDs are retained. The seeder refuses ID/SKU conflicts, inserts missing sample records, and refreshes only `productCategory`, `productType`, `packageQuantity`, and `packageUnit` on existing records where both the stable ID and fictional SKU match. It also corrects only stale synthetic descriptions that explicitly say package size is missing. It does not change sample prices, stock, images, ownership, names, or any other fields, and never targets non-sample records.

The sample listings, their price-comparison classifications and package quantities, and their unique title/category-labelled SVG illustrations are fictional development data, not real products, product photography, verified package sizes, certifications, seller claims, or environmental evidence. The display migration below continues to update only the targeted name and image fields; it never creates or deletes products or updates other fields.

## Update the existing 80 sample names and images

Existing records may still contain the old `[DEV SAMPLE]` name prefix and repeated category photos. Review the targeted migration first. It matches each product by both the fixed sample ID and its `BB-DEV-SAMPLE-*` SKU, then changes only its name and image to the current fictional display values. A conflicting SKU stops the run before writes. It uses the same development environment, host/database match, exact `Updatedbiobazaar` opt-in, and interactive target confirmation as the seeder.

```powershell
Set-Location .\backend
npm run migrate:products:display:dev -- --dry-run
```

If the dry-run reports the expected development database and the number of sample records to update, run the migration and type the exact `MIGRATE Updatedbiobazaar` confirmation when prompted:

```powershell
npm run migrate:products:display:dev
```

This migration is safe to rerun: it only sets the same sample display names and generated SVGs, and skips records that already match. It is not run automatically by the seeder or application.

## Verify in the app

Start the backend and frontend using the existing project commands, then open `/collections` and refresh. The 80 listings should appear, 20 in each category. Category pages remain `/collections/foods`, `/collections/personalcare`, `/collections/household`, and `/collections/lifestyle`. Their custom SVGs are fictional illustrations, not product photographs or verified claims.
