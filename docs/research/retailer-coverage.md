# Retailer coverage

## Confirmed runtime coverage

| Source | Catalog | Price observations | Retailer/store identity | Current status |
|---|---|---|---|---|
| Open Food Facts | Packaged-food catalog, barcode, brand, package description, optional image | None | None | Connected live |
| Open Prices | Product lookup by barcode | Community-entered price observations and dates | OSM location labels when present | Connected live; sparse coverage; no retailer feed |

## Retailer coverage plan

The sources listed below are not currently connected to a retailer-authorized catalog. “No live coverage” applies to this release, even when a public consumer website, flyer or delivery checkout exists.

- Grocery: Biedronka, Lidl, Kaufland, Auchan, Carrefour, Frisco, Aldi, Netto, Dino, Stokrotka, Żabka.
- Flyer aggregators: Blix, Ding, Gazetkowo, Gazetki.pl.
- Drugstores: Rossmann, Hebe.
- Electronics and marketplaces: Media Expert, RTV Euro AGD, MediaMarkt, Ceneo, Allegro.

No aggregate national coverage claim is made. Price records from Open Prices are not a substitute for current retailer catalogs. The UI says “Brak aktualnej ceny” where a product has no recent observation and labels the feature as partial.

## Next coverage steps

1. Ask each retailer/aggregator for a documented feed, allowed fields, permitted retention, location granularity, refresh limits, promotion terms, images, attribution, and commercial rights.
2. Start with one grocery partner with store-level prices and campaign rules, and one electronics affiliate feed for exact-model offers.
3. Track freshness and failed feeds per source; require source URLs and observed timestamps for every offer.
4. Add coverage percentages by product and municipality only after feed completeness can be measured.
