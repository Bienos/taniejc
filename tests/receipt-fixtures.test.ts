import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {parseReceiptText, reconcileReceipt} from '../lib/receipt';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/receipts/${name}`, import.meta.url), 'utf8');

describe('synthetic Polish receipt layouts', () => {
  it('parses product, total, payment and change without including payment lines in reconciliation', () => {
    const receipt = parseReceiptText(fixture('zabka.txt'));
    expect(receipt.store).toBe('ŻABKA');
    expect(receipt.date).toBe('2026-10-19');
    expect(receipt.lines.map(row => row.kind)).toContain('payment');
    expect(reconcileReceipt(receipt.lines, receipt.total).differenceGrosz).toBe(0);
  });
  it('keeps discounts and deposits separate from the product subtotal', () => {
    const receipt = parseReceiptText(fixture('market.txt'));
    expect(receipt.lines.map(row => row.kind)).toEqual(['product', 'discount', 'deposit']);
    expect(reconcileReceipt(receipt.lines, receipt.total)).toMatchObject({itemTotalGrosz:349,recognizedTotalGrosz:349,differenceGrosz:0});
  });
  it('leaves invalid dates and unreadable total uncertain', () => {
    const receipt = parseReceiptText(fixture('uncertain.txt'));
    expect(receipt.date).toBe('');
    expect(receipt.total).toBe('');
    expect(receipt.lines).toEqual([]);
  });
});
