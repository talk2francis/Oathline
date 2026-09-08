import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Original procedural score: sparse sub pulse, muted fifths, and soft metallic overtones.
// It contains no sampled or third-party copyrighted material.
const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rate = 48000, duration = 90, channels = 2, frames = rate * duration;
const data = Buffer.alloc(frames * channels * 2);
const notes = [55,73.416,82.407,65.406];
const smooth = (x) => x*x*(3-2*x);
const env = (t,start,len,attack=.8,release=1.8) => {
  if(t<start||t>start+len) return 0;
  const local=t-start;
  return Math.min(1,smooth(Math.min(1,local/attack)),smooth(Math.min(1,(len-local)/release)));
};
let seed=1949;
const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/4294967296)*2-1;};
let filtered=0;
for(let i=0;i<frames;i++){
  const t=i/rate;
  const phrase=Math.min(3,Math.floor(t/22.5));
  const base=notes[phrase];
  let s=0;
  s += Math.sin(2*Math.PI*base*t)*0.055;
  s += Math.sin(2*Math.PI*base*1.5*t+0.4)*0.021;
  s += Math.sin(2*Math.PI*base*2*t+1.1)*0.009;
  const beat=(t*1.45)%1;
  const pulse=Math.exp(-beat*9)*Math.sin(2*Math.PI*(55-18*beat)*t)*0.035;
  s += pulse;
  for(const start of [4,12,20,30.8,41.8,50,55,60,64,72.8,82.8]){
    const e=env(t,start,2.6,.03,2.3);
    if(e) s += Math.sin(2*Math.PI*(base*4)*t)*e*0.012 + Math.sin(2*Math.PI*(base*6.02)*t)*e*0.006;
  }
  filtered=filtered*.985+noise()*.015;
  s += filtered*0.007;
  const fadeIn=Math.min(1,t/3), fadeOut=Math.min(1,(duration-t)/4);
  const sceneDuck=(t>22&&t<50)?0.78:1;
  s*=fadeIn*fadeOut*sceneDuck;
  const left=Math.max(-1,Math.min(1,s+Math.sin(2*Math.PI*0.031*t)*0.002));
  const right=Math.max(-1,Math.min(1,s+Math.sin(2*Math.PI*0.037*t+1)*0.002));
  data.writeInt16LE(Math.round(left*32767),i*4);
  data.writeInt16LE(Math.round(right*32767),i*4+2);
}
const header=Buffer.alloc(44);
header.write('RIFF',0); header.writeUInt32LE(36+data.length,4); header.write('WAVE',8);
header.write('fmt ',12); header.writeUInt32LE(16,16); header.writeUInt16LE(1,20);
header.writeUInt16LE(channels,22); header.writeUInt32LE(rate,24); header.writeUInt32LE(rate*channels*2,28);
header.writeUInt16LE(channels*2,32); header.writeUInt16LE(16,34); header.write('data',36); header.writeUInt32LE(data.length,40);
mkdirSync(resolve(root,'public/audio'),{recursive:true});
writeFileSync(resolve(root,'public/audio/oathline-score.wav'),Buffer.concat([header,data]));
console.log('Generated original 90-second procedural score.');
