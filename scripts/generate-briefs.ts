// Usage (named flags — works in bash/sh):
//   npm run generate-briefs -- --mode specialty-chem
//   npm run generate-briefs -- --commodity caustic-soda --mode specialty-chem
//
// Usage (positional args — works cross-platform including Windows PowerShell):
//   npm run generate-briefs -- caustic-soda specialty-chem
//   npx tsx --env-file=.env.local scripts/generate-briefs.ts caustic-soda specialty-chem

import { generateAllBriefs, generateBrief } from '../lib/briefGenerator';
import { connectDB } from '../lib/mongodb';

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY is not set. Add it to .env.local.');
    process.exit(1);
  }

  await connectDB();

  const args = process.argv.slice(2);

  // Named flag parsing
  const modeIdx      = args.indexOf('--mode');
  const commodityIdx = args.indexOf('--commodity');
  let mode      = modeIdx      !== -1 ? args[modeIdx + 1]      : undefined;
  let commodity = commodityIdx !== -1 ? args[commodityIdx + 1] : undefined;

  // Positional fallback — first two non-flag args treated as [commodity, mode]
  if (!commodity || !mode) {
    const positional = args.filter(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--mode' && args[args.indexOf(a) - 1] !== '--commodity');
    if (!commodity && positional[0]) commodity = positional[0];
    if (!mode      && positional[1]) mode      = positional[1];
  }

  console.log(`Starting brief generation...`);
  console.log(`Mode: ${mode ?? 'all'}, Commodity: ${commodity ?? 'all'}`);

  if (commodity && mode) {
    const result = await generateBrief(commodity, mode);
    console.log(result);
  } else {
    const results = await generateAllBriefs(mode);
    const succeeded = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;
    const cached    = results.filter(r => r.cached).length;
    console.log(`\nComplete: ${succeeded} succeeded, ${failed} failed, ${cached} cached`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
