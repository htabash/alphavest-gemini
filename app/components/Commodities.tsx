'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, Zap, Plus, CheckCircle } from 'lucide-react'
import { CommodityData, COMMODITIES_LIST } from '@/lib/market'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Position, Signal } from './types'

interface CommoditiesProps {
  lang: 'en' | 'ar'
}

interface CommoditySignal {
  symbol: string
  signal: 'buy' | 'sell' | 'hold'
  confidence: number
  entry: number
  stopLoss: number
  target1: number
  target2: number
  quantity: number
  reasoning: string
  catalyst: string
}

const CATEGORIES = [
  { key: 'all',    en: 'All',    ar: 'الكل'   },
  { key: 'metals', en: 'Metals', ar: 'المعادن' },
  { key: 'energy', en: 'Energy', ar: 'الطاقة'  },
  { key: 'agri',   en: 'Agri',   ar: 'الزراعة' },
]

const SIG_CONFIG = {
  buy:  { en: 'BUY',  ar: 'شراء',    color: '#2EC98A', bg: 'rgba(46,201,138,.13)',  border: '#145C3C' },
  sell: { en: 'SELL', ar: 'بيع',     color: '#E85555', bg: 'rgba(232,85,85,.13)',   border: '#6A2020' },
  hold: { en: 'HOLD', ar: 'احتفاظ', color: '#E8A630', bg: 'rgba(232,166,48,.13)', border: 'rgba(232,166,48,.35)' },
}

