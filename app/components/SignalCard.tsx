'use client'
import { TradeSignal, SIG, sigL, Lang } from './types'
import { TrendingUp, TrendingDown, Minus, ChevronRight, AlertTriangle } from 'lucide-react'

export default function SignalCard({ s, lang, onClick }: { s: TradeSignal; lang: Lang; onClick: () => void }) {
  const cfg = SIG[s.signal]
  const up = s.priceChangePct >= 0
  const Icon = s.signal.includes('uy') ? TrendingUp : s.signal.includes('ell') ? TrendingDown : Minus
  const invalid = s.setupValid === false
  const setupNote = s.setupNote

  return (
    <div className="sc" onClick={onClick} style={invalid ? { opacity: 0.85 } : {}}>
      <div className="sc-top">
        <div>
          <div className="sc-tick">{s.ticker}</div>
          <div className="sc-sec">{s.sector}</div>
        </div>
        <span className="sc-badge" style={{color:cfg.color,background:cfg.bg,border:`0.5px solid ${cfg.border}`}}>
          <Icon size={11}/> {sigL(s.signal,lang)}
        </span>
      </div>

      <div className="sc-name">{s.companyName}</div>

      <div className="sc-price-row">
        <span className="sc-price">${s.price.toFixed(2)}</span>
        <span className={up?'pos':'neg'}>{up?'▲':'▼'} {Math.abs(s.priceChangePct).toFixed(2)}%</span>
      </div>

      <div className="sc-levels">
        {[
          [lang==='ar'?'دخول':'Entry',  s.entry,    ''        ],
          [lang==='ar'?'وقف':'Stop',    s.stopLoss, '#E85555' ],
          [lang==='ar'?'هدف':'Target',  s.target1,  '#2EC98A' ]
        ].map(([k,v,c])=>(
          <div key={k} className="sc-lv">
            <span className="sc-lv-k">{k}</span>
            <span className="sc-lv-v" style={c?{color:c as string}:{}}>{v}</span>
          </div>
        ))}
      </div>

      {/* ✅ تحذير إذا الـ setup غير صالح */}
      {invalid && setupNote && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,170,0,0.08)',
          border: '1px solid rgba(255,170,0,0.25)',
          borderRadius: '6px',
          padding: '6px 10px',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#FFAA00'
        }}>
          <AlertTriangle size={12} style={{flexShrink:0}}/>
          <span>{lang==='ar' ? 'السعر تجاوز نطاق الدخول — انتظر تراجعاً' : setupNote}</span>
        </div>
      )}

      <div className="sc-conf">
        <span className="sc-conf-lbl">{lang==='ar'?'ثقة':'Confidence'}</span>
        <div className="sc-conf-track">
          <div className="sc-conf-fill" style={{width:`${s.confidence}%`,background:cfg.color}}/>
        </div>
        <span className="sc-conf-val" style={{color:cfg.color}}>{s.confidence}%</span>
      </div>

      <div className="sc-reason">{s.reasoning}</div>

      <div className="sc-foot">
        <span className="sc-tf">⏱ {s.timeframe}</span>
        <span className="sc-more">{lang==='ar'?'تفاصيل':'Details'} <ChevronRight size={12}/></span>
      </div>
    </div>
  )
}
