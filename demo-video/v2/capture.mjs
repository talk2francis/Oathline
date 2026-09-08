import {chromium} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import {spawnSync,spawn} from 'node:child_process';
const server=spawn(process.execPath,[path.join(import.meta.dirname,'server.mjs')],{stdio:'inherit'});
process.on('exit',()=>server.kill());
await new Promise(r=>setTimeout(r,700));
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'public/v2/clips');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(root,'v2/raw'),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const manifest=[];const only=process.argv[2];
const wait=(p,ms)=>p.waitForTimeout(ms);
async function move(p,x,y){await p.mouse.move(x,y,{steps:28});await wait(p,260);}
async function click(p,loc){await loc.scrollIntoViewIfNeeded();let box=await loc.boundingBox();await move(p,box.x+box.width*.54,box.y+box.height*.5);await p.mouse.click(box.x+box.width*.54,box.y+box.height*.5);}
async function scroll(p,y){await p.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),y);await wait(p,900);}
async function capture(id,url,prepare,perform){
 if(only&&id!==only)return;
 if(!only&&fs.existsSync(path.join(out,id+'.mp4')))return;
 const c=await browser.newContext({viewport:{width:1600,height:720},deviceScaleFactor:1,recordVideo:{dir:path.join(root,'v2/raw'),size:{width:1600,height:720}}});const p=await c.newPage();
 p.on('pageerror',e=>console.log('PAGE ERROR',id,e.message));
 await p.goto('http://127.0.0.1:3045'+url,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 // Explicit recording-profile fonts compensate for missing build-time font CSS.
 // This changes presentation only; all product state and interaction are unmodified.
 await p.addStyleTag({content:`@font-face{font-family:StudioGeist;src:url('/studio/font/Geist-Regular.woff2')}@font-face{font-family:StudioMono;src:url('/studio/font/GeistMono-Regular.woff2')}body{--sans:StudioGeist,sans-serif;--mono:StudioMono,monospace} html{scroll-behavior:smooth} ::-webkit-scrollbar{width:7px} ::-webkit-scrollbar-thumb{background:#777} `});
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>{const el=document.createElement('div');el.id='recording-pointer';el.innerHTML='<svg width="25" height="30" viewBox="0 0 25 30"><path d="M2 2L3 25L9 19L14 28L18 26L13 17L23 16Z" fill="white" stroke="#101214" stroke-width="1.5"/></svg>';Object.assign(el.style,{position:'fixed',left:'1450px',top:'620px',zIndex:2147483647,pointerEvents:'none'});document.body.appendChild(el);document.addEventListener('mousemove',e=>{el.style.left=e.clientX+'px';el.style.top=e.clientY+'px'});});
 await prepare?.(p);await wait(p,600);
 const start=Date.now();const video=p.video();
 await perform(p);await wait(p,1700);await p.screenshot({path:path.join(out,id+'.png')});
 await c.close();const raw=await video.path();
 // Keep the raw browser recording. Trim setup using measured recording duration.
 const duration=Number(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',raw],{encoding:'utf8'}).stdout);
 const elapsed=(Date.now()-start)/1000;const skip=Math.max(0,duration-elapsed+.2);
 const r=spawnSync('ffmpeg',['-y','-v','error','-ss',String(skip),'-i',raw,'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,id+'.mp4')],{stdio:'inherit'});if(r.status)throw Error('encode failed');
 manifest.push({id,url,duration,skip,recordedAt:new Date().toISOString()});console.log('CAPTURED',id,duration,skip);
}
await capture('mandate','/mandate/',async p=>{await scroll(p,360)},async p=>{
 await click(p,p.getByLabel('Expiry',{exact:true}));await p.getByLabel('Expiry',{exact:true}).fill(new Date(Date.now()+86400000).toISOString().slice(0,16));await wait(p,1800);
 await scroll(p,1020);await move(p,500,360);await wait(p,2500);
 await click(p,p.getByRole('button',{name:'Sign mandate locally'}));await p.getByText('Live TOML · SIGNED').waitFor();await wait(p,1800);
 await p.locator('.mandate-output').scrollIntoViewIfNeeded();await wait(p,1300);
});
await capture('replay','/replay/',async p=>scroll(p,240),async p=>{await move(p,470,380);await wait(p,3300);await scroll(p,510);await wait(p,3300)});
await capture('block','/studio/archive/block',null,async p=>{await wait(p,2300);await scroll(p,330);await move(p,950,260);await wait(p,4500);await scroll(p,540);await wait(p,2200)});
await capture('stale','/studio/archive/stale',async p=>scroll(p,80),async p=>{await wait(p,2200);await scroll(p,360);await move(p,1070,370);await wait(p,4900)});
await capture('fresh','/studio/archive/fresh',async p=>scroll(p,70),async p=>{await wait(p,2200);await scroll(p,380);await wait(p,4100)});
await capture('fill','/receipts/demo/',async p=>scroll(p,190),async p=>{await wait(p,2000);await scroll(p,420);await move(p,590,270);await wait(p,5000);await scroll(p,535);await wait(p,2200)});
await capture('reconcile','/studio/archive/reconcile',null,async p=>{await wait(p,2200);await move(p,590,445);await wait(p,4800);await scroll(p,250);await wait(p,2000)});
await capture('verify','/verify/',async p=>scroll(p,300),async p=>{await wait(p,900);await click(p,p.getByRole('button',{name:'Load shipped demo'}));await p.getByText('CHAIN VALID',{exact:true}).waitFor();await p.locator('.verify-result').scrollIntoViewIfNeeded();await wait(p,5300)});
await capture('tamper','/verify/',async p=>{await scroll(p,270)},async p=>{
 const lines=fs.readFileSync(path.join(root,'../receipts/demo/receipts.jsonl'),'utf8').trim().split('\n');const r=JSON.parse(lines[4]);r.kind='tampered_demo_copy';lines[4]=JSON.stringify(r);
 await move(p,540,400);await wait(p,1500);await p.locator('input[type=file]').setInputFiles({name:'receipts-tampered-copy.jsonl',mimeType:'text/plain',buffer:Buffer.from(lines.join('\n')+'\n')});await p.getByText('CHAIN BROKEN',{exact:true}).waitFor();await p.locator('.verify-result').scrollIntoViewIfNeeded();await wait(p,6000);
});
await capture('surface','/surface/',async p=>scroll(p,210),async p=>{await wait(p,2300);await scroll(p,490);await wait(p,3000)});
await capture('limits','/limits/',async p=>scroll(p,180),async p=>{await wait(p,2200);await scroll(p,410);await wait(p,2300)});
fs.writeFileSync(path.join(root,'v2/capture-manifest'+(only?'-'+only:'')+'.json'),JSON.stringify(manifest,null,2));await browser.close();server.kill();
