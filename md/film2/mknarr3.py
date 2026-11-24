"""Episode 2: words.json -> src/narration.js (with the HUSS meme gap)."""
import json, re
W0 = json.load(open('out/words.json'))
GAP_AT, GAP = 999, 0
EMPH = {'aura', 'gym', 'unc', 'unc...', 'unc?', 'lost?', 'vintage', 'locked', 'in', 'six', 'seven', 'six-pound', 'stopped', 'felt', 'it', 'treadmill', 'huss', 'one', 'five', 'ten', 'protein', 'shake', 'bicep', 'heart', 'pose', 'cooking', 'crack', 'carry', 'home', 'mogged', 'everybody', 'clanker', 'thousand', 'fifty', 'plus', 'minus'}
def sh(t): return round(t + GAP if t > GAP_AT else t, 3)
W = []
for i, (w, a, b) in enumerate(W0):
    disp = ('“' + w[1:]) if w.startswith('"') else w
    if disp.endswith('"'): disp = disp[:-1] + '”'
    if w == 'seven!"': disp = 'sevennnn!”'
    key = re.sub(r"[^a-z0-9'?-]", '', w.lower()).strip('.?')
    W.append([disp, sh(a), sh(b), 1 if key.strip('?.') in EMPH else 0])
PAIRS = [('M.D.', 'had'), ('Get', 'the'), ('So', 'he'), ('He', 'went'), ('The', 'second'), ('"Unc...', 'are'), ('M.D.', 'slowly'), ('"Unc?', 'Son,'), ('Plus', 'one'), ('Then', 'he'), ('First,', 'the'), ('He', 'picked'), ('Then', 'the'), ('"Six...', 'seven!"'), ('The', 'whole'), ('Nobody', 'knew'), ('Plus', 'five'), ('Then', 'he'), ('Speed', 'one.'), ('Speed', 'five.'), ('Speed', 'ten.'), ('The', 'gym'), ('M.D.', 'jumped'), ('"Unc', 'is'), ('Plus', 'ten'), ('Then', 'he'), ('And', 'his'), ('Minus', 'fifty'), ('Ranjid', 'had'), ('But', 'on'), ('"Yo...', 'unc'), ('Next', 'time:')]
IDS = list(range(1, 33))
idx, starts, j = [], [], 0
for p in PAIRS:
    if p is None: idx.append(None); starts.append(GAP_AT); continue
    while not (W0[j][0] == p[0] and W0[j + 1][0] == p[1]): j += 1
    idx.append(j)
    starts.append(0.0 if j == 0 else round(W[j][1] - min(0.15, (W[j][1] - W[j - 1][2]) / 2), 3))
    j += 1
end = round(W[-1][2] + 3.2, 2)
real = [(k, i) for k, i in enumerate(idx) if i is not None]
shot_of = []
for wi in range(len(W)):
    k = max(k for k, i in real if i <= wi); shot_of.append(IDS[k])
js = '// Word-level narration timing (pocketsphinx forced alignment). Gap after "Huss. Huss. Huss." for the HUSS meme beat.\n'
js += f'export const GAPS = [];\nexport const WORDS = ' + json.dumps([w + [s] for w, s in zip(W, shot_of)], ensure_ascii=False) + ';\n'
js += 'export const PHRASES = {};\nexport const STARTS = ' + json.dumps(starts) + f';\nexport const END = {end};\n'
open('src/narration.js', 'w').write(js)
for k, sid in enumerate(IDS):
    e = starts[k + 1] if k + 1 < len(starts) else end
    print(f"{sid:2d} {starts[k]:6.2f} dur {e-starts[k]:5.2f} | " + ' '.join(f"{w[0]}@{w[1]-starts[k]:.2f}" for w, s in zip(W, shot_of) if s == sid))
