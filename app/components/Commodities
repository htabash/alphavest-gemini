'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { CommodityData, COMMODITIES_LIST } from '@/lib/market'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CommoditiesProps {
  lang: 'en' | 'ar'
}

const CATEGORIES = [
  { key: 'all',    en: 'All',    ar: 'الكل'   },
  { key: 'metals', en: 'Metals', ar: 'المعادن' },
  { key: 'energy', en: 'Energy', ar: 'الطاقة'  },
  { key: 'agri',   en: 'Agri',   ar: 'الزراعة' },
]

export default function Commodities({ lang }: CommoditiesProps) {
  const [data, setData] = useState<CommodityData[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<CommodityData | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'1M' | '3M'>('1M')
  const T = (en: string, ar: string) => lang === 'ar' ? ar : en

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/commodities')
      const json = await r.json()
      if (json.data) setData(json.data)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(c => {
    if (category === 'all') return true
    return COMMODITIES_LIST.find(i => i.symbol === c.symbol)?.category === category
  })

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('ZW') || symbol.includes('ZC') || symbol.includes('ZS')) {
      return price.toFixed(2)
    }
    return price.toFixed(2)
  }

  const getSignal = (pct: number) => {
    if (pct > 1) return { label: T('Bullish','صعودي'), color: '#2EC98A' }
    if (pct < -1) return { label: T('Bearish','هبوطي'), color: '#E85555' }
    return { label: T('Neutral','محايد'), color: '#E8A630' }
  }

  const chartData = selected
    ? (chartPeriod === '1M' ? selected.history1M : selected.history3M)
        .map((p, i) => ({ i, p }))
    : []

  const chartUp = chartData.length > 1 && chartData[chartData.length-1].p >= chartData[0].p
  const chartCol = chartUp ? '#2EC98A' : '#E85555'

  return (
    <div>
      {/* Header */}
      <div className="ph">
        <div>
          <h1 className="ptitle">{T('Commodities','السلع')}</h1>
          <div className="pdate">{T('Live commodity prices','أسعار السلع الحية')}</div>
        </div>
        <button className="rbtn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''}/> {T('Refresh','تحديث')}
        </button>
      </div>

      {/* Category Filter */}
      <div className="sector-filter">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`sfb ${category === c.key ? 'on' : ''}`}
            onClick={() => setCategory(c.key)}
          >
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
            const isUp = item.priceChangePct >= 0
            const isSelected = selected?.symbol === item.symbol

            return (
              <div
                key={item.symbol}
                className="port-card"
                style={{
                  cursor:'pointer',
                  borderColor: isSelected ? 'var(--gold)' : undefined,
                  background: isSelected ? 'var(--card2)' : undefined
                }}
                onClick={() => setSelected(isSelected ? null : item)}
              >
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:20}}>{info?.emoji}</span>
                      <div>
                        <div className="sc-tick">{lang === 'ar' ? item.nameAr : item.name}</div>
                        <div className="sc-sec">{item.symbol} · {item.unit}</div>
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize:10, padding:'2px 8px', borderRadius:20,
                    background:`${signal.color}20`, color:signal.color,
                    border:`0.5px solid ${signal.color}40`
                  }}>
                    {signal.label}
                  </span>
                </div>

                {/* Price */}
                <div className="sc-price-row">
                  <span className="sc-price">${formatPrice(item.price, item.symbol)}</span>
                  <span style={{color: isUp ? '#2EC98A' : '#E85555', fontSize:13}}>
                    {isUp ? '▲' : '▼'} {Math.abs(item.priceChangePct).toFixed(2)}%
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
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  padding:'6px 10px', borderRadius:8,
                  background: isUp ? 'rgba(46,201,138,0.08)' : 'rgba(232,85,85,0.08)',
                  border: `0.5px solid ${isUp ? '#145C3C' : '#6A2020'}`
                }}>
                  <span style={{fontSize:11,color:'var(--t2)'}}>{T('Change','التغيير')}</span>
                  <span style={{fontFamily:'monospace',fontSize:12,fontWeight:500,color: isUp ? '#2EC98A' : '#E85555'}}>
                    {isUp ? '+' : ''}${item.priceChange.toFixed(2)}
                  </span>
                </div>

                {/* 52W Range */}
                {item.week52High > 0 && (
                  <div style={{fontSize:10,color:'var(--t3)',textAlign:'center'}}>
                    52W: ${item.week52Low.toFixed(2)} — ${item.week52High.toFixed(2)}
                  </div>
                )}

                {/* ✅ Chart — يظهر عند الضغط */}
                {isSelected && chartData.length > 0 && (
                  <div style={{marginTop:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase'}}>
                        {lang === 'ar' ? item.nameAr : item.name} {T('Price','السعر')}
                      </span>
                      <div style={{display:'flex',gap:4}}>
                        {(['1M','3M'] as const).map(p => (
                          <button key={p} className={`tfb ${chartPeriod===p?'on':''}`} onClick={e => {e.stopPropagation();setChartPeriod(p)}}>{p}</button>
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
