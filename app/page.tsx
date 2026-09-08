'use client';

import {useEffect,useMemo,useState} from 'react';
import {
  Activity,CalendarDays,ChevronLeft,ChevronRight,Heart,History,Link2,
  Moon,RefreshCw,Settings,UserCircle2,X
} from 'lucide-react';
import {Day,average,demoDays,duration,localDate,recovery,shiftDate} from '@/lib/metrics';

type ScoreKind='strain'|'sleep'|'recovery';

type MetricCardProps={label:string;value:string;unit?:string;caption:string;accent?:'green'|'blue'|'orange'|'red'};

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n));}

function sleepScore(day:Day,goal:number){
  if(day.sleep===null)return null;
  const pct=day.sleep/(goal*60)*100;
  return Math.round(clamp(pct));
}

function strainScore(day:Day){
  if(!day.activityAvailable)return null;
  const mins=day.workouts.reduce((sum,w)=>sum+w.minutes,0);
  if(mins===0)return 2;
  return Math.round(clamp(2+mins/8,0,21));
}

function demoSteps(day:Day){
  const seed=Math.floor(new Date(day.date+'T12:00:00Z').getTime()/86400000);
  return Math.max(2200,Math.round(7600+2600*Math.sin(seed*.71)+900*Math.cos(seed*.23)));
}

function demoHeartRate(day:Day){
  const seed=Math.floor(new Date(day.date+'T12:00:00Z').getTime()/86400000);
  return Math.round(72+7*Math.sin(seed*.91));
}

function ScoreRing({label,value,max=100,tone,onClick,large=false}:{label:string;value:number|null;max?:number;tone:'strain'|'sleep'|'recovery';onClick:()=>void;large?:boolean}){
  const pct=value===null?0:clamp(value/max*100);
  const r=large?76:64;
  const c=2*Math.PI*r;
  return <button className={`score-ring ${tone} ${large?'large':''}`} onClick={onClick} aria-label={`${label}: ${value??'unavailable'}`}>
    <svg viewBox="0 0 190 190" aria-hidden="true">
      <circle className="track" cx="95" cy="95" r={r}/>
      <circle className="progress" cx="95" cy="95" r={r} strokeDasharray={`${c}`} strokeDashoffset={`${c*(1-pct/100)}`}/>
    </svg>
    <span className="score-center">
      <strong>{value??'—'}</strong>
      <small>{max===21?'of 21':'of 100'}</small>
    </span>
    <span className="score-label">{label}</span>
  </button>
}

function MetricCard({label,value,unit,caption,accent='green'}:MetricCardProps){
  return <article className={`metric-tile ${accent}`}>
    <span className="metric-label">{label}</span>
    <div className="metric-value">{value}{unit&&<small>{unit}</small>}</div>
    <p>{caption}</p>
  </article>
}

