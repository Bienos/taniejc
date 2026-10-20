export type ReceiptLineKind = 'product' | 'discount' | 'deposit' | 'fee' | 'payment' | 'unknown';
export type ReceiptLine = {
  id: string;
  name: string;
  price: string;
  source?: 'ocr' | 'manual';
  kind?: ReceiptLineKind;
  quantity?: number;
  unitPrice?: string;
  barcode?: string;
  packageBase?: number;
  packageUnit?: 'g' | 'ml';
  confidence?: { name: number; price: number };
  confirmed?: boolean;
  matchItemId?: string;
  matchCode?: string;
  matchStatus?: 'suggested' | 'confirmed' | 'skipped';
  matchLabel?: string;
  matchConfidence?: number;
  matchReason?: string;
  matchTier?: 'exact' | 'same-product-different-size' | 'likely-equivalent' | 'similar' | 'none';
  matchProduct?: { code: string; name: string; brand: string; quantityBase?: number; quantityUnit?: 'g' | 'ml'; quantity?: string };
  matchPlannedGrosz?: number;
  matchPlannedOffer?: { priceGrosz: number; date: string; sourceUrl: string; retailer?: string };
  matchCandidates?: Array<{ itemId: string; label: string; confidence: number; tier: 'exact' | 'same-product-different-size' | 'likely-equivalent' | 'similar' | 'none'; reason: string }>;
};
export type ParsedReceipt = {
  store: string;
  date: string;
  total: string;
  lines: ReceiptLine[];
  fieldConfidence?: { store: number; date: number; total: number };
  fieldSource?: { store: 'ocr' | 'manual'; date: 'ocr' | 'manual'; total: 'ocr' | 'manual' };
};

function toInputDate(value: string) {
  const match = value.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return '';
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

const moneyMatch = (value: string) => value.match(/(-?\d{1,5}[,.]\d{2})\s*(?:zł|pln)?(?:\s+[A-Z])?\s*$/i);
const summaryPattern = /\b(suma|razem|do zap(?:ł|l)aty|total|got[oó]wka|karta|reszta|rabat|zni[zż]ka|sprzeda[zż]|paragon|nip|data|podatek|vat)\b/i;

function kindFor(name: string): ReceiptLineKind {
  const n = name.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/rabat|znizk|promocj|kupon/.test(n)) return 'discount';
  if (/kaucj|butelk|opakowanie zwrot|zwrotne/.test(n)) return 'deposit';
  if (/torb|reklamow|dostaw|oplata|uslug/.test(n)) return 'fee';
  if (/gotowka|karta|visa|mastercard|reszta|wydano/.test(n)) return 'payment';
  return 'product';
}

export function parseReceiptText(text: string): ParsedReceipt {
  const sourceLines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const normalizedLines = sourceLines.map((text) => ({ text, normalized: text.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '') }));
  const totalRow = normalizedLines.find(({ normalized }) => /\b(suma|razem|do zaplaty|total|naleznosc)\b/.test(normalized));
  const total = totalRow ? moneyMatch(totalRow.text)?.[1].replace(',', '.') ?? '' : '';
  const date = toInputDate(text);
  const storeLine = sourceLines.find((line) => line.length > 2 && line.length < 50 && !/\d{2,}/.test(line) && !/^(nip|paragon|fiskalny|data|ul\.?\s)/i.test(line));
  const store = storeLine ?? '';
  const storeLooksLikeMerchant = !!store && /\b(lidl|biedronka|kaufland|auchan|carrefour|zabka|żabka|rossmann|aldi|netto|dino|stokrotka|frisco|polomarket|lewiatan|abc|delikatesy)\b/i.test(store);
  const dateConfidence = date ? 0.85 : 0;
  const totalConfidence = total ? 0.8 : 0;
  const receiptLines: ReceiptLine[] = [];
  for (const line of sourceLines) {
    const normalized = line.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (summaryPattern.test(normalized) && !['discount', 'payment'].includes(kindFor(line))) continue;
    const priceMatch = moneyMatch(line);
    if (!priceMatch || priceMatch.index === undefined) continue;
    const rawName = line.slice(0, priceMatch.index).replace(/^[\s*+\d.:-]+/, '').replace(/\s+[A-Z]$/, '').trim();
    if (rawName.length < 2 || /^\d+$/.test(rawName)) continue;
    const kind = kindFor(rawName);
    const qtyMatch = rawName.match(/(?:^|\s)(\d+(?:[,.]\d+)?)\s*(?:x|szt\.?|kg|g|l|ml)\s*$/i);
    const quantity = qtyMatch ? Number(qtyMatch[1].replace(',', '.')) : undefined;
    const name = qtyMatch ? rawName.slice(0, qtyMatch.index).trim() || rawName : rawName;
    receiptLines.push({
      id: `receipt-${receiptLines.length}`,
      name,
      price: priceMatch[1].replace(',', '.'),
      source: 'ocr',
      kind,
      quantity,
      confidence: { name: name.length >= 3 ? 0.72 : 0.45, price: 0.75 },
      confirmed: false,
    });
  }
  return {
    store,
    date,
    total,
    lines: receiptLines,
    fieldConfidence: { store: storeLooksLikeMerchant ? 0.8 : store ? 0.4 : 0, date: dateConfidence, total: totalConfidence },
    fieldSource: { store: 'ocr', date: 'ocr', total: 'ocr' },
  };
}

export function reconcileReceipt(lines: ReceiptLine[], total: string) {
  const included = lines.filter((line) => (line.kind ?? 'product') === 'product' && /^\d+(?:[.,]\d{1,2})?$/.test(line.price.trim()));
  const itemTotalGrosz = included.reduce((sum, line) => sum + receiptAmountGrosz(line.price), 0);
  const chargeLines = lines.filter((line) => (line.kind ?? 'product') !== 'payment' && /^-?\d+(?:[.,]\d{1,2})?$/.test(line.price.trim()));
  const recognizedTotalGrosz = chargeLines.reduce((sum, line) => sum + receiptAmountGrosz(line.price), 0);
  const receiptTotalGrosz = /^\d+(?:[.,]\d{1,2})?$/.test(total.trim()) ? receiptAmountGrosz(total) : null;
  return { itemTotalGrosz, recognizedTotalGrosz, receiptTotalGrosz, differenceGrosz: receiptTotalGrosz === null ? null : receiptTotalGrosz - recognizedTotalGrosz, includedLineIds: included.map((line) => line.id), excludedLineIds: lines.filter((line) => !included.includes(line)).map((line) => line.id) };
}

export function receiptAmountGrosz(value: string) {
  const match = value.trim().replace(',', '.').match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error('Nieprawidłowa kwota paragonu');
  const amount = Number(match[2]) * 100 + Number((match[3] ?? '').padEnd(2, '0'));
  return match[1] ? -amount : amount;
}
