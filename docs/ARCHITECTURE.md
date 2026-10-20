# Architecture

- Next.js App Router provides a responsive server-rendered shell and two server routes.
- `/api/search` queries Open Food Facts and reads Open Prices observations by barcode. It normalizes upstream results into a small response shape and uses five-minute Next data caching.
- `/api/compare` receives client-selected offers, applies deterministic integer-grosz arithmetic and returns missing lines explicitly. `/api/product/{code}` resolves public Open Food Facts barcode metadata and `/api/prices/{code}` reads eligible Open Prices observations for an explicit history check.
- The client uses versioned browser local storage for lists, saved products, corrected receipts, confirmed personal price history and local target alerts. Receipt images and OCR text are not persisted. No account, receipt or purchase history is sent to a backend.
- `lib/products.ts` owns Polish query normalization, quantity parsing, currency formatting and basket calculation.
- `db/schema.sql` is an evolution schema for licensed/ingested data and future accounts, not yet wired into runtime.

Receipt matches use deterministic barcode/name/brand/package signals, remain suggestions until the user confirms them, and only confirmed catalog products create personal price-history entries. Barcode camera scanning uses the browser `BarcodeDetector` when available; manual EAN entry is the fallback. Open Prices receipt comparisons are read-only and user initiated.

No LLM is used. Product search is upstream catalog search; query parsing is deterministic. Speech recognition stays in the browser where supported.
