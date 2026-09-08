"""Machine-check the actual deliverable; produce a factual report, not a taste score."""
import json,pathlib,subprocess,hashlib
import soundfile as sf
import numpy as np
root=pathlib.Path(__file__).resolve().parents[1]
film=root/'exports/oathline-demo-150s.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(film)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'])==(1920,1080,'30/1')
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert v['color_space']=='bt709' and v['color_range']=='tv'
assert a['codec_name']=='aac' and a['channels']==2 and a['sample_rate']=='48000'
assert abs(float(v['duration'])-150)<.04 and abs(float(a['duration'])-150)<.04
assert len(probe['streams'])==2 # Burned captions + external SRT, no duplicate default text track.
cues=json.loads((root/'v2/captions.json').read_text())
for i,c in enumerate(cues):
    assert 0<=c['start']<c['end']<=150
    assert len(c['text'])<=60
    if i: assert c['start']>=cues[i-1]['end']
story=json.loads((root/'v2/story.json').read_text());segments=[]
for shot in story:
    pcm,sr=sf.read(root/f'public/v2/audio/{shot["id"]}.wav',always_2d=True)
    assert len(pcm)==sr*shot['seconds']
    rms=float(np.sqrt(np.mean(pcm**2)));assert rms>.003
    segments.append({'id':shot['id'],'seconds':len(pcm)/sr,'rms':rms})
    if shot['kind']=='capture': assert (root/f'public/v2/ready/{shot["id"]}.mp4').exists()
subprocess.run(['ffmpeg','-v','error','-i',str(film),'-map','0:v:0','-map','0:a:0','-f','null','-'],check=True)
loud=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(film),'-map','0:a:0','-af','loudnorm=I=-16:TP=-1:LRA=8:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
raw=loud.stderr[loud.stderr.rfind('{'):];levels=json.loads(raw)
assert -17<float(levels['input_i'])<-15
assert float(levels['input_tp'])<=-.8
report={'file':str(film.relative_to(root)),'sha256':hashlib.sha256(film.read_bytes()).hexdigest(),'bytes':film.stat().st_size,'duration':150,'frames':int(v['nb_frames']),'video':{k:v.get(k) for k in ['codec_name','pix_fmt','color_space','color_range','width','height','r_frame_rate']},'audio':{k:a.get(k) for k in ['codec_name','channels','sample_rate','duration']},'captionCues':len(cues),'captionOverlaps':0,'fullDecode':'PASS','audioLevels':levels,'narrationSegments':segments,'humanListeningTest':'Not performed by this automated QA. No perceptual taste guarantee.'}
(root/'exports/QA.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
