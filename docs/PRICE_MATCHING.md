# Price and product matching

The first catalog lookup is performed by Open Food Facts text search. Barcode is the stable key for Open Prices lookups. Search candidates are presented as catalog matches, not asserted as equivalent supermarket offers. Package quantity is shown as supplied by the catalog; nutrition/fat attributes and fuzzy confidence scoring are not yet implemented. Electronics model matching is not supported.

Prices retain their source URL and observed date. Only PLN `PRODUCT` records within seven days, with package-level `price_per=UNIT`, no duplicate marker, and a Polish OSM location can appear as usable observations. A selected city is matched exactly against the OSM city label. This is a local eligibility policy and does not confirm that a retailer still honors the price. Reported discount prices are displayed with conditions marked unknown and excluded from basket optimization. Price amounts are converted to integer grosz before total calculation.

This does not establish that observations are accurate at the point of sale. Open Prices is a community-contributed dataset with its own validation, duplicate detection and outlier processes; we preserve the observation date and link to the record. A licensed retailer feed or a fresh receipt/shelf proof is needed for stronger current-price claims.
