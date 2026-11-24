import json,wave,re,sys
import numpy as np
GAP=float(sys.argv[1]); LEAD=1.0; TAIL=2.2
lines=[l.strip() for l in open('script.txt') if l.strip()]
out=[];t=LEAD;segs=[];SR=16000
for i,l in enumerate(lines):
    w=wave.open(f'l{i:02d}.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32);w.close()
    idx=np.where(np.abs(a)>300)[0]; a=a[max(idx[0]-200,0):idx[-1]+400]
    d=len(a)/SR; words=l.split(); wts=[]
    for wd in words:
        core=re.sub(r'[^\wäöüÄÖÜß]','',wd)
        wt=len(re.findall(r'[aeiouäöüy]+',core.lower()))+len(core)*0.12+0.3
        if re.search(r'[.,:?!]$',wd): wt+=0.9
        wts.append(wt)
    tot=sum(wts);c=t;ws=[]
    for wd,wt in zip(words,wts):
        dd=d*wt/tot; ws.append({'w':wd,'s':round(c,3),'e':round(c+dd,3)}); c+=dd
    out.append({'text':l,'start':round(t,3),'end':round(t+d,3),'words':ws})
    segs.append((t,a)); t+=d+GAP
total=t-GAP+TAIL
buf=np.zeros(int(total*SR)+1,dtype=np.float32)
for s,a in segs: buf[int(s*SR):int(s*SR)+len(a)]+=a
w=wave.open('voice.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(np.clip(buf,-32767,32767).astype(np.int16).tobytes());w.close()
json.dump({'total':total,'lines':out},open('lines.json','w'),ensure_ascii=False,indent=1)
print('total',round(total,2))
for x in out: print(x['start'],x['end'],x['text'])
