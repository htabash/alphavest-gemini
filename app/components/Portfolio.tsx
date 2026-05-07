'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, X, DollarSign, Target, Shield, Bell, BellOff, CheckCircle } from 'lucide-react'
import { Position, Signal, SIG, sigL, Lang } from './types'

interface LivePrice {
  price: number
  priceChangePct: number
}

interface Alert {
  id: string
  ticker: string
  type: 'entry' | 'target1' | 'target2' | 'stop'
  price: number
  message: string
  timestamp: string
  read: boolean
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
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const triggeredRef = useRef<Set<string>>(new Set())
  const T = (en: string, ar: string) => lang === 'ar' ? ar : en

  // ✅ تحميل البيانات من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alphavest-portfolio')
      if (saved) setPositions(JSON.parse(saved))
      const savedAlerts = localStorage.getItem('alphavest-alerts')
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
      const savedTriggered = localStorage.getItem('alphavest-triggered')
      if (savedTriggered) triggeredRef.current = new Set(JSON.parse(savedTriggered))
    } catch { }
  }, [])

  const savePositions = (newPositions: Position[]) => {
    setPositions(newPositions)
    localStorage.setItem('alphavest-portfolio', JSON.stringify(newPositions))
  }

  const saveAlerts = (newAlerts: Alert[]) => {
    setAlerts(newAlerts)
    localStorage.setItem('alphavest-alerts', JSON.stringify(newAlerts))
  }

  // ✅ تشغيل صوت التنبيه
  const playSound = (type: 'success' | 'warning' | 'danger') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      const freq = type === 'success' ? 880 : type === 'warning' ? 660 : 440
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.frequency.setValueAtTime(freq * 1.2, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch { }
  }

  // ✅ إرسال Browser Notification
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification(title, { body, icon: '/favicon.ico' })
      })
    }
  }, [])

  // ✅ إطلاق التنبيه
  const triggerAlert = useCallback((
    pos: Position,
    type: Alert['type'],
    price: number,
    currentPrice: number
  ) => {
    const key = `${pos.id}-${type}`
    if (triggeredRef.current.has(key)) return
    triggeredRef.current.add(key)
    localStorage.setItem('alphavest-triggered', JSON.stringify([...triggeredRef.current]))

    const messages: Record<Alert['type'], { en: string; ar: string; sound: 'success' | 'warning' | 'danger' }> = {
      entry:   { en: `${pos.ticker} reached entry zone $${price}! 🎯`,   ar: `${pos.ticker} وصل لمنطقة الدخول $${price}! 🎯`,   sound: 'success' },
      target1: { en: `${pos.ticker} hit Target 1 at $${price}! 🎉`,      ar: `${pos.ticker} وصل الهدف الأول $${price}! 🎉`,      sound: 'success' },
      target2: { en: `${pos.ticker} hit Target 2 at $${price}! 🚀`,      ar: `${pos.ticker} وصل الهدف الثاني $${price}! 🚀`,     sound: 'success' },
      stop:    { en: `${pos.ticker} hit Stop Loss at $${price}! ⚠️`,     ar: `${pos.ticker} وصل وقف الخسارة $${price}! ⚠️`,     sound: 'danger'  },
    }

    const msg = messages[type]
    const alert: Alert = {
      id: `${pos.id}-${type}-${Date.now()}`,
      ticker: pos.ticker,
      type,
      price: currentPrice,
      message: lang === 'ar' ? msg.ar : msg.en,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
    }

    setAlerts(prev => {
      const updated = [alert, ...prev].slice(0, 20)
      localStorage.setItem('alphavest-alerts', JSON.stringify(updated))
      return updated
    })

    if (alertsEnabled) {
      playSound(msg.sound)
      sendBrowserNotification(
        lang === 'ar' ? `تنبيه AlphaVest — ${pos.ticker}` : `AlphaVest Alert — ${pos.ticker}`,
        lang === 'ar' ? msg.ar : msg.en
      )
    }
  }, [lang, alertsEnabled, sendBrowserNotification])

  // ✅ جلب الأسعار وفحص التنبيهات
  useEffect(() => {
    if (positions.length === 0) return

    const fetchPrices = async () => {
      try {
        const tickers = [...new Set(positions.map(p => p.ticker))]
        const results: Record<string, LivePrice> = {}

        await Promise.all(tickers.map(async (ticker) => {
          try {
            const r = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticker, lang: 'en' })
            })
            const data = await r.json()
            if (data.price) {
              results[ticker] = { price: data.price, priceChangePct: data.priceChangePct || 0 }
            }
          } catch { }
        }))

        setLivePrices(results)

        // ✅ فحص التنبيهات لكل صفقة
        positions.forEach(pos => {
          const live = results[pos.ticker]
          if (!live) return
          const p = live.price

          // Entry Alert — عندما يقترب السعر من الـ entry (ضمن 1%)
          const entryMid = pos.entryPrice
          if (Math.abs(p - entryMid) / entryMid <= 0.01) {
            triggerAlert(pos, 'entry', pos.entryPrice, p)
          }

          // Target 1
          if (pos.target1 > 0 && p >= pos.target1) {
            triggerAlert(pos, 'target1', pos.target1, p)
          }

          // Target 2
          if (pos.target2 > 0 && p >= pos.target2) {
            triggerAlert(pos, 'target2', pos.target2, p)
          }

          // Stop Loss
          if (pos.stopLoss > 0 && p <= pos.stopLoss) {
            triggerAlert(pos, 'stop', pos.stopLoss, p)
          }
        })

      } catch { }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [positions, triggerAlert])

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
    // ✅ امسح triggered لهذا الـ ticker حتى يُعاد فحصه
    const newTriggered = new Set([...triggeredRef.current].filter(k => !k.startsWith(newPosition.id)))
    triggeredRef.current = newTriggered
    localStorage.setItem('alphavest-triggered', JSON.stringify([...newTriggered]))

    savePositions([...positions, newPosition])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const removePosition = (id: string) => {
    savePositions(positions.filter(p => p.id !== id))
  }

  const calcPnL = (pos: Position) => {
    const live = livePrices[pos.ticker]
    if (!live) return null
    const currentValue = live.price * pos.quantity
    const entryValue = pos.entryPrice * pos.quantity
    const pnl = currentValue - entryValue
    const pnlPct = ((live.price - pos.entryPrice) / pos.entryPrice) * 100
    return { pnl, pnlPct, currentPrice: live.price, currentValue, entryValue }
  }

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
    ? (totalStats.totalPnL / totalStats.totalCost) * 100 : 0

  const getStatus = (pos: Position) => {
    const live = livePrices[pos.ticker]
    if (!live) return null
    const p = live.price
    if (pos.stopLoss > 0 && p <= pos.stopLoss) return { label: T('Stop Hit','وقف الخسارة'), color: '#E85555' }
    if (pos.target2 > 0 && p >= pos.target2) return { label: T('Target 2 ✓','الهدف 2 ✓'), color: '#2EC98A' }
    if (pos.target1 > 0 && p >= pos.target1) return { label: T('Target 1 ✓','الهدف 1 ✓'), color: '#2EC98A' }
    return { label: T('Active','نشطة'), color: '#E8A630' }
  }

  const unreadCount = alerts.filter(a => !a.read).length

  const markAllRead = () => {
    const updated = alerts.map(a => ({ ...a, read: true }))
    saveAlerts(updated)
  }

  const clearAlerts = () => {
    saveAlerts([])
    triggeredRef.current = new Set()
    localStorage.removeItem('alphavest-triggered')
  }

  const alertTypeColor = (type: Alert['type']) => {
    if (type === 'stop') return '#E85555'
    if (type === 'entry') return '#E8A630'
    return '#2EC98A'
  }

  const alertTypeIcon = (type: Alert['type']) => {
    if (type === 'stop') return '⚠️'
    if (type === 'entry') return '🎯'
    if (type === 'target2') return '🚀'
    return '🎉'
  }

  return (
    <div>
      {/* ✅ Header */}
      <div className="ph">
        <div>
          <h1 className="ptitle">{T('Portfolio', 'محفظتي')}</h1>
          <div className="pdate">{T('Track your open positions', 'تتبع صفقاتك المفتوحة')}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>

          {/* ✅ زر التنبيهات */}
          <button
            onClick={() => { setShowAlerts(!showAlerts); if (!showAlerts) markAllRead() }}
            style={{
              position:'relative', display:'flex', alignItems:'center', gap:6,
              padding:'8px 14px', borderRadius:8, border:'.5px solid var(--border2)',
              background: showAlerts ? 'var(--gold-bg)' : 'transparent',
              color: showAlerts ? 'var(--gold)' : 'var(--t2)',
              cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif'
            }}
          >
            <Bell size={14}/>
            {T('Alerts','التنبيهات')}
            {unreadCount > 0 && (
              <span style={{
                position:'absolute', top:-6, right:-6,
                background:'#E85555', color:'white',
                borderRadius:'50%', width:18, height:18,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700
              }}>{unreadCount}</span>
            )}
          </button>

          {/* ✅ تفعيل/إيقاف التنبيهات */}
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            title={alertsEnabled ? T('Disable alerts','إيقاف التنبيهات') : T('Enable alerts','تفعيل التنبيهات')}
            style={{
              display:'flex', alignItems:'center', padding:'8px',
              borderRadius:8, border:'.5px solid var(--border2)',
              background:'transparent',
              color: alertsEnabled ? '#2EC98A' : 'var(--t3)',
              cursor:'pointer'
            }}
          >
            {alertsEnabled ? <Bell size={14}/> : <BellOff size={14}/>}
          </button>

          <button className="abtn" onClick={() => setShowForm(true)}>
            <Plus size={14}/> {T('Add Position', 'إضافة صفقة')}
          </button>
        </div>
      </div>

      {/* ✅ Alerts Panel */}
      {showAlerts && (
        <div style={{
          background:'var(--card)', border:'.5px solid var(--border)',
          borderRadius:13, padding:'13px 15px', marginBottom:16
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:500,color:'var(--t)'}}>
              🔔 {T('Price Alerts','تنبيهات الأسعار')}
              {alerts.length > 0 && <span style={{fontSize:11,color:'var(--t3)',marginLeft:8}}>({alerts.length})</span>}
            </span>
            <div style={{display:'flex',gap:8}}>
              {alerts.length > 0 && (
                <>
                  <button onClick={markAllRead} style={{fontSize:11,color:'var(--t3)',background:'transparent',border:'none',cursor:'pointer'}}>
                    <CheckCircle size={12}/> {T('Mark all read','تعليم كمقروء')}
                  </button>
                  <button onClick={clearAlerts} style={{fontSize:11,color:'#E85555',background:'transparent',border:'none',cursor:'pointer'}}>
                    {T('Clear all','مسح الكل')}
                  </button>
                </>
              )}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--t3)',fontSize:12}}>
              {T('No alerts yet. Alerts will appear when prices reach your targets.','لا توجد تنبيهات بعد. ستظهر عند وصول الأسعار لأهدافك.')}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:300,overflowY:'auto'}}>
              {alerts.map(alert => (
                <div key={alert.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'8px 10px', borderRadius:8,
                  background: alert.read ? 'transparent' : 'rgba(255,255,255,0.03)',
                  border:`.5px solid ${alertTypeColor(alert.type)}30`,
                  opacity: alert.read ? 0.7 : 1
                }}>
                  <span style={{fontSize:16}}>{alertTypeIcon(alert.type)}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'var(--t)',fontWeight: alert.read ? 400 : 500}}>
                      {alert.message}
                    </div>
                    <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>
                      {alert.timestamp} · ${alert.price.toFixed(2)}
                    </div>
                  </div>
                  {!alert.read && (
                    <div style={{width:6,height:6,borderRadius:'50%',background:alertTypeColor(alert.type),flexShrink:0}}/>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            const hasAlert = alerts.some(a => a.ticker === pos.ticker && !a.read)

            return (
              <div key={pos.id} className="port-card" style={hasAlert ? {borderColor:'var(--gold)'} : {}}>
                {/* Card Header */}
                <div className="port-card-top">
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span className="sc-tick">{pos.ticker}</span>
                      <span className="sc-badge" style={{color:cfg.color,background:cfg.bg,border:`0.5px solid ${cfg.border}`}}>
                        {sigL(pos.signal, lang)}
                      </span>
                      {hasAlert && (
                        <span style={{fontSize:14}}>🔔</span>
                      )}
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
              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Ticker *','الرمز *')}</label>
                <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="AAPL" value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value.toUpperCase()})}/>
              </div>

              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Company Name','اسم الشركة')}</label>
                <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="Apple Inc." value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Entry Price *','سعر الدخول *')}</label>
                  <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="150.00" type="number" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Quantity *','الكمية *')}</label>
                  <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="10" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}/>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:11,color:'#E85555',textTransform:'uppercase',letterSpacing:'.5px'}}>Stop Loss</label>
                  <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="140.00" type="number" value={form.stopLoss} onChange={e => setForm({...form, stopLoss: e.target.value})}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'#2EC98A',textTransform:'uppercase',letterSpacing:'.5px'}}>Target 1</label>
                  <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="165.00" type="number" value={form.target1} onChange={e => setForm({...form, target1: e.target.value})}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'#2EC98A',textTransform:'uppercase',letterSpacing:'.5px'}}>Target 2</label>
                  <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder="180.00" type="number" value={form.target2} onChange={e => setForm({...form, target2: e.target.value})}/>
                </div>
              </div>

              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Signal','الإشارة')}</label>
                <select style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4,color:'var(--t)',fontFamily:'DM Sans,sans-serif',fontSize:13}} value={form.signal} onChange={e => setForm({...form, signal: e.target.value as Signal})}>
                  <option value="strongBuy">{T('Strong Buy','شراء قوي')}</option>
                  <option value="buy">{T('Buy','شراء')}</option>
                  <option value="hold">{T('Hold','احتفاظ')}</option>
                  <option value="sell">{T('Sell','بيع')}</option>
                  <option value="strongSell">{T('Strong Sell','بيع قوي')}</option>
                </select>
              </div>

              <div>
                <label style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{T('Notes','ملاحظات')}</label>
                <input className="sinp" style={{background:'var(--card)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',width:'100%',marginTop:4}} placeholder={T('Optional notes...','ملاحظات اختيارية...')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
              </div>

              <button className="abtn" style={{marginTop:8,justifyContent:'center'}} onClick={addPosition} disabled={!form.ticker || !form.entryPrice || !form.quantity}>
                <Plus size={14}/> {T('Add Position','إضافة الصفقة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
