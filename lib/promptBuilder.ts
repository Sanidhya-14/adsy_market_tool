import type { BriefContext } from './briefContext';

const MODE_LABELS: Record<string, string> = {
  'specialty-chem': 'Specialty Chemicals',
  'life-sciences':  'Life Sciences',
  'energy':         'Energy',
};

const MODE_LENS: Record<string, string> = {
  'life-sciences':  'Focus on pharmaceutical supply chain, API availability, and regulatory impact on this compound.',
  'energy':         'Focus on energy feedstock pricing dynamics, refinery margins, and downstream petrochemical impact.',
  'specialty-chem': 'Focus on specialty chemical supply chains, downstream industrial demand, and contract vs spot market dynamics.',
};

export function buildSystemPrompt(industryMode: string): string {
  void industryMode; // mode shapes user prompt, not system prompt
  return `You are a senior procurement intelligence analyst specializing in North American chemical and life sciences markets.
You generate concise, data-grounded daily market briefs for procurement professionals.
Your output must be valid JSON matching the exact schema provided. No markdown, no prose outside JSON.
Focus exclusively on North American (US, Canada, Mexico) market conditions and supply chains.
Today's date: ${new Date().toISOString().slice(0, 10)}`;
}

export function buildUserPrompt(ctx: BriefContext): string {
  const casLine = ctx.casNumber ? ` (CAS: ${ctx.casNumber})` : '';
  const formulaLine = ctx.molecularFormula ? ` | Formula: ${ctx.molecularFormula}` : '';
  const priceStr =
    ctx.currentPrice != null
      ? `${ctx.currentPrice} ${ctx.priceUnit ?? ''} (Source: ${ctx.priceDataSource})`
      : `Unavailable (Source: ${ctx.priceDataSource})`;
  const changeStr =
    ctx.priceChange24h != null
      ? `${ctx.priceChange24h > 0 ? '+' : ''}${ctx.priceChange24h}%`
      : 'N/A';

  const headlineSection =
    ctx.recentHeadlines.length > 0
      ? ctx.recentHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : 'No recent headlines available.';

  return `Generate a procurement intelligence brief for ${ctx.commodityName}${casLine}${formulaLine}.

MARKET DATA:
- Current price: ${priceStr}
- 24h change: ${changeStr}
- Price data as of: ${ctx.asOfDate}

DEMAND CONTEXT:
- Key demand sectors: ${ctx.demandSectors.join(', ') || 'N/A'}
- Feedstock dependencies: ${ctx.feedstockDependencies.join(', ') || 'N/A'}
- Seasonal pattern: ${ctx.seasonality ?? 'N/A'}
- Typical bullish triggers: ${ctx.bullishTriggers.join('; ') || 'N/A'}
- Typical bearish triggers: ${ctx.bearishTriggers.join('; ') || 'N/A'}

RECENT MARKET HEADLINES (last 24-48h):
${headlineSection}

INDUSTRY LENS — ${MODE_LABELS[ctx.industryMode] ?? ctx.industryMode}:
${MODE_LENS[ctx.industryMode] ?? ''}

OUTPUT: Respond ONLY with a JSON object matching this exact schema:
{
  "marketSnapshot": "string (2-3 sentences on current market state)",
  "priceVerdict": "bullish" | "bearish" | "neutral" | "volatile",
  "priceVerdictRationale": "string (1-2 sentences)",
  "keyDrivers": ["string", "string", "string"],
  "procurementDirective": "string (1-2 sentences — actionable recommendation for buyers)",
  "geographicContext": "string (1 sentence — North American specific)",
  "industryLens": "string (1-2 sentences — mode-specific insight)",
  "riskFlags": ["string"],
  "confidenceScore": 0-100,
  "sources": ["string"]
}

No additional text before or after the JSON object. If data is insufficient, return the schema with null for unknown fields and a low confidenceScore.`;
}
