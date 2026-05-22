# Adsy Global — API & Data Integration Reference

> **Purpose:** Documents every API, data source, JSON format, backend lib/route, and frontend component linkage in the platform.
> **Last Updated:** May 2025
> **Stack:** Next.js App Router · TypeScript · MongoDB · Groq · Vercel

---

## Part 1 — By Feature / Page Section

Each entry = one UI feature. Traces the full data chain: External Source → Backend Lib → Internal API Route → Frontend Component.

---

### Feature 1 · Price Chart (Overview Tab)

**What it does:** Displays a time-series area chart of a commodity's historical price (weekly, up to 52 weeks). Shown on every commodity detail page in the Overview tab, and as a sparkline on every dashboard card.

| Field | Value |
|---|---|
| **Page / Component** | `components/CommodityChart.tsx`, `components/CommodityCard.tsx` |
| **Internal API Route** | `GET /api/commodities/[id]` → `app/api/commodities/[id]/route.ts` |
| **External Data Sources** | U.S. EIA API (energy commodities) · FRED API (macro/chemical commodities) · Mock Data Engine (fallback) |
| **Backend Libs** | `lib/eia.ts` → `fetchEIASeries()`, `fetchEIANaturalGas()` · `lib/fred.ts` → `fetchFREDSeries()` · `lib/mockData.ts` → `generateMockTimeSeries()` |
| **Auth** | `EIA_API_KEY` · `FRED_API_KEY` (both optional — falls back to mock) |
| **Fallback** | Mock data engine activates if API key is missing or request fails |

**External API Formats:**

*EIA v2 — Petroleum Spot Prices*
```
GET https://api.eia.gov/v2/petroleum/pri/spt/data/
    ?api_key=KEY&data[]=value&facets[series][]=RWTC
    &frequency=weekly&sort[0][column]=period&sort[0][direction]=desc&length=52
```
```json
{
  "response": {
    "data": [
      { "period": "2024-10-25", "value": "71.78" },
      { "period": "2024-10-18", "value": "70.54" }
    ]
  }
}
```

*EIA v2 — Natural Gas*
```
GET https://api.eia.gov/v2/natural-gas/pri/sum/data/
    ?api_key=KEY&facets[duoarea][]=NUS&facets[series][]=RNGWHHD&frequency=daily
```

*FRED — Commodity Series*
```
GET https://fred.stlouisfed.org/graph/fredgraph.csv?id=POILBREUSDM&vintage_date=...
```

**Internal API Response (`/api/commodities/[id]`):**
```json
{
  "id": "crude-oil",
  "source": "eia",
  "series": [
    { "date": "2024-04-12", "price": 85.4 },
    { "date": "2024-04-19", "price": 83.1 }
  ],
  "currentPrice": 83.1,
  "change": -2.3,
  "changePct": -2.69
}
```

**Frontend Fetch:**
```typescript
// CommodityChart.tsx
const res = await fetch(`/api/commodities/${commodity.id}`);
```

---

### Feature 2 · AI Analyzer (Overview Tab)

**What it does:** Displays a pre-generated daily AI brief for each commodity, including market snapshot, price verdict (Bullish/Bearish/Neutral/Volatile), key market drivers, procurement directive, geographic context, and risk flags. Powered by Groq (Llama-3). Briefs are generated at 6am UTC daily via a cron job and stored in MongoDB.

| Field | Value |
|---|---|
| **Page / Component** | `components/AIAnalyzerCard.tsx` |
| **Internal API Route** | `GET /api/brief/[commodityId]?mode={industryMode}` → `app/api/brief/[commodityId]/route.ts` |
| **External Data Sources** | Groq API (Llama-3.3-70b-versatile) · EIA · FRED · GNews · PubChem · MongoDB (read at runtime) |
| **Backend Libs** | `lib/briefGenerator.ts` → `generateBrief()` · `lib/briefContext.ts` → `buildBriefContext()` · `lib/groq.ts` · `lib/promptBuilder.ts` · `models/AIBrief.ts` (Mongoose model) |
| **Auth** | `GROQ_API_KEY` · `MONGODB_URI` · `CRON_SECRET` (for cron route) |
| **Generation Trigger** | GitHub Actions cron (`.github/workflows/generate-briefs.yml`) at 6am UTC · Manual via `npm run generate-briefs` · Cron HTTP route `GET /api/cron/generate-briefs` |
| **Fallback** | Returns `{ available: false }` if no brief exists in MongoDB |

