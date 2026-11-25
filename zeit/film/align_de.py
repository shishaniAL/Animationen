"""Map German sentences to speech segments (pause-based DP), estimate word times by syllables."""
import re, json
lines = [l.strip() for l in open('script.txt') if l.strip()]
sil = [tuple(map(float, l.split())) for l in open('out/sil.txt')]
segs, p = [], 0.0
for a, b in sil:
    if a - p > 0.05: segs.append((p, a))
    p = b
END_AUDIO = 147.15
if END_AUDIO - p > 0.1: segs.append((p, END_AUDIO))
def syl(w): return max(1, len(re.findall(r'(ei|ie|au|eu|äu|[aeiouäöüy])+', re.sub(r'\d+', lambda m: {'10': 'zehn', '25': 'fünfundzwanzig', '50': 'fünfzig'}.get(m.group(), 'zwei'), w.lower()))))
SY = [sum(syl(w) for w in l.split()) for l in lines]
rate = sum(SY) / sum(b - a for a, b in segs)
n, m = len(lines), len(segs)
INF = 1e9
D = [[INF] * (m + 1) for _ in range(n + 1)]; B = [[0] * (m + 1) for _ in range(n + 1)]
D[0][0] = 0
for i in range(1, n + 1):
    for j in range(1, m + 1):
        for k in range(max(0, j - 5), j):
            if D[i - 1][k] >= INF: continue
            dur = sum(b - a for a, b in segs[k:j]); exp = SY[i - 1] / rate
            c = D[i - 1][k] + (dur - exp) ** 2 / max(0.5, exp)
            if c < D[i][j]: D[i][j] = c; B[i][j] = k
groups, j = [], m
for i in range(n, 0, -1): k = B[i][j]; groups.append((k, j)); j = k
groups.reverse()
words, starts = [], []
for i, (k, j) in enumerate(groups):
    gs = segs[k:j]; ws = lines[i].split()
    starts.append(round(gs[0][0], 3))
    # distribute words over the sub-segments proportionally to syllables
    tot = sum(b - a for a, b in gs); wsy = [syl(w) + 0.3 for w in ws]; S = sum(wsy)
    # map cumulative syllable fraction onto speech time (skipping pauses)
    def tmap(frac):
        x = frac * tot
        for a, b in gs:
            if x <= b - a: return a + x
            x -= b - a
        return gs[-1][1]
    c = 0
    for w, s_ in zip(ws, wsy):
        words.append([w, round(tmap(c / S), 3), round(tmap((c + s_) / S), 3), i]); c += s_
    print(f"{i+1:2d} {gs[0][0]:6.2f}-{gs[-1][1]:6.2f} ({len(gs)} seg) exp {SY[i]/rate:4.1f}s got {tot:4.1f}s | {lines[i][:60]}")
# scene cuts slightly before each sentence
cuts = [0.0] + [round(max(0, starts[i] - 0.15), 3) for i in range(1, n)]
END = round(groups and segs[-1][1] + 1.5, 2)
open('dist/narration.js', 'w').write('window.NARR = ' + json.dumps({'starts': cuts, 'end': END, 'words': words}, ensure_ascii=False) + ';\n')
print('END', END)
