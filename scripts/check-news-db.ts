import { connectDB } from '../lib/mongodb';
import mongoose from 'mongoose';

async function main() {
  await connectDB();
  const db = mongoose.connection.db!;
  const col = db.collection('newsarticles');

  const total = await col.countDocuments();
  const withCommodities = await col.countDocuments({ commodityIds: { $exists: true, $not: { $size: 0 } } });
  const withGeo = await col.countDocuments({ isGeographicallyRelevant: true });
  const withHash = await col.countDocuments({ urlHash: { $exists: true } });

  console.log({ total, withCommodities, withGeo, withHash });

  const sample = await col.findOne(
    { commodityIds: { $not: { $size: 0 } } },
    { projection: { title: 1, commodityIds: 1, isGeographicallyRelevant: 1, urlHash: 1, source: 1 } }
  );
  if (sample) console.log('sample:', JSON.stringify(sample, null, 2));
  else console.log('no tagged articles found');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
