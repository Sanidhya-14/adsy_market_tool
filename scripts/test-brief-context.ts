import { buildBriefContext } from '../lib/briefContext';

async function main() {
  const ctx = await buildBriefContext('ethanol', 'specialty-chem');
  console.log('recentHeadlines:', ctx.recentHeadlines);
  console.log('priceDataSource:', ctx.priceDataSource);
  console.log('currentPrice:', ctx.currentPrice);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
