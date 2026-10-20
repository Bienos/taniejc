# Competitive analysis

## Current product context

- **Blix** and **Ding** expose Polish supermarket flyers and product discovery to consumers. Blix's terms list flyer browsing, product search and shopping lists. Ding's terms explain that retailers are responsible for flyer content, including price, availability and promotion validity. This supports the need to surface conditions and dates rather than imply guaranteed shelf price.
- **Gazetkowo** and **Gazetki.pl** are additional flyer-discovery destinations. Their presence does not establish a reusable data API.
- **Ceneo** and **Allegro** serve online product discovery/comparison use cases; official partner/API access and commercial permissions must be established for any import.
- **Open Food Facts / Open Prices** provide open community databases for product metadata and observations, rather than a complete current retail catalog.

## Product opportunity

The initial differentiated workflow is one search/list → inspect source-backed observations → compare only what is actually known. Basket optimization must not describe incomplete results as complete. The strongest future advantage depends on retailer-authorized store-level catalogs, normalized products and promotion terms, not on generating a chat interface.

## Limits

This is a source and product-scope review, not a feature-by-feature usability benchmark. Competitor pricing data and app behavior can change. Retailer and aggregator APIs were not presumed based on the consumer-facing sites.

References: [Blix regulations](https://blix.pl/p/regulamin/), [Ding service regulations](https://ding.pl/regulamin-serwisu.pdf), [Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/).

Commercial integration note: Allegro describes its REST API as an authorized way for external applications to access its resources; Ceneo documents an API for users of its Affiliate Program. Both are plausible later integrations after approval/partner enrollment and a terms review, not open anonymous price feeds.
