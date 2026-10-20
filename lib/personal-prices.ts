import { decimalToGrosz, unitPriceGrosz } from './products';
import type { ReceiptLine } from './receipt';

export type PersonalPrice = {
  id: string;
  receiptId: string;
  receiptLineId: string;
  productCode: string;
  productName: string;
  brand: string;
  packageQuantity?: number;
  packageUnit?: 'g' | 'ml';
  paidGrosz: number;
  unitPriceGrosz?: number;
  store: string;
  date: string;
  source: 'confirmed-receipt';
};

export function makePersonalPrice(input: { receiptId: string; line: ReceiptLine; productCode: string; productName: string; brand?: string; packageBase?: number; packageUnit?: 'g' | 'ml'; store: string; date: string }): PersonalPrice {
  const paidGrosz = decimalToGrosz(input.line.price);
  const base = input.packageBase;
  const unitPrice = base && input.packageUnit ? unitPriceGrosz(paidGrosz / 100, base, input.packageUnit) : undefined;
  return { id: `${input.receiptId}:${input.line.id}`, receiptId: input.receiptId, receiptLineId: input.line.id, productCode: input.productCode, productName: input.productName, brand: input.brand ?? '', packageQuantity: base, packageUnit: input.packageUnit, paidGrosz, unitPriceGrosz: unitPrice, store: input.store, date: input.date, source: 'confirmed-receipt' };
}

export function priceHistoryFor(prices: PersonalPrice[], productCode: string) {
  return prices.filter((price) => price.productCode === productCode).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function targetPriceReached(latestPublicGrosz: number | undefined, targetGrosz: number | undefined) {
  return Number.isSafeInteger(latestPublicGrosz) && Number.isSafeInteger(targetGrosz) && (latestPublicGrosz as number) <= (targetGrosz as number);
}
