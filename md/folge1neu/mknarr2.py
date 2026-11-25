"""words.json + shot start words -> src/narration.js"""
import json, re
W0 = json.load(open('out/words.json'))
GAP_AT, GAP = 76.2, 0.9
REPL = {'Mickel': 'Michael', "Mickel's": "Michael's"}
EMPH = {'82', 'exactly', '5', 'am', 'oatmeal', 'crossword', '7', 'pm', 'boring', 'asleep', 'ranjid', "ranjid's", 'old', 'pen', 'doctor', 'forty', 'years', 'one', 'ten', 'three', 'hundred', 'trend', 'dance', 'slang', 'cardigan', 'window', 'slippers', 'black', 'outfit', 'fanny', 'pack', 'red', 'cap', 'sunglasses', 'm.d', 'legend', 'vintage', 'forever', 'gym', 'doctor?'}
def sh(t): return round(t + GAP if t > GAP_AT else t, 3)
W = []
for i, (w, a, b) in enumerate(W0):
    core = re.sub(r'^[“"]|[.,:?!…"”]+$', '', w).rstrip('.')
    disp = w.replace('"', '“', 1) if w.startswith('"') else w
    if disp.endswith('"'): disp = disp[:-1] + '”'
    for k, v in REPL.items():
        disp = re.sub(r'\b' + re.escape(k) + r'(?![\w])', v, disp) if k in disp else disp
    key = re.sub(r"[^a-z0-9'./?]", '', w.lower()).strip('.')
    e = 1 if key in EMPH or (i in (2, 3)) else 0
    W.append([disp, sh(a), sh(b), e])
STARTS_AT = [('This', 'is'), ('Mickel', 'is'), ('Every', 'day,'), ('He', 'woke'), ('He', 'ate'), ('He', 'solved'), ('And', 'at'), ('Mickel', 'was'), ('One', 'Sunday,'), ('Ranjid', 'looked'), ('"Grandpa...', "you're"), ('Mickel', 'dropped'), ('Nobody', 'had'), ('Not', 'even'), ('That', 'night,'), ('For', 'the'), ('He', 'took'), ('Then', 'ten.'), ('Then', 'three'), ('By', 'sunrise,'), ('He', 'threw'), ('He', 'sold'), ('And', 'he'), ('The', 'next'), ('And', 'there'), ('"Ranjid.', 'From'), ('Ranjid', 'stared'), ('"Like...', 'a'), ('"No,', 'Ranjid.'), ('M.D.', 'slowly'), ('"I\'m', 'not'), ('And', 'that'), ('Next', 'time:')]
idx, j = [], 0
for a0, a1 in STARTS_AT:
    while not (W0[j][0] == a0 and W0[j + 1][0] == a1): j += 1
    idx.append(j); j += 1
starts = [0.0] + [round(W[i][1] - min(0.15, (W[i][1] - W[i - 1][2]) / 2), 3) for i in idx[1:]]
end = round(W[-1][2] + 3.0, 2)
shot_of = [max(k for k, st in enumerate(idx) if st <= i) + 1 for i in range(len(W))]
js = '// Word-level narration timing (pocketsphinx forced alignment, ElevenLabs "Brian").\n'
js += f'export const GAPS = [[{GAP_AT}, {GAP}]];\nexport const WORDS = ' + json.dumps([w + [s] for w, s in zip(W, shot_of)], ensure_ascii=False) + ';\n'
js += 'export const PHRASES = {};\nexport const STARTS = ' + json.dumps(starts) + f';\nexport const END = {end};\n'
open('src/narration.js', 'w').write(js)
for k, i in enumerate(idx):
    e = starts[k + 1] if k + 1 < len(starts) else end
    print(f"{k+1:2d} {starts[k]:6.2f} dur {e-starts[k]:5.2f} | " + ' '.join(f"{w[0]}@{w[1]-starts[k]:.2f}" for w, s in zip(W, shot_of) if s == k + 1))