**Internal API Response (`/api/brief/[commodityId]`):**
```json
{
  "available": true,
  "isTodaysBrief": true,
  "daysOld": 0,
  "brief": {
    "commodityId": "crude-oil",
    "date": "2025-05-14",
    "industryMode": "energy",
    "generatedAt": "2025-05-14T06:02:11.000Z",
    "modelUsed": "llama-3.3-70b-versatile",
    "marketSnapshot": "WTI crude settled at $81.40/bbl...",
    "priceVerdict": "bearish",
    "priceVerdictRationale": "Demand concerns from China offset supply cuts...",
    "keyDrivers": ["OPEC+ output discipline", "USD strength", "China PMI miss"],
    "procurementDirective": "Lock in Q3 contracts before Friday's OPEC decision.",
    "geographicContext": "Gulf Coast refinery utilization at 91%...",
    "industryLens": "Energy sector facing margin compression...",
    "riskFlags": ["Hurricane season approaching", "Iran export waiver expiry"],
    "confidenceScore": 0.82,
    "sources": ["EIA Weekly Petroleum Report", "GNews"],
    "isFallback": false,
    "fallbackReason": null
  }
}
```

**Frontend Fetch:**
```typescript
// AIAnalyzerCard.tsx
fetch(`/api/brief/${commodityId}?mode=${industryMode}`)
```

---

### Feature 3 · News & Research (Overview Tab + News Tab)

**What it does:** Displays recent market news articles for each commodity. Primary source is MongoDB (pre-scraped and stored articles); falls back to live GNews API if MongoDB has fewer than 3 articles.

| Field | Value |
|---|---|
| **Page / Component** | `components/NewsCard.tsx` (Overview) · `CommodityDetailPage.tsx` News tab |
| **Internal API Route** | `GET /api/news/[id]?limit=10` → `app/api/news/[id]/route.ts` |
| **External Data Sources** | MongoDB (`NewsArticle` collection) · GNews API (fallback) |
| **Backend Libs** | `lib/mongodb.ts` · `models/NewsArticle.ts` · GNews fetch inline in route |
| **Auth** | `GNEWS_API_KEY` (optional) · `MONGODB_URI` |
| **Fallback Logic** | MongoDB first → if < 3 articles, falls back to GNews → if GNews fails, returns whatever MongoDB had |

**GNews External Request:**
```
GET https://gnews.io/api/v4/search
    ?q="caustic+soda"+AND+market&lang=en&max=10&sortby=publishedAt&token=KEY
```

**Internal API Response (`/api/news/[id]`):**
```json
{
  "source": "mongodb",
  "articles": [
    {
      "title": "Caustic Soda Prices Rise on Asian Demand Surge",
      "description": "Spot prices for caustic soda climbed 4% this week...",
      "url": "https://example.com/article",
      "publishedAt": "2025-05-13T08:00:00Z",
      "source": { "name": "Chemical Week" },
      "isGeographicallyRelevant": true,
      "sourceCountry": "US"
    }
  ]
}
```

**Frontend Fetch:**
```typescript
// NewsCard.tsx
fetch(`/api/news/${commodityId}?limit=10`)
```

---

### Feature 4 · Identity & Regulatory (Identity Tab)

**What it does:** Displays chemical identity information — IUPAC name, molecular formula, molecular weight, CAS number, canonical SMILES, InChI/InChIKey, GHS hazard codes, and a 2D structure image. Data is fetched from PubChem and cached in MongoDB for 30 days.

| Field | Value |
|---|---|
| **Page / Component** | `components/CommodityDetailPage.tsx` — `identity` tab |
| **Internal API Route** | `GET /api/pubchem/[commodityId]` → `app/api/pubchem/[commodityId]/route.ts` |
| **External Data Sources** | PubChem PUG REST API (`pubchem.ncbi.nlm.nih.gov/rest/pug`) · PubChem PUG View (GHS hazards) |
| **Backend Libs** | `lib/pubchem.ts` → `fetchPubChemByCid()` · `models/PubChemCache.ts` (30-day cache) · `lib/mongodb.ts` |
| **Auth** | None (PubChem is free, no key required) |
| **Rate Limiting** | In-memory rate limiter in `lib/pubchem.ts` — max 4 req/sec |
| **Cache** | MongoDB `PubChemCache` collection · 30-day TTL per commodity |
| **Fallback** | `{ available: false, reason: "mixture" }` for commodities without a PubChem CID |

