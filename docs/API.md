# Application API

## `GET /api/search?q={text}&city={city}`

Searches Open Food Facts, then looks up community price observations for up to four returned barcodes. Returns `products`, `offers`, parsed query and coverage status. Upstream failures return HTTP 502 with a visible warning. Responses use five-minute Next fetch caching.

Offer fields include observation ID, source URL, price, currency, date, location/retailer label and product barcode. An observation is eligible for comparison only if it is no more than seven days old, is in PLN, and the source location identifies Poland.

## `GET /api/product/{code}`

Looks up a barcode through the public Open Food Facts v2 product endpoint and returns verified catalog fields when present. It does not return a price. Unknown barcodes return `product: null`; upstream failures return 502. Responses are cached for one hour.

## `GET /api/prices/{code}?city={city}`

Reads up to 20 observations for an exact product barcode from Open Prices, filters using the same freshness, duplicate, location, currency and unit-basis rules as search, and returns source-linked observations. It is used only for a user-requested personal-history comparison. It does not submit receipt prices.

## `POST /api/compare`

Body: `{ "items": [{ "name": "…", "quantity": 1, "product": { "code": "EAN" } }], "maxStores": 2, "city": "Warszawa" }`.

Returns the deterministic best combination among supplied offers, per-retailer subtotals, missing lines and a partial-coverage disclaimer. It re-reads Open Prices by barcode, ignores client-supplied amounts, and does not invent substitute prices. Up to 12 items can be compared in one request.
