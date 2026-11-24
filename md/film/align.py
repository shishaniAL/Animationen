import re, json, wave, sys
from pocketsphinx import Decoder
txt = open('rajesh_script.txt').read()
orig = re.findall(r"[A-Za-z0-9'\-/]+", txt)
MAP = {'2': ['two'], '24/7': ['twenty', 'four', 'seven'], 'brainrot': ['brain', 'rot'], 'tiktok': ['tick', 'tock']}
norm, owner = [], []
for i, t in enumerate(orig):
    for w in MAP.get(t.lower(), [t.lower()]): norm.append(w); owner.append(i)
d = Decoder(samprate=16000)
d.add_word('rajesh', 'R AA JH EH SH', True)
d.set_align_text(' '.join(norm))
w = wave.open('n16.wav'); data = w.readframes(w.getnframes())
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100, s.end_frame / 100) for s in d.seg() if s.word not in ('<s>', '</s>', '<sil>', '[NOISE]')]
segs = [(re.sub(r'\(\d+\)$', '', w), a, b) for w, a, b in segs]
print(len(segs), len(norm))
out = {}
for (w, a, b), o in zip(segs, owner):
    if o not in out: out[o] = [orig[o], a, b]
    else: out[o][2] = b
res = [out[i] for i in range(len(orig)) if i in out]
json.dump(res, open('rajesh_words.json', 'w'))
for r in res: print(f"{r[1]:6.2f} {r[2]:6.2f} {r[0]}")