**PubChem External Requests (3 calls per compound):**
```
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/IUPACName,MolecularFormula,.../JSON
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/synonyms/JSON
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=GHS+Classification
```

**Internal API Response (`/api/pubchem/[commodityId]`):**
```json
{
  "available": true,
  "cached": true,
  "identity": {
    "cid": 887,
    "name": "Methanol",
    "iupacName": "methanol",
    "molecularFormula": "CH4O",
    "molecularWeight": 32.04,
    "canonicalSmiles": "CO",
    "inchi": "InChI=1S/CH4O/c1-2/h2H,1H3",
    "inchiKey": "OKKJLVBELUTLKV-UHFFFAOYSA-N",
    "casNumber": "67-56-1",
    "synonyms": ["Methanol", "Methyl alcohol", "Wood alcohol"],
    "ghsHazards": ["H225", "H301", "H311", "H331", "H370"],
    "structureImageUrl": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/887/PNG",
    "fetchedAt": "2025-05-01T10:00:00Z"
  }
}
```

**Frontend Fetch:**
```typescript
// CommodityDetailPage.tsx — fetchIdentity()
fetch(`/api/pubchem/${commodity.id}`)
```

---

### Feature 5 · Drug Enforcements (Identity Tab — Life Sciences Mode)

**What it does:** Displays FDA drug enforcement actions (recalls, market withdrawals) involving the commodity as an ingredient. Only shown when industry mode is `life-sciences`.

| Field | Value |
|---|---|
| **Page / Component** | `components/CommodityDetailPage.tsx` — `identity` tab (life-sciences mode only) |
| **Internal API Route** | `GET /api/openfda/[commodityId]` → `app/api/openfda/[commodityId]/route.ts` |
| **External Data Source** | OpenFDA Drug Enforcement API (`api.fda.gov/drug/enforcement.json`) |
| **Backend Libs** | `lib/openfda.ts` → `fetchDrugEnforcements()` |
| **Auth** | None (OpenFDA is free, no key required) |

**OpenFDA External Request:**
```
GET https://api.fda.gov/drug/enforcement.json
    ?search=reason_for_recall:"methanol"&limit=5&sort=report_date:desc
```

**Internal API Response (`/api/openfda/[commodityId]`):**
```json
{
  "commodityName": "Methanol",
  "enforcements": [
    {
      "recallNumber": "D-0123-2024",
      "recallInitiationDate": "20240315",
      "reasonForRecall": "Presence of methanol contamination above acceptable limits",
      "productDescription": "Hand Sanitizer 500ml",
      "recallingFirm": "ABC Pharma LLC",
      "status": "Ongoing",
      "classification": "Class I"
    }
  ]
}
```

**Frontend Fetch:**
```typescript
// CommodityDetailPage.tsx — fetchIdentity()
fetch(`/api/openfda/${commodity.id}`)  // only when industryMode === 'life-sciences'
```

---

### Feature 6 · Trade Flows (Trade Flows Tab)

**What it does:** Displays a bar chart of US import or export trade partners for a commodity by HS code, with percentage share and USD values. Data comes from the World Bank WITS API.

| Field | Value |
|---|---|
| **Page / Component** | `components/CommodityDetailPage.tsx` — `trade-flows` tab |
| **Internal API Route** | `GET /api/trade-flows/[commodityId]?direction=import&year=2022` → `app/api/trade-flows/[commodityId]/route.ts` |
| **External Data Source** | World Bank WITS API (`wits.worldbank.org/API/V1/SDMX/V21`) |
| **Backend Libs** | `lib/comtrade.ts` → `fetchUSTradeFlows()` |
| **Auth** | None (WITS is free, no key required) |
| **Fallback** | `{ available: false, reason: "no_wits_mapping" }` if commodity has no HS→WITS mapping |

