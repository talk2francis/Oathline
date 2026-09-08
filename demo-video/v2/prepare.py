"""Conform recorded footage, speech, captions and licensed score to 150 seconds."""
import json,pathlib,subprocess,re,sys
import numpy as np
import soundfile as sf
ROOT=pathlib.Path(__file__).resolve().parents[1]
def run(args):
    subprocess.run(args,cwd=ROOT,check=True)
def ff(args):
    if '--captions-only' not in sys.argv: run(['ffmpeg','-y','-v','error',*args])
def duration(p): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)]))
story=json.loads((ROOT/'v2/story.json').read_text())
timing={s['id']:s for s in json.loads((ROOT/'v2/narration-timing.json').read_text())}
audio=ROOT/'public/v2/audio';ready=ROOT/'public/v2/ready';ready.mkdir(exist_ok=True)
out=ROOT/'output/v2';out.mkdir(parents=True,exist_ok=True)
captions=[];offset=0;tracks=[];audit=[]
def readable(s):
    return s.replace('U S D T','USDT').replace('B N B','BNB').replace('Pre Tool Use','PreToolUse')
def chunks(text):
    words=readable(text).split();parts=[];part=[]
    for word in words:
        if part and (len(' '.join([*part,word]))>56 or len(part)>=9): parts.append(' '.join(part));part=[]
        part.append(word)
    if part: parts.append(' '.join(part))
    for i in range(len(parts)-1):
        w=parts[i].split()
        while len(w)>2 and w[-1].lower().strip(',') in {'for','a','the','and','of','with','to','its','an','in'}:
            parts[i+1]=w.pop()+' '+parts[i+1]
        parts[i]=' '.join(w)
    return parts
for shot in story:
    ident=shot['id'];seconds=shot['seconds'];t=timing[ident]
    speed=max(1,t['speechSeconds']/(seconds-.7))
    if speed>1.14: raise RuntimeError(f'{ident} needs script trimming, not rushed speech: {speed:.3f}')
    lead=.32
    conformed=audio/f'{ident}.wav'
    ff(['-i',str(audio/f'{ident}-raw.wav'),'-af',f'atempo={speed},highpass=f=75,afade=t=in:d=0.012,adelay=320,apad,atrim=duration={seconds}', '-ar','48000','-ac','2',str(conformed)])
    if '--captions-only' not in sys.argv:
        # atempo's buffered tail can leave shorter WAVs despite atrim/apad.
        # Conform by sample count so every following scene stays in sync.
        pcm,sr=sf.read(conformed,always_2d=True)
        target=seconds*sr
        if len(pcm)<target: pcm=np.pad(pcm,((0,target-len(pcm)),(0,0)))
        sf.write(conformed,pcm[:target],sr,subtype='PCM_16')
    tracks.append(conformed)
    for sentence in t['sentences']:
        parts=chunks(sentence['text']);weights=[len(p) for p in parts];total=sum(weights)
        start=offset+lead+sentence['start']/speed;span=(sentence['end']-sentence['start'])/speed
        for part,w in zip(parts,weights):
            end=start+span*w/total
            captions.append({'start':round(start,3),'end':round(end,3),'text':part,'scene':ident})
            start=end
    if shot['kind']=='capture' and not (ready/f'{ident}.mp4').exists():
        src=ROOT/f'public/v2/clips/{ident}.mp4';dur=duration(src)
        # Remove only trailing stillness, then modestly conform the recorded take.
        usable=max(seconds,min(dur,dur-.65)) if dur>seconds else dur
        rate=max(1,usable/seconds)
        ff(['-i',str(src),'-vf',f'trim=duration={usable},setpts=PTS/{rate},fps=30,tpad=stop_mode=clone:stop_duration={seconds}', '-t',str(seconds),'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(ready/f'{ident}.mp4')])
    audit.append({'scene':ident,'start':offset,'seconds':seconds,'speechSpeed':round(speed,4),'speechEnds':round(offset+lead+t['speechSeconds']/speed,3)})
    offset+=seconds
    print('Conformed',ident,flush=True)
assert offset==150
(ROOT/'v2/captions.json').write_text(json.dumps(captions,indent=2))
(ROOT/'v2/conform-audit.json').write_text(json.dumps(audit,indent=2))
def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt='\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n'
(out/'oathline-150.srt').write_text(srt)
(ROOT/'v2/VOICEOVER.md').write_text('# Oathline — 150-second narration\n\nLocal synthetic narrator: Kokoro bm_george.\n\n'+'\n\n'.join(f'## {a["start"]:03d}s — {s["title"]}\n\n'+ '\n\n'.join(s['lines']) for s,a in zip(story,audit)))
if '--captions-only' in sys.argv: sys.exit(0)
inputs=[x for p in tracks for x in ['-i',str(p)]]
ff([*inputs,'-filter_complex',''.join(f'[{i}:a]' for i in range(len(tracks)))+f'concat=n={len(tracks)}:v=0:a=1,loudnorm=I=-17:TP=-2:LRA=7[a]', '-map','[a]','-ar','48000',str(out/'narration.wav')])
music=audio/'undertow.mp3';tail=duration(music)-8
ff(['-i',str(music),'-filter_complex',f'[0:a]asplit=2[m1][m2];[m1]atrim=0:144,asetpts=PTS-STARTPTS[a];[m2]atrim=start={tail},asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=2:c1=tri:c2=tri,atrim=duration=150,highpass=f=45,loudnorm=I=-28:TP=-6:LRA=9,afade=t=in:d=2,afade=t=out:st=146:d=4[m]', '-map','[m]','-ar','48000',str(out/'music-bed.wav')])
ff(['-i',str(out/'narration.wav'),'-i',str(out/'music-bed.wav'),'-filter_complex','[0:a]asplit=2[voice][key];[1:a][key]sidechaincompress=threshold=0.045:ratio=3:attack=35:release=450:makeup=1[duck];[voice][duck]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-16:TP=-1:LRA=8,atrim=duration=150[a]', '-map','[a]','-ar','48000','-ac','2',str(out/'final-mix.wav')])
print(json.dumps(audit,indent=2))
