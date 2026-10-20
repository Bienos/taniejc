export const LOCAL_STATE_KEY = 'taniej-local-v2';
export type LocalSnapshot = { version: 2; city: string; items: unknown[]; saved: unknown[]; receipts: unknown[]; prices: unknown[]; alerts: unknown[] };
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const records = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row)) : [];
const itemsOnly = (value: unknown) => records(value).filter((row) => typeof row.id === 'string' && typeof row.name === 'string').map((row) => ({ ...row, quantity: Number.isSafeInteger(row.quantity) && Number(row.quantity) > 0 ? Number(row.quantity) : 1, offers: Array.isArray(row.offers) ? row.offers.filter((offer) => !!offer && typeof offer === 'object' && Number.isFinite((offer as any).price) && typeof (offer as any).date === 'string') : [], product: row.product && typeof row.product === 'object' && typeof (row.product as any).code === 'string' && typeof (row.product as any).name === 'string' ? row.product : undefined }));
const productsOnly = (value: unknown) => records(value).filter((row) => typeof row.code === 'string' && typeof row.name === 'string').map((row) => ({ code: row.code, name: row.name, brand: typeof row.brand === 'string' ? row.brand : '', quantity: typeof row.quantity === 'string' ? row.quantity : '', quantityBase: Number.isFinite(row.quantityBase) ? row.quantityBase : undefined, quantityUnit: row.quantityUnit === 'g' || row.quantityUnit === 'ml' ? row.quantityUnit : undefined, image: typeof row.image === 'string' ? row.image : '', sourceUrl: typeof row.sourceUrl === 'string' ? row.sourceUrl : '' }));
const receiptsOnly = (value: unknown) => records(value).filter((row) => typeof row.id === 'string' && typeof row.store === 'string' && Array.isArray(row.lines)).map((row) => ({ ...row, date: typeof row.date === 'string' ? row.date : '', total: typeof row.total === 'string' ? row.total : '', fieldSource: { store: (row.fieldSource as any)?.store === 'ocr' ? 'ocr' : 'manual', date: (row.fieldSource as any)?.date === 'ocr' ? 'ocr' : 'manual', total: (row.fieldSource as any)?.total === 'ocr' ? 'ocr' : 'manual' }, lines: records(row.lines).filter((line) => typeof line.id === 'string' && typeof line.name === 'string' && typeof line.price === 'string').map((line) => ({ ...line, source: line.source === 'ocr' ? 'ocr' : 'manual' })) }));
const pricesOnly = (value: unknown) => records(value).filter((row) => typeof row.id === 'string' && typeof row.productCode === 'string' && Number.isSafeInteger(row.paidGrosz) && Number(row.paidGrosz) >= 0);
const alertsOnly = (value: unknown) => records(value).filter((row) => typeof row.productCode === 'string' && Number.isSafeInteger(row.targetGrosz) && Number(row.targetGrosz) > 0);
function readJson(storage: StorageLike, key: string) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as unknown;
  } catch { return undefined; }
}

function safeGet(storage: StorageLike, key: string) {
  try { return storage.getItem(key); } catch { return null; }
}

export function loadLocalSnapshot(storage: StorageLike): LocalSnapshot {
  const current = readJson(storage, LOCAL_STATE_KEY);
  if (current && typeof current === 'object' && (current as any).version === 2) {
    const value = current as any;
    return { version: 2, city: typeof value.city === 'string' ? value.city : 'Warszawa', items: itemsOnly(value.items), saved: productsOnly(value.saved), receipts: receiptsOnly(value.receipts), prices: pricesOnly(value.prices), alerts: alertsOnly(value.alerts) };
  }
  return {
    version: 2,
    city: safeGet(storage, 'taniej-city-v1') || 'Warszawa',
    items: itemsOnly(readJson(storage, 'taniej-list-v1')),
    saved: productsOnly(readJson(storage, 'taniej-saved-v1')),
    receipts: receiptsOnly(readJson(storage, 'taniej-receipts-v1')),
    prices: pricesOnly(readJson(storage, 'taniej-personal-prices-v1')),
    alerts: alertsOnly(readJson(storage, 'taniej-alerts-v1')),
  };
}

export function saveLocalSnapshot(storage: StorageLike, snapshot: LocalSnapshot) {
  try { storage.setItem(LOCAL_STATE_KEY, JSON.stringify({ ...snapshot, version: 2 })); return true; } catch { return false; }
}

export function clearPrivatePurchaseData(storage: StorageLike) {
  try {
    const snapshot = loadLocalSnapshot(storage);
    return saveLocalSnapshot(storage, { ...snapshot, receipts: [], prices: [], alerts: [] });
  } catch { return false; }
}
