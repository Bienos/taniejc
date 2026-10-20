# Taniej

Mobile-first Polish shopping companion for product discovery, lists, and source-backed price observations. Search uses the Open Food Facts product catalog. Barcode-matched price observations come from Open Prices. Retailer-authorized price feeds are not yet connected, so the app reports missing data honestly.

## Run locally

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Search submits to a server route that calls public upstream APIs. A network connection is required for live catalog and observation lookups. Shopping lists, saved products, corrected receipts, confirmed personal prices and local alerts are stored in versioned browser local storage when available. Receipt OCR runs in the browser with Tesseract.js (`pol`); the first scan downloads and caches Polish OCR language data. The receipt photo is not sent to the app server or retained after the review screen closes. Check OCR values and each proposed receipt match before saving. Receipt photos and OCR text are not stored or uploaded. Barcode lookup reads Open Food Facts; camera scanning uses BarcodeDetector when supported, with manual code entry as fallback. Browser speech recognition is optional and depends on browser support and microphone permission.

## Build and test

```bash
npm test
npm run build
npm start
```

## Environment

No secrets are required for the current read-only Open Food Facts / Open Prices integrations. Do not put service credentials in `NEXT_PUBLIC_*` variables. Configure `APP_CONTACT_EMAIL` and update the User-Agent contact before production release. `DATABASE_URL` is not required yet; a PostgreSQL schema draft is in `db/schema.sql`.

## Current data scope

- Product metadata: Open Food Facts public catalog API.
- Community price observations: Open Prices API, matched by barcode.
- Retailer catalog and promotions: not connected. Use authorized feeds/agreements.
- Price comparison: only recent PLN observations from the dataset; all missing items remain visible. A result is partial if any basket line lacks an eligible observation.
- Receipt feedback loop: review Polish OCR, classify product/discount/deposit/fee/payment lines, match receipt products to the current list, confirm matches, compare matched planned cost to paid cost, and save private price history. Receipts and receipt prices are never sent to Open Prices.
- Personal history can show unit prices and a user-requested comparison with the latest eligible public observation. Local target alerts only evaluate when the user checks; no background notifications.
- Barcode lookup: scan on supported browsers or enter a code manually, verify Open Food Facts metadata, then attach it to the list or receipt review.
- See [source registry](docs/research/source-registry.md) and [known limitations](docs/KNOWN_LIMITATIONS.md).

## Deployment

Deploy as a standard Next.js Node application on Vercel or another Next.js host with outbound access to `world.openfoodfacts.org` and `prices.openfoodfacts.org`. Configure caching, request throttles, monitoring, and a contact email before opening access broadly. Add a PostgreSQL service only when server-side users or scheduled source imports are implemented.
