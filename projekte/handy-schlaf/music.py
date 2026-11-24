import numpy as np, wave
SR=48000; T=60.0; N=int(SR*T); t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def m2f(m): return 440*2**((m-69)/12)
def env(n,a,r):
    e=np.ones(n); na=int(a*SR); nr=int(r*SR)
    e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return e
def add(sig,start,pan=0.0,g=1.0):
    i=int(start*SR); j=min(N,i+len(sig)); s=sig[:j-i]*g
    L[i:j]+=s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
def pad(notes,start,dur,g):
    n=int(dur*SR); tt=np.arange(n)/SR; s=np.zeros(n)
    for m in notes:
        f=m2f(m)
        for det in (-0.12,0.0,0.13):
            ff=f*2**(det/12); s+=np.sin(2*np.pi*ff*tt+rng.random()*6)+0.25*np.sin(4*np.pi*ff*tt)
    return s*env(n,min(1.2,dur*0.4),min(1.4,dur*0.45))*g/len(notes)
def bell(m,start,g,dec=2.2):
    n=int(dec*2*SR); tt=np.arange(n)/SR; f=m2f(m)
    s=(np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*3)+0.2*np.sin(2*np.pi*f*5.4*tt)*np.exp(-tt*6))*np.exp(-tt/dec*2.2)
    s[:200]*=np.linspace(0,1,200); add(s,start,pan=rng.uniform(-.5,.5),g=g)
def sub(m,start,dur,g):
    n=int(dur*SR); tt=np.arange(n)/SR; s=np.sin(2*np.pi*m2f(m)*tt)*np.exp(-tt*2.5); s[:300]*=np.linspace(0,1,300); add(s,start,g=g)
def tick(start,g):
    n=int(0.04*SR); s=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*180); s=np.diff(np.concatenate([[0],s])); add(s,start,pan=0.3,g=g)
# chord tables (MIDI): Dm Bb F C | Dm Bb Gm A | Bb F C F
A=[[50,57,62,65],[46,53,58,62],[53,57,60,65],[48,55,60,64]]
B=[[50,57,62,65],[46,53,58,62],[43,55,58,62],[45,52,57,61]]
C=[[46,53,58,62],[53,57,60,65],[48,55,60,64],[53,60,65,69]]
bar=2.5
sections=[(0,20,A,'calm'),(20,39,B,'tense'),(39,44,[[50,57,62],[46,53,58]],'low'),(44,60,C,'resolve')]
for s0,s1,ch,mood in sections:
    k=0; x=s0
    while x<s1-0.01:
        d=min(bar,s1-x); c=ch[k%len(ch)]
        g={'calm':0.16,'tense':0.17,'low':0.12,'resolve':0.16}[mood]
        add(pad(c,x,d+1.0,g),x,pan=0)
        sub(c[0]-12,x,2.0,0.22 if mood!='low' else 0.15)
        if mood in('calm','resolve'):
            for i,b in enumerate([0,1.25] if mood=='calm' else [0,0.625,1.25,1.875]):
                if x+b<s1: bell(c[(i+1)%len(c)]+12,x+b,0.07)
        if mood=='tense':
            for i in range(8):
                st=x+i*bar/8
                if st<s1: bell(c[i%len(c)]+24,st,0.035,0.8); tick(st,0.05)
            sub(c[0]-12,x+bar/2,1.2,0.14)
        if mood=='low': bell(c[2]+12,x,0.05,3)
        k+=1; x+=bar
# riser into the block (29.3 -> 30.36) and a soft impact on "BLOCKIERT"
n=int(1.06*SR); tt=np.arange(n)/SR; nz=rng.standard_normal(n); rs=np.convolve(nz,np.ones(30)/30,'same')*(tt/1.06)**2*0.25
add(rs,29.3,g=1)
n=int(2.5*SR); tt=np.arange(n)/SR; imp=np.sin(2*np.pi*55*tt*np.exp(-tt*0.6))*np.exp(-tt*2.2)*0.5; add(imp,30.36)
# master: fade in/out, gentle lowpass, normalize
def lp(x,a=0.25):
    y=np.zeros_like(x); acc=0.0
    # vectorized one-pole via lfilter-free approach
    from itertools import accumulate
    return np.array(list(accumulate(x,lambda p,v:p+a*(v-p))))
L=lp(L);R=lp(R)
fade=np.ones(N); fade[:SR]=np.linspace(0,1,SR); fade[-int(2.5*SR):]=np.linspace(1,0,int(2.5*SR)); L*=fade;R*=fade
pk=max(abs(L).max(),abs(R).max()); L=L/pk*0.8; R=R/pk*0.8
st=np.stack([L,R],1); w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
print('ok')
