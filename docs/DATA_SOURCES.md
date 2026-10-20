# Data sources

Runtime: Open Food Facts product search and Open Prices read-only observations. See [research source registry](research/source-registry.md), [API feasibility](research/api-feasibility.md), [coverage](research/retailer-coverage.md), and [license notes](research/data-licensing.md).

Retailer or flyer pages are outbound links only. No retailer pricing, flyer image extraction, hidden mobile API use, or delivery prices are included. Open-source data attribution must remain visible and its ODbL obligations must be reviewed before combining it with licensed retailer data.

Receipt-derived amounts are private user-entered observations held only in local browser storage. The app never submits them to Open Prices. The user may request a read-only exact-barcode Open Prices lookup to compare personal paid history with an eligible public observation; the response keeps the observation date, location, price basis and source link visible. Barcode metadata is fetched through the public Open Food Facts product endpoint and is presented for user verification.
