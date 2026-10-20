import { NextRequest, NextResponse } from 'next/server';
import { normalizePriceObservation, type Offer } from '@/lib/products';

export const revalidate = 300;
const endpoint = 'https://prices.openfoodfacts.org/api/v1/prices';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{8,14}$/.test(code)) return NextResponse.json({ error: 'Nieprawidłowy kod produktu.' }, { status: 400 });
  const city = (request.nextUrl.searchParams.get('city') || '').trim();
  try {
    const url = new URL(endpoint);
    url.searchParams.set('product_code', code); url.searchParams.set('currency', 'PLN'); url.searchParams.set('duplicate_of__isnull', 'true'); url.searchParams.set('size', '20'); url.searchParams.set('order_by', '-date');
    const response = await fetch(url, { headers: { 'User-Agent': `TaniejPL/0.2 (contact: ${process.env.APP_CONTACT_EMAIL || 'hello@taniej.app'})`, Accept: 'application/json' }, next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Upstream unavailable');
    const body = await response.json();
    const rows = Array.isArray(body.items) ? body.items : Array.isArray(body.results) ? body.results : [];
    const offers = rows.map((row: unknown) => normalizePriceObservation(row, code, '', Date.now(), city)).filter((offer: Offer) => offer.eligible).sort((a: Offer, b: Offer) => b.date.localeCompare(a.date));
    return NextResponse.json({ offers, source: 'Open Prices', checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Nie udało się odczytać obserwacji cen.' }, { status: 502 });
  }
}
