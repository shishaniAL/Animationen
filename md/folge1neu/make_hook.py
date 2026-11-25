"""Cold open: 'I'm not old. I'm vintage.' drop -> freeze -> rewind -> episode.
Usage: python3 make_hook.py episode.mp4 out.mp4"""
import json, subprocess, sys, wave, numpy as np
IN, OUT = sys.argv[1], sys.argv[2]
F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
tl = {s['id']: s for s in json.load(open('out/timeline.json'))['timeline']}
V = tl[31]['start']
run = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100']
def txt(t, y, size, col):
    return f"drawtext=fontfile={F}:text='{t}':fontcolor={col}:fontsize={size}:borderw={int(size*0.12)}:bordercolor=black:x=(w-text_w)/2:y={y}"
# 1) the drop (2.6 s)
run('-ss', f'{V:.3f}', '-t', '2.6', '-i', IN, '-vf', ','.join([txt('82 Y/O GRANDPA', 330, 118, 'white'), txt('BECAME A LEGEND', 470, 118, '0xffd23f')]), *ENC, 'out/h1.mp4')
# 2) freeze 0.7 s
run('-ss', f'{V + 2.6:.3f}', '-i', IN, '-frames:v', '1', 'out/h2.png')
run('-ss', f'{V + 2.6:.3f}', '-t', '0.7', '-i', IN, '-vn', '-ac', '2', '-ar', '44100', 'out/h2.wav')
run('-loop', '1', '-t', '0.7', '-i', 'out/h2.png', '-i', 'out/h2.wav', '-vf', ','.join([txt('BUT HOW?!', 380, 150, '0xff4d4d')]), '-shortest', *ENC, 'out/h2.mp4')
# 3) rewind: shot 31 reversed fast with tape sound
run('-ss', f'{V:.3f}', '-t', '2.6', '-i', IN, '-an', '-vf', 'reverse,setpts=PTS/2.6,eq=saturation=0.6:contrast=1.15,noise=alls=18:allf=t,' + txt('24 HOURS EARLIER', 800, 100, 'white'), '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', 'out/h3v.mp4')
SR = 44100; n = int(SR * 1.0); t = np.arange(n) / SR
f = 300 + 2500 * (t / t[-1]) ** 2; ph = 2 * np.pi * np.cumsum(f) / SR
x = (np.sign(np.sin(ph)) * 0.25 + np.random.default_rng(1).standard_normal(n) * 0.15) * np.minimum(1, t / 0.05) * 0.6
pcm = (np.stack([x, x], 1) * 32767).astype('<i2')
with wave.open('out/h3.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
run('-i', 'out/h3v.mp4', '-i', 'out/h3.wav', '-shortest', *ENC, 'out/h3.mp4')
parts = ['out/h1.mp4', 'out/h2.mp4', 'out/h3.mp4', IN]
args = sum([['-i', p] for p in parts], [])
fc = ''.join(f'[{i}:v][{i}:a]' for i in range(len(parts))) + f'concat=n={len(parts)}:v=1:a=1[v][a]'
run(*args, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', *ENC[:-6], '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', OUT)
print(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip())
