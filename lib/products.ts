export type ParsedQuery = { raw: string; normalized: string; quantity: number; packageGrams?: number; category?: string; terms: string[] };
const aliases: Record<string,string> = {"filet":"piers z kurczaka", "kurczak":"kurczak", "jogurty":"jogurt", "jogurtu":"jogurt", "ryzu":"ryz", "pomidorow":"pomidor", "pomidory":"pomidor", "mleka":"mleko", "indyka":"indyk", "kilo":"kg", "kilogram":"kg", "kilogramow":"kg", "sztuki":"szt", "sztuk":"szt"};
export function normalizePolish(value:string){return value.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l").replace(/[^a-z0-9.% ]/g," ").replace(/\s+/g," ").trim();}
export function parsePolishQuery(value:string):ParsedQuery {
 const normalized=normalizePolish(value); const words=normalized.split(" ").filter(Boolean); const quantityToken=words.find(w=>/^\d+(?:[.,]\d+)?$/.test(w));
 const quantity=quantityToken?Number(quantityToken.replace(",",".")):1;
 const grams=normalized.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gram|gramow|ml|l)\b/);
 const packageGrams=grams ? Math.round(Number(grams[1].replace(",",".")) * (/^kg|^l$/.test(grams[2])?1000:1)) : undefined;
 const category= /piers|kurczak|indyk|mieso|wolowina/.test(normalized)?"mięso":/jogurt|mleko|ser|nabial/.test(normalized)?"nabiał":/ryz|makaron|kasza/.test(normalized)?"produkty sypkie":undefined;
 const canonical=words.map(w=>aliases[w]??w).join(" ");
 return {raw:value,normalized:canonical,quantity,packageGrams,category,terms:canonical.split(" ").filter(w=>w&&!/^\d/.test(w)&&!['kg','g','ml','l','szt','proc'].includes(w))};
}
const spokenNumbers:Record<string,number>={"jeden":1,"jedna":1,"jedno":1,"dwa":2,"dwie":2,"trzy":3,"cztery":4,"piec":5,"szesc":6,"siedem":7,"osiem":8,"dziewiec":9,"dziesiec":10};
export function parseSpokenShoppingList(value:string){
 const cleaned=value.toLocaleLowerCase('pl-PL').replace(/[.!?]/g,'').replace(/^(poproszę|potrzebuję|chcę kupić|kup|dodaj)\s+/,"");
 return cleaned.split(/\s*,\s*|\s+(?:oraz|i)\s+/).map(normalizePolish).map(part=>part.replace(/^(jakies|jakas|jakis|prosze)\s+/,"").trim()).filter(Boolean).map((part,index)=>{
  const measure=part.match(/^(?:(\d+(?:[.,]\d+)?|pol)\s*)?(kg|kilo|kilogram|kilogramy|kilogramow|g|gram|gramy|gramow|l|litr|litra|litry|litrow|ml|mililitr|mililitry|mililitrow)\s+(.+)$/);
  const spokenMeasure=measure?{amountBase:Math.round((measure[1]==='pol'?0.5:Number((measure[1]||'1').replace(',','.')))*(/^(kg|kilo|kilogram|kilogramy|kilogramow|l|litr|litra|litry|litrow)$/.test(measure[2])?1000:1)),amountUnit:/^(l|litr|litra|litry|litrow|ml|mililitr|mililitry|mililitrow)$/.test(measure[2])?'ml' as const:'g' as const}:undefined;
  if(measure)part=measure[3];
  const numeric=part.match(/^(\d+(?:[.,]\d+)?|pol|jeden|jedna|jedno|dwa|dwie|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec)\s+/);
  const token=numeric?.[1]; const quantity=token?(token==="pol"?0.5:/^\d/.test(token)?Number(token.replace(",",".")):spokenNumbers[token]??1):1;
  const name=(numeric?part.slice(numeric[0].length).trim():part).split(' ').map(word=>aliases[word]??word).join(' ');
  return {id:`spoken-${index}`,name,quantity:quantity>0?quantity:1,...spokenMeasure};
 });
}
export function unitPriceGrosz(pricePLN:number, quantity:number, unit:string){if(!Number.isFinite(pricePLN)||pricePLN<0||!Number.isFinite(quantity)||quantity<=0) throw new Error("Nieprawidłowa cena lub ilość"); const unitFactor=/^(g|ml)$/i.test(unit)?1000:1; return Math.round(decimalToGrosz(pricePLN)*unitFactor/quantity);}
export function decimalToGrosz(value:number|string){const raw=String(value).trim().replace(',','.');const match=raw.match(/^(\d+)(?:\.(\d+))?$/);if(!match)throw new Error('Nieprawidłowa kwota');const whole=BigInt(match[1]);const fraction=(match[2]||'').padEnd(3,'0');const grosz=whole*100n+BigInt(fraction.slice(0,2))+(Number(fraction[2])>=5?1n:0n);if(grosz>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Kwota poza zakresem');return Number(grosz);}
export function moneyFromGrosz(grosz:number){return `${(grosz/100).toFixed(2).replace('.',',')} zł`;}
export type Offer={id:string; name:string; code?:string; price:number; currency:string; date:string; retailer?:string; location?:string; storeKey?:string; storeName?:string; sourceUrl:string; kind?:string; priceWithoutDiscount?:number; eligible?:boolean; basketEligible?:boolean;};
export function normalizePriceObservation(row:any,code:string,name:string,now=Date.now(),city?:string):Offer {
 const location=row?.location||{};const date=String(row?.date||'');const ageDays=(now-new Date(date).getTime())/86400000;const retailer=location.osm_brand||location.osm_name;const currency=String(row?.currency||'');
 const cityMatch=!city||normalizePolish(String(location.osm_address_city||''))===normalizePolish(city);
 const priceWithoutDiscount=Number(row?.price_without_discount);
 const storeKey=location.id!=null?`location:${location.id}`:location.osm_id!=null?`osm:${location.osm_type||''}:${location.osm_id}`:undefined;
 const discounted=row?.price_is_discounted===true;
 const pricePer=String(row?.price_per||'UNIT').toUpperCase();
 const validAmountBasis=pricePer==='UNIT';
 const validProductPrice=!row?.type||String(row.type).toUpperCase()==='PRODUCT';
 const validDuplicate=row?.duplicate_of==null;
 const validDate=Number.isFinite(ageDays)&&ageDays>=0&&ageDays<=7;
 const eligible=String(location.osm_address_country_code||'').toLowerCase()==='pl'&&cityMatch&&!!retailer&&validDate&&currency==='PLN'&&Number.isFinite(Number(row?.price))&&Number(row.price)>=0&&validAmountBasis&&validProductPrice&&validDuplicate;
 return {id:String(row?.id??''),name,code,price:Number(row?.price),currency,date,retailer:retailer||undefined,location:[location.osm_address_city,location.osm_address_suburb].filter(Boolean).join(', ')||undefined,storeKey,storeName:location.osm_name||undefined,sourceUrl:`https://prices.openfoodfacts.org/api/v1/prices/${encodeURIComponent(String(row?.id??''))}`,kind:discounted?'Promocja zgłoszona · warunki nieznane':'Cena zgłoszona',priceWithoutDiscount:discounted&&Number.isFinite(priceWithoutDiscount)&&priceWithoutDiscount>Number(row?.price)?priceWithoutDiscount:undefined,eligible,basketEligible:eligible&&!discounted&&!!storeKey};
}
export function optimizeBasket(items:{quantity:number; offers:Offer[]}[], maxStores:number=4){
 const retailers=[...new Set(items.flatMap(i=>i.offers.map(o=>o.retailer).filter(Boolean) as string[]))];
 type BasketResult={totalGrosz:number; assignments:Offer[]; stores:string[]};
 let best:BasketResult|null=null;
 function walk(i:number,selected:Offer[],stores:Set<string>,sum:number){if(i===items.length){if(!best||sum<best.totalGrosz)best={totalGrosz:sum,assignments:[...selected],stores:[...stores]};return;}
  const choices=items[i].offers.filter(o=>o.currency==='PLN'&&Number.isFinite(o.price)&&o.eligible!==false&&o.basketEligible!==false).sort((a,b)=>a.price-b.price);
  for(const offer of choices){const r=offer.storeKey??`retailer:${offer.retailer??"Nieznany sklep"}`;const next=new Set(stores);next.add(r);if(next.size>maxStores)continue;walk(i+1,[...selected,offer],next,sum+Math.round(decimalToGrosz(offer.price)*items[i].quantity));}
 }
 walk(0,[],new Set(),0); return {best:best as BasketResult|null, retailers};
}
