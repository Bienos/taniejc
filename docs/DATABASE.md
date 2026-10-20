# Database

The MVP has no server database; user lists remain in their browser. `db/schema.sql` is a PostgreSQL/Supabase starting schema for source observations, locations, normalized products, promotions, lists, and source job health. It is not applied by the app yet. Before enabling authenticated accounts, add Supabase Auth RLS policies, test policies as anonymous and signed-in users, and keep service credentials on the server only.

## Current device-local data

The app stores version 2 JSON under `taniej-local-v2` in browser local storage. It contains city, shopping-list items, saved products, receipts with field/line provenance and confirmed match snapshots, personal price entries in integer grosz, and local target alerts. A loader migrates the existing `taniej-*-v1` list, saved-product, receipt and city keys and sanitizes malformed records. Saving failures are surfaced in the interface. Clearing purchase history removes receipts, personal prices and alerts while retaining lists and saved products. Local storage is not encrypted and is not synchronized.
