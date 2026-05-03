import { connectDB } from '@/lib/mongodb';
import { COMMODITIES } from '@/lib/commodities';
import { fetchPubChemByCid } from '@/lib/pubchem';
import { PubChemCache } from '@/models/PubChemCache';

const THROTTLE_MS = 1000;

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const start = Date.now();
  console.log('[warm-pubchem-cache] Connecting to MongoDB...');
  await connectDB();

  const targets = COMMODITIES.filter((c) => c.pubchemCid != null);
  console.log(`[warm-pubchem-cache] ${targets.length} commodities to warm.`);

  let succeeded = 0;
  let failed = 0;

  for (const commodity of targets) {
    const t0 = Date.now();
    process.stdout.write(`  → ${commodity.id} (CID ${commodity.pubchemCid})... `);

    const identity = await fetchPubChemByCid(commodity.pubchemCid!);

    if (!identity) {
      console.log('FAILED');
      failed++;
    } else {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await PubChemCache.findOneAndUpdate(
        { commodityId: commodity.id },
        {
          commodityId: commodity.id,
          cid: commodity.pubchemCid,
          identity,
          fetchedAt: now,
          expiresAt,
        },
        { upsert: true, new: true }
      );
      console.log(`OK (${Date.now() - t0}ms)`);
      succeeded++;
    }

    // Throttle to 1 req/sec (conservative — PubChem allows 5/sec)
    if (targets.indexOf(commodity) < targets.length - 1) {
      await sleep(THROTTLE_MS);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\n[warm-pubchem-cache] Done in ${elapsed}s — ${succeeded} succeeded, ${failed} failed.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[warm-pubchem-cache] Fatal:', err);
  process.exit(1);
});
