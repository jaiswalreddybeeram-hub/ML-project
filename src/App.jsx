import {useState,useMemo} from 'react'
import {LayoutDashboard,Database,Eraser,BarChart3,ListChecks,Activity,GitCompare,Info,Presentation,ArrowRight,Search,AlertTriangle} from 'lucide-react'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from 'recharts'

const COLS=['Debt Ratio','Current Ratio','Working Capital','Cash Flow','ROA','Profitability']
let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647
const ROWS=Array.from({length:60},(_,i)=>{const b=i%5===0;const r=(a,c)=>+(a+rnd()*(c-a)).toFixed(3)
return b?[r(.6,.95),r(.4,1.1),r(-.2,.05),r(-.15,.03),r(-.2,0),r(-.15,0),'Bankrupt']:[r(.2,.6),r(1.2,2.8),r(.05,.4),r(.05,.3),r(.02,.2),r(.02,.15),'Non-Bankrupt']})
const M=[[1,-.45,-.3,-.35,-.5,-.55],[-.45,1,.6,.4,.35,.3],[-.3,.6,1,.45,.4,.35],[-.35,.4,.45,1,.55,.5],[-.5,.35,.4,.55,1,.8],[-.55,.3,.35,.5,.8,1]]
const NAV=[['Dashboard',LayoutDashboard],['Dataset',Database],['Data Cleaning',Eraser],['Data Analysis',BarChart3],['Feature Selection',ListChecks],['Prediction',Activity],['Model Comparison',GitCompare],['About Project',Info]]
const FEATS=[['Debt Ratio','Liabilities / total assets',1,'Strong link with insolvency'],['Working Capital','Short-term financial cushion',1,'Captures liquidity strain'],['Current Ratio','Current assets / current liabilities',1,'Direct liquidity indicator'],['Cash Flow','Operating cash generation',1,'Shows ability to pay obligations'],['Return on Assets','Net income / total assets',1,'Efficiency of asset use'],['Profitability','Net profit margin',0,'Highly correlated with ROA (redundant)']]
const IMP=[['Debt Ratio',.27],['Cash Flow',.21],['Current Ratio',.19],['ROA',.17],['Working Capital',.11],['Profitability',.05]].map(([n,v])=>({n,v}))
const MET=['Accuracy','Precision','Recall','F1 Score'],DT=[.86,.84,.81,.82],RF=[.93,.92,.9,.91]

