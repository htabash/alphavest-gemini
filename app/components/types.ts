export type Signal = 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell'
export type Lang = 'en' | 'ar'

export interface TradeSignal {
  ticker: string; companyName: string; sector: string
  price: number; priceChangePct: number; signal: Signal; confidence: number
  entry: string; stopLoss: string; target1: string; target2: string
  timeframe: string; rsi: number; macd: string; trend: string
  reasoning: string; catalyst: string
}
export interface MarketSummary { sp500: string; nasdaq: string; sentiment: string; vix: string; note: string }
export interface SignalsData { date: string; marketSummary: MarketSummary; signals: TradeSignal[]; topBuy: string; topSell: string; watchlist: string[] }
export interface StockData {
  ticker: string; companyName: string; sector: string; industry: string; exchange: string; description: string
  price: number; priceChange: number; priceChangePct: number; open: number; high: number; low: number
  volume: string; avgVolume: string; week52High: number; week52Low: number; marketCap: string; beta: number
  signal: Signal; confidence: number; entry: string; stopLoss: string; target1: string; target2: string; timeframe: string
  score: number; scoreBreakdown: Record<string,number>
  fundamentals: Record<string,unknown>; technical: Record<string,unknown>
  historicalPrices: Record<string,number[]>
  analysis: { summary: string; bullish: string[]; bearish: string[]; catalysts: string[] }
  news: Array<{headline:string;source:string;time:string;sentiment:string}>
  analystRatings: Record<string,unknown>
  competitors: Array<Record<string,unknown>>
}

export const SIG: Record<Signal,{en:string;ar:string;color:string;bg:string;border:string}> = {
  strongBuy: {en:'STRONG BUY',ar:'شراء قوي', color:'#2EC98A',bg:'rgba(46,201,138,.13)',border:'#145C3C'},
  buy:       {en:'BUY',       ar:'شراء',     color:'#2EC98A',bg:'rgba(46,201,138,.13)',border:'#145C3C'},
  hold:      {en:'HOLD',      ar:'احتفاظ',   color:'#E8A630',bg:'rgba(232,166,48,.13)',border:'rgba(232,166,48,.35)'},
  sell:      {en:'SELL',      ar:'بيع',       color:'#E85555',bg:'rgba(232,85,85,.13)', border:'#6A2020'},
  strongSell:{en:'STRONG SELL',ar:'بيع قوي', color:'#E85555',bg:'rgba(232,85,85,.13)', border:'#6A2020'},
}
export const sigL = (s: Signal, l: Lang) => l === 'ar' ? SIG[s]?.ar : SIG[s]?.en
