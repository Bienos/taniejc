# Known limitations

- No authorized Polish supermarket price catalog is connected. Open Prices observations are crowdsourced and sparse.
- Catalog search uses the Open Food Facts legacy search endpoint because official docs state full-text search is not available in the recommended v3 API; rate limits apply.
- No promotion feed, validity conditions, loyalty/coupon rules, store inventory, precise distance, delivery price, route or checkout integration.
- Basket math uses verified package prices and integer grosz. It rejects duplicate observations, category prices and non-package unit prices. Reported promotions with unknown conditions are excluded from basket totals; multi-buy rules, loyalty prices and substitutions are not modeled.
- City filtering compares the selected city with the Open Prices OSM city label. It is exact-match only; there is no radius or route calculation.
- Voice uses browser SpeechRecognition and may not exist or behave consistently across browsers. Polish recognition may depend on the browser's speech service and network; dictated entries still need review.
- Receipt capture runs Polish OCR locally with Tesseract.js. OCR output is an editable draft; receipt layouts, abbreviations, discounts and totals vary. The displayed confidence is Tesseract's overall confidence applied to fields, not independently calibrated confidence per word or amount. The first scan downloads the Polish OCR model and needs network access. Corrected receipts and confirmed matches stay in versioned browser local storage. Receipt images and OCR source text are discarded; there is no encrypted cloud backup or sync.
- Receipt matching uses deterministic barcode/name/brand/package signals, but name similarity can still suggest the wrong variant. Review the attributes and explicitly confirm every match. Planned-versus-paid subtotals include only confirmed matches and available eligible observations.
- Barcode lookup uses public Open Food Facts metadata, which may be incomplete. Camera scanning needs a secure context, camera permission and browser support for `BarcodeDetector`; manual barcode entry remains available.
- Personal target alerts are local reminders checked when the user asks the app to look up public observations. They do not run in the background or notify while the app is closed. Browser local storage is not encrypted and clearing browser data removes the local history.
- Lists, receipts, alerts and personal price history are local to one browser. There is no login, cloud sync, server-side user database, public sharing or automatic receipt-price contribution to Open Prices.
- PostgreSQL schema is a documented evolution path and is not connected to the running app.
