# Basket optimization

The server re-reads each product barcode from Open Prices, filters to the selected city, then enumerates eligible offer choices per line and selects the minimum integer-grosz total while respecting the maximum number of retailer labels. For this MVP's small user-created baskets this bounded search is simpler than an ILP dependency. Duplicate labels are treated as one retailer. If a line has no eligible offer, no complete solution is reported. Missing data is shown separately.

This version does not model promo mechanics, loyalty/coupon thresholds, package rounding, store distance, delivery, travel time, minimum orders, substitutions or multi-buy offers. Quantities currently multiply listed offer price; package sizing must be checked by the user. The application does not claim that quantity-weighted package costs are unit-normalized.
