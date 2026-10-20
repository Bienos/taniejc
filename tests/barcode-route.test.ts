import {afterEach, describe, expect, it, vi} from 'vitest';
import {GET} from '../app/api/product/[code]/route';

afterEach(() => vi.restoreAllMocks());

describe('Open Food Facts barcode lookup', () => {
  it('rejects malformed codes without making an upstream request', async () => {
    const response = await GET(new Request('http://localhost'), {params: Promise.resolve({code:'abc'})});
    expect(response.status).toBe(400);
  });
  it('returns normalized public metadata on an exact barcode lookup', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({status:1,product:{code:'5901234567890',product_name:'Jogurt naturalny',brands:'Marka',quantity:'400 g',image_front_small_url:'https://img.example/x.jpg'}}), {status:200,headers:{'content-type':'application/json'}})));
    const response = await GET(new Request('http://localhost'), {params: Promise.resolve({code:'5901234567890'})});
    const body = await response.json();
    expect(body.product).toMatchObject({code:'5901234567890',name:'Jogurt naturalny',brand:'Marka',quantityBase:400,quantityUnit:'g'});
  });
  it('returns a clear upstream error rather than inventing product details', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const response = await GET(new Request('http://localhost'), {params: Promise.resolve({code:'5901234567890'})});
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('Nie udało');
  });
});
