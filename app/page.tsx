'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, TrendingUp, Zap, BarChart2 } from 'lucide-react'
import { SignalsData, StockData, SIG, sigL, Lang } from './components/types'
import SignalCard from './components/SignalCard'
import StockDetail from './components/StockDetail'

const TX = {
  en:{ title:'AlphaVest', sub:'US Trading Signals · AI Powered', signals:"Today's Signals", query:'Stock Query', refresh:'Refresh', loadSig:'Generating today\'s signals...', loadStock:'Analyzing stock...', ph:'Search ticker... AAPL, NVDA, TSLA', empty:'Enter a US ticker for complete analysis', disc:'For informational purposes only. Not financial advice. · AlphaVest © 2026 · Powered by Gemini AI' },
  ar:{ title:'AlphaVest', sub:'توصيات التداول الأمريكي · مدعوم بالذكاء الاصطناعي', signals:'توصيات اليوم', query:'استعلام سهم', refresh:'تحديث', loadSig:'جارٍ إنشاء توصيات اليوم...', loadStock:'جارٍ تحليل السهم...', ph:'ابحث عن سهم... AAPL أو NVDA أو TSLA', empty:'أدخل رمز سهم أمريكي للحصول على تحليل كامل', disc:'للأغراض التعليمية فقط. ليست نصيحة مالية. · AlphaVest © 2026 · Gemini AI' }
}
const QUICK = ['NVDA','AAPL','MSFT','TSLA','AMZN','META','GOOGL','JPM','AMAT','AMD','NFLX','INTC']

export default function Home() {
  const [lang, setLang] = useState<Lang>('en')
  const [tab, setTab] = useState<'signals'|'query'>('signals')
  const [signals, setSignals] = useState<SignalsData|null>(null)
  const [loadSig, setLoadSig] = useState(false)
  const [search, setSearch] = useState('')
  const [loadStock, setLoadStock] = useState(false)
  const [stock, setStock] = useState<StockData|null>(null)
  const tx = TX[lang]

  const fetchSignals = useCallback(async () => {
    setLoadSig(true)
    try { const r = await fetch(`/api/signals?lang=${lang}`); setSignals(await r.json()) }
    catch(e){console.error(e)} finally{setLoadSig(false)}
  }, [lang])

  useEffect(()=>{fetchSignals()},[fetchSignals])

  const analyze = async (ticker: string) => {
    if(!ticker.trim()) return
    setLoadStock(true); setStock(null); setTab('query')
    try { const r = await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticker:ticker.toUpperCase(),lang})}); setStock(await r.json()) }
    catch(e){console.error(e)} finally{setLoadStock(false)}
  }

  const sentCol = (s:string) => s==='Bullish'||s==='صعودي'?'#2EC98A':s==='Bearish'||s==='هبوطي'?'#E85555':'#E8A630'

  return (
    <div className="app" dir={lang==='ar'?'rtl':'ltr'}>
      <header className="hdr">
        <div className="hdr-in">
          <div className="logo"><Zap size={17} color="#C9A84C" strokeWidth={2.5}/><span className="logo-t">Alpha<b>Vest</b></span></div>
          <nav className="hnav">
            <button className={`ntab ${tab==='signals'?'on':''}`} onClick={()=>setTab('signals')}><TrendingUp size={14}/> {tx.signals}</button>
            <button className={`ntab ${tab==='query'?'on':''}`} onClick={()=>setTab('query')}><Search size={14}/> {tx.query}</button>
          </nav>
          <div className="lang-row">
            <button className={`lb ${lang==='en'?'on':''}`} onClick={()=>setLang('en')}>EN</button>
            <button className={`lb ${lang==='ar'?'on':''}`} onClick={()=>setLang('ar')}>عر</button>
          </div>
        </div>
      </header>

      <main className="main">
        {tab==='signals'&&(
          <div>
            <div className="ph">
              <div><h1 className="ptitle">{tx.signals}</h1>{signals&&<div className="pdate">{signals.date}</div>}</div>
              <button className="rbtn" onClick={fetchSignals} disabled={loadSig}><RefreshCw size={13} className={loadSig?'spin':''}/> {tx.refresh}</button>
            </div>

            {signals?.marketSummary&&(
              <div className="mbar">
                {[['S&P 500',signals.marketSummary.sp500],['NASDAQ',signals.marketSummary.nasdaq],['VIX',signals.marketSummary.vix],[lang==='ar'?'المشاعر':'Sentiment',signals.marketSummary.sentiment]].map(([k,v])=>(
                  <div key={k} className="mi"><span className="mk">{k}</span><span className="mv" style={{color:k==='Sentiment'||k==='المشاعر'?sentCol(v):(v.startsWith?.('+'))?'#2EC98A':v.startsWith?.('-')?'#E85555':'inherit'}}>{v}</span></div>
                ))}
                <div className="mnote">{signals.marketSummary.note}</div>
              </div>
            )}

            {signals&&(
              <div className="tpicks">
                <div className="tp buy-tp"><span className="tpl">⚡ {lang==='ar'?'أفضل شراء':'Top Buy'}</span><span className="tpt" style={{color:'#2EC98A'}}>{signals.topBuy}</span></div>
                <div className="tp sell-tp"><span className="tpl">⚡ {lang==='ar'?'أفضل بيع':'Top Sell'}</span><span className="tpt" style={{color:'#E85555'}}>{signals.topSell}</span></div>
                <div className="tp watch-tp"><span className="tpl">👁 {lang==='ar'?'قائمة المراقبة':'Watchlist'}</span><span className="tpt" style={{color:'var(--gold)'}}>{signals.watchlist?.join(' · ')}</span></div>
              </div>
            )}

            {loadSig&&<div className="loading"><div className="ring"/><div className="lmsg">{tx.loadSig}</div></div>}
            {!loadSig&&signals?.signals&&(
              <div className="sgrid">{signals.signals.map(s=><SignalCard key={s.ticker} s={s} lang={lang} onClick={()=>analyze(s.ticker)}/>)}</div>
            )}
          </div>
        )}

        {tab==='query'&&(
          <div>
            <div className="ph"><h1 className="ptitle">{tx.query}</h1></div>
            <div className="sbox-wrap">
              <div className="sbox">
                <Search size={15} color="var(--t3)"/>
                <input className="sinp" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&analyze(search)} placeholder={tx.ph}/>
                <button className="abtn" onClick={()=>analyze(search)} disabled={loadStock}>
                  {loadStock?<span className="spin-sm"/>:<><BarChart2 size={13}/> {lang==='ar'?'تحليل':'Analyze'}</>}
                </button>
              </div>
              <div className="qchips">{QUICK.map(t=><button key={t} className="qchip" onClick={()=>{setSearch(t);analyze(t)}}>{t}</button>)}</div>
            </div>
            {loadStock&&<div className="loading"><div className="ring"/><div className="lmsg">{tx.loadStock}</div></div>}
            {!loadStock&&!stock&&<div className="empty"><BarChart2 size={44} color="var(--t3)"/><p>{tx.empty}</p></div>}
          </div>
        )}
      </main>

      {stock&&!loadStock&&<StockDetail data={stock} lang={lang} onClose={()=>setStock(null)}/>}

      <footer className="ftr"><div className="ftr-in">{tx.disc}</div></footer>
    </div>
  )
}
