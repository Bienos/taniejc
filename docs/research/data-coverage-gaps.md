# Data coverage gaps

1. **No authorized supermarket price feeds**: most important launch blocker for dependable cross-retailer comparison. Pursue agreements with Biedronka, Lidl, Kaufland, Auchan, Carrefour or Frisco.
2. **Sparse community price observations**: Open Prices is user-contributed and may not have Polish data for a barcode or city. Absence does not mean the item is unavailable.
3. **Freshness**: this release treats observations within seven days as eligible for basket calculation, a conservative product policy, not a guarantee of current availability. Retailer prices can change sooner.
4. **Store locality**: Open Prices location fields can be incomplete. City and distance filters are not yet implemented; the selected city is a UI preference only.
5. **Catalog search**: Open Food Facts is not a universal Polish catalog and does not expose current full-text API search through the recommended v3 API. Search uses a legacy endpoint subject to low rate limits; results can be noisy or absent.
6. **Promotion terms**: current Open Prices records are not a reliable feed for loyalty-card, coupon, multi-buy, online-only, or historical price rules. No promotions are fabricated or displayed as offers.
7. **Delivery economics**: no delivery slot, fee, minimum order or availability data is integrated.
8. **Images**: source images may be missing, old, low-resolution or subject to attribution/share-alike and third-party constraints.
9. **Non-food and exact model matching**: Open Food Facts primarily serves packaged consumer food products; electronics depend on future licensed feeds and exact model identifiers.
10. **No account or sync**: lists are stored locally on one browser/device. No server-side accounts, alerts, shared links or cross-device sync yet.
