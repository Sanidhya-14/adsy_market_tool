import { connectDB } from '../lib/mongodb';
import { NewsArticle } from '../models/NewsArticle';

async function test(commodityId: string) {
  await connectDB();
  const docs = await NewsArticle.find(
    { commodityIds: commodityId },
    { title: 1, source: 1, isGeographicallyRelevant: 1, sourceCountry: 1, publishedAt: 1 }
  ).sort({ publishedAt: -1 }).limit(10).lean();

  console.log(`[${commodityId}] found: ${docs.length}`);
  if (docs.length > 0) {
    console.log('source field sample:', (docs as any[])[0]);
    console.log('→ API would return source: mongodb');
  } else {
    console.log('→ API would fall back to GNews');
  }
}

async function main() {
  await test('diesel');
  await test('ethanol');
  await test('caustic-soda');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