**WITS External Request:**
```
GET https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/
    reporter/usa/year/2022/partner/all/product/{productCode}/indicator/MPRT-TRD-VL?format=JSON
```

**Internal API Response (`/api/trade-flows/[commodityId]`):**
```json
{
  "available": true,
  "commodityName": "Methanol",
  "summary": {
    "direction": "import",
    "year": 2022,
    "totalValue": 1450000000,
    "partners": [
      { "name": "Trinidad and Tobago", "iso3": "TTO", "value": 580000000, "sharePct": 40.0 },
      { "name": "Saudi Arabia",        "iso3": "SAU", "value": 290000000, "sharePct": 20.0 },
      { "name": "Chile",               "iso3": "CHL", "value": 218000000, "sharePct": 15.0 }
    ]
  }
}
```

**Frontend Fetch:**
```typescript
// CommodityDetailPage.tsx — fetchTrade()
fetch(`/api/trade-flows/${commodity.id}?direction=${tradeDir}`)
```

---

### Feature 7 · Demand Signals (Demand Signals Tab)

**What it does:** Aggregates demand-side intelligence for a commodity. Behaviour differs by industry mode:
- **Life Sciences mode:** Shows active FDA drug shortages, drugs using the ingredient, and active clinical trials from ClinicalTrials.gov
- **Specialty Chem / Energy mode:** Shows downstream sector context from internal `lib/contextData.ts`

| Field | Value |
|---|---|
| **Page / Component** | `components/CommodityDetailPage.tsx` — `demand-signals` tab |
| **Internal API Route** | `GET /api/demand-signals/[commodityId]?mode=life-sciences` → `app/api/demand-signals/[commodityId]/route.ts` |
| **External Data Sources** | OpenFDA Drug Shortages API · OpenFDA Drug Products API · ClinicalTrials.gov API v2 |
| **Backend Libs** | `lib/openfda.ts` → `fetchDrugShortages()`, `fetchDrugsUsingIngredient()` · `lib/clinicaltrials.ts` → `fetchTrialsForChemical()` · `lib/contextData.ts` (internal static data) |
| **Auth** | None (all sources are free and keyless) |

**ClinicalTrials.gov External Request:**
```
GET https://clinicaltrials.gov/api/v2/studies
    ?query.intr=methanol&filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING&pageSize=5&format=json
```

**Internal API Response (`/api/demand-signals/[commodityId]`) — Life Sciences Mode:**
```json
{
  "mode": "life-sciences",
  "shortages": [
    {
      "drugName": "Methanol Solution 70%",
      "status": "Current",
      "reason": "Manufacturing delays",
      "resolvedDate": null
    }
  ],
  "drugsUsingIngredient": [
    {
      "brandName": "Formaldehyde Solution",
      "genericName": "formaldehyde",
      "dosageForm": "Solution",
      "marketingStatus": "Prescription"
    }
  ],
  "trials": [
    {
      "nctId": "NCT05123456",
      "title": "Safety Study of Topical Formulation",
      "phase": "Phase 2",
      "status": "RECRUITING",
      "sponsor": "XYZ Pharma Inc.",
      "startDate": "2024-03",
      "conditions": ["Skin Infection"],
      "interventionName": "methanol"
    }
  ],
  "downstreamContext": null
}
```

**Internal API Response — Specialty Chem / Energy Mode:**
```json
{
  "mode": "specialty-chem",
  "shortages": [],
  "drugsUsingIngredient": [],
  "trials": [],
  "downstreamContext": {
    "demandSectors": ["Formaldehyde production", "Acetic acid synthesis", "Fuel blending"],
    "feedstockDependencies": ["Natural gas (syngas route)", "Coal (China)"],
    "bullishTriggers": ["Rising formaldehyde demand from construction sector"],
    "bearishTriggers": ["Overcapacity in China", "Natural gas price spikes"]
  }
}
```

**Frontend Fetch:**
```typescript
// CommodityDetailPage.tsx — fetchDemand()
fetch(`/api/demand-signals/${commodity.id}?mode=life-sciences`)
```

---

### Feature 8 · Macro Indicators (Macro Page)

**What it does:** Standalone page displaying CPI and PPI historical trends with year-over-year breakdown by sub-component (Core CPI, PPI Goods, PPI Services, etc.). Data sourced from the U.S. Bureau of Labor Statistics public API.

