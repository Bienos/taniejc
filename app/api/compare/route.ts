import {NextRequest,NextResponse} from 'next/server';
import {decimalToGrosz,normalizePriceObservation,optimizeBasket,type Offer} from '@/lib/products';
const PRICES='https://prices.openfoodfacts.org/api/v1/prices';
const headers={'User-Agent':`TaniejPL/0.1 (contact: ${process.env.APP_CONTACT_EMAIL||'hello@taniej.app'})`,'Accept':'application/json'};
async function fetchTimed(input:URL,init:RequestInit & {next?:{revalidate:number}}){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([fetch(input,init),new Promise<Response>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Upstream timeout')),4500)})])}finally{if(timer)clearTimeout(timer)}}
async function readFreshOffers(code:string,name:string,city:string):Promise<Offer[]>{
 const u=new URL(PRICES);u.searchParams.set('product_code',code);u.searchParams.set('currency','PLN');u.searchParams.set('duplicate_of__isnull','true');u.searchParams.set('size','20');u.searchParams.set('order_by','-date');
 const response=await fetchTimed(u,{headers,next:{revalidate:300},signal:AbortSignal.timeout(4000)});if(!response.ok)return [];
 const body=await response.json();const rows=Array.isArray(body.items)?body.items:Array.isArray(body.results)?body.results:Array.isArray(body)?body:[];
 return rows.map((row:any)=>normalizePriceObservation(row,code,name,Date.now(),city)).filter((offer:Offer)=>offer.eligible);
}
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const raw=Array.isArray(body.items)?body.items:[];const maxStores=Math.max(1,Math.min(4,Number(body.maxStores)||4));
  if(raw.length>12)return NextResponse.json({error:'Porównanie obejmuje maksymalnie 12 pozycji naraz.'},{status:400});
  const city=String(body.city||'').trim();const items=await Promise.all(raw.map(async(item:any)=>{const code=typeof item.product?.code==='string'?item.product.code:'';let offers:Offer[]=[];if(code){try{offers=await readFreshOffers(code,String(item.name||'Produkt'),city)}catch{offers=[]}}return {name:String(item.name||'Produkt'),quantity:Math.max(1,Number(item.quantity)||1),code,offers}}));
  const {best}=optimizeBasket(items,maxStores);
  const storeKeys=[...new Set(items.flatMap((item:{offers:Offer[]})=>item.offers.filter((offer:Offer)=>offer.storeKey&&offer.basketEligible!==false).map((offer:Offer)=>offer.storeKey as string)))];
  const singleStoreOptions=storeKeys.flatMap((storeKey:string)=>{const selected=items.map((item:{offers:Offer[]})=>item.offers.filter((offer:Offer)=>offer.storeKey===storeKey&&offer.basketEligible!==false).sort((a:Offer,b:Offer)=>a.price-b.price)[0]);if(selected.some((item:Offer|undefined)=>!item))return [];const complete=selected as Offer[];return [{retailer:complete[0].retailer,storeName:complete[0].storeName,location:complete[0].location,storeKey,totalGrosz:complete.reduce((total,offer,index)=>total+Math.round(decimalToGrosz(offer.price)*items[index].quantity),0),assignments:complete}]}).sort((a,b)=>a.totalGrosz-b.totalGrosz);
 const missing=items.map((item:{name:string;offers:Offer[]})=>({name:item.name,matched:item.offers.some((offer:Offer)=>offer.basketEligible!==false)})).filter((item:{name:string;matched:boolean})=>!item.matched);
 return NextResponse.json({best:best?{totalGrosz:best.totalGrosz,stores:best.stores,assignments:best.assignments}:null,singleStoreOptions,missing,complete:missing.length===0&&items.length>0,disclaimer:'Ceny to społecznościowe obserwacje Open Prices, nie potwierdzenie bieżącej dostępności ani ceny na kasie. Zgłoszenia promocyjne z nieznanymi warunkami nie są wliczane do koszyka.'});
 }catch{return NextResponse.json({error:'Nie udało się porównać koszyka. Spróbuj ponownie.'},{status:502});}
}
