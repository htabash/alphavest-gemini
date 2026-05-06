'use client'
import { StockData, SIG, sigL, Lang } from './types'
import PriceChart from './PriceChart'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const SENT: Record<string,{cls:string;en:string;ar:string}> = {
  positive:{cls:'nb-pos',en:'Bullish',ar:'صعودي'},
  negative:{cls:'nb-neg',en:'Bearish',ar:'هبوطي'},
  neutral:{cls:'nb-neu',en:'Neutral',ar:'محايد'},
}

// ✅ تنسيق Market Cap
function fmtCap(v: unknown): string {
  if (typeof v === 'string' && v.includes('$')) return v
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (isNaN(n) || n === 0) return '—'
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n/1e6).toFixed(1)}M`
  return `$${n}`
}

function Row({k,v,sub,color}:{k:string;v:string;sub?:string;color?:string}) {
  return (
    <div className="irow">
      <span className="ik">{k}</span>
      <div className="ivw">
        <span className="iv" style={color?{color}:{}}>{v}</span>
        {sub && <span className="is">{sub}</span>}
      </div>
    </div>
  )
}

export default function StockDetail({data,lang,onClose}:{data:StockData;lang:Lang;onClose:()=>void}) {
  const cfg = SIG[data.signal]
  const pcp = +(data.priceChangePct||0)
  const fm = data.fundamentals as Record<string,string|number|null>
  const tc = data.technical as Record<string,string|number|null>
  const an = data.analysis
  const ar = data.analystRatings as Record<string,string|number>
  const rsiVal = +(tc.rsi||0)
  const rsiColor = rsiVal>70?'#E85555':rsiVal<30?'#2EC98A':'#C9A84C'
  const rsiLabel = rsiVal>70?(lang==='ar'?'ذروة شراء':'Overbought'):rsiVal<30?(lang==='ar'?'ذروة بيع':'Oversold'):(lang==='ar'?'محايد':'Neutral')
  const T = (en:string,ar:string) => lang==='ar'?ar:en
  const Icon = data.signal.includes('uy') ? TrendingUp : data.signal.includes('ell') ? TrendingDown : Minus
  const score = +(data.score||0)
  const scol = score>=70?'#2EC98A':score>=50?'#E8A630':'#E85555'
  const circ = 2*Math.PI*36
  const off = circ-(score/100)*circ
  const str = (v:unknown) => v!=null&&v!==''?String(v):'—'

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="panel">
        <button className="panel-close" onClick={onClose}><X size={18}/></button>

        {/* HEADER */}
        <div className="dhead">
          <div>
            <div className="dsym">{data.ticker} · {data.exchange} · {data.sector}</div>
            <div className="dname">{data.companyName}</div>
            <div className="dtags">
              <span className="tag">{data.industry}</span>
              <span className="tag">{fmtCap(data.marketCap)}</span>
              <span className="tag">β {data.beta}</span>
            </div>
            <p className="ddesc">{data.description}</p>
          </div>
          <div className="dprice-col">
            <div className="dprice">${(+(data.price||0)).toFixed(2)}</div>
            <div className={pcp>=0?'pos':'neg'} style={{fontFamily:'monospace',fontSize:13,marginTop:3}}>
              {pcp>=0?'▲':'▼'} {Math.abs(pcp).toFixed(2)}%
            </div>
            <div style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace',marginTop:2}}>H: ${data.high} · L: ${data.low}</div>
            <div className="dbadge" style={{color:cfg.color,background:cfg.bg,border:`0.5px solid ${cfg.border}`}}>
              <Icon size={13}/> {sigL(data.signal,lang)}
            </div>
            <div style={{fontSize:11,color:'var(--t2)',marginTop:6,fontFamily:'monospace'}}>
              {T('Confidence','ثقة')}: <span style={{color:cfg.color,fontWeight:500}}>{data.confidence}%</span>
            </div>
          </div>
        </div>

        {/* TRADE SETUP */}
        <div className="setup-box">
          <div className="setup-ttl">🎯 {T('Trade Setup','نقطة الصفقة')}</div>
          <div className="setup-g4">
            <div className="setup-item"><div className="sik">{T('Entry','دخول')}</div><div className="siv">{data.entry}</div></div>
            <div className="setup-item"><div className="sik">{T('Stop Loss','وقف الخسارة')}</div><div className="siv" style={{color:'#E85555'}}>{data.stopLoss}</div></div>
            <div className="setup-item"><div className="sik">{T('Target 1','الهدف 1')}</div><div className="siv" style={{color:'#2EC98A'}}>{data.target1}</div></div>
            <div className="setup-item"><div className="sik">{T('Target 2','الهدف 2')}</div><div className="siv" style={{color:'#2EC98A'}}>{data.target2}</div></div>
          </div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:8}}>
            ⏱ {T('Timeframe','الإطار الزمني')}: <span style={{color:'var(--gold)',fontFamily:'monospace'}}>{data.timeframe}</span>
          </div>
        </div>

        {/* CHART */}
        <div className="dcard">
          <PriceChart prices={data.historicalPrices||{}} ticker={data.ticker} s1={+(tc.support1||0)||undefined} r1={+(tc.resistance1||0)||undefined}/>
        </div>

        {/* SCORE + DAY STATS */}
        <div className="grid2">
          <div className="dcard">
            <div className="clbl">{T('AI Score','النتيجة')}</div>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{position:'relative',width:90,height:90,flexShrink:0}}>
                <svg width="90" height="90" viewBox="0 0 90 90" style={{transform:'rotate(-90deg)'}}>
                  <circle cx="45" cy="45" r="36" fill="none" stroke="#1A2640" strokeWidth="6"/>
                  <circle cx="45" cy="45" r="36" fill="none" stroke={scol} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ.toFixed(1)} strokeDashoffset={off.toFixed(1)} style={{transition:'stroke-dashoffset 1.5s ease'}}/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontFamily:'monospace',fontSize:20,fontWeight:500,color:scol}}>{score}</span>
                </div>
              </div>
              <div style={{flex:1}}>
                {Object.entries(data.scoreBreakdown||{}).map(([k,v])=>{
                  const cols:Record<string,string>={fundamental:'#3A7BD5',technical:'#C9A84C',sentiment:'#2EC98A',momentum:'#E8A630'}
                  const c = cols[k]||'#888'
                  return (
                    <div key={k} style={{marginBottom:7}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                        <span style={{fontSize:10,color:'var(--t2)',textTransform:'capitalize'}}>{k}</span>
                        <span style={{fontSize:10,fontFamily:'monospace',color:c}}>{v}</span>
                      </div>
                      <div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${v}%`,background:c,borderRadius:2}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="dcard">
            <div className="clbl">{T('Day Stats','إحصائيات اليوم')}</div>
            <Row k={T('Open','الافتتاح')} v={`$${data.open}`}/>
            <Row k={T('High','الأعلى')} v={`$${data.high}`}/>
            <Row k={T('Low','الأدنى')} v={`$${data.low}`}/>
            <Row k={T('Volume','الحجم')} v={data.volume}/>
            <Row k={T('Avg Volume','متوسط الحجم')} v={data.avgVolume}/>
            <Row k={T('52W High','أعلى 52 أسبوع')} v={`$${data.week52High}`}/>
            <Row k={T('52W Low','أدنى 52 أسبوع')} v={`$${data.week52Low}`}/>
          </div>
        </div>

        {/* FUNDAMENTALS + TECHNICAL */}
        <div className="grid2">
          <div className="dcard">
            <div className="clbl">{T('Fundamentals','الأساسيات')}</div>
            <Row k={T('Revenue','الإيرادات')} v={str(fm.revenue)} sub={str(fm.revenueGrowth)}/>
            <Row k={T('Net Income','صافي الربح')} v={str(fm.netIncome)} sub={str(fm.netMargin)}/>
            <Row k={T('EPS','ربح السهم')} v={str(fm.eps)} sub={str(fm.epsGrowth)}/>
            <Row k={T('P/E','مكرر الأرباح')} v={str(fm.pe)} sub={`Fwd ${str(fm.forwardPE)}`}/>
            <Row k="EBITDA" v={str(fm.ebitda)}/>
            <Row k={T('Free Cash Flow','التدفق النقدي')} v={str(fm.freeCashFlow)}/>
            <Row k={T('Debt/Equity','الدين/حقوق')} v={str(fm.debtEquity)}/>
            <Row k={T('ROE','العائد على حقوق')} v={str(fm.roe)}/>
          </div>
          <div className="dcard">
            <div className="clbl">{T('Technical','الفني')}</div>
            <Row k={T('Trend','الاتجاه')} v={str(tc.trend)} color="#2EC98A"/>
            <Row k="RSI" v={`${rsiVal} — ${rsiLabel}`} color={rsiColor}/>
            <Row k="MACD" v={str(tc.macd)} color="#2EC98A"/>
            <Row k={T('SMA 20','م.متحرك 20')} v={`$${tc.sma20}`}/>
            <Row k={T('SMA 50','م.متحرك 50')} v={`$${tc.sma50}`}/>
            <Row k={T('SMA 200','م.متحرك 200')} v={`$${tc.sma200}`}/>
            <Row k={T('Support','الدعم')} v={`$${tc.support1} / $${tc.support2}`} color="#2EC98A"/>
            <Row k={T('Resistance','المقاومة')} v={`$${tc.resistance1} / $${tc.resistance2}`} color="#E85555"/>
          </div>
        </div>

        {/* AI ANALYSIS */}
        <div className="dcard">
          <div className="clbl">🤖 {T('AI Analysis','تحليل الذكاء الاصطناعي')}</div>
          <p className="asum">{an.summary}</p>
          <div className="grid2" style={{marginTop:12,marginBottom:0}}>
            {an.bullish?.length>0&&(
              <div className="aib bull">
                <div className="aibt bull-t">▲ {T('Bullish Factors','عوامل صعودية')}</div>
                <ul>{an.bullish.map((b,i)=><li key={i}>{b}</li>)}</ul>
              </div>
            )}
            {an.bearish?.length>0&&(
              <div className="aib bear">
                <div className="aibt bear-t">▼ {T('Risk Factors','عوامل المخاطرة')}</div>
                <ul>{an.bearish.map((b,i)=><li key={i}>{b}</li>)}</ul>
              </div>
            )}
          </div>
          {an.catalysts?.length>0&&(
            <div style={{marginTop:10,background:'var(--gold-bg)',borderRadius:8,padding:'9px 12px',border:'0.5px solid rgba(201,168,76,.2)'}}>
              <div style={{fontSize:10,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>⚡ {T('Catalysts','المحفزات')}</div>
              {an.catalysts.map((c,i)=><div key={i} style={{fontSize:12,color:'var(--t2)',marginBottom:3}}>· {c}</div>)}
            </div>
          )}
        </div>

        {/* ANALYST RATINGS */}
        <div className="dcard">
          <div className="clbl">📊 {T('Analyst Ratings','تقييمات المحللين')}</div>
          <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:500,fontFamily:'monospace',color:'#2EC98A'}}>{str(ar.buy)}</div><div style={{fontSize:10,color:'var(--t3)'}}>{T('Buy','شراء')}</div></div>
            <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:500,fontFamily:'monospace',color:'#E8A630'}}>{str(ar.hold)}</div><div style={{fontSize:10,color:'var(--t3)'}}>{T('Hold','احتفاظ')}</div></div>
            <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:500,fontFamily:'monospace',color:'#E85555'}}>{str(ar.sell)}</div><div style={{fontSize:10,color:'var(--t3)'}}>{T('Sell','بيع')}</div></div>
            <div style={{flex:1,minWidth:140}}>
              <div style={{fontSize:12,color:'var(--t2)'}}>{T('Avg Target','الهدف المتوسط')}: <span style={{color:'var(--gold)',fontFamily:'monospace'}}>{str(ar.avgTarget)}</span></div>
              <div style={{fontSize:12,color:'var(--t2)',marginTop:3}}>{T('High','أعلى')}: <span style={{color:'#2EC98A',fontFamily:'monospace'}}>{str(ar.highTarget)}</span> · {T('Low','أدنى')}: <span style={{color:'#E85555',fontFamily:'monospace'}}>{str(ar.lowTarget)}</span></div>
              <div style={{marginTop:6,fontSize:13,fontWeight:500,color:'#2EC98A'}}>{str(ar.consensus)}</div>
            </div>
          </div>
        </div>

        {/* NEWS */}
        <div className="dcard">
          <div className="clbl">📰 {T('News & Sentiment','الأخبار والمشاعر')}</div>
          {(data.news||[]).map((n,i)=>{
            const s = SENT[n.sentiment]||SENT.neutral
            return (
              <div key={i} className="nitem">
                <div className="ntitle">{n.headline}</div>
                <div className="nmeta"><span className="nsrc">{n.source} · {n.time}</span><span className={`nbadge ${s.cls}`}>{lang==='ar'?s.ar:s.en}</span></div>
              </div>
            )
          })}
        </div>

        {/* COMPETITORS */}
        <div className="dcard">
          <div className="clbl">⚖️ {T('Sector Comparison','مقارنة القطاع')}</div>
          <div className="ctable-h">
            <span>{T('Ticker','الرمز')}</span>
            <span>{T('Price','السعر')}</span>
            <span>Mkt Cap</span>
            <span>P/E</span>
            <span>YTD</span>
            <span>{T('Signal','الإشارة')}</span>
          </div>
          <div className="ctable-me">
            <span style={{color:'var(--gold)',fontFamily:'monospace',fontWeight:500}}>{data.ticker}</span>
            <span style={{fontFamily:'monospace',fontSize:12}}>${(+(data.price||0)).toFixed(2)}</span>
            <span style={{fontFamily:'monospace',fontSize:12}}>{fmtCap(data.marketCap)}</span>
            <span style={{fontFamily:'monospace',fontSize:12}}>{str(fm.pe)}</span>
            <span style={{fontFamily:'monospace',fontSize:12}}>—</span>
            <span style={{fontSize:11,color:cfg.color}}>{sigL(data.signal,lang)}</span>
          </div>
          {(data.competitors||[]).map((c)=>{
            const sig = c.signal as string
            const cs = SIG[sig as keyof typeof SIG]||SIG.hold
            const ytd = str(c.ytd)
            return (
              <div key={str(c.ticker)} className="ctable-row">
                <span style={{fontFamily:'monospace',fontSize:12,fontWeight:500}}>{str(c.ticker)}</span>
                <span style={{fontFamily:'monospace',fontSize:12}}>${str(c.price)}</span>
                <span style={{fontFamily:'monospace',fontSize:12}}>{fmtCap(c.marketCap)}</span>
                <span style={{fontFamily:'monospace',fontSize:12}}>{str(c.pe)}</span>
                <span style={{fontFamily:'monospace',fontSize:12,color:ytd.startsWith('+')?'#2EC98A':'#E85555'}}>{ytd}</span>
                <span style={{fontSize:11,color:cs.color}}>{sigL(sig as keyof typeof SIG,lang)}</span>
              </div>
            )
          })}
        </div>

        <div className="disc">{T('For informational purposes only. Not financial advice.','للأغراض التعليمية فقط. ليست نصيحة مالية.')}</div>
      </div>
    </div>
  )
}
