<div align="center">

# Adsy Global: Procurement Intelligence Platform

**AI-Powered B2B Chemical Procurement Dashboard**

*Built by [Sanidhya Kumar Ghosal](https://github.com/Sanidhya-14) · [Adsy Global Solutions](https://github.com/Sanidhya-14/adsy_market_tool)*

---

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama--3-F55036?style=for-the-badge)](https://groq.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

> **Note:** This project is currently undergoing a v1 refactor. Some features described below are being significantly expanded or replaced. See AGENTS.md.

---

## Overview

Chemical procurement teams operate in an environment of **deliberate information asymmetry**. Suppliers control pricing visibility; buyers are left negotiating blind.

**Adsy Global: Procurement Intelligence Platform** closes that gap.

This enterprise dashboard aggregates real-time feedstock prices from authoritative public data sources and runs **live AI sentiment analysis** on market news — delivering procurement teams the hard data and strategic directives they need to walk into supplier negotiations with confidence.

> *"Know the real cost before the first email. Win the negotiation before the first call."*

---

## ✨ Features

### 📊 Market Data Engine
Real-time API ingestion for key feedstocks (Crude Oil, Natural Gas, Gasoline, Benzene, and more) via the U.S. EIA and FRED APIs.

### 🤖 AI Procurement Advisor
Integrates the **GNews API** for live market news ingestion and **Groq (Llama-3)** for sub-second inference. The advisor produces:
- A **Bullish / Bearish / Neutral** market sentiment verdict
- Specific, time-bound **procurement directives** (e.g., *"Feedstock volatility elevated — lock in Q3 contracts before Friday's OPEC decision"*)
- Being expanded into a fuller AI Analyzer in v1

### 🛡️ Graceful Degradation Engine
No API keys? No internet? No problem. A **deterministic pseudo-random mock data engine** ensures every chart, metric, and UI component renders with realistic data in all environments — making demos, reviews, and local development seamless without any configuration.

### 📄 Export-Ready Negotiation Briefs
One-click generation of clean, print-optimized **Negotiation Brief** documents. Structured for direct attachment to supplier emails — market data, cost breakdowns, and AI directives formatted for executive and procurement audiences.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Data Visualization | Recharts |
| Icons | Lucide React |
| AI Inference | Groq API — Llama-3 |
| Market News | GNews API |
| Energy Data | U.S. EIA API |
| Macro Data | FRED API (Federal Reserve) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18.0` or higher
- npm `v9.0` or higher

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Sanidhya-14/adsy_market_tool.git
cd adsy_market_tool
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.local.example .env.local
```

Open `.env.local` and populate your API keys:

```env
# AI Inference — https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key

# Market News — https://gnews.io/
GNEWS_API_KEY=your_gnews_api_key

# Energy Data — https://www.eia.gov/opendata/
EIA_API_KEY=your_eia_api_key

# Macro / Commodity Data — https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=your_fred_api_key
```

> **Note:** All API keys are optional. If any key is absent or a request fails, the platform automatically falls back to its built-in mock data engine. The full UI remains functional and presentable in all states.

**4. Start the development server**

```bash
npm run dev
```

**5. Open in browser**

```
http://localhost:3000
```

---

## 📁 Project Structure

```
adsy_market_tool/
├── app/
│   ├── api/               # Next.js API routes (data fetchers, AI endpoints)
│   ├── commodity/         # Commodity detail pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main dashboard entry point
├── components/            # Reusable UI components
├── lib/                   # Utility functions, mock data engine, proxy models
├── public/
├── .env.local.example
└── README.md
```

---

## 🔑 API Keys & Data Sources

| Service | Purpose | Free Tier |
|---|---|---|
| [Groq](https://console.groq.com/) | Llama-3 AI inference for market sentiment | ✅ Yes |
| [GNews](https://gnews.io/) | Real-time chemical & commodity news | ✅ Yes |
| [U.S. EIA](https://www.eia.gov/opendata/) | Crude oil, natural gas, energy pricing | ✅ Yes |
| [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) | Macro commodity indices, PPI data | ✅ Yes |

All services listed above offer free-tier API access sufficient for development and demonstration use.

---

## 🤝 Contributing

Contributions, issue reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow the existing code style and include relevant tests where applicable.

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Adsy Global: Procurement Intelligence Platform**

Engineered by **Sanidhya Kumar Ghosal**

*Adsy Global Solutions · 2025*

[GitHub](https://github.com/Sanidhya-14/adsy_market_tool) · [Report an Issue](https://github.com/Sanidhya-14/adsy_market_tool/issues)

</div>