const Demo=({t='Demo / Illustrative Result'})=><span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full"><AlertTriangle size={12}/>{t}</span>
const Card=({children,className=''})=><div className={`bg-white rounded-2xl shadow-lg p-5 text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${className}`}>{children}</div>
const H=({t,sub,badge})=><div className="mb-6"><h1 className="text-3xl font-bold text-white border-l-4 border-blue-500 pl-3">{t}</h1>{sub&&<p className="text-blue-200 mt-1">{sub}</p>}{badge&&<div className="mt-2"><Demo t={badge}/></div>}</div>
const Flow=({steps})=><div className="flex flex-wrap items-center gap-2">{steps.map((x,i)=><span key={x} className="flex items-center gap-2"><span className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium">{x}</span>{i<steps.length-1&&<ArrowRight className="text-blue-300" size={16}/>}</span>)}</div>
const Tbl=({head,rows})=><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-100">{head.map(h=><th key={h} className="text-left p-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t">{r.map((c,j)=><td key={j} className="p-2 whitespace-nowrap">{c}</td>)}</tr>)}</tbody></table></div>

function Dashboard({go,h}){return <>
<H t="Bankruptcy Prediction System" sub="Financial Risk Prediction Using Machine Learning" badge="Demo values until actual dataset is inserted"/>
<div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{[['Dataset Records','6,819*'],['Total Attributes','96*'],['Selected Features','25*'],['Models Used','2']].map(([a,b])=><Card key={a} className="border-t-4 border-blue-500"><p className="text-slate-500 text-sm">{a}</p><p className="text-4xl font-bold text-blue-700">{b}</p></Card>)}</div>
<Card className="mb-6"><h2 className="font-semibold mb-3">Project Workflow</h2><Flow steps={['Dataset','Cleaning','Analysis','Feature Selection','Decision Tree','Random Forest','Prediction','Evaluation']}/></Card>
<p className="text-blue-300 text-xs mb-4">* Demo placeholder values</p>
<div className="flex gap-3"><button onClick={()=>go(1)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold">Explore Dataset</button><button onClick={()=>go(5)} className="bg-white text-blue-800 px-6 py-3 rounded-xl font-semibold">Start Prediction</button></div></>}

function Dataset(){const[q,setQ]=useState('');const[p,setP]=useState(0)
const f=useMemo(()=>ROWS.map((r,i)=>[i+1,...r]).filter(r=>r.join(' ').toLowerCase().includes(q.toLowerCase())),[q]);const pages=Math.max(1,Math.ceil(f.length/10))
return <><H t="Dataset Explorer" badge="Demo Dataset Preview"/>
<div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">{[['Dataset','Company Bankruptcy (demo)'],['Records','60 shown (demo)'],['Attributes','7 shown (demo)'],['Target','Bankrupt'],['Classes','Bankrupt / Non-Bankrupt']].map(([a,b])=><Card key={a}><p className="text-xs text-slate-500">{a}</p><p className="font-semibold text-sm">{b}</p></Card>)}</div>
<Card className="mb-5"><div className="flex items-center gap-2 mb-3 border rounded-lg px-3 py-2"><Search size={16}/><input value={q} onChange={e=>{setQ(e.target.value);setP(0)}} placeholder="Search rows..." className="outline-none flex-1"/></div>
<Tbl head={['#',...COLS,'Class']} rows={f.slice(p*10,p*10+10)}/>
<div className="flex justify-between items-center mt-3 text-sm"><button disabled={p===0} onClick={()=>setP(p-1)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40">Prev</button><span>Page {p+1} / {pages} ({f.length} rows)</span><button disabled={p>=pages-1} onClick={()=>setP(p+1)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40">Next</button></div></Card>
<Card><h2 className="font-semibold mb-2">Attributes</h2><Tbl head={['Attribute','Data Type','Purpose','Selected']} rows={[...FEATS.map(f=>[f[0],'float64',f[1],f[2]?'Selected':'Not Selected']),['Bankrupt','int (0/1)','Target variable','Target']]}/></Card></>}

function Cleaning({h}){const st=[['Missing Values',142,0],['Duplicate Rows',37,0],['Invalid Values',19,0],['Outliers',264,58]]
const why=['Missing values bias models and break many algorithms.','Duplicates leak between train/test and inflate accuracy.','Wrong types or impossible values corrupt calculations.','Extreme outliers can distort distributions and splits.']
return <><H t="Data Cleaning Pipeline" badge="Demo / Illustrative values"/>
<Card className="mb-5"><Flow steps={['Raw Data','Missing Value Check','Duplicate Check','Data Type Check','Outlier Check','Clean Data']}/></Card>
<div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">{st.map(([a,b,c],i)=><Card key={a}><p className="font-semibold">{a}</p><p className="text-sm text-red-600">Before: {b}</p><p className="text-sm text-green-600">After: {c}</p><p className="text-xs text-slate-500 mt-2">{why[i]}</p></Card>)}</div>
<Card className="mb-5"><h2 className="font-semibold mb-2">Before vs After Cleaning</h2><div style={{height:h}}><ResponsiveContainer><BarChart data={st.map(([n,b,a])=>({n,Before:b,After:a}))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="n"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Before" fill="#ef4444"/><Bar dataKey="After" fill="#2563eb"/></BarChart></ResponsiveContainer></div></Card>
<Card><h2 className="font-semibold mb-2">Cleaned Data Sample <Demo t="Demo Dataset Preview"/></h2><Tbl head={[...COLS,'Class']} rows={ROWS.slice(0,5)}/></Card></>}

function Analysis({h}){const hist=['0.2-0.35','0.35-0.5','0.5-0.65','0.65-0.8','0.8-0.95'].map((n,i)=>({n,'Non-Bankrupt':[30,40,22,6,2][i],Bankrupt:[1,2,5,12,14][i]}))
const cmp=COLS.map((n,i)=>({n,Bankrupt:[.78,.7,-.05,-.04,-.08,-.06][i],'Non-Bankrupt':[.4,1.9,.2,.15,.1,.08][i]}))
const box=[['Debt Ratio',.2,.35,.45,.58,.95],['Liquidity',.4,1.2,1.8,2.3,2.8],['Working Capital',-.2,.05,.15,.28,.4],['Cash Flow',-.15,.02,.12,.2,.3]]
const fd=COLS.slice(0,5).map((c,k)=>{const v=ROWS.map(r=>r[k]);const lo=Math.min(...v),hi=Math.max(...v),w=(hi-lo)/5;const bins=Array.from({length:5},(_,j)=>({n:(lo+j*w).toFixed(2),B:0,N:0}));ROWS.forEach(r=>{const j=Math.min(4,Math.floor((r[k]-lo)/w));bins[j][r[6]==='Bankrupt'?'B':'N']++});return[c,bins]})
const Chart=({data,keys,cols})=><div style={{height:h}}><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="n" fontSize={11}/><YAxis/><Tooltip/><Legend/>{keys.map((k,i)=><Bar key={k} dataKey={k} fill={cols[i]}/>)}</BarChart></ResponsiveContainer></div>
return <><H t="Exploratory Data Analysis" badge="Illustrative Visualization"/>
<div className="grid xl:grid-cols-2 gap-5 mb-5"><Card><h2 className="font-semibold">Target Distribution</h2><Chart data={[{n:'Non-Bankrupt','Count':48},{n:'Bankrupt','Count':12}]} keys={['Count']} cols={['#2563eb']}/></Card>
<Card><h2 className="font-semibold">Debt Ratio Histogram</h2><Chart data={hist} keys={['Non-Bankrupt','Bankrupt']} cols={['#2563eb','#ef4444']}/></Card></div>
<Card className="mb-5"><h2 className="font-semibold mb-1">Feature Distributions <Demo t="Demo Dataset Preview"/></h2><p className="text-xs text-slate-500 mb-2">Blue = Non-Bankrupt, Red = Bankrupt</p><div className="grid md:grid-cols-3 xl:grid-cols-5 gap-3">{fd.map(([c,b])=><div key={c}><p className="text-xs font-medium text-center">{c}</p><div style={{height:h-100}}><ResponsiveContainer><BarChart data={b}><XAxis dataKey="n" fontSize={9}/><Tooltip/><Bar dataKey="N" stackId="a" fill="#2563eb"/><Bar dataKey="B" stackId="a" fill="#ef4444"/></BarChart></ResponsiveContainer></div></div>)}</div></Card>
<Card className="mb-5"><h2 className="font-semibold mb-1">Correlation Heatmap</h2><p className="text-xs text-amber-700 mb-3">Illustrative correlation visualization — replace with actual dataset results.</p>
<div className="overflow-x-auto"><div className="grid gap-1 min-w-[560px]" style={{gridTemplateColumns:'110px repeat(6,1fr)'}}><div/>{COLS.map(c=><div key={c} className="text-xs text-center font-medium">{c}</div>)}
{M.map((r,i)=>[<div key={'l'+i} className="text-xs font-medium self-center">{COLS[i]}</div>,...r.map((v,j)=><div key={i+'-'+j} title={v} className="rounded text-white text-xs text-center py-4 font-semibold" style={{background:v>=0?`rgba(37,99,235,${.15+v*.85})`:`rgba(239,68,68,${.15-v*.85})`}}>{v.toFixed(2)}</div>)])}</div></div></Card>
<div className="grid xl:grid-cols-2 gap-5"><Card><h2 className="font-semibold mb-3">Box Plots (min · Q1 · median · Q3 · max)</h2>{box.map(([n,a,b,c,d,e])=>{const lo=Math.min(a,0),sp=e-lo;const pc=x=>((x-lo)/sp*100)+'%';return <div key={n} className="mb-4"><p className="text-xs mb-1">{n}</p><div className="relative h-5 bg-slate-100 rounded"><div className="absolute h-0.5 bg-slate-500 top-2" style={{left:pc(a),width:(e-a)/sp*100+'%'}}/><div className="absolute h-5 bg-blue-300 border border-blue-700" style={{left:pc(b),width:(d-b)/sp*100+'%'}}/><div className="absolute h-5 w-0.5 bg-blue-900" style={{left:pc(c)}}/></div></div>})}</Card>
<Card><h2 className="font-semibold">Bankrupt vs Non-Bankrupt (mean indicators)</h2><Chart data={cmp} keys={['Bankrupt','Non-Bankrupt']} cols={['#ef4444','#2563eb']}/></Card></div></>}

function Features({h}){return <><H t="Feature Selection" badge="Example / demo features"/>
<Card className="mb-5"><Flow steps={['Original Attributes','Feature Analysis','Selected Features']}/></Card>
<Card className="mb-5"><Tbl head={['Feature','Description','Selected','Reason']} rows={FEATS.map(f=>[f[0],f[1],f[2]?'✅ Yes':'❌ No',f[3]])}/></Card>
<div className="grid xl:grid-cols-2 gap-5"><Card><h2 className="font-semibold mb-2">Why Feature Selection?</h2><ul className="list-disc ml-5 space-y-1 text-sm"><li>Removes unnecessary information</li><li>Reduces complexity</li><li>Helps the model focus on relevant financial indicators</li><li>Can improve generalization</li></ul></Card>
<Card><h2 className="font-semibold">Feature Importance <Demo t="Illustrative Feature Importance"/></h2><div style={{height:h}}><ResponsiveContainer><BarChart data={IMP} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number"/><YAxis type="category" dataKey="n" width={110} fontSize={12}/><Tooltip/><Bar dataKey="v" fill="#2563eb"/></BarChart></ResponsiveContainer></div></Card></div></>}

function Prediction(){const[f,setF]=useState({debt:.45,cr:1.8,wc:.2,cf:.15,roa:.08,pr:.06,eq:.5,ta:1});const[res,setRes]=useState(null)
const L={debt:'Debt Ratio',cr:'Current Ratio',wc:'Working Capital',cf:'Cash Flow',roa:'Return on Assets',pr:'Profitability',eq:'Equity Ratio',ta:'Asset Turnover'}
const run=()=>{const sc=Math.max(0,Math.min(100,50*f.debt+12*Math.max(0,1.5-f.cr)-60*f.roa-40*f.cf-30*f.wc-30*f.pr-10*f.eq+15));setRes({dt:Math.min(100,Math.round(sc*1.08)),rf:Math.round(sc)})}
const V=p=>p>50?'BANKRUPT':'NON-BANKRUPT'
return <><H t="Bankruptcy Risk Prediction"/><Card className="mb-5"><div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{Object.keys(L).map(k=><label key={k} className="text-sm font-medium">{L[k]}<input type="number" step="0.01" value={f[k]} onChange={e=>setF({...f,[k]:+e.target.value})} className="mt-1 w-full border rounded-lg p-2"/></label>)}</div>
<div className="mt-5 flex flex-wrap gap-2 items-center"><span className="text-sm text-slate-500">Sample inputs:</span>{[['Healthy company',{debt:.3,cr:2.4,wc:.3,cf:.25,roa:.12,pr:.1,eq:.6,ta:1.2}],['Risky company',{debt:.9,cr:.6,wc:-.1,cf:-.1,roa:-.1,pr:-.08,eq:.1,ta:.4}]].map(([n,v])=><button key={n} onClick={()=>{setF(v);setRes(null)}} className="px-3 py-1 rounded-full border border-blue-300 text-blue-700 text-sm hover:bg-blue-50">{n}</button>)}</div>
<button onClick={run} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold">PREDICT BANKRUPTCY RISK</button></Card>
{res&&<Card><div className="mb-3"><Demo t="Demo Prediction — Not connected to a trained backend model"/></div><div className="grid md:grid-cols-2 gap-5">{[['Decision Tree',res.dt],['Random Forest',res.rf]].map(([n,p])=><div key={n}><p className="text-slate-500 text-sm">{n}:</p><p className={`text-2xl font-bold ${p>50?'text-red-600':'text-green-600'}`}>{V(p)}</p><div className="h-4 bg-slate-200 rounded-full mt-2 overflow-hidden"><div className="h-full transition-all" style={{width:p+'%',background:p>50?'#ef4444':p>30?'#f59e0b':'#22c55e'}}/></div><p className="text-xs mt-1">Demo risk score: {p}%</p></div>)}</div></Card>}</>}

function Compare({h}){const d=MET.map((n,i)=>({n,'Decision Tree':DT[i],'Random Forest':RF[i]}))
const CM=({t,m})=><Card><h3 className="font-semibold mb-2">{t}</h3><div className="grid grid-cols-3 gap-1 text-center text-sm"><div/><b>Pred NB</b><b>Pred B</b><b>Actual NB</b><div className="bg-blue-600 text-white p-4 rounded">{m[0][0]}</div><div className="bg-blue-200 p-4 rounded">{m[0][1]}</div><b>Actual B</b><div className="bg-blue-200 p-4 rounded">{m[1][0]}</div><div className="bg-blue-600 text-white p-4 rounded">{m[1][1]}</div></div></Card>
return <><H t="Decision Tree vs Random Forest" badge="Illustrative Results — Replace with actual experimental results."/>
<Card className="mb-5"><Tbl head={['Metric','Decision Tree','Random Forest']} rows={MET.map((m,i)=>[m,DT[i],RF[i]])}/></Card>
<div className="grid xl:grid-cols-2 gap-5 mb-5">{MET.map((m,i)=><Card key={m}><h3 className="font-semibold">{m}</h3><div style={{height:h-60}}><ResponsiveContainer><BarChart data={[d[i]]}><XAxis dataKey="n"/><YAxis domain={[0,1]}/><Tooltip/><Legend/><Bar dataKey="Decision Tree" fill="#60a5fa"/><Bar dataKey="Random Forest" fill="#1d4ed8"/></BarChart></ResponsiveContainer></div></Card>)}</div>
<div className="grid xl:grid-cols-2 gap-5 mb-5"><CM t="Decision Tree Confusion Matrix (illustrative)" m={[[168,12],[17,53]]}/><CM t="Random Forest Confusion Matrix (illustrative)" m={[[174,6],[9,61]]}/></div>
<div className="grid xl:grid-cols-2 gap-5"><Card><h3 className="font-semibold">Decision Tree</h3><ul className="list-disc ml-5 text-sm"><li>Easy to interpret</li><li>Single tree</li><li>Can overfit</li></ul></Card><Card><h3 className="font-semibold">Random Forest</h3><ul className="list-disc ml-5 text-sm"><li>Multiple trees</li><li>More robust</li><li>Reduces overfitting tendency</li></ul></Card></div></>}

function About(){const S=({t,c})=><Card><h3 className="font-semibold text-blue-700 mb-1">{t}</h3><div className="text-sm">{c}</div></Card>
return <><H t="About Project"/><div className="grid xl:grid-cols-2 gap-5">
<S t="Project Title" c="Bankruptcy Prediction Using Decision Trees and Random Forest"/>
<S t="Problem Statement" c="Predict whether a company is at risk of bankruptcy from its financial indicators, enabling early warning for stakeholders."/>
<S t="Objectives" c={<ul className="list-disc ml-5"><li>Clean and analyse financial data</li><li>Select relevant features</li><li>Train and compare Decision Tree and Random Forest</li></ul>}/>
<S t="Methodology" c="Dataset → Cleaning → EDA → Heatmap → Feature Selection → Decision Tree → Random Forest → Prediction → Comparison"/>
<S t="Technologies Used" c="Python, scikit-learn, pandas (ML project); React, Vite, Tailwind, Recharts (this demo UI)"/>
<S t="Algorithms" c="Decision Tree, Random Forest"/>
<S t="Applications" c="Credit risk assessment, investment screening, auditing, financial monitoring"/>
<S t="Team Members" c={<>Member 1 — Name / Roll No.<br/>Member 2 — Name / Roll No.<br/>Member 3 — Name / Roll No.</>}/>
<S t="Guide" c="Dr. N. Nirmalajyothi, Associate Professor, CSE"/>
<S t="Department / Year" c="Computer Science and Engineering · 2026–27"/></div></>}

export default function App(){const[i,setI]=useState(0);const[pres,setPres]=useState(false);const h=pres?400:260
const pages=[<Dashboard go={setI}/>,<Dataset/>,<Cleaning h={h}/>,<Analysis h={h}/>,<Features h={h}/>,<Prediction/>,<Compare h={h}/>,<About/>]
return <div className="min-h-screen flex bg-gradient-to-br from-[#0b1530] via-[#10244f] to-[#0b1530]">
{!pres&&<aside className="w-60 shrink-0 p-4 bg-black/30 border-r border-white/10"><div className="mb-6"><p className="text-white font-bold text-lg">📉 BankruptcyAI</p><p className="text-[11px] text-blue-300">Financial Risk Prediction</p></div>{NAV.map(([n,Ic],k)=><button key={n} onClick={()=>setI(k)} className={`w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-xl text-sm transition ${i===k?'bg-blue-600 text-white':'text-blue-200 hover:bg-white/10'}`}><Ic size={18}/>{n}</button>)}<p className="text-[10px] text-blue-300/70 mt-6">Frontend demo · B.Tech CSE 2026–27</p></aside>}
<main className={`flex-1 p-8 overflow-auto ${pres?'text-lg max-w-6xl mx-auto':''}`}>
<div className="flex justify-end mb-4"><button onClick={()=>setPres(!pres)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm"><Presentation size={16}/>{pres?'Exit Presentation':'Presentation Mode'}</button></div>
{pres&&<div className="flex flex-wrap gap-2 mb-4">{NAV.map(([n],k)=><button key={n} onClick={()=>setI(k)} className={`px-3 py-1 rounded-full text-xs ${i===k?'bg-blue-600 text-white':'bg-white/10 text-blue-200'}`}>{n}</button>)}</div>}
<div key={i} className="fade">{pages[i]}</div></main></div>}
