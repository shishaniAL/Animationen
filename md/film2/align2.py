"""Force-align script.txt to the narration word by word.
Usage: python3 align2.py script.txt out/n16.wav out/words.json"""
import re, json, wave, sys
from pocketsphinx import Decoder
script, wav, outp = sys.argv[1:4]
disp = open(script).read().split()
MAP = {'5': ['five'], '7': ['seven'], '82': ['eighty', 'two'], 'm.d': ['m', 'd'], '24/7': ['twenty', 'four', 'seven']}
PRON = {'mickel': 'M IH K AH L', "mickel's": 'M IH K AH L Z', 'ranjid': 'R AA N JH IH D', "ranjid's": 'R AA N JH IH D Z'}
norm, owner = [], []
for i, t in enumerate(disp):
    k = re.sub(r"[^a-z0-9'./]", '', t.lower()).strip('.').strip("'")
    for w in MAP.get(k, [k]):
        if w: norm.append(w); owner.append(i)
d = Decoder(samprate=16000)
for w, p in PRON.items():
    try: d.add_word(w, p, True)
    except RuntimeError: pass
d.set_align_text(' '.join(norm))
data = wave.open(wav).readframes(10 ** 9)
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
segs = [(re.sub(r'\(\d+\)$', '', s.word), s.start_frame / 100, s.end_frame / 100) for s in d.seg() if s.word not in ('<s>', '</s>', '<sil>', '[NOISE]')]
assert len(segs) == len(norm), (len(segs), len(norm))
out = {}
for (w, a, b), o in zip(segs, owner):
    if o not in out: out[o] = [disp[o], a, b]
    else: out[o][2] = b
res = [out[i] for i in range(len(disp))]
json.dump(res, open(outp, 'w'), ensure_ascii=False)
for r in res: print(f"{r[1]:6.2f} {r[2]:6.2f} {r[0]}")
