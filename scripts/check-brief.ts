import { connectDB } from '../lib/mongodb';
import { AIBrief } from '../models/AIBrief';

async function main() {
  await connectDB();
  const brief = await AIBrief.findOne({ commodityId: 'ethanol', industryMode: 'specialty-chem' })
    .sort({ date: -1 })
    .lean();

  if (!brief) { console.log('no brief found'); process.exit(0); }
  console.log(JSON.stringify(brief, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
