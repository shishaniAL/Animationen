"""Score + sound effects for KHAMZAT, synthesised deterministically from the timeline.
Usage: python3 audio.py out/timeline.json out/audio.wav [narration.mp3]
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
GAPS = []  # [(seconds_in_original, length)] set from the command line JSON
rng = np.random.default_rng(7)

def T(sec): return int(round(sec * SR))
def tl(n): return np.arange(n) / SR
def env_ad(n, a=0.005, d=0.3):
    t = tl(n); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d); return e
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9; return x / m * peak
def nf(name):  # note name -> freq
    names = {'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2}
    n, o = name[:-1], int(name[-1]); return 440 * 2 ** ((names[n] + (o - 4) * 12) / 12)

def add(buf, x, at, gain=1.0):
    i = T(at)
    if i >= len(buf): return
    x = x[: len(buf) - i]; buf[i:i + len(x)] += x * gain

# ---------------- instruments ----------------
def kick(n=T(0.4)):
    t = tl(n); f = 45 + 85 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) + 0.3 * lp(noise(n), 2000) * np.exp(-t * 80)
def clap(n=T(0.25)):
    t = tl(n); e = np.zeros(n)
    for off in (0, 0.011, 0.022): e += np.exp(-np.maximum(0, t - off) * 60) * (t >= off)
    e += 0.5 * np.exp(-t * 14)
    return bp(noise(n), 900, 4000) * e * 0.8
def hat(n=T(0.06), open_=False):
    if open_: n = T(0.22)
    t = tl(n); return hp(noise(n), 7000) * np.exp(-t * (18 if open_ else 70)) * 0.5
def bass(f, dur):
    n = T(dur); t = tl(n)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.2 * np.sin(6 * np.pi * f * t)
    x = np.tanh(1.6 * x) * env_ad(n, 0.005, dur * 0.7)
    x[-T(0.01):] *= np.linspace(1, 0, T(0.01))
    return lp(x, 900)
def pluck(f, dur=0.45, bright=0.5):
    n = T(dur); N = max(2, int(SR / f))
    buf = lp(rng.uniform(-1, 1, N), 2000 + 6000 * bright) if N > 20 else rng.uniform(-1, 1, N)
    out = np.zeros(n); b = buf.copy(); idx = 0; prev = 0.0
    for i in range(n):
        v = b[idx]; nv = 0.5 * (v + prev) * 0.996; prev = v; b[idx] = nv; out[i] = v; idx = (idx + 1) % N
    out *= np.exp(-tl(n) * 3)
    return out
def pad(freqs, dur, cutoff=1400):
    n = T(dur); t = tl(n); x = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.0, 0.005):
            ph = (f * (1 + det) * t) % 1.0; x += (2 * ph - 1)
    x = lp(x / (len(freqs) * 3), cutoff, 2)
    a = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5).clip(0, 1)
    return x * a
def stab(freqs, dur=0.18):
    n = T(dur); t = tl(n); x = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t) for f in freqs)
    return lp(x, 2500) * env_ad(n, 0.003, 0.08) / len(freqs)

# ---------------- sound effects ----------------
def sweep(f0, f1, dur, shape='sin'):
    n = T(dur); f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == 'sin' else np.sign(np.sin(ph))
def fx(name):
    if name == 'whoosh':
        n = T(0.7); t = tl(n); x = noise(n); e = np.sin(np.pi * t / 0.7) ** 2
        lo = bp(x, 300, 1200); hi = bp(x, 1500, 5000); m = t / 0.7
        return (lo * (1 - m) + hi * m) * e * 0.9
    if name == 'zoom':
        n = T(0.45); t = tl(n); return bp(noise(n), 800, 6000) * (t / 0.45) ** 2 * 1.2
    if name in ('boing', 'boing2'):
        n = T(0.5); t = tl(n); base = 180 if name == 'boing' else 240
        f = base * (1 + 1.6 * t / 0.5) * (1 + 0.12 * np.sin(2 * np.pi * 14 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * np.exp(-t * 5) * 0.8
    if name == 'rustle':
        n = T(0.6); t = tl(n); e = np.abs(np.sin(2 * np.pi * 11 * t)) * np.exp(-t * 4); return bp(noise(n), 2000, 7000) * e
    if name in ('bass', 'hit'):
        n = T(1.6 if name == 'bass' else 0.6); t = tl(n); f = 40 + 60 * np.exp(-t * 10); ph = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(ph) * np.exp(-t * (2.2 if name == 'bass' else 6)) + 0.4 * lp(noise(n), 900) * np.exp(-t * 25)
        return np.tanh(2 * x)
    if name == 'punch':
        n = T(0.35); t = tl(n); f = 60 + 120 * np.exp(-t * 40); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.tanh(3 * (np.sin(ph) * np.exp(-t * 14) + 0.8 * lp(noise(n), 3000) * np.exp(-t * 40)))
    if name == 'rooster':
        out = np.zeros(T(1.3)); sylls = [(0.0, 0.12, 700, 900), (0.15, 0.12, 900, 1000), (0.3, 0.14, 1000, 1150), (0.48, 0.6, 1150, 800)]
        for st, d, f0, f1 in sylls:
            n = T(d); t = tl(n); f = np.linspace(f0, f1, n) * (1 + 0.03 * np.sin(2 * np.pi * 30 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
            x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph); x *= np.sin(np.pi * t / d) ** 0.5
            add(out, x * 0.6, st)
        return bp(out, 400, 5000)
    if name == 'crickets':
        n = T(2.0); t = tl(n); g = (np.sin(2 * np.pi * 3.2 * t) > 0.6) * (np.sin(2 * np.pi * 45 * t) > 0)
        return np.sin(2 * np.pi * 4300 * t) * lp(g.astype(float), 300) * 0.25
    if name == 'snore':
        n = T(1.4); t = tl(n); e = np.sin(np.pi * t / 1.4) ** 2
        x = lp(noise(n), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)) + 0.3 * np.sin(2 * np.pi * 85 * t)
        return x * e * 1.4
    if name == 'water':
        n = T(1.2); t = tl(n); x = bp(noise(n), 1500, 6000) * 0.35
        for k in range(14):
            st = rng.uniform(0, 1.1); m = T(0.05); tt = tl(m); add(x, np.sin(2 * np.pi * np.linspace(900, 2200, m) * tt) * np.exp(-tt * 70) * 0.4, st)
        return x * np.minimum(1, t / 0.1)
    if name == 'salute':
        n = T(0.3); t = tl(n); return (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * np.exp(-t * 12) * 0.5
    if name == 'whimper':
        n = T(0.6); t = tl(n); f = np.linspace(1300, 700, n) * (1 + 0.05 * np.sin(2 * np.pi * 9 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * np.sin(np.pi * t / 0.6) * 0.45
    if name == 'neon':
        n = T(3.6); t = tl(n); x = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.08 + 0.05 * np.sin(2 * np.pi * 200 * t)
        return lp(x, 1500) * np.minimum(1, t / 0.3)
    if name == 'record':
        n = T(0.6); t = tl(n); f = 900 * np.exp(-t * 4) + 80; ph = 2 * np.pi * np.cumsum(f) / SR
        return bp(noise(n), 500, 4000) * 0.5 * (1 + np.sin(ph)) * np.exp(-t * 3)
    if name == 'land':
        n = T(0.3); t = tl(n); return lp(noise(n), 400) * np.exp(-t * 18) * 1.6
    if name == 'slurp':
        n = T(1.4); t = tl(n); m = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)
        x = bp(noise(n), 600, 2500) * m + 0.2 * np.sin(2 * np.pi * np.cumsum(500 + 300 * m) / SR)
        return x * np.sin(np.pi * t / 1.4) * 0.9
    if name == 'laugh':
        out = np.zeros(T(1.8))
        for k in range(7):
            st = k * 0.22; n = T(0.15); t = tl(n); f0 = 260 - k * 12
            x = (np.sign(np.sin(2 * np.pi * f0 * t)) * 0.4 + np.sin(2 * np.pi * f0 * t)) + 0.4 * noise(n)
            x = bp(x, 500, 2400) * np.sin(np.pi * t / 0.15)
            add(out, x * 0.7, st)
        return out
    if name == 'crush':
        out = np.zeros(T(1.3))
        for k in range(26):
            st = rng.uniform(0, 1.15); n = T(0.03); add(out, hp(noise(n), 2500) * np.exp(-tl(n) * 90) * rng.uniform(0.3, 1), st)
        return out * 0.9
    if name == 'heartbeat':
        out = np.zeros(T(0.9))
        for st, g in ((0, 1), (0.22, 0.7)):
            n = T(0.2); t = tl(n); add(out, np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18) * g, st)
        return out * 1.4
    if name == 'coo':
        n = T(0.7); t = tl(n); f = 420 + 60 * np.sin(2 * np.pi * 1.6 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return lp(np.sin(ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t)), 1200) * np.sin(np.pi * t / 0.7) * 0.45
    if name == 'strain':
        n = T(1.1); t = tl(n); f = 115 * (1 + 0.04 * np.sin(2 * np.pi * 7 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
        x = np.tanh(3 * np.sin(ph)) + 0.4 * lp(noise(n), 1200)
        return bp(x, 150, 1800) * np.sin(np.pi * t / 1.1) * 0.7
    if name == 'pop':
        n = T(0.25); t = tl(n); f = 900 * np.exp(-t * 18) + 200; ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * np.exp(-t * 22) + 0.6 * hp(noise(n), 3000) * np.exp(-t * 150)
    if name == 'giggle':
        out = np.zeros(T(0.9))
        for k in range(5):
            n = T(0.1); t = tl(n); f0 = 620 + k * 25; add(out, np.sin(2 * np.pi * f0 * t) * np.sin(np.pi * t / 0.1) * 0.45, k * 0.14)
        return out
    if name == 'tvon':
        n = T(0.8); t = tl(n); x = 0.6 * hp(noise(T(0.02)), 2000); out = np.zeros(n); out[:len(x)] += x
        out += np.sin(2 * np.pi * np.geomspace(60, 900, n) * t) * 0.25 * np.exp(-t * 3); return out
    if name == 'shine':
        out = np.zeros(T(1.0))
        for k, f in enumerate([1318, 1568, 1976, 2637, 3136]):
            n = T(0.5); t = tl(n); add(out, np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * 0.5, k * 0.06)
        return out
    if name == 'flies':
        n = T(2.4); t = tl(n); f = 210 + 25 * np.sin(2 * np.pi * 1.3 * t) + 15 * np.sin(2 * np.pi * 3.7 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return bp(np.sign(np.sin(ph)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.8 * t)), 200, 3000) * np.sin(np.pi * t / 2.4) * 0.5
    if name == 'crunch':
        out = np.zeros(T(0.5))
        for k in range(12):
            st = rng.uniform(0, 0.35); m = T(0.04); add(out, bp(noise(m), 600, 4000) * np.exp(-tl(m) * 60), st)
        return out
    if name == 'heartfast':
        out = np.zeros(T(2.4))
        for k in range(8):
            for st, g in ((0, 1), (0.1, 0.7)):
                m = T(0.15); tt = tl(m); add(out, np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 22) * g, k * 0.3 + st)
        return out * 1.5
    if name == 'door':
        n = T(1.0); t = tl(n); f = 300 + 250 * np.sin(np.pi * t) + 30 * noise(n).cumsum() / SR * 50; ph = 2 * np.pi * np.cumsum(f) / SR
        return bp(np.sign(np.sin(ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * t)), 300, 3000) * np.sin(np.pi * t) * 0.35
    if name == 'fan':
        n = T(2.4); t = tl(n); whirr = bp(noise(n), 300, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 60 * t))
        f = 700 + 500 * t / 2.4 + 60 * np.sin(2 * np.pi * 6 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return (whirr * 0.6 + np.sin(ph) * 0.35) * np.minimum(1, t / 0.3)
    if name == 'breath':
        out = np.zeros(T(1.8))
        for st, d in ((0, 0.7), (0.9, 0.8)):
            n = T(d); t = tl(n); add(out, lp(noise(n), 900) * np.sin(np.pi * t / d) * 1.2, st)
        return out
    if name == 'slime':
        n = T(0.7); t = tl(n); f = 180 + 120 * np.sin(2 * np.pi * 3 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return (lp(noise(n), 700) * 0.6 + np.sin(ph) * 0.5) * np.sin(np.pi * t / 0.7)
    if name == 'tick':
        n = T(0.05); t = tl(n); return hp(noise(n), 3000) * np.exp(-t * 200) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 150) * 0.5
    if name == 'phone':
        out = np.zeros(T(1.6))
        for st in (0, 0.5):
            n = T(0.4); t = tl(n); add(out, (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.3 * (np.sin(2 * np.pi * 20 * t) > 0), st)
        return out
    if name == 'scream':
        n = T(1.3); t = tl(n); f = 420 * (1 + 0.25 * np.minimum(1, t / 0.2)) * (1 + 0.04 * np.sin(2 * np.pi * 7 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
        x = sum(np.sin(k * ph) / k for k in range(1, 9))
        x = bp(x, 600, 3500) + 0.2 * bp(noise(n), 1500, 4000)
        return x * np.minimum(1, t / 0.05) * np.minimum(1, (1.3 - t) / 0.4)
    if name == 'siren':
        n = T(2.4); t = tl(n); f = 750 + 250 * np.sign(np.sin(2 * np.pi * 1.4 * t)); f = lp(f, 20, 1); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * 0.4 * np.minimum(1, t / 0.6)
    if name == 'steps':
        out = np.zeros(T(1.8))
        for k in range(9):
            m = T(0.12); add(out, lp(noise(m), 300) * np.exp(-tl(m) * 30), k * 0.19)
        return out * 1.4
    if name == 'pan':
        n = T(1.2); t = tl(n); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((523, 3), (1187, 5), (1960, 7), (2871, 9)))
        return x * 0.4 + hp(noise(n), 3000) * np.exp(-t * 60) * 0.5
    if name == 'camclick':
        n = T(0.15); t = tl(n); return hp(noise(n), 2000) * (np.exp(-t * 120) + 0.6 * np.exp(-np.maximum(0, t - 0.07) * 120) * (t > 0.07))
    if name == 'confetti':
        n = T(1.2); t = tl(n); x = np.zeros(n); x[:T(0.08)] += np.tanh(3 * lp(noise(T(0.08)), 1200)) * np.exp(-tl(T(0.08)) * 40)
        return x + hp(noise(n), 5000) * np.exp(-t * 3) * 0.25
    if name == 'cricket': return fx('crickets')
    raise ValueError(name)

FX_GAIN = {'whoosh': 0.45, 'zoom': 0.4, 'boing': 0.5, 'boing2': 0.45, 'rustle': 0.4, 'bass': 0.85, 'hit': 0.75, 'punch': 0.9, 'rooster': 0.5,
           'crickets': 0.3, 'snore': 0.55, 'water': 0.35, 'salute': 0.4, 'whimper': 0.4, 'neon': 0.5, 'record': 0.6, 'land': 0.6, 'slurp': 0.7,
           'laugh': 0.6, 'crush': 0.8, 'heartbeat': 0.9, 'coo': 0.45, 'strain': 0.6, 'pop': 0.9, 'giggle': 0.5, 'tvon': 0.5, 'shine': 0.45, 'flies': 0.35, 'crunch': 0.7, 'heartfast': 0.85, 'door': 0.4, 'fan': 0.55, 'breath': 0.6,
           'slime': 0.55, 'tick': 0.5, 'phone': 0.45, 'scream': 0.7, 'siren': 0.45, 'steps': 0.6, 'pan': 0.55, 'camclick': 0.5, 'confetti': 0.6, 'cricket': 0.35}

# ---------------- score ----------------
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT; E8 = BEAT / 2
CHORDS = [('D2', ['D3', 'F3', 'A3']), ('Bb1', ['Bb2', 'D3', 'F3']), ('C2', ['C3', 'E3', 'G3']), ('A1', ['A2', 'C#3', 'E3'])]
MEL = ['D4', None, 'F4', None, 'E4', 'D4', None, 'A3',   'D4', None, 'F4', None, 'G4', 'A4', None, None,
       'F4', None, 'D4', None, 'C4', 'D4', None, None,   'E4', None, 'C#4', None, 'E4', 'A4', None, None]
CMEL = ['A4', None, None, 'A4', 'Bb4', None, 'A4', None, 'F4', None, None, 'F4', 'G4', None, 'A4', None,
        'C5', None, None, 'C5', 'Bb4', None, 'A4', None, 'E4', None, 'G4', None, 'A4', None, None, None]

def section_at(t, secs):
    s = secs[0][1]
    for st, name in secs:
        if t >= st: s = name
    return s

def score(total, secs):
    buf = np.zeros(T(total) + SR)
    drums = np.zeros_like(buf); club = np.zeros_like(buf)
    nbars = int(total / BAR) + 1
    for b in range(nbars):
        bar_t = b * BAR
        root, triad = CHORDS[b % 4]
        for e in range(8):
            t = bar_t + e * E8
            if t >= total: break
            s = section_at(t, secs)
            mi = (b % 4) * 8 + e
            if s in ('groove', 'groove2'):
                if e in (0, 5): add(drums, kick(), t, 0.9)
                if e in (2, 6): add(drums, clap(), t, 0.55)
                add(drums, hat(open_=(e == 7)), t, 0.28 if e % 2 else 0.18)
                bn = [0, None, 0, 12, 7, None, 0, 10][e]
                if bn is not None: add(buf, bass(nf(root) * 2 ** (bn / 12), E8 * 0.9), t, 0.42)
                if MEL[mi]: add(buf, pluck(nf(MEL[mi]), 0.5), t, 0.32)
                if s == 'groove2' and CMEL[mi]: add(buf, pluck(nf(CMEL[mi]) , 0.4, 0.8), t, 0.2)
            elif s == 'intro':
                if e % 2 == 0: add(drums, hat(), t, 0.12)
                if e == 0: add(buf, pad([nf(n) for n in triad], BAR + 0.3, 900), t, 0.22)
                if e == 0: add(buf, bass(nf(root), BEAT * 1.8), t, 0.3)
                if MEL[mi] and e % 2 == 0: add(buf, pluck(nf(MEL[mi]), 0.6, 0.3), t, 0.25)
            elif s == 'club':
                if e % 2 == 0: add(club, kick(), t, 1.0)
                if e % 2 == 1: add(club, bass(nf(root) * 2, E8 * 0.8), t, 0.6); add(club, stab([nf(n) * 2 for n in triad]), t, 0.5)
                add(club, hat(), t, 0.25)
            elif s == 'tension':
                if e == 0: add(buf, pad([nf('D2'), nf('Ab2'), nf('D3')], BAR + 0.3, 500), t, 0.3)
                if e % 4 == 0: add(drums, kick(), t, 0.35)
            elif s == 'soft':
                if e == 0: add(buf, pad([nf(n) for n in triad], BAR + 0.3, 700), t, 0.2)
                if e % 2 == 0: add(buf, pluck(nf(triad[(e // 2) % 3]) * 2, 0.9, 0.2), t, 0.2)
    buf += drums
    buf += lp(club, 450, 4) * 1.6  # muffled, heard from outside the club
    # fades at section edges into silence
    for st, name in secs:
        if name in ('silence',):
            i = T(st); buf[i:i + T(0.04)] *= np.linspace(1, 0, T(0.04))[: len(buf[i:i + T(0.04)])]
    # gate silence regions hard
    for k, (st, name) in enumerate(secs):
        if name == 'silence':
            en = secs[k + 1][0] if k + 1 < len(secs) else total
            buf[T(st) + T(0.04): T(en)] = 0
    return buf

def main(tl_path, out_path, narr_path=None):
    tlj = json.load(open(tl_path)); total = tlj['total']; shots = tlj['timeline']
    start = {s['id']: s['start'] for s in shots}
    secs = []
    for sh in shots:
        m = sh.get('music')
        if not m: continue
        st0 = sh['start']
        if m in ('intro', 'groove', 'groove2', 'club', 'soft', 'tension'): secs.append((st0, m))
        elif m in ('silence', 'stop'): secs.append((st0, 'silence'))
        elif m == 'hype': secs.append((st0, 'groove2'))
        elif m == 'drop': secs.append((st0, 'tension')); secs.append((st0 + 1.2, 'groove2'))
        elif m == 'sting': secs.append((st0, 'silence')); secs.append((st0 + 1.4, 'groove2'))
    mus = score(total, secs)
    sfx = np.zeros_like(mus)
    for s in shots:
        for c in s['sfx']:
            x = fx(c['n']); add(sfx, norm(x, 1.0), s['start'] + c['t'], FX_GAIN[c['n']])
    voice = np.zeros_like(mus)
    if narr_path:
        import subprocess
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', narr_path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
        v = np.frombuffer(raw, dtype='<i2').astype(float) / 32768
        for at, ln in sorted(GAPS, reverse=True):  # insert dramatic pauses
            v = np.concatenate([v[:T(at)], np.zeros(T(ln)), v[T(at):]])
        v = norm(v, 0.9)
        voice[:min(len(v), len(voice))] = v[:len(voice)]
    # ducking: music sits under the voice and the effects
    venv = lp(np.abs(voice), 6, 1); fenv = lp(np.abs(sfx), 8, 1)
    duck = (1 - 0.6 * np.clip(venv / 0.04, 0, 1)) * (1 - 0.35 * np.clip(fenv / 0.15, 0, 1))
    mix = mus * 0.55 * duck + sfx * (0.85 if narr_path else 1.0) + voice
    mix = hp(mix, 30)
    mix = np.tanh(mix * 1.1) * 0.95
    mix = mix[: T(total)]
    st = np.stack([mix, mix], 1)
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('wrote', out_path, total, 's')

if __name__ == '__main__':
    if len(sys.argv) > 4: GAPS.extend(json.loads(sys.argv[4]))
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
