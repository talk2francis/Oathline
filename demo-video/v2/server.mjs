import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const receipts=fs.readFileSync(path.join(root,'receipts/demo/receipts.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function archive(id){
 let title,body;
 if(id==='block'){title='observations/codex/enforcement-terminal.txt';body=fs.readFileSync(path.join(root,title),'utf8');}
 else if(id==='reconcile'){title='receipts/demo/reconciliation.txt';body=fs.readFileSync(path.join(root,title),'utf8');}
 else {let r=receipts.find(x=>x.seq===(id==='stale'?24:28));title=`receipts/demo/receipts.jsonl · sequence ${r.seq}`;
 body=JSON.stringify({seq:r.seq,ts:r.ts,kind:r.kind,toolName:r.toolName,outcome:r.outcome,mode:r.mode,binanceSubmission:r.binanceSubmission,clauses:r.ruling.clauses.filter(c=>['budget.max_order_usdt','state.max_age_seconds'].includes(c.id)),mandateHash:r.mandateHash},null,2);}
 let lines=body.split('\n').map((line,i)=>`<div class="line ${/exceeds|Blocked|blocked|OUTSIDE|NOT_CALLED|NOT CALLED|NEEDS_APPROVAL/.test(line)?'alert':/MATCHED|INSIDE_MANDATE|VALID|within|0.3s/.test(line)?'good':''}"><span>${String(i+1).padStart(2,'0')}</span><code>${esc(line)||' '}</code></div>`).join('');
 return `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Mono;src:url('/studio/font/GeistMono-Regular.woff2')}*{box-sizing:border-box}body{margin:0;background:#101215;color:#d9ddd8;font:18px/1.75 Mono,monospace}header{position:sticky;top:0;padding:20px 36px;background:#181b20;border-bottom:1px solid #34383c;z-index:2;font:15px/1.4 sans-serif;color:#afb9b8}header b{color:#dbc58b;margin-right:28px}.content{padding:24px 25px 50px}.line{display:flex;white-space:pre-wrap}.line span{width:54px;flex:none;color:#5d656f;font-size:13px;padding-top:4px}.line code{font:inherit}.alert{background:#a3433426;color:#f0a59b}.good{color:#a4d3b1}footer{padding:20px 80px;color:#7e8991;font:14px/1.5 sans-serif}</style><header><b>ARCHIVED EVIDENCE · 05 SEP 2026</b>${esc(title)}</header><div class="content">${lines}</div><footer>Read-only file presentation. ${id==='block'?'The historical receipt retains ADVISORY. The separate host observation records the denial being honored.':id==='reconcile'?'Result limited to the stated observed execution window.':'Selected fields from the committed receipt; no values changed.'}</footer>`;
}
http.createServer((req,res)=>{
 let url=new URL(req.url,'http://localhost');let p=url.pathname;
 if(p.startsWith('/studio/archive/')){res.setHeader('Content-Type','text/html');return res.end(archive(p.split('/').pop()));}
 let file,servedRoot;
 if(p.startsWith('/studio/font/')){const name=path.basename(p);servedRoot=path.join(root,'site/node_modules/geist/dist/fonts',name.startsWith('GeistMono')?'geist-mono':'geist-sans');file=path.join(servedRoot,name);}
 else {servedRoot=path.join(root,'site/out');file=path.join(servedRoot,decodeURIComponent(p));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');}
 if(!file.startsWith(servedRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end('Not found');}
 res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.json':'application/json','.jsonl':'text/plain'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
}).listen(3045,'127.0.0.1',()=>console.log('Recording server http://127.0.0.1:3045'));
