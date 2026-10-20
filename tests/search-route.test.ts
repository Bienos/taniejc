import {afterEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {GET} from '../app/api/search/route';
afterEach(()=>vi.unstubAllGlobals());
describe('live search adapter',()=>{
 it('returns catalog metadata and only marks a fresh Polish observation eligible',async()=>{
  const mock=vi.fn(async(input:RequestInfo|URL)=>{const url=String(input);if(url.includes('cgi/search.pl'))return new Response(JSON.stringify({products:[{code:'1234567890123',product_name:'Ryż basmati',brands:'Przykład',quantity:'500 g'}]}),{status:200,headers:{'content-type':'application/json'}});return new Response(JSON.stringify({items:[{id:9,price:6.49,currency:'PLN',date:new Date().toISOString().slice(0,10),location:{osm_brand:'Lidl',osm_address_country_code:'PL',osm_address_city:'Warszawa'}}]}),{status:200,headers:{'content-type':'application/json'}})});
  vi.stubGlobal('fetch',mock);const response=await GET(new NextRequest('http://localhost/api/search?q=ryz+basmati'));const body=await response.json();expect(response.status).toBe(200);expect(body.products[0].code).toBe('1234567890123');expect(body.offers[0].eligible).toBe(true);expect(mock).toHaveBeenCalledTimes(2);
 });
 it('surfaces source failure without inserting fallback offers',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('upstream unavailable',{status:503})));const response=await GET(new NextRequest('http://localhost/api/search?q=ryz'));const body=await response.json();expect(response.status).toBe(502);expect(body.offers).toEqual([]);expect(body.warning).toBeTruthy()});
});
