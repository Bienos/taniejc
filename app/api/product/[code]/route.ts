import { NextResponse } from 'next/server';

export const revalidate = 3600;
const OFF = 'https://world.openfoodfacts.org';
const size = (quantity: string) => {
  const match = quantity.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/);
  if (!match) return { quantityBase: undefined, quantityUnit: undefined };
  return { quantityBase: Number(match[1].replace(',', '.')) * (match[2] === 'kg' || match[2] === 'l' ? 1000 : 1), quantityUnit: match[2] === 'ml' || match[2] === 'l' ? 'ml' : 'g' };
};

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{8,14}$/.test(code)) return NextResponse.json({ error: 'Wpisz prawidłowy kod kreskowy.' }, { status: 400 });
  try {
    const url = new URL(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json`);
    url.searchParams.set('fields', 'code,status,product_name,brands,quantity,image_front_small_url,url,categories_tags');
    const response = await fetch(url, { headers: { 'User-Agent': `TaniejPL/0.2 (contact: ${process.env.APP_CONTACT_EMAIL || 'hello@taniej.app'})`, Accept: 'application/json' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return NextResponse.json({ error: 'Katalog Open Food Facts chwilowo nie odpowiada.' }, { status: 502 });
    const body = await response.json();
    const product = body?.product;
    if (body?.status !== 1 || !product?.product_name) return NextResponse.json({ product: null, source: 'Open Food Facts', checkedAt: new Date().toISOString() });
    const quantity = String(product.quantity || '');
    return NextResponse.json({ product: { code: String(product.code || code), name: String(product.product_name), brand: String(product.brands || ''), quantity, ...size(quantity), image: String(product.image_front_small_url || ''), sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}` }, source: 'Open Food Facts', checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Nie udało się sprawdzić kodu. Sprawdź połączenie i spróbuj ponownie.' }, { status: 502 });
  }
}