export default function Home(){
  const [today,setToday]=useState('2026-09-07');
  const [date,setDate]=useState('2026-09-07');
  const [days,setDays]=useState<Day[]>([]);
  const [connected,setConnected]=useState(false);
  const [demo,setDemo]=useState(true);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [goal,setGoal]=useState(8);
  const [lastSync,setLastSync]=useState('');
  const [detail,setDetail]=useState<ScoreKind|null>(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showHistory,setShowHistory]=useState(false);

  async function sync(end:string){
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/health?end='+end,{cache:'no-store'});
      const data=await r.json() as {connected?:boolean;days?:Day[];syncedAt?:string;warnings?:string[];error?:string};
      setConnected(!!data.connected);
      if(data.connected){setDemo(false);setDays(data.days??[]);setLastSync(data.syncedAt??'');if(data.warnings?.length)setError(data.warnings.join(' '));}
      if(!r.ok)setError(data.error??'Could not sync. Please try again.');
    }catch{setError('Could not reach the connection service. Please try again.');}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    const t=localDate();setToday(t);setDate(t);
    try{const g=Number(localStorage.getItem('pulse-sleep-goal'));if(g>=4&&g<=12)setGoal(g);}catch{}
    void sync(t);
  },[]);

  const all=demo?demoDays(today):days;
  const d=all.find(x=>x.date===date)??{date,hrv:null,rhr:null,sleep:null,workouts:[],activityAvailable:false};
  const scoreRecovery=recovery(d,all,goal);
  const scoreSleep=sleepScore(d,goal);
  const scoreStrain=strainScore(d);
  const base=all.filter(x=>x.date<date&&x.date>=shiftDate(date,-28));
  const hrvBase=average(base.map(x=>x.hrv));
  const rhrBase=average(base.map(x=>x.rhr));
  const steps=demo?demoSteps(d):null;
  const hr=demo?demoHeartRate(d):null;

  const insight=useMemo(()=>{
    if(scoreRecovery===null||scoreSleep===null)return 'Keep wearing your device consistently so Pulse can learn your baseline and give you a more useful daily recommendation.';
    if(scoreRecovery>=75&&scoreSleep>=75)return 'Recovery is strong today. You slept well and your signals are near or better than baseline. This is a good day for a harder workout.';
    if(scoreRecovery<45)return 'Recovery is lower today. Keep intensity light, prioritize hydration and aim for an earlier night to support recovery.';
    if(scoreSleep<70)return 'Your recovery is workable, but sleep was below target. Keep training moderate and give yourself extra time to wind down tonight.';
    return 'You are in a balanced range today. A normal training day makes sense, with extra attention to how your body feels.';
  },[scoreRecovery,scoreSleep]);

  function move(next:string){if(!next||next>today||next<shiftDate(today,-27))return;setDate(next);}
  const prettyDate=new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});

  const detailCopy:Record<ScoreKind,{title:string;body:string;facts:string[]}>= {
    strain:{title:'Strain',body:'Strain estimates how much activity load you accumulated today from recorded workouts.',facts:[`Recorded workout time: ${d.activityAvailable?Math.round(d.workouts.reduce((s,w)=>s+w.minutes,0))+' min':'Unavailable'}`,`Workouts: ${d.activityAvailable?d.workouts.length:'—'}`,'The current score is an experimental Pulse estimate on a 0–21 scale.']},
    sleep:{title:'Sleep Score',body:'Sleep Score compares your recorded sleep with the sleep goal you set in Pulse.',facts:[`Time asleep: ${duration(d.sleep)}`,`Sleep goal: ${goal} hours`,scoreSleep===null?'No sleep reading available.':`${scoreSleep}% of your current sleep target.`]},
    recovery:{title:'Recovery',body:'Recovery combines HRV, resting heart rate and sleep relative to your recent personal baseline.',facts:[`HRV: ${d.hrv??'—'} ms${hrvBase?` · baseline ${Math.round(hrvBase)} ms`:''}`,`Resting HR: ${d.rhr??'—'} bpm${rhrBase?` · baseline ${Math.round(rhrBase)} bpm`:''}`,'At least 14 prior HRV and resting-HR readings are needed for a score.']}
  };

  return <main className="pulse-shell">
    <header className="dashboard-top">
      <button className="icon-button" onClick={()=>setShowSettings(true)} aria-label="Open settings"><Settings/></button>
      <div className="date-picker-wrap">
        <button className="icon-button subtle" onClick={()=>move(shiftDate(date,-1))} disabled={date<=shiftDate(today,-27)} aria-label="Previous day"><ChevronLeft/></button>
        <button className="date-pill" onClick={()=>setShowHistory(true)}><CalendarDays/><span>{date===today?'Today':prettyDate}</span><History/></button>
        <button className="icon-button subtle" onClick={()=>move(shiftDate(date,1))} disabled={date>=today} aria-label="Next day"><ChevronRight/></button>
      </div>
      <button className="icon-button" onClick={()=>setShowSettings(true)} aria-label="Open account"><UserCircle2/></button>
    </header>

    <section className="hero-copy">
      <span className="brand-lockup"><Activity/> PULSE</span>
      <h1>Your day at a glance.</h1>
      <p>{demo?'Showing sample data until you connect your wearable.':'Your latest health signals, organized around your personal baseline.'}</p>
    </section>

    {error&&<div className="error-banner">{error}</div>}

    <section className="score-deck" aria-label="Daily scores">
      <ScoreRing label="Strain" value={scoreStrain} max={21} tone="strain" onClick={()=>setDetail('strain')}/>
      <ScoreRing label="Sleep Score" value={scoreSleep} tone="sleep" large onClick={()=>setDetail('sleep')}/>
      <ScoreRing label="Recovery" value={scoreRecovery} tone="recovery" onClick={()=>setDetail('recovery')}/>
    </section>

    <section className="daily-brief">
      <div className="brief-icon"><Heart/></div>
      <div><span className="eyebrow">Daily brief</span><h2>{insight}</h2></div>
    </section>

    <section className="metrics-grid">
      <MetricCard label="Steps" value={steps===null?'—':steps.toLocaleString()} caption={steps===null?'Step data is not available from the current connection yet.':'Estimated demo steps for the selected day.'} accent="green"/>
      <MetricCard label="Heart Rate" value={hr===null?'—':String(hr)} unit={hr===null?undefined:' bpm'} caption={hr===null?'Live/daily heart-rate data is not available from the current connection yet.':'Representative demo heart rate.'} accent="red"/>
      <MetricCard label="HRV" value={d.hrv===null?'—':String(Math.round(d.hrv))} unit={d.hrv===null?undefined:' ms'} caption={hrvBase===null?'Personal baseline building':`${d.hrv!==null&&d.hrv>=hrvBase?'Above':'Below'} 28-day baseline of ${Math.round(hrvBase)} ms`} accent="blue"/>
      <MetricCard label="Resting Heart Rate" value={d.rhr===null?'—':String(Math.round(d.rhr))} unit={d.rhr===null?undefined:' bpm'} caption={rhrBase===null?'Personal baseline building':`${d.rhr!==null&&d.rhr<=rhrBase?'Better than':'Above'} 28-day baseline of ${Math.round(rhrBase)} bpm`} accent="orange"/>
    </section>

    <section className="connection-strip">
      <div><Link2/><span>{connected?'Wearable connected':'Demo mode'}</span>{lastSync&&<small>Updated {new Date(lastSync).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</small>}</div>
      <button onClick={()=>connected?sync(today):setShowSettings(true)} disabled={loading}>{connected?<><RefreshCw/>{loading?'Syncing…':'Sync data'}</>:<>Connect wearable</>}</button>
    </section>

    {detail&&<div className="modal-backdrop" onMouseDown={()=>setDetail(null)}><section className="modal-card" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setDetail(null)}><X/></button>
      <span className="eyebrow">Score details</span><h2>{detailCopy[detail].title}</h2><p>{detailCopy[detail].body}</p>
      <div className="fact-list">{detailCopy[detail].facts.map(f=><div key={f}>{f}</div>)}</div>
    </section></div>}

    {showHistory&&<div className="modal-backdrop" onMouseDown={()=>setShowHistory(false)}><section className="modal-card history-modal" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setShowHistory(false)}><X/></button><span className="eyebrow">History</span><h2>Choose a day</h2>
      <div className="history-list">{Array.from({length:14},(_,i)=>shiftDate(today,-i)).map(day=><button key={day} className={day===date?'active':''} onClick={()=>{move(day);setShowHistory(false)}}><span>{new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>{day===today&&<small>Today</small>}</button>)}</div>
    </section></div>}

    {showSettings&&<div className="modal-backdrop" onMouseDown={()=>setShowSettings(false)}><section className="modal-card" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setShowSettings(false)}><X/></button><span className="eyebrow">Settings</span><h2>Pulse preferences</h2>
      <label className="setting-row"><span><strong>Sleep goal</strong><small>Used for your Sleep Score</small></span><select value={goal} onChange={e=>{const n=Number(e.target.value);setGoal(n);try{localStorage.setItem('pulse-sleep-goal',String(n));}catch{}}}>{Array.from({length:9},(_,i)=>i+4).map(h=><option key={h} value={h}>{h} hours</option>)}</select></label>
      <div className="setting-row"><span><strong>Data connection</strong><small>{connected?'Connected and read-only':'Not connected — demo data is active'}</small></span><a className="connect-link" href="/api/connect">{connected?'Reconnect':'Connect'}</a></div>
      {!connected&&!demo&&<button className="wide-button" onClick={()=>setDemo(true)}>Explore demo data</button>}
    </section></div>}
  </main>;
}
