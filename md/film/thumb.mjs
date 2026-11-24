import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('file://' + path.join(here, 'dist/index.html')); await p.waitForFunction(() => window.FILM_READY || window.FILM_ERROR);
for (const k of ['tall', 'wide']) { const url = await p.evaluate((k) => FILM.thumb(k), k); fs.writeFileSync(path.join(here, `../thumbnail_folge1_${k}.png`), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', k); }
await b.close();