export default function Commodities({ lang }: CommoditiesProps) {
  const [data, setData] = useState<CommodityData[]>([])
  const [signals, setSignals] = useState<CommoditySignal[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<CommodityData | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'1M' | '3M'>('1M')
  const [addedToPortfolio, setAddedToPortfolio] = useState<Set<string>>(new Set())
  const T = (en: string, ar: string) => lang === 'ar' ? ar : en

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/commodities')
      const json = await r.json()
      if (json.data) setData(json.data)
      if (json.signals) setSignals(json.signals)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // ✅ إضافة صفقة للـ Portfolio تلقائياً
  const addToPortfolio = (item: CommodityData, aiSignal: CommoditySignal) => {
    try {
      const info = COMMODITIES_LIST.find(c => c.symbol === item.symbol)
      const newPosition: Position = {
        id: `${item.symbol}-${Date.now()}`,
        ticker: item.symbol,
        companyName: lang === 'ar' ? item.nameAr : item.name,
        entryPrice: aiSignal.entry,
        quantity: aiSignal.quantity,
        entryDate: new Date().toISOString().split('T')[0],
        stopLoss: aiSignal.stopLoss,
        target1: aiSignal.target1,
        target2: aiSignal.target2,
        signal: aiSignal.signal as Signal,
        notes: `${info?.emoji || ''} AI Signal — ${aiSignal.catalyst}`,
      }

      const saved = localStorage.getItem('alphavest-portfolio')
      const existing: Position[] = saved ? JSON.parse(saved) : []

      // تحقق إذا الصفقة موجودة مسبقاً
      const alreadyExists = existing.some(p => p.ticker === item.symbol)
      if (alreadyExists) {
        alert(T(`${item.name} already in portfolio!`, `${item.nameAr} موجود في المحفظة مسبقاً!`))
        return
      }

      const updated = [...existing, newPosition]
      localStorage.setItem('alphavest-portfolio', JSON.stringify(updated))
      setAddedToPortfolio(prev => new Set([...prev, item.symbol]))

      // أزل العلامة بعد 3 ثواني
      setTimeout(() => {
        setAddedToPortfolio(prev => {
          const next = new Set(prev)
          next.delete(item.symbol)
          return next
        })
      }, 3000)

    } catch { }
  }

  const filtered = data.filter(c => {
    if (category === 'all') return true
    return COMMODITIES_LIST.find(i => i.symbol === c.symbol)?.category === category
  })

  const getSignal = (pct: number) => {
    if (pct > 1) return { label: T('Bullish','صعودي'), color: '#2EC98A' }
    if (pct < -1) return { label: T('Bearish','هبوطي'), color: '#E85555' }
    return { label: T('Neutral','محايد'), color: '#E8A630' }
  }

  const getAISignal = (symbol: string): CommoditySignal | null =>
    signals.find(s => s.symbol === symbol) || null

  const chartData = selected
    ? (chartPeriod === '1M' ? selected.history1M : selected.history3M).map((p, i) => ({ i, p }))
    : []

  const chartUp = chartData.length > 1 && chartData[chartData.length-1].p >= chartData[0].p
  const chartCol = chartUp ? '#2EC98A' : '#E85555'

  // ✅ AI Signals Summary — فقط buy/sell
  const actionableSignals = signals.filter(s => s.signal !== 'hold')

  return (
    <div>
      {/* Header */}
      <div className="ph">
        <div>
          <h1 className="ptitle">{T('Commodities','السلع')}</h1>
          <div className="pdate">{T('Live prices · AI Signals','أسعار حية · إشارات ذكاء اصطناعي')}</div>
        </div>
        <button className="rbtn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''}/> {T('Refresh','تحديث')}
        </button>
      </div>

      {/* ✅ AI Signals Banner */}
      {actionableSignals.length > 0 && (
        <div style={{
          background:'var(--card)',border:'.5px solid var(--gold3)',
          borderRadius:13,padding:'13px 16px',marginBottom:16,
          borderLeft:'3px solid var(--gold)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <Zap size={14} color="var(--gold)"/>
            <span style={{fontSize:12,fontWeight:500,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.5px'}}>
              {T('AI Trading Signals','إشارات التداول الآلي')}
            </span>
            <span style={{fontSize:10,color:'var(--t3)',marginLeft:4}}>
              {T('Updated every 30 min','يتحدث كل 30 دقيقة')}
            </span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {actionableSignals.map(sig => {
              const info = COMMODITIES_LIST.find(c => c.symbol === sig.symbol)
              const commodity = data.find(d => d.symbol === sig.symbol)
              const cfg = SIG_CONFIG[sig.signal]
              const isAdded = addedToPortfolio.has(sig.symbol)

              return (
                <div key={sig.symbol} style={{
                  display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',
                  padding:'10px 12px',borderRadius:10,
                  background:'rgba(255,255,255,0.03)',
                  border:`.5px solid ${cfg.color}30`
                }}>
                  {/* Info */}
                  <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
                    <span style={{fontSize:18}}>{info?.emoji}</span>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontFamily:'monospace',fontSize:13,fontWeight:500}}>
                          {lang === 'ar' ? commodity?.nameAr : commodity?.name || sig.symbol}
                        </span>
                        <span style={{
                          fontSize:10,padding:'1px 7px',borderRadius:20,
                          background:cfg.bg,color:cfg.color,border:`.5px solid ${cfg.border}`
                        }}>
                          {lang === 'ar' ? cfg.ar : cfg.en}
                        </span>
                        <span style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace'}}>
                          {sig.confidence}%
                        </span>
                      </div>
                      <div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{sig.reasoning}</div>
                    </div>
                  </div>

                  {/* Levels */}
                  <div style={{display:'flex',gap:12,fontFamily:'monospace',fontSize:11}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{color:'var(--t3)',fontSize:9,textTransform:'uppercase'}}>Entry</div>
                      <div style={{color:'var(--gold)'}}>${sig.entry.toFixed(2)}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{color:'var(--t3)',fontSize:9,textTransform:'uppercase'}}>Stop</div>
                      <div style={{color:'#E85555'}}>${sig.stopLoss.toFixed(2)}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{color:'var(--t3)',fontSize:9,textTransform:'uppercase'}}>T1</div>
                      <div style={{color:'#2EC98A'}}>${sig.target1.toFixed(2)}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{color:'var(--t3)',fontSize:9,textTransform:'uppercase'}}>T2</div>
                      <div style={{color:'#2EC98A'}}>${sig.target2.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* ✅ زر إضافة للمحفظة */}
                  {commodity && (
                    <button
                      onClick={() => addToPortfolio(commodity, sig)}
                      style={{
                        display:'flex',alignItems:'center',gap:5,
                        padding:'7px 14px',borderRadius:8,
                        background: isAdded ? 'rgba(46,201,138,0.15)' : cfg.bg,
                        border: `.5px solid ${isAdded ? '#2EC98A' : cfg.border}`,
                        color: isAdded ? '#2EC98A' : cfg.color,
                        cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif',
                        whiteSpace:'nowrap',transition:'all .2s'
                      }}
                    >
                      {isAdded
                        ? <><CheckCircle size={12}/> {T('Added!','تمت الإضافة!')}</>
                        : <><Plus size={12}/> {T('Add to Portfolio','إضافة للمحفظة')}</>
                      }
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="sector-filter">
        {CATEGORIES.map(c => (
          <button key={c.key} className={`sfb ${category === c.key ? 'on' : ''}`} onClick={() => setCategory(c.key)}>
            {lang === 'ar' ? c.ar : c.en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="ring"/><div className="lmsg">{T('Loading prices...','جارٍ تحميل الأسعار...')}</div></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:11,paddingBottom:30}}>
          {filtered.map(item => {
            const info = COMMODITIES_LIST.find(c => c.symbol === item.symbol)
            const signal = getSignal(item.priceChangePct)
            const aiSignal = getAISignal(item.symbol)
            const isUp = item.priceChangePct >= 0
            const isSelected = selected?.symbol === item.symbol
            const isAdded = addedToPortfolio.has(item.symbol)

            return (
              <div
                key={item.symbol}
                className="port-card"
                style={{cursor:'pointer',borderColor:isSelected?'var(--gold)':undefined,background:isSelected?'var(--card2)':undefined}}
                onClick={() => setSelected(isSelected ? null : item)}
              >
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:20}}>{info?.emoji}</span>
                    <div>
                      <div className="sc-tick">{lang === 'ar' ? item.nameAr : item.name}</div>
                      <div className="sc-sec">{item.symbol} · {item.unit}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${signal.color}20`,color:signal.color,border:`0.5px solid ${signal.color}40`}}>
                      {signal.label}
                    </span>
                    {/* ✅ AI Signal badge */}
                    {aiSignal && aiSignal.signal !== 'hold' && (
                      <span style={{
                        fontSize:9,padding:'2px 7px',borderRadius:20,
                        background:SIG_CONFIG[aiSignal.signal].bg,
                        color:SIG_CONFIG[aiSignal.signal].color,
                        border:`.5px solid ${SIG_CONFIG[aiSignal.signal].border}`
                      }}>
                        🤖 AI: {lang === 'ar' ? SIG_CONFIG[aiSignal.signal].ar : SIG_CONFIG[aiSignal.signal].en}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="sc-price-row">
                  <span className="sc-price">${item.price.toFixed(2)}</span>
                  <span style={{color:isUp?'#2EC98A':'#E85555',fontSize:13}}>
                    {isUp?'▲':'▼'} {Math.abs(item.priceChangePct).toFixed(2)}%
                  </span>
                </div>

                {/* Day Stats */}
                <div className="port-levels">
                  <div className="port-level">
                    <span className="sc-lv-k">{T('Open','الافتتاح')}</span>
                    <span className="sc-lv-v">${item.open.toFixed(2)}</span>
                  </div>
                  <div className="port-level">
                    <span className="sc-lv-k">{T('High','الأعلى')}</span>
                    <span className="sc-lv-v" style={{color:'#2EC98A'}}>${item.high.toFixed(2)}</span>
                  </div>
                  <div className="port-level">
                    <span className="sc-lv-k">{T('Low','الأدنى')}</span>
                    <span className="sc-lv-v" style={{color:'#E85555'}}>${item.low.toFixed(2)}</span>
                  </div>
                </div>

                {/* Change */}
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',borderRadius:8,background:isUp?'rgba(46,201,138,0.08)':'rgba(232,85,85,0.08)',border:`0.5px solid ${isUp?'#145C3C':'#6A2020'}`}}>
                  <span style={{fontSize:11,color:'var(--t2)'}}>{T('Change','التغيير')}</span>
                  <span style={{fontFamily:'monospace',fontSize:12,fontWeight:500,color:isUp?'#2EC98A':'#E85555'}}>
                    {isUp?'+':''}${item.priceChange.toFixed(2)}
                  </span>
                </div>

                {/* 52W */}
                {item.week52High > 0 && (
                  <div style={{fontSize:10,color:'var(--t3)',textAlign:'center'}}>
                    52W: ${item.week52Low.toFixed(2)} — ${item.week52High.toFixed(2)}
                  </div>
                )}

                {/* ✅ AI Signal Details — يظهر عند الضغط */}
                {isSelected && aiSignal && aiSignal.signal !== 'hold' && (
                  <div style={{
                    background:`${SIG_CONFIG[aiSignal.signal].color}10`,
                    border:`.5px solid ${SIG_CONFIG[aiSignal.signal].border}`,
                    borderRadius:10,padding:'10px 12px',marginTop:4
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:11,fontWeight:500,color:SIG_CONFIG[aiSignal.signal].color}}>
                        🤖 {T('AI Signal','إشارة AI')} — {lang==='ar'?SIG_CONFIG[aiSignal.signal].ar:SIG_CONFIG[aiSignal.signal].en}
                      </span>
                      <span style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace'}}>{aiSignal.confidence}% {T('confidence','ثقة')}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:5,marginBottom:8}}>
                      {[
                        {k:'Entry',v:`$${aiSignal.entry.toFixed(2)}`,c:'var(--gold)'},
                        {k:'Stop',v:`$${aiSignal.stopLoss.toFixed(2)}`,c:'#E85555'},
                        {k:'T1',v:`$${aiSignal.target1.toFixed(2)}`,c:'#2EC98A'},
                        {k:'T2',v:`$${aiSignal.target2.toFixed(2)}`,c:'#2EC98A'},
                      ].map(({k,v,c}) => (
                        <div key={k} className="sc-lv">
                          <span className="sc-lv-k">{k}</span>
                          <span className="sc-lv-v" style={{color:c}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:'var(--t2)',marginBottom:8,lineHeight:1.5}}>{aiSignal.reasoning}</div>
                    <button
                      onClick={e => { e.stopPropagation(); addToPortfolio(item, aiSignal) }}
                      style={{
                        width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                        padding:'8px',borderRadius:8,
                        background:isAdded?'rgba(46,201,138,0.15)':SIG_CONFIG[aiSignal.signal].bg,
                        border:`.5px solid ${isAdded?'#2EC98A':SIG_CONFIG[aiSignal.signal].border}`,
                        color:isAdded?'#2EC98A':SIG_CONFIG[aiSignal.signal].color,
                        cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif',transition:'all .2s'
                      }}
                    >
                      {isAdded
                        ? <><CheckCircle size={13}/> {T('Added to Portfolio!','تمت الإضافة للمحفظة!')}</>
                        : <><Plus size={13}/> {T('Add to Portfolio','إضافة للمحفظة')}</>
                      }
                    </button>
                  </div>
                )}

                {/* Chart */}
                {isSelected && chartData.length > 0 && (
                  <div style={{marginTop:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase'}}>
                        {lang==='ar'?item.nameAr:item.name} {T('Price','السعر')}
                      </span>
                      <div style={{display:'flex',gap:4}}>
                        {(['1M','3M'] as const).map(p => (
                          <button key={p} className={`tfb ${chartPeriod===p?'on':''}`}
                            onClick={e => {e.stopPropagation();setChartPeriod(p)}}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
                        <defs>
                          <linearGradient id={`cg${item.symbol.replace(/[^a-z]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartCol} stopOpacity={0.18}/>
                            <stop offset="100%" stopColor={chartCol} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="i" hide/>
                        <YAxis domain={['auto','auto']} hide/>
                        <Tooltip
                          contentStyle={{background:'#111926',border:'0.5px solid #1A2640',borderRadius:8,fontSize:11,fontFamily:'monospace'}}
                          formatter={(v) => [`$${v}`, lang==='ar'?item.nameAr:item.name]}
                          labelFormatter={() => ''}
                        />
                        <Area type="monotone" dataKey="p" stroke={chartCol} strokeWidth={1.5}
                          fill={`url(#cg${item.symbol.replace(/[^a-z]/gi,'')})`} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
