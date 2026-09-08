import {cpSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..');
const repo = resolve(demo, '..');
for (const dir of ['public/brand','public/fonts','public/evidence','public/audio','public/captures','output']) mkdirSync(resolve(demo,dir),{recursive:true});

cpSync(resolve(repo,'site/public/brand/oathline-lockup-dark.png'),resolve(demo,'public/brand/oathline-lockup-dark.png'));
cpSync(resolve(repo,'observations/codex/enforcement-terminal.txt'),resolve(demo,'public/evidence/enforcement-terminal.txt'));
cpSync(resolve(repo,'receipts/demo/order-12534006821.json'),resolve(demo,'public/evidence/order-12534006821.json'));
cpSync(resolve(repo,'receipts/demo/reconciliation.txt'),resolve(demo,'public/evidence/reconciliation.txt'));
cpSync(resolve(repo,'receipts/demo/verification.txt'),resolve(demo,'public/evidence/verification.txt'));

const fontCandidates = [
  resolve(repo,'site/node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2'),
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
];
const semiboldCandidates = [
  resolve(repo,'site/node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2'),
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
];
const copyFirst = (items,target) => {
  for (const item of items) { try { cpSync(item,target); return; } catch {} }
  throw new Error(`No font source available for ${target}`);
};
copyFirst(fontCandidates,resolve(demo,'public/fonts/Geist-Regular.woff2'));
copyFirst(semiboldCandidates,resolve(demo,'public/fonts/Geist-SemiBold.woff2'));

const cues = [
  ['00:00:00,000','00:00:05,000','An agent can hold permission to trade.\nThat does not mean every trade should pass.'],
  ['00:00:05,000','00:00:13,000','Binance Agent OS keeps authentication in its official OAuth connection.\nOathline adds a separate, expiring boundary on how that authority may be used.'],
  ['00:00:13,000','00:00:22,000','This signed mandate permits BNBUSDT Spot, with fifteen dollars per order,\nforty dollars per day, and state no older than thirty seconds.'],
  ['00:00:22,000','00:00:31,000','Now untrusted context pushes the agent toward an eighty-three-dollar market order.\nOathline does not guess why the reasoning failed. It evaluates the action.'],
  ['00:00:31,000','00:00:42,000','Eighty-three forty exceeds fifteen per order—and the entire daily limit.\nOutside mandate. Binance submission: not called.'],
  ['00:00:42,000','00:00:50,000','In this observed Codex 0.153.3 run, the host honored that denial\nbefore spot dot new order was submitted.'],
  ['00:00:50,000','00:01:04,000','A valid seven-dollar order takes the other path—but only with current evidence.\nStale state is withheld. A fresh Binance read arrives. The action passes, and Binance fills it.'],
  ['00:01:04,000','00:01:13,000','Order 12534006821: real BNBUSDT,\nmatched back to the authorization that preceded it.'],
  ['00:01:13,000','00:01:23,000','The full chain verifies locally: thirty-six entries, zero broken links.\nOne matched execution. Zero orphans. Zero divergences.'],
  ['00:01:23,000','00:01:30,000','Policy before execution. Evidence after.\nOathline gives software a boundary.'],
];
writeFileSync(resolve(demo,'output/oathline-demo.srt'),cues.map((c,i)=>`${i+1}\n${c[0]} --> ${c[1]}\n${c[2]}\n`).join('\n'));

const script = readFileSync(resolve(demo,'VOICEOVER.md'),'utf8');
writeFileSync(resolve(demo,'output/narration-script.txt'),script.slice(script.indexOf('## Script'),script.indexOf('## Pronunciation')));
console.log('Prepared evidence, brand, fonts, subtitles, and narration script.');
