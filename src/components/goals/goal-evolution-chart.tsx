"use client";

import {useId, useMemo, useState} from "react";
import {Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

export type GoalHistoryContribution = {
 id: string;
 amount: number | string;
 contribution_type: "contribution" | "withdrawal" | "initial_balance";
 occurred_on: string;
 created_at?: string;
};
type Props = {contributions: GoalHistoryContribution[]; currentAmount: number; targetAmount: number; createdAt: string; today: string; locale: string; color?: string | null};
type Point = {timestamp: number; balance: number; deposits: number; initial: number; withdrawals: number; count: number; carry: boolean};
type Period = "all" | "30" | "90";
const DAY = 86400000;
function parseDay(value: string) {
 const day = value.slice(0,10);
 if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
 const n = Date.parse(`${day}T00:00:00Z`);
 return Number.isFinite(n) && new Date(n).toISOString().slice(0,10) === day ? n : NaN;
}
export function GoalEvolutionChart({contributions,currentAmount,targetAmount,today,locale}: Props) {
 const en = locale === "en";
 const uid = `finco-goal-${useId().replace(/[^a-zA-Z0-9_-]/g,"")}`;
 const [period,setPeriod] = useState<Period>("all");
 const [showTarget,setShowTarget] = useState(false);
 const [inspectedTime,setInspectedTime] = useState<number | null>(null);
 const [touch,setTouch] = useState(false);
 const accent = "#6ee7b7";
 const money = (n: number) => new Intl.NumberFormat(en ? "en-US" : "pt-BR",{style:"currency",currency:en ? "USD" : "BRL"}).format(n);
 const date = (n: number, full=false) => new Intl.DateTimeFormat(en ? "en-US" : "pt-BR",{day:"2-digit",month:full ? "long" : "short",...(full ? {year:"numeric" as const} : {}),timeZone:"UTC"}).format(n);
 const compact = (n: number) => new Intl.NumberFormat(en ? "en-US" : "pt-BR",{notation:"compact",maximumFractionDigits:1}).format(n);
 const history = useMemo(() => {
  const groups = new Map<number,{deposits: number; initial: number; withdrawals: number; count: number}>();
  const asOf = parseDay(today);
  let skipped = 0;
  for (const entry of contributions) {
   const timestamp = parseDay(entry.occurred_on);
   const amount = Number(entry.amount);
   if (!Number.isFinite(timestamp) || !Number.isFinite(amount) || amount < 0 || !["contribution","initial_balance","withdrawal"].includes(entry.contribution_type) || (Number.isFinite(asOf) && timestamp>asOf)) {skipped++;continue;}
   const day = groups.get(timestamp) ?? {deposits:0,initial:0,withdrawals:0,count:0};
   const cents = Math.round(amount*100);
   if (entry.contribution_type === "withdrawal") day.withdrawals += cents;
   else if (entry.contribution_type === "initial_balance") day.initial += cents;
   else day.deposits += cents;
   day.count++;
   groups.set(timestamp,day);
  }
  let balanceCents = 0;
  const points: Point[] = [...groups.entries()].sort((a,b) => a[0]-b[0]).map(([timestamp,g]) => {
   balanceCents += g.deposits+g.initial-g.withdrawals;
   return {timestamp,balance:balanceCents/100,deposits:g.deposits/100,initial:g.initial/100,withdrawals:g.withdrawals/100,count:g.count,carry:false};
  });
  return {points,sum:balanceCents/100,skipped};
 },[contributions,today]);
 const points = useMemo(() => {
  if (!history.points.length) return [];
  const asOf = parseDay(today);
  const cutoff = period !== "all" && Number.isFinite(asOf) ? asOf-(Number(period)-1)*DAY : -Infinity;
  const kept = history.points.filter(p => p.timestamp>=cutoff);
  const previous = history.points.filter(p => p.timestamp<cutoff).at(-1);
  const result: Point[] = previous && kept[0]?.timestamp !== cutoff ? [{...previous,timestamp:cutoff,deposits:0,initial:0,withdrawals:0,count:0,carry:true},...kept] : [...kept];
  // Extend a known ledger balance to today only after history starts.
  // A sole historical date remains a single point, never an invented slope.
  if (result.length>1 && Number.isFinite(asOf) && result[result.length-1].timestamp<asOf) result.push({...result[result.length-1],timestamp:asOf,deposits:0,initial:0,withdrawals:0,count:0,carry:true});
  return result;
 },[history.points,period,today]);
 const selected = points.find(p => p.timestamp === inspectedTime);
 const currentPoint = selected ?? points.at(-1);
 const selectedIndex = currentPoint ? points.indexOf(currentPoint) : 0;
 const single = points.length === 1;
 const first = points[0];
 const last = points.at(-1);
 const target = Number.isFinite(targetAmount) && targetAmount>0 ? targetAmount : 0;
 const progress = target>0 ? Math.max(0,Math.min(currentAmount/target*100,100)) : 0;
 const difference = first && last ? last.balance-first.balance : 0;
 const mismatch = history.points.length>0 && Math.abs(history.sum-currentAmount)>0.02;
 const low = points.reduce((v,p) => Math.min(v,p.balance),0);
 const high = Math.max(...points.map(p => p.balance),showTarget ? target : 0,1);
 const span = first && last ? last.timestamp-first.timestamp : 0;
 const margin = Math.max(span*0.04,DAY*0.35);
 const xDomain: [number,number] = first && last ? [first.timestamp-margin,last.timestamp+margin] : [0,DAY];
 function inspect(index: number) {setInspectedTime(points[Math.max(0,Math.min(points.length-1,index))]?.timestamp ?? null);}
 function changePeriod(value: Period) {setPeriod(value);setInspectedTime(null);}
 function pointDescription(p: Point) {return p.carry ? (en ? "Known balance carried forward; no new movement" : "Saldo registrado mantido; sem nova movimentação") : (en ? `${p.count} recorded movement(s) on this date` : `${p.count} movimentação(ões) registrada(s) nesta data`);}
 return <section aria-label={en ? "Goal evolution" : "Evolução da meta"} className="rounded-2xl border border-white/8 bg-linear-to-br from-slate-900/50 to-slate-950/20 p-4 sm:p-5">
  <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200/70">{en ? "Recorded history" : "Histórico registrado"}</p><h3 className="mt-1.5 text-base font-semibold tracking-tight text-slate-100">{en ? "Goal evolution" : "Evolução da meta"}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{history.points.length === 1 ? (en ? "Your first recorded date is highlighted below." : "Sua primeira data registrada está destacada abaixo.") : (en ? "Your balance after each recorded day." : "Seu saldo após cada dia com movimentações." )}</p></div><div className="text-right"><p className="text-[10px] text-slate-500">{en ? "Current saved balance" : "Saldo atual da meta"}</p><p className="mt-1 text-xl font-semibold tracking-tight tabular-nums text-emerald-200">{money(currentAmount)}</p></div></header>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label={en ? "Chart period" : "Período do gráfico"} className="inline-flex rounded-xl bg-slate-950/40 p-1">{([['30',en ? '30 days' : '30 dias'],['90',en ? '90 days' : '90 dias'],['all',en ? 'All' : 'Tudo']] as const).map(([value,label]) => <button key={value} type="button" aria-pressed={period===value} onClick={() => changePeriod(value)} className={`min-h-10 rounded-lg px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 ${period===value ? "bg-white/8 font-medium text-white" : "text-slate-500 hover:text-slate-200"}`}>{label}</button>)}</div>{target>0 && points.length>1 ? <button type="button" aria-pressed={showTarget} onClick={() => setShowTarget(v => !v)} className="min-h-10 rounded-xl border border-white/7 px-3 text-xs text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50">{showTarget ? (en ? "Hide target" : "Ocultar objetivo") : (en ? "Show target" : "Ver objetivo")}</button> : null}</div>
  {target>0 ? <div className="mt-4"><div className="mb-2 flex justify-between gap-3 text-[11px]"><span className="text-slate-500">{en ? "Current progress" : "Progresso atual"}</span><span className="tabular-nums text-emerald-200">{new Intl.NumberFormat(en ? "en-US" : "pt-BR",{maximumFractionDigits:1}).format(progress)}% · {money(target)}</span></div><div role="progressbar" aria-label={en ? "Current goal progress" : "Progresso atual da meta"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-white/6"><div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-300" style={{width:`${progress}%`}}/></div></div> : null}
  {!points.length ? <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center"><p className="text-sm text-slate-300">{en ? "No recorded history yet" : "Ainda não há histórico registrado"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{en ? "The saved balance is shown above. Record an initial balance, contribution or withdrawal to start this chart." : "O saldo salvo aparece acima. Registre saldo inicial, aporte ou resgate para iniciar o gráfico."}</p></div> : <>
   {single && currentPoint ? <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4"><div className="flex items-start gap-3"><span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full bg-emerald-200 shadow-[0_0_16px_rgba(110,231,183,0.25)]"/><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-widest text-emerald-200/70">{currentPoint.carry ? (en ? "Known balance in this period" : "Saldo registrado neste período") : (en ? "First recorded date" : "Primeira data registrada")}</p><p className="mt-1 text-sm text-slate-200">{date(currentPoint.timestamp,true)}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-200">{money(currentPoint.balance)}</p><p className="mt-2 text-xs leading-5 text-slate-400">{currentPoint.carry ? (en ? "No new movement in this range. Balance carried from the previous recorded date." : "Sem nova movimentação neste recorte. Saldo mantido desde o registro anterior.") : (en ? "Only one day has movements. Future recorded dates will form the evolution; no earlier zero balance is assumed." : "Há movimentações em apenas um dia. Novas datas registradas formarão a evolução; não presumimos saldo zero antes deste registro.")}</p></div></div></div> : <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-slate-500">{first && last ? `${date(first.timestamp)} — ${date(last.timestamp)}` : ""}</span><span className={`font-medium tabular-nums ${difference>=0 ? "text-emerald-200" : "text-rose-200"}`}>{difference>=0 ? "+" : ""}{money(difference)} <span className="font-normal text-slate-500">{en ? "between displayed balances" : "entre os saldos exibidos"}</span></span></div>}
   <div className={`mt-3 min-w-0 w-full ${single ? "h-[150px] sm:h-[170px]" : "h-[230px] sm:h-[270px]"}`} style={{touchAction:"pan-y"}} onPointerDownCapture={e => {if(e.pointerType==="touch")setTouch(true);}} onMouseEnter={() => setTouch(false)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
     <AreaChart data={points} accessibilityLayer margin={{top:16,right:18,bottom:8,left:0}} onClick={state => {const index=Number(state.activeTooltipIndex);if(state.activeTooltipIndex!=null && Number.isInteger(index))inspect(index);}}>
      <defs><linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={0.32}/><stop offset="100%" stopColor={accent} stopOpacity={0.035}/></linearGradient></defs>
      {!single ? <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.10)" strokeDasharray="3 7"/> : null}
      <XAxis dataKey="timestamp" type="number" scale="time" domain={xDomain} ticks={single && first ? [first.timestamp] : undefined} tickFormatter={n => date(Number(n))} axisLine={false} tickLine={false} minTickGap={48} tickMargin={10} tick={{fill:"#94a3b8",fontSize:10}}/>
      <YAxis hide={single} width={48} domain={[Math.min(0,low),high*1.12]} tickFormatter={n => compact(Number(n))} tickCount={4} axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:10}}/>
      {!single && showTarget && target>0 ? <ReferenceLine y={target} stroke="#6ee7b7" strokeOpacity={0.4} strokeDasharray="5 5"/> : null}
      <Tooltip trigger={touch ? "click" : "hover"} isAnimationActive={false} cursor={single ? false : {stroke:"rgba(110,231,183,0.25)",strokeDasharray:"4 4"}} content={({active,payload}) => {const p=payload?.[0]?.payload as Point | undefined;if(!active || !p)return null;return <div className="max-w-64 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-xs shadow-xl"><p className="text-slate-400">{date(p.timestamp,true)}</p><p className="mt-2 text-lg font-semibold tabular-nums text-emerald-200">{money(p.balance)}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{pointDescription(p)}</p>{p.deposits+p.initial>0 ? <p className="mt-2 text-emerald-200">+ {money(p.deposits+p.initial)} · {en ? "Contributions / initial balance" : "Aportes / saldo inicial"}</p> : null}{p.withdrawals>0 ? <p className="mt-1 text-rose-200">− {money(p.withdrawals)} · {en ? "Withdrawals" : "Resgates"}</p> : null}</div>;}}/>
      <Area type="stepAfter" dataKey="balance" name={en ? "Recorded balance" : "Saldo registrado"} stroke={accent} strokeWidth={3} fill={single ? "transparent" : `url(#${uid}-area)`} dot={single ? {r:6,fill:accent,stroke:"#d1fae5",strokeWidth:2} : points.length<=20 ? {r:3,fill:accent,stroke:"#0f172a",strokeWidth:1.5} : false} activeDot={{r:6,fill:accent,stroke:"#ecfdf5",strokeWidth:2}} isAnimationActive={false}/>
      {last && !single ? <ReferenceDot x={last.timestamp} y={last.balance} r={5} fill={accent} stroke="#ecfdf5" strokeWidth={2}/> : null}
      {selected && !single && selected.timestamp!==last?.timestamp ? <ReferenceDot x={selected.timestamp} y={selected.balance} r={5} fill={accent} stroke="#ecfdf5" strokeWidth={2}/> : null}
     </AreaChart>
    </ResponsiveContainer>
   </div>
   {currentPoint ? <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/20 px-3 py-3 text-xs"><span className="text-slate-400">{date(currentPoint.timestamp,true)}</span><span className="font-medium tabular-nums text-emerald-200">{money(currentPoint.balance)}</span></div> : null}
   <details className="mt-3 border-t border-white/5 pt-3"><summary className="cursor-pointer text-xs font-medium text-slate-400">{en ? "Explore history" : "Explorar histórico"}</summary><div className="pt-3"><p className="text-[11px] text-slate-500">{currentPoint ? pointDescription(currentPoint) : ""}</p>{currentPoint && !currentPoint.carry ? <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"><span className="text-emerald-200">{en ? "Contributions / initial" : "Aportes / inicial"}: {money(currentPoint.deposits+currentPoint.initial)}</span><span className="text-rose-200">{en ? "Withdrawals" : "Resgates"}: {money(currentPoint.withdrawals)}</span></p> : null}<label className="mt-3 block"><span className="sr-only">{en ? "Inspect history date" : "Inspecionar data do histórico"}</span><input type="range" min={0} max={Math.max(points.length-1,0)} step={1} value={selectedIndex} disabled={points.length<2} onChange={e => inspect(Number(e.target.value))} aria-valuetext={currentPoint ? `${date(currentPoint.timestamp,true)}: ${money(currentPoint.balance)}` : ""} className="h-8 w-full cursor-pointer" style={{accentColor:accent}}/></label><div className="flex items-center justify-between gap-3"><button type="button" disabled={selectedIndex<=0} onClick={() => inspect(selectedIndex-1)} className="min-h-10 rounded-lg px-2 text-xs text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:opacity-30">← {en ? "Previous" : "Anterior"}</button><span className="text-[10px] text-slate-500">{selectedIndex+1}/{points.length}</span><button type="button" disabled={selectedIndex>=points.length-1} onClick={() => inspect(selectedIndex+1)} className="min-h-10 rounded-lg px-2 text-xs text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:opacity-30">{en ? "Next" : "Próximo"} →</button></div></div></details>
  </>}
  {mismatch ? <p role="alert" className="mt-3 rounded-xl bg-amber-300/5 p-3 text-xs leading-5 text-amber-200">{en ? `Recorded history totals ${money(history.sum)}; the saved balance is ${money(currentAmount)}. Check the initial balance or missing records. No adjustment was fabricated.` : `O histórico registrado soma ${money(history.sum)}; o saldo salvo é ${money(currentAmount)}. Confira o saldo inicial ou registros ausentes. Nenhum ajuste foi inventado.`}</p> : null}
  {history.skipped>0 ? <p className="mt-3 text-[11px] text-amber-200/80">{en ? `${history.skipped} invalid or future record(s) excluded.` : `${history.skipped} registro(s) inválido(s) ou futuro(s) fora do gráfico.`}</p> : null}
  <p className="mt-3 text-[10px] leading-5 text-slate-500">{en ? "Hover or tap a point. On mobile, use Explore history. Daily balances are reconstructed from recorded movements, not forecasts." : "Passe o mouse ou toque em um ponto. No celular, use Explorar histórico. Os saldos diários são reconstruídos a partir das movimentações registradas, não são previsões."}</p>
 </section>;
}
