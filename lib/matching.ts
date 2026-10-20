import { normalizePolish } from './products';
import type { ReceiptLine } from './receipt';

type Matchable = { id: string; name: string; product?: { code: string; name: string; brand?: string; quantity?: string; quantityBase?: number; quantityUnit?: 'g' | 'ml' } };
export type MatchSuggestion = { receiptLineId: string; itemId?: string; tier: 'exact' | 'same-product-different-size' | 'likely-equivalent' | 'similar' | 'none'; confidence: number; reason: string; candidates: Array<{ itemId: string; label: string; confidence: number; tier: MatchSuggestion['tier']; reason: string }> };

function tokens(value: string) {
  const stop = new Set(['produkt', 'spozywczy', 'szt', 'sztuk', 'sztuki', 'opak', 'opakowanie', 'kg', 'g', 'ml', 'l']);
  return new Set(normalizePolish(value).split(' ').filter((token) => token.length > 1 && !stop.has(token) && !/^\d/.test(token)));
}

function textSize(value: string) {
  const match = normalizePolish(value).match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/);
  if (!match) return undefined;
  const unit = match[2];
  return { base: Number(match[1].replace(',', '.')) * (unit === 'kg' || unit === 'l' ? 1000 : 1), unit: unit === 'l' || unit === 'ml' ? 'ml' : 'g' };
}

function rank(line: ReceiptLine, item: Matchable) {
  if (line.barcode && item.product?.code && line.barcode === item.product.code) return { tier: 'exact' as const, confidence: 100, reason: 'Zgodny kod kreskowy.' };
  const itemText = [item.name, item.product?.brand, item.product?.name, item.product?.quantity].filter(Boolean).join(' ');
  const left = normalizePolish(line.name);
  const right = normalizePolish(itemText);
  const a = tokens(line.name);
  const b = tokens(itemText);
  const common = [...a].filter((token) => b.has(token)).length;
  const overlap = common / Math.max(1, Math.min(a.size, b.size));
  const union = new Set([...a, ...b]).size;
  const jaccard = common / Math.max(1, union);
  const receiptSize = line.packageBase ? { base: line.packageBase, unit: line.packageUnit } : textSize(line.name);
  const productSize = item.product?.quantityBase && item.product.quantityUnit ? { base: item.product.quantityBase, unit: item.product.quantityUnit } : textSize(itemText);
  if (receiptSize && productSize && receiptSize.unit === productSize.unit && Math.abs(receiptSize.base - productSize.base) / Math.max(receiptSize.base, productSize.base) > 0.05) {
    return { tier: 'same-product-different-size' as const, confidence: Math.round(Math.min(overlap, jaccard) * 100), reason: `Rozmiar różni się: paragon ${receiptSize.base}${receiptSize.unit}, lista ${productSize.base}${productSize.unit}.` };
  }
  if (left === right || (overlap === 1 && a.size >= 2)) return { tier: 'likely-equivalent' as const, confidence: Math.round(Math.max(88, overlap * 100)), reason: 'Nazwa po normalizacji jest zgodna; potwierdź wzrokowo.' };
  if (overlap >= 0.72 && jaccard >= 0.45) return { tier: 'likely-equivalent' as const, confidence: Math.round(58 + overlap * 34), reason: `Zgodne słowa: ${common}/${Math.max(1, a.size)}; sprawdź markę i wariant.` };
  if (overlap >= 0.35) return { tier: 'similar' as const, confidence: Math.round(35 + overlap * 35), reason: 'Część nazwy pasuje, ale wariant może być inny.' };
  return { tier: 'none' as const, confidence: 0, reason: 'Brak wystarczających wspólnych cech.' };
}

export function suggestReceiptMatches(lines: ReceiptLine[], items: Matchable[]): MatchSuggestion[] {
  return lines.filter((line) => (line.kind ?? 'product') === 'product').map((line) => {
    const candidates = items.map((item) => ({ item, ...rank(line, item), label: [item.product?.brand, item.product?.name || item.name, item.product?.quantity].filter(Boolean).join(' · ') })).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    const best = candidates[0];
    const chosen = best && best.confidence >= 65 && best.tier !== 'same-product-different-size' ? best : undefined;
    return { receiptLineId: line.id, itemId: chosen?.item.id, tier: best?.tier ?? 'none', confidence: chosen?.confidence ?? best?.confidence ?? 0, reason: best?.reason ?? 'Lista zakupów jest pusta.', candidates: candidates.map(({ item, tier, confidence, reason, label }) => ({ itemId: item.id, tier, confidence, reason, label })) };
  });
}

export function packagesForRequestedAmount(amountBase: number, packageBase: number) {
  if (!Number.isFinite(amountBase) || amountBase <= 0 || !Number.isFinite(packageBase) || packageBase <= 0) return null;
  return Math.ceil(amountBase / packageBase);
}
