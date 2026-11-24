"""Edit the narration: tighten the Huss runs and stretch the end of 'seven!'."""
import subprocess, numpy as np, wave
SR = 44100
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'narration.mp3', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768
T = lambda s: int(round(s * SR))
def stretch(seg, factor):  # time-stretch with pitch kept (ffmpeg atempo chain)
    tempo = 1 / factor; chain = []
    while tempo < 0.5: chain.append('atempo=0.5'); tempo /= 0.5
    chain.append(f'atempo={tempo:.4f}')
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', ','.join(chain), '-f', 'f32le', '-'], input=seg.astype('<f4').tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype='<f4').copy()
# edits: (start, end, action) on the ORIGINAL timeline, sorted
EDITS = [
    (31.18, 31.62, ('stretch', 3.2)),   # "seven!" -> "sevennnn"
    (44.36, 44.62, ('cut',)),           # Huss. Huss.
    (46.99, 47.20, ('cut',)),           # Huss. Huss. Huss.
    (47.63, 47.82, ('cut',)),
]
out, pos = [], 0
for a, b, act in EDITS:
    out.append(x[pos:T(a)])
    seg = x[T(a):T(b)]
    if act[0] == 'stretch':
        s = stretch(seg, act[1]); fade = T(0.08); s[-fade:] *= np.linspace(1, 0, fade); out.append(s)
    pos = T(b)
out.append(x[pos:])
y = np.concatenate(out)
# tiny crossfades are not needed: cuts sit in silence between words
pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
with wave.open('narration_edit.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('edited length', len(y) / SR)