| Field | Value |
|---|---|
| **Page / Component** | `app/macro/page.tsx` · `components/MacroAnalysis.tsx` |
| **Internal API Routes** | `GET /api/bls` → `app/api/bls/route.ts` · `GET /api/macro` → `app/api/macro/route.ts` |
| **External Data Source** | U.S. Bureau of Labor Statistics (BLS) Public API v2 |
| **Backend Libs** | `lib/bls.ts` → `fetchBLSData()`, `fetchMacroData()` |
| **Auth** | None (BLS public API is free and keyless) |
| **BLS Series Used** | `CUUR0000SA0` (CPI All) · `SA0L1E` (Core CPI) · `WPUFD49104` (PPI All) · `WPUFD49207` (PPI Goods) · `WPUFD49502` (PPI Services) |

**BLS External Request:**
```
POST https://api.bls.gov/publicAPI/v2/timeseries/data/
Content-Type: application/json

{
  "seriesid": ["CUUR0000SA0", "SA0L1E", "WPUFD49104"],
  "startyear": "2020",
  "endyear": "2025"
}
```

**Internal API Response (`/api/bls` and `/api/macro`):**
```json
{
  "cpi": [
    { "date": "2025-01", "cpiAll": 314.2, "cpiCore": 320.1 }
  ],
  "ppi": [
    { "date": "2025-01", "ppiAll": 232.8, "ppiGoods": 218.4, "ppiServices": 251.2 }
  ]
}
```

**Frontend Fetch:**
```typescript
// MacroAnalysis.tsx
fetch('/api/macro')
fetch('/api/bls')
```

---

### Feature 9 · Brief Generation (Background Cron Job)

**What it does:** Not a UI feature — this is the daily background process that pre-generates AI briefs for all commodities × all industry modes and stores them in MongoDB. Triggered at 6am UTC via GitHub Actions.

| Field | Value |
|---|---|
| **Cron Route** | `GET /api/cron/generate-briefs?mode={mode}` → `app/api/cron/generate-briefs/route.ts` |
| **Auth** | `Authorization: Bearer {CRON_SECRET}` header required |
| **Script** | `npm run generate-briefs` → `lib/briefGenerator.ts` → `generateAllBriefs()` |
| **GitHub Actions** | `.github/workflows/generate-briefs.yml` — daily at 06:00 UTC |
| **Data Sources Read** | EIA · FRED · GNews · PubChem · MongoDB (NewsArticle) |
| **Data Written** | MongoDB `AIBrief` collection |
| **AI Model** | Groq `llama-3.3-70b-versatile` · `temperature: 0.3` · `max_tokens: 800` · `response_format: json_object` |
| **Secrets Required** | `MONGODB_URI` · `GROQ_API_KEY` · `EIA_API_KEY` · `FRED_API_KEY` · `NEXT_PUBLIC_BASE_URL` |

**Cron Response:**
```json
{
  "ok": true,
  "succeeded": 28,
  "failed": 2,
  "cached": 12,
  "total": 42,
  "results": [
    { "commodityId": "crude-oil", "industryMode": "energy", "success": true, "cached": false, "durationMs": 2340 }
  ]
}
```

---

## Part 2 — By Commodity

Quick reference mapping each commodity to its data source, series ID, and which external API backs its price chart.

| Commodity | ID | Category | Unit | Data Source | Series ID | Badge |
|---|---|---|---|---|---|---|
| Crude Oil (WTI) | `crude-oil` | Energy | $/bbl | EIA | `RWTC` | Gov: EIA |
| Natural Gas (Henry Hub) | `natural-gas` | Energy | $/MMBtu | EIA | `RNGWHHD` | Gov: EIA |
| Gasoline (RBOB) | `gasoline` | Energy | $/gal | EIA | `EER_EPMRR_PF4_RGC_DPG` | Gov: EIA |
| Ethanol | `ethanol` | Bio-Chemicals | $/gal | FRED | *(fredSeriesId set)* | Gov: FRED |
| Brent Crude Oil | `brent-crude` | Energy | $/bbl | FRED | `POILBREUSDM` | Gov: FRED |
| Heating Oil (No. 2) | `heating-oil` | Energy | $/gal | EIA | `null` (pending) | Mock Data |
| Diesel (Ultra-Low Sulfur) | `diesel` | Energy | $/gal | EIA | `null` (pending) | Mock Data |
| Biodiesel (B100) | `biodiesel` | Bio-Chemicals | $/gal | FRED | `null` | Mock Data |
| Isopropyl Alcohol (IPA) | `ipa` | Solvents | $/MT | FRED | `null` | Mock Data |
| Acetic Acid | `acetic-acid` | Chemicals | $/MT | FRED | `null` | Mock Data |
| DMSO | `dmso` | Solvents | $/MT | FRED | `null` | Mock Data |
| *(+ remaining commodities)* | — | — | — | — | — | — |

