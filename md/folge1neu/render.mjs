// Usage:
//   node render.mjs stills 0,100,200 [outdir]      -> PNG/JPG stills + contact sheet
//   node render.mjs video [from] [to] [out.mp4]    -> silent video segment (frames from..to-1)
//   node render.mjs timeline                       -> prints timeline JSON
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(new URL(import.meta.url).pathname);
const [, , mode, a1, a2, a3] = process.argv;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto('file://' + path.join(here, 'dist/index.html'));
await page.waitForFunction(() => window.FILM_READY || window.FILM_ERROR, null, { timeout: 120000 });
const err = await page.evaluate(() => window.FILM_ERROR);
if (err) { console.error(err); process.exit(1); }
const info = await page.evaluate(() => ({ total: FILM.total, frames: FILM.durationFrames, fps: FILM.fps, timeline: FILM.timeline }));

async function grab(f) {
  const url = await page.evaluate((f) => { FILM.render(f); return FILM.grab(0.93); }, f);
  return Buffer.from(url.split(',')[1], 'base64');
}

if (mode === 'timeline') {
  console.log(JSON.stringify(info, null, 1));
} else if (mode === 'stills') {
  const outdir = a2 || path.join(here, 'out/stills');
  fs.mkdirSync(outdir, { recursive: true });
  const frames = a1.split(',').map(Number);
  for (const f of frames) {
    const t0 = Date.now();
    const buf = await grab(f);
    fs.writeFileSync(path.join(outdir, `f${String(f).padStart(5, '0')}.jpg`), buf);
    console.log('frame', f, Date.now() - t0, 'ms');
  }
} else if (mode === 'video') {
  const from = Number(a1 || 0), to = Number(a2 || info.frames);
  const out = a3 || path.join(here, `out/part_${from}_${to}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    const buf = await grab(f);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - from) % 60 === 0) console.log(`frame ${f}/${to} ${((Date.now() - t0) / (f - from + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close();
