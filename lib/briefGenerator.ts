import { connectDB } from './mongodb';
import { COMMODITIES, type IndustryMode } from './commodities';
import { buildBriefContext } from './briefContext';
import { buildSystemPrompt, buildUserPrompt } from './promptBuilder';
import { groq } from './groq';

async function getAIBrief() {
  const { AIBrief } = await import('../models/AIBrief');
  return AIBrief;
}

// llama3-70b-8192 was decommissioned by Groq; llama-3.3-70b-versatile is the current replacement
const MODEL = 'llama-3.3-70b-versatile';
const VALID_VERDICTS = new Set(['bullish', 'bearish', 'neutral', 'volatile']);

export interface GenerationResult {
  commodityId: string;
  industryMode: string;
  date: string;
  success: boolean;
  cached: boolean;
  error: string | null;
  durationMs: number;
}

export async function generateBrief(
  commodityId: string,
  industryMode: string
): Promise<GenerationResult> {
  const start = Date.now();
  const date = new Date().toISOString().slice(0, 10);

  await connectDB();
  const AIBrief = await getAIBrief();

  // Skip if today's non-fallback brief already exists
  const existing = await AIBrief.findOne({ commodityId, date, industryMode, isFallback: false });
  if (existing) {
    return { commodityId, industryMode, date, success: true, cached: true, error: null, durationMs: Date.now() - start };
  }

  try {
    const ctx = await buildBriefContext(commodityId, industryMode);

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(industryMode) },
        { role: 'user',   content: buildUserPrompt(ctx) },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const rawText = completion.choices[0]?.message?.content ?? '{}';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      // JSON extraction fallback — handles models that wrap JSON in markdown
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};
    }

    // Sanitize verdict
    if (!VALID_VERDICTS.has(parsed.priceVerdict as string)) {
      parsed.priceVerdict = null;
    }

    await AIBrief.findOneAndUpdate(
      { commodityId, date, industryMode },
      {
        commodityId, date, industryMode,
        generatedAt: new Date(),
        modelUsed: MODEL,
        marketSnapshot:        parsed.marketSnapshot        ?? null,
        priceVerdict:          parsed.priceVerdict          ?? null,
        priceVerdictRationale: parsed.priceVerdictRationale ?? null,
        keyDrivers:            Array.isArray(parsed.keyDrivers)  ? parsed.keyDrivers  : [],
        procurementDirective:  parsed.procurementDirective  ?? null,
        geographicContext:     parsed.geographicContext     ?? null,
        industryLens:          parsed.industryLens          ?? null,
        riskFlags:             Array.isArray(parsed.riskFlags)   ? parsed.riskFlags   : [],
        confidenceScore:       typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : null,
        sources:               Array.isArray(parsed.sources)     ? parsed.sources     : [],
        isFallback:    false,
        fallbackReason: null,
      },
      { upsert: true, returnDocument: 'after' }
    );

    return { commodityId, industryMode, date, success: true, cached: false, error: null, durationMs: Date.now() - start };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

    // Write fallback record so the reader knows generation was attempted
    try {
      await AIBrief.findOneAndUpdate(
        { commodityId, date, industryMode },
        {
          commodityId, date, industryMode,
          generatedAt: new Date(),
          modelUsed: MODEL,
          marketSnapshot: null, priceVerdict: null, priceVerdictRationale: null,
          keyDrivers: [], procurementDirective: null, geographicContext: null,
          industryLens: null, riskFlags: [], confidenceScore: null, sources: [],
          isFallback: true,
          fallbackReason: error,
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch { /* ignore secondary write failure */ }

    return { commodityId, industryMode, date, success: false, cached: false, error, durationMs: Date.now() - start };
  }
}

const ALL_MODES: IndustryMode[] = ['specialty-chem', 'life-sciences', 'energy'];

export async function generateAllBriefs(mode?: string): Promise<GenerationResult[]> {
  const modes = mode ? [mode] : (ALL_MODES as string[]);
  const commodityIds = COMMODITIES.map(c => c.id);

  const tasks: Array<{ commodityId: string; mode: string }> = [];
  for (const commodityId of commodityIds) {
    for (const m of modes) {
      tasks.push({ commodityId, mode: m });
    }
  }

  const total = tasks.length;
  const results: GenerationResult[] = [];

  for (let i = 0; i < total; i++) {
    const { commodityId, mode: m } = tasks[i];
    const result = await generateBrief(commodityId, m);
    results.push(result);
    console.log(
      `[${i + 1}/${total}] ${commodityId} (${m}): ${result.success ? 'OK' : 'FAIL'}${result.cached ? ' (cached)' : ''}`
    );
    if (i < total - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}
