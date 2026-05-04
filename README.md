# AlphaVest — AI Trading Signals (Free · Powered by Google Gemini)

## 🆓 Get FREE Gemini API Key (No Credit Card)

1. Go to **https://aistudio.google.com**
2. Click **"Get API key"** → **"Create API key"**
3. Copy the key (starts with `AIza...`)
4. Done — 100% free, 1,500 requests/day

## 🚀 Deploy to Vercel (3 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "AlphaVest with Gemini AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/alphavest.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to **https://vercel.com** → New Project → Import GitHub repo
2. Add Environment Variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIza...` (your key from aistudio.google.com)
3. Click **Deploy** ✓

Your live app: `https://alphavest.vercel.app`

## 💻 Run Locally
```bash
cp .env.example .env.local
# Edit .env.local: GEMINI_API_KEY=AIza...
npm install
npm run dev
# Open: http://localhost:3000
```

## Features
- 📈 Daily trading signals (Buy/Sell/Hold) with Entry, Stop Loss, Targets
- 🏆 Top Buy & Top Sell picks every day
- 🔍 Query any US stock for full analysis (40+ indicators)
- 📊 Interactive price charts (1M/3M/6M/1Y)
- 🤖 AI score (0-100) with breakdown
- 📰 News with sentiment analysis
- ⚖️ Sector competitor comparison
- 🌐 Arabic/English bilingual
- 📱 Fully responsive
