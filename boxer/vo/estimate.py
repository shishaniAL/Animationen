# Writes src/canvas-core/boxerTiming.ts from an estimate (used until the real voiceover exists).
import json, sys
lines=[l.strip() for l in open(sys.argv[1]) if l.strip()]
t=0.8; segs=[]
for l in lines:
    words=l.split(); dur=0.36*len(words)+0.35*l.count(',')+0.5
    if l.startswith('Remember'): dur=1.6
    per=[len(w)+2 for w in words]; tot=sum(per); ws=[]; c=t
    for w,p in zip(words,per):
        d=(dur-0.5)*p/tot; ws.append([w,round(c,3),round(c+d,3)]); c+=d
    segs.append({"text":l,"start":round(t,3),"end":round(t+dur,3),"words":ws}); t+=dur+0.35
json.dump({"segments":segs,"end":round(t+2.6,3)},open(sys.argv[2],'w'),indent=0)
