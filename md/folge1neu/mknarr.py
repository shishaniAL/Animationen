import json, re
words = json.load(open('rajesh_words.json'))  # [orig, a, b]
txt = open('rajesh_script.txt').read()
disp = txt.split()
assert len(disp) == len(words), (len(disp), len(words))
GAP_AT, GAP = 83.75, 0.8
def sh(t): return t + GAP if t > GAP_AT else t
W = [[disp[i].replace('"', '“' if i == 0 or disp[i][0] == '"' else '”'), round(sh(a), 3), round(sh(b), 3)] for i, (w, a, b) in enumerate(words)]
# fix quote direction: opening quotes at word start, closing at word end
for x in W:
    s = x[0]
    if s.startswith('“') or s.startswith('”'): s = '“' + s[1:]
    if s.endswith('”') or s.endswith('“'): s = s[:-1] + '”'
    s = s.replace('“,', '”,')
    x[0] = s
EMPH = {'rajesh kumar', 'responsibilities', 'job', 'girlfriend', 'hobbies', 'wi-fi', 'unlimited', 'screen', 'time', '2', 'pm', 'three', 'hours', 'stairs', 'life', 'aura', 'rich', 'ceo', 'nothing', 'website', 'logo', 'linkedin', 'account', 'cousin', "mcdonald's", 'bankrupt', 'no', 'investors', 'mother', 'accidentally', 'subscribed', 'give', 'up', 'somewhere', 'six', 'brainrot', 'not', 'paused', 'professional', 'tiktok', 'viewer', 'zero', 'dollars', '24/7', 'absolutely', 'right'}
for i, x in enumerate(W):
    k = re.sub(r'[^a-z0-9\'/\-]', '', x[0].lower())
    x.append(1 if k in EMPH or (k in ('rajesh', 'kumar') and i in (6, 7)) else 0)
starts_words = ['There', 'Rajesh', 'No', 'Just', 'Every', 'opened', 'His', 'And', 'Nobody', 'One', 'He', 'His', 'He', 'His', 'After', 'The', 'There', 'His', 'But', '“Every', 'Then', 'And', 'His', '“Your', 'Rajesh', 'And', 'As', 'Salary:']
idx, j = [], 0
for sw in starts_words:
    while not W[j][0].strip('“”,.:?').startswith(sw.strip('“:')): j += 1
    idx.append(j); j += 1
starts = []
for k, i in enumerate(idx):
    if i == 0: starts.append(0.0); continue
    gap = W[i][1] - W[i - 1][2]
    starts.append(round(W[i][1] - min(0.15, gap / 2), 3))
end = round(W[-1][2] + 1.6, 2)
shot_of = []
for i in range(len(W)):
    s = max(k for k, st in enumerate(idx) if st <= i); shot_of.append(s + 1)
js = '// Word-level narration timing (pocketsphinx forced alignment of the ElevenLabs "Brian" take).\n'
js += f'// Times in the EDITED narration: {GAP} s of silence inserted at {GAP_AT} s (after "Rajesh paused the video.").\n'
js += f'export const GAPS = [[{GAP_AT}, {GAP}]];\n'
js += 'export const WORDS = ' + json.dumps([[w, a, b, e, s] for (w, a, b, e), s in zip(W, shot_of)], ensure_ascii=False) + ';\n'
js += 'export const PHRASES = {};\n'
js += 'export const STARTS = ' + json.dumps(starts) + ';\n'
js += f'export const END = {end};\n'
open('/home/user/Animationen/rajesh/film/src/narration.js', 'w').write(js)
for k, i in enumerate(idx):
    e = starts[k + 1] if k + 1 < len(starts) else end
    ws = [f"{w[0]}@{w[1]-starts[k]:.2f}" for w, s in zip(W, shot_of) if s == k + 1]
    print(f"{k+1:2d} start {starts[k]:6.2f} dur {e-starts[k]:5.2f} | " + ' '.join(ws))
