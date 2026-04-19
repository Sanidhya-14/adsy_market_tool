import { NextRequest } from 'next/server';

const GNEWS_BASE = 'https://gnews.io/api/v4/search';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

interface GNewsArticle {
  title: string;
  description: string;
  publishedAt: string;
  source: { name: string };
}

interface GNewsResponse {
  articles?: GNewsArticle[];
}

export async function POST(request: NextRequest) {
  try {
    const { commodity } = await request.json();
    if (!commodity) {
      return Response.json({ error: 'commodity is required' }, { status: 400 });
    }

    // 1. Fetch news from GNews
    const gnewsKey = process.env.GNEWS_API_KEY;
    let newsContext = '';

    if (gnewsKey) {
      const gnewsUrl = new URL(GNEWS_BASE);
      gnewsUrl.searchParams.set('q', `${commodity} price market supply demand`);
      gnewsUrl.searchParams.set('token', gnewsKey);
      gnewsUrl.searchParams.set('lang', 'en');
      gnewsUrl.searchParams.set('max', '5');
      gnewsUrl.searchParams.set('sortby', 'publishedAt');

      const gnewsRes = await fetch(gnewsUrl.toString());
      if (gnewsRes.ok) {
        const gnewsData: GNewsResponse = await gnewsRes.json();
        const articles = gnewsData.articles ?? [];
        newsContext = articles
          .map(
            (a, i) =>
              `Article ${i + 1}: "${a.title}" — ${a.description ?? 'No description'} (Source: ${a.source.name}, ${a.publishedAt})`
          )
          .join('\n');
      }
    }

    if (!newsContext) {
      newsContext = `No live news available for ${commodity}. Base analysis on general chemical market fundamentals.`;
    }

    // 2. Send to Groq (Llama-3)
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return Response.json(
        {
          sentiment: 'Neutral',
          summary:
            'AI analysis unavailable (GROQ_API_KEY not configured). Configure your API key to enable market intelligence.',
          action: 'Configure GROQ_API_KEY in .env.local to enable AI procurement directives.',
        },
        { status: 200 }
      );
    }

    const systemPrompt = `You are an expert B2B chemical procurement advisor with 20 years of experience in commodity markets. Analyze news and market signals to provide actionable procurement intelligence. Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

    const userPrompt = `Analyze the following recent news for "${commodity}" and provide procurement intelligence.

News context:
${newsContext}

Respond with a JSON object containing exactly these three fields:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "summary": "1-2 sentence summary of key supply/demand drivers and price pressure",
  "action": "specific procurement directive (e.g., 'Lock in 3-month forward contracts immediately', 'Delay purchases — oversupply signals')"
}`;

    const groqRes = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', errText);
      return Response.json(
        {
          sentiment: 'Neutral',
          summary: 'AI analysis temporarily unavailable. Check Groq API key and quota.',
          action: 'Manual market assessment recommended. Review supplier contracts.',
        },
        { status: 200 }
      );
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return Response.json({
      sentiment: parsed.sentiment ?? 'Neutral',
      summary: parsed.summary ?? 'Analysis unavailable.',
      action: parsed.action ?? 'Consult procurement team.',
    });
  } catch (err) {
    console.error('Sentiment API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
