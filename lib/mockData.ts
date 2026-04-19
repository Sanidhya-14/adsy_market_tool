export interface PricePoint {
  date: string;
  price: number;
}

// Seeded pseudo-random (mulberry32) for deterministic data
function seededRandom(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateMockTimeSeries(
  commodityId: string,
  basePrice: number,
  volatility: number,
  weeks = 52
): PricePoint[] {
  const rand = seededRandom(stringToSeed(commodityId));
  const data: PricePoint[] = [];
  const endDate = new Date('2026-04-20');
  let price = basePrice;

  for (let i = weeks; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i * 7);

    // Random walk with mean reversion
    const noise = (rand() - 0.5) * volatility * 2;
    const reversion = (basePrice - price) * 0.08;
    price = Math.max(price * 0.7, price + noise + reversion);
    price = parseFloat(price.toFixed(basePrice < 10 ? 3 : 1));

    data.push({
      date: d.toISOString().split('T')[0],
      price,
    });
  }

  return data;
}

export function getCurrentPrice(
  commodityId: string,
  basePrice: number,
  volatility: number
): number {
  const series = generateMockTimeSeries(commodityId, basePrice, volatility, 52);
  return series[series.length - 1].price;
}

export function getPriceChange(
  commodityId: string,
  basePrice: number,
  volatility: number
): { value: number; percent: number } {
  const series = generateMockTimeSeries(commodityId, basePrice, volatility, 52);
  const current = series[series.length - 1].price;
  const prev = series[series.length - 2].price;
  const value = parseFloat((current - prev).toFixed(basePrice < 10 ? 3 : 1));
  const percent = parseFloat(((value / prev) * 100).toFixed(2));
  return { value, percent };
}
