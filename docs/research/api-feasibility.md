# API feasibility

## Integrations working in this application

- **Open Food Facts**: server-side read request to its public legacy search endpoint, returning product names, brands, package descriptions, barcode and image. It is catalog metadata, not a price list. The application sends a custom User-Agent and caches queries for five minutes. Search-as-you-type is intentionally not used. The official docs recommend v3 for product details, identify the legacy search endpoint, and document a 10 requests/minute search limit and 15 product reads/minute per IP.
- **Open Prices**: server-side read by returned product barcode. The app reads observations, retailer/location labels where available, currency, observation date, and discount flag. These are community observations; freshness is shown, records over seven days are excluded from optimization, and an observation is not proof of current shelf availability. API docs allow anonymous exploration; write endpoints require an account/token.
- **Open Food Facts product images**: shown only when an image URL is supplied by the catalog; attribution and image license caveats apply.

## Not integrated

The named retail chains and flyer aggregators do not have a documented public price feed confirmed in this review. Their public consumer sites are not authorization to scrape, rehost flyer artwork, or automate private mobile APIs. Blix terms describe their consumer functionality; Ding terms disclaim responsibility for flyer price accuracy. Neither is evidence of a third-party reuse license. Use a signed data/affiliate agreement or retailer-supplied feeds. Keep source URLs as outbound links until then.

Allegro has an official REST API; access is authorized, requires an application and OAuth credentials, and remains inactive because no credentials are configured. Ceneo documents an affiliate API, but access is restricted to users in its Affiliate Program and requires enrollment/account credentials. Obtain the partner terms and confirm price/product display rights before activating either integration.

## Rate, cache and failure behavior

The Next.js route caches upstream responses for five minutes. Search runs only on submit. A failed upstream call returns a visible error; no stale price is relabeled current and no synthetic offer is inserted. Production deployments should add request coalescing, per-user throttling, an application contact email in `User-Agent`, and an independently monitored scheduled importer before growth.

Sources: [Open Food Facts API usage](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/), [Open Prices API](https://prices.openfoodfacts.org/api/docs), [Open Prices API repository](https://github.com/openfoodfacts/open-prices).
