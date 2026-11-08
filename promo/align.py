# usage: python align.py vo_dir  -> transcribes vo.wav (word timestamps), compares to script text per segment, writes align.json
import json, sys, re, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel
d=sys.argv[1]
segs=json.load(open(f'{d}/segments.json',encoding='utf8'))
m=WhisperModel('whisper-small',device='cpu',compute_type='int8')
raw=subprocess.check_output(['ffmpeg','-v','error','-i',f'{d}/vo.wav','-f','f32le','-ac','1','-ar','16000','-'])
audio=np.frombuffer(raw,dtype=np.float32)
r,info=m.transcribe(audio,language='zh',word_timestamps=True,initial_prompt='优易库，Minecraft，Boss，AI，Premiere，剪映。',vad_filter=False)
words=[]
for s in r:
    for w in s.words: words.append({'w':w.word,'s':round(w.start,3),'e':round(w.end,3)})
norm=lambda t: re.sub(r'[^一-鿿A-Za-z0-9]','',t).lower()
hyp=''.join(norm(w['w']) for w in words)
# char-level map hyp char -> time
ct=[]
for w in words:
    n=norm(w['w'])
    for i,c in enumerate(n): ct.append((c,w['s']+(w['e']-w['s'])*i/max(1,len(n)),w['s']+(w['e']-w['s'])*(i+1)/max(1,len(n))))
ref=''.join(norm(s['text']) for s in segs['segments'])
sm=difflib.SequenceMatcher(None,ref,hyp,autojunk=False)
print('overall similarity %.3f'%sm.ratio())
# per segment: text recognised within its [start-0.4,end+0.4] window
out=[]
for s in segs['segments']:
    got=''.join(c for c,a,b in ct if a>=s['start']-0.3 and b<=s['end']+0.3)
    sim=difflib.SequenceMatcher(None,norm(s['text']),got,autojunk=False).ratio()
    out.append({'id':s['id'],'text':s['text'],'heard':got,'sim':round(sim,3),'start':s['start'],'end':s['end']})
    print(s['id'],'%.2f'%sim,'|',norm(s['text']),'|',got)
json.dump({'similarity':sm.ratio(),'segments':out,'words':words},open(f'{d}/align.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
