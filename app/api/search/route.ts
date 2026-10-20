import { NextRequest, NextResponse } from 'next/server';
import { normalizePriceObservation, parsePolishQuery, type Offer } from '@/lib/products';
export const revalidate=300;
const OFF='https://world.openfoodfacts.org'; const PRICES='https://prices.openfoodfacts.org/api/v1/prices';
const headers={'User-Agent':`TaniejPL/0.1 (contact: ${process.env.APP_CONTACT_EMAIL||'hello@taniej.app'})`,'Accept':'application/json'};
async function fetchTimed(input:string|URL,init:RequestInit & {next?:{revalidate:number}},ms:number){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([fetch(input,init),new Promise<Response>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Upstream timeout')),ms)})])}finally{if(timer)clearTimeout(timer)}}
function parseSize(q?:string){if(!q)return undefined; const m=q.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/); if(!m)return undefined; return Number(m[1].replace(',','.'))*(m[2]==='kg'||m[2]==='l'?1000:1);}
function parseUnit(q?:string):'g'|'ml'|undefined{if(!q)return undefined;const m=q.toLowerCase().match(/\d+(?:[.,]\d+)?\s*(kg|g|ml|l)\b/);if(!m)return undefined;return m[1]==='ml'||m[1]==='l'?'ml':'g';}
function text(v:unknown){return typeof v==='string'?v:'';}
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get('q')||'').trim();const city=(req.nextUrl.searchParams.get('city')||'').trim(); if(q.length<2)return NextResponse.json({query:q,products:[],offers:[],warning:'Wpisz co najmniej 2 znaki.'});
 try{
  const params=new URLSearchParams({search_terms:q,search_simple:'1',action:'process',json:'1',page_size:'6',fields:'code,product_name,brands,quantity,image_front_small_url,url,categories_tags'});
  const res=await fetchTimed(`${OFF}/cgi/search.pl?${params}`,{headers,next:{revalidate:300},signal:AbortSignal.timeout(5000)},5500);
  if(!res.ok)throw new Error(`OFF HTTP ${res.status}`);
  const body=await res.json(); const raw=Array.isArray(body.products)?body.products:[];
  const products=raw.filter((p:any)=>p.code&&p.product_name).map((p:any)=>({code:String(p.code),name:text(p.product_name),brand:text(p.brands),quantity:text(p.quantity),quantityBase:parseSize(text(p.quantity)),quantityUnit:parseUnit(text(p.quantity)),image:text(p.image_front_small_url),sourceUrl:`https://world.openfoodfacts.org/product/${encodeURIComponent(String(p.code))}`,source:'Open Food Facts'}));
  const pricePages=await Promise.all(products.slice(0,6).map(async(p:any)=>{try{const u=new URL(PRICES);u.searchParams.set('product_code',p.code);u.searchParams.set('currency','PLN');u.searchParams.set('duplicate_of__isnull','true');u.searchParams.set('size','20');u.searchParams.set('order_by','-date');const r=await fetchTimed(u,{headers,next:{revalidate:300},signal:AbortSignal.timeout(4000)},4500); if(!r.ok)return []; const d=await r.json(); const rows=Array.isArray(d.items)?d.items:Array.isArray(d.results)?d.results:Array.isArray(d)?d:[];return rows.map((x:any)=>normalizePriceObservation(x,p.code,p.name,Date.now(),city)).filter((x:Offer)=>x.eligible); }catch{return []}}));
  const offers=pricePages.flat().sort((a,b)=>a.price-b.price);
  return NextResponse.json({query:q,parsed:parsePolishQuery(q),products,offers,coverage:offers.length?'crowdsourced':'none',checkedAt:new Date().toISOString(),sources:[{name:'Open Food Facts',url:'https://world.openfoodfacts.org'},{name:'Open Prices',url:'https://prices.openfoodfacts.org'}]});
 }catch(error){return NextResponse.json({query:q,products:[],offers:[],coverage:'unavailable',checkedAt:new Date().toISOString(),warning:'Nie udało się pobrać danych z otwartych źródeł. Spróbuj ponownie za chwilę.',detail:process.env.NODE_ENV==='development'?String(error):undefined},{status:502});}
}
