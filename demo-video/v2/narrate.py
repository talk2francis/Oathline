"""Local-only neural narration. The model weights are data, never remote code."""
import json, os, pathlib, sys, hashlib
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parents[1]
opts = ort.SessionOptions()
opts.intra_op_num_threads = 2
opts.inter_op_num_threads = 1
session = ort.InferenceSession(str(ROOT/'.models/kokoro-v1.0.onnx'), sess_options=opts, providers=['CPUExecutionProvider'])
class TypedKokoro(Kokoro):
    # v0.4.9 assumes integer speed for the new export; the v1.1 model requires float.
    def _create_audio(self, phonemes, voice, speed):
        tokens=self.tokenizer.tokenize(phonemes)
        if len(tokens)>510: raise ValueError('Narration sentence exceeds model context')
        result=self.sess.run(None,{'input_ids':np.array([[0,*tokens,0]],dtype=np.int64),
            'style':np.array(voice[len(tokens)],dtype=np.float32),'speed':np.array([speed],dtype=np.float32)})[0]
        return result,24000
tts = TypedKokoro.from_session(session,str(ROOT/'.models/voices-v1.0.bin'))
voice = os.getenv('OATHLINE_VOICE','bm_george')
out = ROOT/'public/v2/audio'
out.mkdir(parents=True,exist_ok=True)
if '--sample' in sys.argv:
    for v in ['bm_george','am_michael','af_heart']:
        samples,rate=tts.create('This order never reached Binance. The mandate allowed fifteen. Oathline stopped the call.',voice=v,speed=1.0,lang='en-gb' if v.startswith('b') else 'en-us')
        sf.write(str(out/f'sample-{v}.wav'),samples,rate)
        print(v,len(samples)/rate,flush=True)
    sys.exit(0)
story=json.loads((ROOT/'v2/story.json').read_text())
raw=ROOT/'v2/raw';raw.mkdir(exist_ok=True)
timing=[]
for shot in story:
    bits=[];sentences=[];clock=0
    for i,line in enumerate(shot['lines']):
        key=hashlib.sha256(line.encode()).hexdigest()[:10]
        path=raw/f"{shot['id']}-{voice}-{i}-{key}.wav"
        if path.exists(): samples,rate=sf.read(str(path),dtype='float32')
        else:
            spoken=line.replace('Oathline','Oath line')
            samples,rate=tts.create(spoken,voice=voice,speed=1.02,lang='en-gb' if voice.startswith('b') else 'en-us')
            sf.write(str(path),samples,rate)
        gap=np.zeros(int(rate*.16),dtype=np.float32)
        bits.extend([samples,gap]);sentences.append({'text':line,'start':clock,'end':clock+len(samples)/rate})
        clock+=(len(samples)+len(gap))/rate
    joined=np.concatenate(bits)
    sf.write(str(out/f"{shot['id']}-raw.wav"),joined,rate)
    timing.append({'id':shot['id'],'seconds':shot['seconds'],'speechSeconds':len(joined)/rate,'sentences':sentences})
    print(shot['id'],round(len(joined)/rate,2),'available',shot['seconds'],flush=True)
(ROOT/'v2/narration-timing.json').write_text(json.dumps(timing,indent=2))
