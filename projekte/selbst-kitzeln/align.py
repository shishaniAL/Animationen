# align a user's recording of script.txt to its lines: speech segments from silence detection,
# merged/split to match the line count; word times estimated within each line.
import sys,json,re,subprocess,wave
import numpy as np
audio, script, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines=[l.strip() for l in open(script) if l.strip()]
subprocess.run(['ffmpeg','-v','error','-y','-i',audio,'-ac','1','-ar','16000','user16.wav'],check=True)
w=wave.open('user16.wav'); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32); w.close()
SR=16000; hop=160; fr=np.sqrt(np.convolve((a**2)[: len(a)//hop*hop].reshape(-1,hop).mean(1),np.ones(3)/3,'same'))
thr=max(np.percentile(fr,20)*3, fr.max()*0.04); on=fr>thr
segs=[];i=0;n=len(on)
while i<n:
    if on[i]:
        j=i
        while j<n and (on[j:j+25].any()): j+=1   # bridge gaps < 0.25 s
        segs.append([i*hop/SR,j*hop/SR]); i=j
    else: i+=1
segs=[s for s in segs if s[1]-s[0]>0.12]
def gaps(sg): return [(sg[k+1][0]-sg[k][1],k) for k in range(len(sg)-1)]
while len(segs)>len(lines):   # merge across the smallest pause
    g,k=min(gaps(segs)); segs[k]=[segs[k][0],segs[k+1][1]]; del segs[k+1]
weights=[len(l) for l in lines]
while len(segs)<len(lines):   # split the longest segment
    k=max(range(len(segs)),key=lambda k:segs[k][1]-segs[k][0]); s0,s1=segs[k]; m=(s0+s1)/2; segs[k:k+1]=[[s0,m],[m,s1]]
res=[]
for l,(s0,s1) in zip(lines,segs):
    d=s1-s0; words=l.split(); wts=[]
    for wd in words:
        core=re.sub(r'[^\wäöüÄÖÜß]','',wd); wt=len(re.findall(r'[aeiouäöüy]+',core.lower()))+len(core)*0.12+0.3
        if re.search(r'[.,:?!]$',wd): wt+=0.9
        wts.append(wt)
    tot=sum(wts);c=s0;ws=[]
    for wd,wt in zip(words,wts): dd=d*wt/tot; ws.append({'w':wd,'s':round(c,3),'e':round(c+dd,3)}); c+=dd
    res.append({'text':l,'start':round(s0,3),'end':round(s1,3),'words':ws})
total=len(a)/SR
json.dump({'total':total,'lines':res},open(out,'w'),ensure_ascii=False,indent=1)
print('segments',len(segs),'total',round(total,2))
for r in res: print(r['start'],r['end'],r['text'])
