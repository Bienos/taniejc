import {afterEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '../app/api/compare/route';
afterEach(()=>vi.unstubAllGlobals());
describe('basket comparison route',()=>{
 it('re-reads barcode observations and ignores client-supplied amounts',async()=>{
  const mock=vi.fn(async()=>new Response(JSON.stringify({items:[{id:40,type:'PRODUCT',price:12.75,currency:'PLN',price_per:'UNIT',date:new Date().toISOString().slice(0,10),location:{id:90,osm_name:'Lidl Warszawa Centrum',osm_brand:'Lidl',osm_address_country_code:'PL'}}]}),{status:200,headers:{'content-type':'application/json'}}));vi.stubGlobal('fetch',mock);
  const request=new NextRequest('http://localhost/api/compare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:[{name:'Ryż',quantity:2,product:{code:'111'},offers:[{price:.01}]}],maxStores:1})});const response=await POST(request);const body=await response.json();expect(response.status).toBe(200);expect(body.best.totalGrosz).toBe(2550);expect(body.best.assignments[0].price).toBe(12.75);expect(mock).toHaveBeenCalledTimes(1);
 });
 it('keeps lines with missing barcodes out of a purported complete basket',async()=>{vi.stubGlobal('fetch',vi.fn());const request=new NextRequest('http://localhost/api/compare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:[{name:'Pomidory',quantity:1}],maxStores:2})});const response=await POST(request);const body=await response.json();expect(body.best).toBeNull();expect(body.complete).toBe(false);expect(body.missing[0].name).toBe('Pomidory')});
});
