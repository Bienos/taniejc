import {describe, expect, it} from 'vitest';
import {parseReceiptText, reconcileReceipt} from '../lib/receipt';

describe('receipt OCR cleanup', () => {
  it('extracts editable item rows, merchant, date and total from Polish receipt text', () => {
    const parsed = parseReceiptText('ŻABKA\nul. Testowa 1\nData: 19.10.2026\nKawa 12,99 A\nJogurt grecki 4,50 A\nSUMA 17,49');
    expect(parsed.store).toBe('ŻABKA');
    expect(parsed.date).toBe('2026-10-19');
    expect(parsed.total).toBe('17.49');
    expect(parsed.lines.map(({name, price}) => [name, price])).toEqual([['Kawa', '12.99'], ['Jogurt grecki', '4.50']]);
  });

  it('leaves uncertain fields empty instead of inventing prices', () => {
    expect(parseReceiptText('SKLEP\nMleko\nRazem').lines).toEqual([]);
  });

  it('classifies deposits, discounts and fees so they do not inflate product subtotals', () => {
    const receipt = parseReceiptText('CARREFOUR\nJogurt naturalny 3,99 A\nKaucja butelka 0,50 A\nRabat aplikacja -1,00\nTorba reklamowa 0,40 A\nRazem 3,89');
    expect(receipt.lines.map((line) => line.kind)).toEqual(['product','deposit','discount','fee']);
    expect(reconcileReceipt(receipt.lines, receipt.total)).toMatchObject({itemTotalGrosz:399,recognizedTotalGrosz:389,receiptTotalGrosz:389,differenceGrosz:0});
  });

  it('flags date and store fields that the text does not support confidently', () => {
    const receipt = parseReceiptText('MARKET\nMleko 2,99 A\nSuma 2,99');
    expect(receipt.date).toBe('');
    expect(receipt.fieldConfidence?.date).toBe(0);
    expect(receipt.fieldConfidence?.store).toBe(0.4);
  });
});
