import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame,interpolate,Easing} from 'remotion';
import story from './story.json';
import cues from './captions.json';
import './film.css';
const ease=Easing.bezier(.22,1,.36,1);
const tween=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const tags:Record<string,string>={mandate:'RECORDED PRODUCT INTERACTION',replay:'LOCAL SIMULATION · NOT A LIVE TRADE',block:'ARCHIVED HOST OUTPUT · CODEX 0.153.3',stale:'ARCHIVED RECEIPT · 024',fresh:'ARCHIVED RECEIPT · 028',fill:'ARCHIVED BINANCE RESULT · 05 SEP 2026',reconcile:'ARCHIVED RECONCILIATION · LIMITED WINDOW',verify:'RECORDED LOCAL VERIFICATION',tamper:'RECORDED TEST · MODIFIED COPY',surface:'OBSERVED CATALOG · 05 SEP 2026',limits:'REAL PRODUCT DOCUMENTATION'};
const notes:Record<string,string>={mandate:'A new local signing demonstration. Historical trades use their original mandate.',replay:'This SELL fixture and the following observed BUY are separate evidence paths.',block:'Historical receipt says ADVISORY; the separate host observation records the block being honored.',stale:'7.00 USDT within budget · snapshot 31.8s old · 30s maximum',fresh:'Same 7.00 USDT proposal · refreshed snapshot 0.3s old',fill:'Recorded allow-path emitted a hook-format warning; adapter corrected afterward. No new trade placed.',reconcile:'Order-ID match within the explicitly recorded Binance-history window.',verify:'Hash-link consistency, not proof that every underlying claim is true.',tamper:'The original committed receipt chain is unchanged.',surface:'318 total · 176 READ · 50 WRITE · 92 UNKNOWN',limits:'Client enforcement is observed, version-specific behavior—not a universal guarantee.'};
function Caption(){const f=useCurrentFrame();const c=cues.find(c=>f/30>=c.start&&f/30<c.end);return c?<div className="sub-safe"><div className="subtitle">{c.text}</div></div>:null;}
function Brand({large=false}:{large?:boolean}){return <div className={large?'brand-lockup large':'brand-lockup'}><Img src={staticFile('brand/oathline-lockup-dark.png')}/></div>;}
function Screen({shot}: {shot:typeof story[number]}){
 const f=useCurrentFrame();
 // These are camera crops of recorded pixels, never reconstructed interfaces.
 const zoom=['verify','tamper','fill'].includes(shot.id)?tween(f,85,155,1,shot.id==='fill'?1.34:1.16):1;
 const origin=shot.id==='fill'?'24% 44%':'48% 60%';
 return <><div className="film-head"><div className="chapter">{shot.chapter}</div><h1>{shot.title}</h1><div className="evidence-tag"><i/>{tags[shot.id]}</div></div>
 <div className="screen"><OffthreadVideo src={staticFile(`v2/ready/${shot.id}.mp4`)} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`,transformOrigin:origin}}/></div>
 <div className="source-note">{notes[shot.id]}</div></>;
}
function Opening(){const f=useCurrentFrame();return <>
 <div className="opening-header"><Brand/><span>FINANCIAL AUTHORITY, WITH CONDITIONS.</span></div>
 <div className="cold-copy" style={{transform:`translateY(${tween(f,0,26,18,0)}px)`,opacity:tween(f,0,20,0,1)}}><div className="chapter">AN OBSERVED CODEX RUN</div><h1>This order<br/>never reached<br/><em>Binance.</em></h1><div className="cold-values"><div><b>83.40</b><span>USDT PROPOSED</span></div><div><b>15.00</b><span>USDT PERMITTED</span></div></div></div>
 <div className="cold-evidence"><Img src={staticFile('v2/clips/block.png')}/><div className="evidence-ribbon">ACTUAL ARCHIVED OUTPUT · CODEX 0.153.3</div></div>
 <div className="cold-rule" style={{transform:`scaleX(${tween(f,25,100,0,1)})`}}/>
 </>;}
function Boundary(){const f=useCurrentFrame();return <><div className="film-head"><div className="chapter">01 / DELEGATE</div><h1>Access is not a blank cheque.</h1><div className="evidence-tag">EXPLANATORY GRAPHIC</div></div><div className="boundary-panels">
 <div className="access-panel" style={{opacity:tween(f,0,20,0,1)}}><span>BINANCE AGENT OS</span><h2>Account<br/>access.</h2><div className="panel-line"/><p>Official MCP connection<br/>Binance OAuth</p><small>Oathline holds no Binance API key.</small></div>
 <div className="mandate-panel" style={{opacity:tween(f,60,90,0,1),transform:`translateY(${tween(f,60,90,20,0)}px)`}}><span>OATHLINE</span><h2>Financial<br/>conditions.</h2><div className="panel-line"/><p>Signed mandate<br/>Deterministic action checks</p><small>Beside Agent OS—not a credential proxy.</small></div>
 </div></>;}
function Ending(){const f=useCurrentFrame();return <div className="ending" style={{opacity:tween(f,0,20,0,1)}}><div className="end-rule"/><Brand large/><h1>Give software a boundary.</h1><p>Policy before execution. Evidence after.</p><div className="end-links">oathline.xyz <span>·</span> github.com/talk2francis/Oathline</div><div className="credit">“Undertow” — Scott Buckley · CC BY 4.0 · scottbuckley.com.au</div></div>;}
export function Film(){const f=useCurrentFrame();let from=0;return <AbsoluteFill className="film"><div className="ambient"/>{story.map(shot=>{const start=from;from+=shot.seconds*30;return <Sequence key={shot.id} from={start} durationInFrames={shot.seconds*30}><AbsoluteFill className="shot">{shot.kind==='opening'?<Opening/>:shot.kind==='boundary'?<Boundary/>:shot.kind==='ending'?<Ending/>:<Screen shot={shot}/>}</AbsoluteFill></Sequence>})}<Caption/><div className="timeline-track"><div style={{width:`${f/4499*100}%`}}/></div><div className="final-fade" style={{opacity:tween(f,4480,4499,0,1)}}/></AbsoluteFill>}