> **Note on "Mock Data" commodities:** The `dataSource` field still indicates EIA or FRED as the *intended* source, but the `eiaSeriesId` / `fredSeriesId` is `null` — meaning `generateMockTimeSeries()` activates automatically. These are pending endpoint verification.

**Per-commodity API chain (same for all):**

```
Frontend:  fetch(`/api/commodities/${commodity.id}`)
                        ↓
Backend:   app/api/commodities/[id]/route.ts
                        ↓
           if EIA + eiaSeriesId  → lib/eia.ts → api.eia.gov
           if FRED + fredSeriesId → lib/fred.ts → fred.stlouisfed.org
           else                  → lib/mockData.ts → deterministic mock
                        ↓
Response:  { id, source, series: [{date, price}], currentPrice, change, changePct }
```

**Non-price APIs per commodity (all commodities share the same routes, parameter is `commodityId`):**

| Feature | Route | Availability |
|---|---|---|
| AI Brief | `/api/brief/[commodityId]` | All commodities (if brief generated) |
| News | `/api/news/[id]` | All commodities |
| Chemical Identity | `/api/pubchem/[commodityId]` | Only commodities with `pubchemCid` set |
| Drug Enforcements | `/api/openfda/[commodityId]` | Life-sciences mode only |
| Trade Flows | `/api/trade-flows/[commodityId]` | Only commodities with a WITS product mapping |
| Demand Signals | `/api/demand-signals/[commodityId]` | All commodities (content varies by mode) |

---

## Summary — All Internal API Routes

| Route | Method | External Source(s) | Frontend Consumer |
|---|---|---|---|
| `/api/commodities/[id]` | GET | EIA / FRED / Mock | `CommodityChart`, `CommodityCard` |
| `/api/brief/[commodityId]` | GET | MongoDB (AIBrief) | `AIAnalyzerCard` |
| `/api/news/[id]` | GET | MongoDB + GNews | `NewsCard`, Detail page News tab |
| `/api/pubchem/[commodityId]` | GET | PubChem + MongoDB cache | Detail page Identity tab |
| `/api/openfda/[commodityId]` | GET | OpenFDA | Detail page Identity tab (LS mode) |
| `/api/trade-flows/[commodityId]` | GET | World Bank WITS | Detail page Trade Flows tab |
| `/api/demand-signals/[commodityId]` | GET | OpenFDA + ClinicalTrials.gov | Detail page Demand Signals tab |
| `/api/bls` | GET | BLS Public API | `MacroAnalysis` |
| `/api/macro` | GET | BLS Public API | `MacroAnalysis` |
| `/api/cron/generate-briefs` | GET | Groq + all price APIs | GitHub Actions cron only |

---

## Environment Variables Reference

| Variable | Required | Used By |
|---|---|---|
| `MONGODB_URI` | Yes | All MongoDB reads/writes |
| `GROQ_API_KEY` | Yes (for AI) | `lib/groq.ts`, brief generation |
| `EIA_API_KEY` | Optional | `lib/eia.ts` |
| `FRED_API_KEY` | Optional | `lib/fred.ts` |
| `GNEWS_API_KEY` | Optional | `/api/news/[id]` fallback |
| `CRON_SECRET` | Yes (for cron) | `/api/cron/generate-briefs` auth |
| `NEXT_PUBLIC_BASE_URL` | Recommended | `lib/briefContext.ts` self-fetch |
| `VERCEL_URL` | Auto (Vercel) | `lib/briefContext.ts` self-fetch fallback |
