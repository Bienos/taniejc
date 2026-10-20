import {describe, expect, it} from 'vitest';
import {makePersonalPrice, priceHistoryFor, targetPriceReached} from '../lib/personal-prices';

describe('private receipt price history', () => {
  it('stores actual paid price and package-normalized unit price in grosz', () => {
    const price = makePersonalPrice({receiptId:'r',line:{id:'l',name:'Mleko',price:'4.99'},productCode:'5900000000000',productName:'Mleko 1 l',packageBase:1000,packageUnit:'ml',store:'Lidl',date:'2026-10-20'});
    expect(price).toMatchObject({paidGrosz:499,unitPriceGrosz:499,source:'confirmed-receipt'});
  });
  it('filters history by exact barcode and sorts newest first', () => {
    const records = ['2026-10-01','2026-10-20'].map((date,index)=>makePersonalPrice({receiptId:String(index),line:{id:'l',name:'Mleko',price:'4.99'},productCode:'5900000000000',productName:'Mleko',store:'Market',date}));
    expect(priceHistoryFor(records,'5900000000000')[0].date).toBe('2026-10-20');
    expect(priceHistoryFor(records,'other')).toEqual([]);
  });
  it('only signals a local target alert when an eligible observed price is at or below it', () => {
    expect(targetPriceReached(499,500)).toBe(true);
    expect(targetPriceReached(501,500)).toBe(false);
    expect(targetPriceReached(undefined,500)).toBe(false);
  });
});
