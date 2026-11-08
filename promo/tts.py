# usage: python tts.py script.json outdir   -> per-segment mp3 + vo.wav (with gaps) + segments.json (exact start/end)
import asyncio, json, subprocess, sys, os
import edge_tts
VOICE='zh-CN-XiaoyiNeural'; RATE='+6%'; PITCH='+4Hz'
GAP={'default':0.28}
sc=json.load(open(sys.argv[1],encoding='utf8')); out=sys.argv[2]; os.makedirs(out,exist_ok=True)
async def main():
    for s in sc['segments']:
        f=f"{out}/{s['id']}.mp3"
        tf=f+'.txt'
        if os.path.exists(f) and os.path.exists(tf) and open(tf,encoding='utf8').read()==s['text']: continue
        for k in range(6):
            try:
                await asyncio.wait_for(edge_tts.Communicate(s['text'],VOICE,rate=RATE,pitch=PITCH).save(f),40); break
            except Exception as e:
                print('retry',s['id'],k,repr(e)[:80]); await asyncio.sleep(2)
        else: raise SystemExit('tts failed '+s['id'])
        open(tf,'w',encoding='utf8').write(s['text'])
asyncio.run(main())
def dur(f):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]).decode().strip())
t=0.0; segs=[]; lst=[]
for s in sc['segments']:
    f=f"{out}/{s['id']}.mp3"
    d=dur(f)
    # trim leading/trailing silence for tight timing
    g=f"{out}/{s['id']}.t.wav"
    subprocess.run(['ffmpeg','-y','-v','error','-i',f,'-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse','-ar','48000','-ac','1',g],check=True)
    d=dur(g); gap=s.get('gap',GAP['default'])
    segs.append({**s,'start':round(t,3),'end':round(t+d,3)})
    lst.append((g,d,gap)); t+=d+gap
# concat with silence gaps
parts=[]; 
inputs=[]; flt=[]
for i,(g,d,gap) in enumerate(lst):
    inputs+=['-i',g]; flt.append(f"[{i}:a]apad=pad_dur={gap}[a{i}]")
cc=''.join(f"[a{i}]" for i in range(len(lst)))
flt.append(f"{cc}concat=n={len(lst)}:v=0:a=1[o]")
subprocess.run(['ffmpeg','-y','-v','error',*inputs,'-filter_complex',';'.join(flt),'-map','[o]','-ar','48000',f"{out}/vo.wav"],check=True)
json.dump({'total':round(t,3),'segments':segs},open(f"{out}/segments.json",'w',encoding='utf8'),ensure_ascii=False,indent=1)
print('total',round(t,2))
