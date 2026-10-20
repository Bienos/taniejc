import {describe, expect, it} from 'vitest';
import {packagesForRequestedAmount, suggestReceiptMatches} from '../lib/matching';

describe('receipt line matching', () => {
  it('suggests an exact normalized name but leaves it for confirmation', () => {
    const [match] = suggestReceiptMatches([{id:'r1',name:'Jogurt grecki 400 g',price:'4.50'}], [{id:'i1',name:'Jogurt grecki 400 g'}]);
    expect(match).toMatchObject({itemId:'i1',tier:'likely-equivalent',confidence:100});
    expect(match.reason).toContain('potwierdź');
  });
  it('does not match materially different package sizes as equivalent', () => {
    const [match] = suggestReceiptMatches([{id:'r1',name:'Ryż 500 g',price:'4.50'}], [{id:'i1',name:'Ryż 1 kg',product:{code:'1',name:'Ryż',quantity:'1 kg',quantityBase:1000,quantityUnit:'g'}}]);
    expect(match.tier).toBe('same-product-different-size');
    expect(match.itemId).toBeUndefined();
  });
  it('uses barcode identity only when codes match and calculates required packages safely', () => {
    expect(suggestReceiptMatches([{id:'r1',name:'unknown',price:'2',barcode:'5901234567890'}], [{id:'i1',name:'Tea',product:{code:'5901234567890',name:'Tea'}}])[0].tier).toBe('exact');
    expect(packagesForRequestedAmount(1000,400)).toBe(3);
    expect(packagesForRequestedAmount(1000,0)).toBeNull();
  });
});
