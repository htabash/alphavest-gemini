'use client'
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
type TF = '1M'|'3M'|'6M'|'1Y'
export default function PriceChart({ prices, ticker, s1, r1 }: { prices: Record<TF,number[]>; ticker: string; s1?: number; r1?: number }) {
  const [tf, setTf] = useState<TF>('1M')
  const data = (prices[tf]||prices['1M']||[]).map((p,i) => ({i,p}))
  const up = data.length>1 && data[data.length-1].p >= data[0].p
  const col = up ? '#2EC98A' : '#E85555'
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span className="clbl">{ticker} Price</span>
        <div className="tf-row">{(['1M','3M','6M','1Y'] as TF[]).map(t=><button key={t} className={`tfb ${tf===t?'on':''}`} onClick={()=>setTf(t)}>{t}</button>)}</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{top:4,right:4,left:0,bottom:0}}>
          <defs><linearGradient id={`g${ticker}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity={0.18}/><stop offset="100%" stopColor={col} stopOpacity={0}/></linearGradient></defs>
          <XAxis dataKey="i" hide/>
          <YAxis domain={['auto','auto']} hide/>
          {s1 && <ReferenceLine y={s1} stroke="#2EC98A" strokeDasharray="4 4" strokeOpacity={0.4}/>}
          {r1 && <ReferenceLine y={r1} stroke="#E85555" strokeDasharray="4 4" strokeOpacity={0.4}/>}
          <Tooltip contentStyle={{background:'#111926',border:'0.5px solid #1A2640',borderRadius:8,fontSize:12,fontFamily:'monospace'}} formatter={(v)=>[`$${v}`,ticker]} labelFormatter={()=>''}/>
          <Area type="monotone" dataKey="p" stroke={col} strokeWidth={1.5} fill={`url(#g${ticker})`} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
