'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, X, DollarSign, Target, Shield } from 'lucide-react'
import { Position, Signal, SIG, sigL, Lang } from './types'

interface LivePrice {
  price: number
  priceChangePct: number
}

interface PortfolioProps {
  lang: Lang
  onAnalyze: (ticker: string) => void
}

const EMPTY_FORM = {
  ticker: '',
  companyName: '',
  entryPrice: '',
  quantity: '',
  stopLoss: '',
  target1: '',
  target2: '',
  signal: 'buy' as Signal,
  notes: '',
}

export default function Portfolio({ lang, onAnalyze }: PortfolioProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const T = (en: string, ar: string) => lang === 'ar' ? ar : en

  // ✅ تحميل المحفظة من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alphavest-portfolio')
      if (saved) setPositions(JSON.parse(saved))
    } catch { }
  }, [])

  // ✅ حفظ المحفظة في localStorage
  const savePositions = (newPositions: Position[]) => {
    setPositions(newPositions)
    localStorage.setItem('alphavest-portfolio', JSON.stringify(newPositions))
  }

  // ✅ جلب الأسعار الحية
  useEffect(() => {
    if (positions.length === 0) return
    const fetchPrices = async () => {
      try {
        const tickers = [...new Set(positions.map(p => p.ticker))]
        const results: Record<string, LivePrice> = {}
        await Promise.all(tickers.map(async (ticker) => {
          try {
            const r = await fetch(`/api/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticker, lang: 'en' })
            })
            const data = await r.json()
            if (data.price) {
              results[ticker] = {
                price: data.price,
                priceChangePct: data.priceChangePct || 0
              }
            }
          } catch { }
        }))
        setLivePrices(results)
      } catch { }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 5 * 60 * 1000) // كل 5 دقائق
    return () => clearInterval(interval)
  }, [positions])

  // ✅ إضافة صفقة جديدة
  const addPosition = () => {
    if (!form.ticker || !form.entryPrice || !form.quantity) return
    const newPosition: Position = {
      id: Date.now().toString(),
      ticker: form.ticker.toUpperCase(),
      companyName: form.companyName || form.ticker.toUpperCase(),
      entryPrice: parseFloat(form.entryPrice),
      quantity: parseFloat(form.quantity),
      entryDate: new Date().toISOString().split('T')[0],
      stopLoss: parseFloat(form.stopLoss) || 0,
      target1: parseFloat(form.target1) || 0,
      target2: parseFloat(form.target2) || 0,
      signal: form.signal,
      notes: form.notes,
    }
    savePositions([...positions, newPosition])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  // ✅ حذف صفقة
  const removePosition = (id: string) => {
    savePositions(positions.filter(p => p.id !== id))
  }

  // ✅ حساب P&L
  const calcPnL = (pos: Position) => {
    const live = livePrices[pos.ticker]
    if (!live) return null
    const currentValue = live.price * pos.quantity
    const entryValue = pos.entryPrice * pos.quantity
    const pnl = currentValue - entryValue
    const pnlPct = ((live.price - pos.entryPrice) / pos.entryPrice) * 100
    return { pnl, pnlPct, currentPrice: live.price, currentValue, entryValue }
  }

  // ✅ حساب إجمالي المحفظة
  const totalStats = positions.reduce((acc, pos) => {
    const calc = calcPnL(pos)
    if (!calc) return acc
    return {
      totalValue: acc.totalValue + calc.currentValue,
      totalCost: acc.totalCost + calc.entryValue,
      totalPnL: acc.totalPnL + calc.pnl,
    }
  }, { totalValue: 0, totalCost: 0, totalPnL: 0 })

  const totalPnLPct = totalStats.totalCost > 0
    ? (totalStats.totalPnL / totalStats.totalCost) * 100
    : 0

  // ✅ حالة الصفقة
  const getStatus = (pos: Position) => {
    const live = livePrices[pos.ticker]
    if (!live) return null
    const p = live.price
    if (pos.stopLoss > 0 && p <= pos.stopLoss) return { label: T('Stop Hit','وقف الخسارة'), color: '#E85555' }
    if (pos.target2 > 0 && p >= pos.target2) return { label: T('Target 2 ✓','الهدف 2 ✓'), color: '#2EC98A' }
    if (pos.target1 > 0 && p >= pos.target1) return { label: T('Target 1 ✓','الهدف 1 ✓'), color: '#2EC98A' }
    return { label: T('Active','نشطة'), color: '#E8A630' }
  }

  return (
    <div>
      {/* ✅ Header */}
      <div className="ph">
        <div>
          <h1 className="ptitle">{T('Portfolio', 'محفظتي')}</h1>
          <div className="pdate">{T('Track your open positions', 'تتبع صفقاتك المفتوحة')}</div>
        </div>
        <button className="abtn" onClick={() => setShowForm(true)}>
          <Plus size={14}/> {T('Add Position', 'إضافة صفقة')}
        </button>
      </div>

      {/* ✅ إجمالي المحفظة */}
      {positions.length > 0 && (
        <div className="port-summary">
          <div className="port-stat">
            <div className="port-stat-lbl">{T('Total Value', 'إجمالي القيمة')}</div>
            <div className="port-stat-val">${totalStats.totalValue.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </div>
          <div className="port-stat">
            <div className="port-stat-lbl">{T('Total Cost', 'إجمالي التكلفة')}</div>
            <div className="port-stat-val">${totalStats.totalCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </div>
          <div className="port-stat">
            <div className="port-stat-lbl">{T('Total P&L', 'الربح/الخسارة')}</div>
            <div className="port-stat-val" style={{color: totalStats.totalPnL >= 0 ? '#2EC98A' : '#E85555'}}>
              {totalStats.totalPnL >= 0 ? '+' : ''}${totalStats.totalPnL.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
              <span style={{fontSize:13,marginLeft:6}}>({totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%)</span>
            </div>
          </div>
          <div className="port-stat">
            <div className="port-stat-lbl">{T('Positions', 'الصفقات')}</div>
            <div className="port-stat-val">{positions.length}</div>
          </div>
        </div>
      )}

      {/* ✅ قائمة الصفقات */}
      {positions.length === 0 ? (
        <div className="empty" style={{marginTop:60}}>
          <DollarSign size={44} color="var(--t3)"/>
          <p>{T('No positions yet. Add your first trade!', 'لا توجد صفقات. أضف صفقتك الأولى!')}</p>
          <button className="abtn" onClick={() => setShowForm(true)}>
            <Plus size={14}/> {T('Add Position', 'إضافة صفقة')}
          </button>
        </div>
      ) : (
        <div className="port-grid">
          {positions.map(pos => {
            const calc = calcPnL(pos)
            const status = getStatus(pos)
            const cfg = SIG[pos.signal]
            const isProfitable = calc ? calc.pnl >= 0 : null

            return (
              <div key={pos.id} className="port-card">
                {/* Card Header */}
                <div className="port-card-top">
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span className="sc-tick">{pos.ticker}</span>
                      <span className="sc-badge" style={{color:cfg.color,background:cfg.bg,border:`0.5px solid ${cfg.border}`}}>
                        {sigL(pos.signal, lang)}
                      </span>
                    </div>
                    <div className="sc-name">{pos.companyName}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                    {status && (
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(255,255,255,0.06)',color:status.color,border:`0.5px solid ${status.color}40`}}>
                        {status.label}
                      </span>
                    )}
                    <button onClick={() => removePosition(pos.id)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--t3)',padding:2}}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>

                {/* Live Price */}
                <div className="sc-price-row">
                  {calc ? (
                    <>
                      <span className="sc-price">${calc.currentPrice.toFixed(2)}</span>
                      <span style={{color: isProfitable ? '#2EC98A' : '#E85555', fontSize:13}}>
                        {isProfitable ? '▲' : '▼'} {Math.abs(calc.pnlPct).toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="sc-price" style={{color:'var(--t3)'}}>Loading...</span>
                  )}
                </div>

                {/* Entry Info */}
                <div className="port-levels">
                  <div className="port-level">
                    <span className="sc-lv-k">{T('Entry','دخول')}</span>
                    <span className="sc-lv-v">${pos.entryPrice}</span>
                  </div>
                  <div className="port-level">
                    <span className="sc-lv-k">{T('Qty','الكمية')}</span>
                    <span className="sc-lv-v">{pos.quantity}</span>
                  </div>
                  <div className="port-level">
                    <span className="sc-lv-k">{T('Date','التاريخ')}</span>
                    <span className="sc-lv-v">{pos.entryDate}</span>
                  </div>
                </div>

                {/* P&L */}
                {calc && (
                  <div style={{background: isProfitable ? 'rgba(46,201,138,0.08)' : 'rgba(232,85,85,0.08)', borderRadius:8, padding:'8px 12px', border:`0.5px solid ${isProfitable ? '#145C3C' : '#6A2020'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:11,color:'var(--t2)'}}>{T('P&L','الربح/الخسارة')}</span>
                      <span style={{fontFamily:'monospace',fontSize:13,fontWeight:500,color: isProfitable ? '#2EC98A' : '#E85555'}}>
                        {isProfitable ? '+' : ''}${calc.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:3}}>
                      <span style={{fontSize:11,color:'var(--t2)'}}>{T('Value','القيمة')}</span>
                      <span style={{fontFamily:'monospace',fontSize:12,color:'var(--t2)'}}>
                        ${calc.currentValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Targets */}
                {(pos.stopLoss > 0 || pos.target1 > 0) && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5}}>
                    {pos.stopLoss > 0 && (
                      <div className="sc-lv">
                        <span className="sc-lv-k"><Shield size={8}/> Stop</span>
                        <span className="sc-lv-v" style={{color:'#E85555'}}>${pos.stopLoss}</span>
                      </div>
                    )}
                    {pos.target1 > 0 && (
                      <div className="sc-lv">
                        <span className="sc-lv-k"><Target size={8}/> T1</span>
                        <span className="sc-lv-v" style={{color:'#2EC98A'}}>${pos.target1}</span>
                      </div>
                    )}
                    {pos.target2 > 0 && (
                      <div className="sc-lv">
                        <span className="sc-lv-k"><Target size={8}/> T2</span>
                        <span className="sc-lv-v" style={{color:'#2EC98A'}}>${pos.target2}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {pos.notes && (
                  <div style={{fontSize:11,color:'var(--t3)',fontStyle:'italic'}}>
                    {pos.notes}
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={() => onAnalyze(pos.ticker)}
                  className="sc-more"
                  style={{background:'transparent',border:'none',cursor:'pointer',padding:0,alignSelf:'flex-end'}}
                >
                  {T('Analyze →','تحليل →')}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ✅ Form Modal */}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="panel" style={{maxWidth:480}}>
            <button className="panel-close" onClick={() => setShowForm(false)}><X size={18}/></button>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:700,marginBottom:16}}>
              {T('Add New Position','إضافة صفقة جديدة')}
            </h2>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Ticker */}
              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Ticker *','الرمز *')}</label>
                <input
                  className="sinp"
                  style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                  placeholder="AAPL"
                  value={form.ticker}
                  onChange={e => setForm({...form, ticker: e.target.value.toUpperCase()})}
                />
              </div>

              {/* Company Name */}
              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Company Name','اسم الشركة')}</label>
                <input
                  className="sinp"
                  style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                  placeholder="Apple Inc."
                  value={form.companyName}
                  onChange={e => setForm({...form, companyName: e.target.value})}
                />
              </div>

              {/* Entry Price + Quantity */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Entry Price *','سعر الدخول *')}</label>
                  <input
                    className="sinp"
                    style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                    placeholder="150.00"
                    type="number"
                    value={form.entryPrice}
                    onChange={e => setForm({...form, entryPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Quantity *','الكمية *')}</label>
                  <input
                    className="sinp"
                    style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                    placeholder="10"
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                  />
                </div>
              </div>

              {/* Stop Loss + Target 1 + Target 2 */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:11,color:'#E85555',textTransform:'uppercase',letterSpacing:'.5px'}}>Stop Loss</label>
                  <input
                    className="sinp"
                    style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                    placeholder="140.00"
                    type="number"
                    value={form.stopLoss}
                    onChange={e => setForm({...form, stopLoss: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#2EC98A',textTransform:'uppercase',letterSpacing:'.5px'}}>Target 1</label>
                  <input
                    className="sinp"
                    style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                    placeholder="165.00"
                    type="number"
                    value={form.target1}
                    onChange={e => setForm({...form, target1: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#2EC98A',textTransform:'uppercase',letterSpacing:'.5px'}}>Target 2</label>
                  <input
                    className="sinp"
                    style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                    placeholder="180.00"
                    type="number"
                    value={form.target2}
                    onChange={e => setForm({...form, target2: e.target.value})}
                  />
                </div>
              </div>

              {/* Signal */}
              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Signal','الإشارة')}</label>
                <select
                  style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4,color:'var(--t)',fontFamily:'DM Sans,sans-serif',fontSize:13}}
                  value={form.signal}
                  onChange={e => setForm({...form, signal: e.target.value as Signal})}
                >
                  <option value="strongBuy">{T('Strong Buy','شراء قوي')}</option>
                  <option value="buy">{T('Buy','شراء')}</option>
                  <option value="hold">{T('Hold','احتفاظ')}</option>
                  <option value="sell">{T('Sell','بيع')}</option>
                  <option value="strongSell">{T('Strong Sell','بيع قوي')}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Notes','ملاحظات')}</label>
                <input
                  className="sinp"
                  style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}}
                  placeholder={T('Optional notes...','ملاحظات اختيارية...')}
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
              </div>

              {/* Submit */}
              <button
                className="abtn"
                style={{marginTop:8,justifyContent:'center'}}
                onClick={addPosition}
                disabled={!form.ticker || !form.entryPrice || !form.quantity}
              >
                <Plus size={14}/> {T('Add Position','إضافة الصفقة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
