import {existsSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)};
mkdirSync(resolve(root,'output'),{recursive:true});
run('pnpm',['prepare']);
run('pnpm',['render:silent']);
const silent=resolve(root,'output/oathline-demo-silent.mp4');
const narration=resolve(root,'public/audio/narration.wav');
if(existsSync(narration)){
  run('ffmpeg',['-y','-i',silent,'-i',narration,'-filter_complex','[0:a]volume=0.72[bed];[1:a]highpass=f=75,lowpass=f=15000,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=160,volume=1.2[vo];[bed][vo]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350[duck];[duck][vo]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1:LRA=8[a]','-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',resolve(root,'output/oathline-demo-master.mp4')]);
}else{
  run('ffmpeg',['-y','-i',silent,'-c','copy',resolve(root,'output/oathline-demo-master.mp4')]);
  console.warn('No narration.wav found: master contains original score and burned captions only.');
}
run('ffmpeg',['-y','-i',resolve(root,'output/oathline-demo-master.mp4'),'-vf','scale=1920:1080:flags=lanczos','-c:v','libx264','-preset','slow','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',resolve(root,'output/oathline-demo-x.mp4')]);
