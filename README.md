# WealthWise 💰

A personal finance dashboard built for the Indian investor. Track your SIPs, plan your retirement, benchmark against indices, and chat with an AI advisor — all in one place.

> Built with React + Vite. All data stays on **your device** (localStorage). No backend, no database.

---

## Features

- **Dashboard** — Net worth overview, corpus projection chart, goal progress
- **SIP Planner** — Add mutual fund SIPs, see projections per fund, wealth multiples
- **Retirement Planner** — Model your corpus, drawdown simulation, safe withdrawal rate calculator
- **Benchmark** — Compare your expected returns vs Nifty 50, Sensex, Midcap 150, FD, PPF
- **Net Worth Tracker** — Track all assets (MFs, stocks, FDs, gold, crypto, real estate)
- **AI Advisor** — Chat with Claude AI, which has full context of your portfolio

---

## Quick Start (Local)

### Step 1: Install Node.js
Download from [nodejs.org](https://nodejs.org) — pick the **LTS** version. Install it like any app.

### Step 2: Open Terminal
- **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter
- **Windows**: Press `Win`, type `Command Prompt`, press Enter

### Step 3: Run these commands
```bash
# Navigate to the project folder (adjust path as needed)
cd ~/Desktop/wealthwise

# Install dependencies (only needed once)
npm install

# Start the app
npm run dev
```

Open your browser and go to: **http://localhost:5173**

---

## AI Advisor Setup

The AI Advisor tab uses Claude. To enable it:

1. Get a free API key at [console.anthropic.com](https://console.anthropic.com)
2. In the project folder, create a file called `.env.local`
3. Add this line to it:
   ```
   VITE_ANTHROPIC_API_KEY=your_actual_key_here
   ```
4. Restart the app (`npm run dev`)

---

## Deploy to Vercel (Free Hosting)

1. Push this project to GitHub (create account at github.com → New Repository → upload files)
2. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
3. Click **"Add New Project"** → import your GitHub repo
4. In **Environment Variables**, add:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: your API key
5. Click **Deploy**

Your app will be live at a URL like `https://wealthwise-yourname.vercel.app` — and auto-deploys every time you push to GitHub.

---

## Project Structure

```
wealthwise/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          ← Copy this to .env.local and add your API key
└── src/
    ├── App.jsx            ← Root component, state management
    ├── index.css          ← Design system / global styles
    ├── hooks/
    │   └── useLocalStorage.js
    ├── utils/
    │   └── finance.js     ← SIP/corpus math, benchmarks, formatters
    ├── components/
    │   ├── Sidebar.jsx
    │   └── ui.jsx         ← Reusable: Card, Input, Slider, StatCard
    └── pages/
        ├── ProfileSetup.jsx
        ├── Dashboard.jsx
        ├── SIPPlanner.jsx
        ├── Retirement.jsx
        ├── Benchmark.jsx
        ├── NetWorth.jsx
        └── AIAdvisor.jsx
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool (fast dev server) |
| Recharts | Charts (area, bar, line, pie) |
| Lucide React | Icons |
| Claude API | AI Advisor |

---

## Privacy

All your financial data (SIPs, assets, profile) is stored in your **browser's localStorage**. Nothing is sent to any server except when you use the AI Advisor (which sends your portfolio summary to Claude's API).

---

## Disclaimer

This app is for **personal use and education only**. It does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions.
# Wealthwise
