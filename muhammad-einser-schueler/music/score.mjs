// SCORE for "Muhammad, ein 1er-Schüler". An original tune in F major, 120 bpm, 4/4, 13 bars = 26 s.
// Every sample is arithmetic: oscillators, seeded noise, envelopes. No samples, no files read.
//   node music/score.mjs out/score.wav
// One bar = 2 s = one picture bar: every cut lands on a bar line. The five big moments
// (4, 8, 14, 20, 24 s) are downbeats, and each gets a hit: crash + low boom + a chord stab.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SR = 48000, BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT, BARS = 13, LEN = BARS * BAR + 1.5; // a short tail, trimmed at the mux
const N = Math.ceil(LEN * SR), L = new Float32Array(N), R = new Float32Array(N);
const BIG = [4, 8, 14, 20, 24];
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (bar, beat = 0) => bar * BAR + beat * BEAT;          // bar from 0
const add = (t0, buf, gain = 1, pan = 0) => { const i0 = Math.round(t0 * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length; i++) { const j = i0 + i; if (j < 0 || j >= N) continue; L[j] += buf[i] * gl; R[j] += buf[i] * gr; } };

// ---------------------------------------------------------------- instruments
const env = (i, n, a, r) => { const t = i / SR, d = n / SR; return Math.min(1, t / a) * Math.min(1, Math.max(0, (d - t) / r)); };
// celesta-like bell: a few inharmonic partials, each decaying at its own rate
const bell = (m, dur, bright = 1) => { const n = Math.round((dur + 1.2) * SR), b = new Float32Array(n), f = hz(m);
  const parts = [[1, 1, 2.2], [2, 0.35 * bright, 4], [3.01, 0.18 * bright, 6], [4.2, 0.08 * bright, 9]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [k, a, d] of parts) v += a * Math.sin(2 * Math.PI * f * k * t) * Math.exp(-d * t); b[i] = v * Math.min(1, t / 0.003) * 0.5; } return b; };
// plucked string (Karplus-Strong, seeded excitation): pizzicato for the graded sheets
const pluck = (m, dur, seed) => { const r = rng(seed), n = Math.round((dur + 0.6) * SR), b = new Float32Array(n), p = Math.max(2, Math.round(SR / hz(m))), line = Float32Array.from({ length: p }, () => r() * 2 - 1);
  let k = 0; for (let i = 0; i < n; i++) { const a = line[k], c = line[(k + 1) % p]; b[i] = a; line[k] = 0.497 * (a + c); k = (k + 1) % p; } return b; };
// warm pad: three detuned saws through a one-pole lowpass
const pad = (ms, dur, cut = 900) => { const n = Math.round((dur + 0.5) * SR), b = new Float32Array(n), a = 1 - Math.exp(-2 * Math.PI * cut / SR); let y = 0;
  const ph = ms.flatMap((m) => [hz(m) * 0.997, hz(m), hz(m) * 1.004]);
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const f of ph) v += ((t * f) % 1) * 2 - 1; y += a * (v / ph.length - y); b[i] = y * env(i, Math.round(dur * SR), 0.25, 0.4) * 0.6; } return b; };
// round bass: sine plus a little second harmonic, short pluck envelope
const bass = (m, dur) => { const n = Math.round((dur + 0.1) * SR), b = new Float32Array(n), f = hz(m);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-2.2 * t) * env(i, Math.round(dur * SR), 0.005, 0.05); } return b; };
// brass-ish lead for the fanfare: saw with a filter that opens on the attack
const brass = (m, dur) => { const n = Math.round((dur + 0.2) * SR), b = new Float32Array(n), f = hz(m); let y = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, cut = 600 + 2600 * Math.exp(-6 * t) + 500, a = 1 - Math.exp(-2 * Math.PI * cut / SR), v = ((t * f * 1.002) % 1) + ((t * f * 0.998) % 1) - 1; y += a * (v - y); b[i] = y * env(i, Math.round(dur * SR), 0.03, 0.12) * 0.55; } return b; };
const kick = () => { const n = Math.round(0.45 * SR), b = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = 48 + 110 * Math.exp(-28 * t); ph += f / SR; b[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-7 * t); } return b; };
const noiseHit = (seed, dur, decay, hp = 0.0, tone = 0) => { const r = rng(seed), n = Math.round(dur * SR), b = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, w = r() * 2 - 1, h = w - hp * prev; prev = w; b[i] = (h + (tone ? 0.6 * Math.sin(2 * Math.PI * tone * t) * Math.exp(-20 * t) : 0)) * Math.exp(-decay * t); } return b; };
const snare = (seed) => noiseHit(seed, 0.3, 18, 0.5, 190);
const hat = (seed, open = false) => noiseHit(seed, open ? 0.3 : 0.08, open ? 12 : 55, 0.95);
const crash = (seed) => noiseHit(seed, 2.6, 1.6, 0.9);
const boom = () => { const n = Math.round(1.6 * SR), b = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += (38 + 60 * Math.exp(-9 * t)) / SR; b[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-2.4 * t); } return b; };
// riser: noise through a sweeping resonant-ish lowpass, swelling into a downbeat
const riser = (seed, dur) => { const r = rng(seed), n = Math.round(dur * SR), b = new Float32Array(n); let y = 0;
  for (let i = 0; i < n; i++) { const k = i / n, cut = 300 + 7000 * k * k, a = 1 - Math.exp(-2 * Math.PI * cut / SR); y += a * ((r() * 2 - 1) - y); b[i] = y * k * k * 0.9; } return b; };
// engine: a growling saw whose pitch climbs as the car pulls away
const engine = (dur) => { const n = Math.round(dur * SR), b = new Float32Array(n); let ph = 0, y = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = 55 + 70 * (1 - Math.exp(-1.2 * t)) + 6 * Math.sin(t * 31); ph += f / SR; const v = (ph % 1) * 2 - 1, a = 1 - Math.exp(-2 * Math.PI * 700 / SR); y += a * (v - y); b[i] = y * Math.min(1, t / 0.08) * Math.exp(-0.6 * t) * 0.8; } return b; };

// ---------------------------------------------------------------- the harmony, one chord per half bar
// F major. Shot 1 starts uneasy (D minor), climbs to the 1 (F on bar 3); shot 2 lifts to Bb when he
// grows; shot 3 grooves to F for the coins; shot 4 builds over Bb-C to the reveal on F; shot 5 ends home.
const F = [53, 57, 60], Dm = [50, 53, 57], Bb = [46, 50, 53], C = [48, 52, 55], Gm = [55, 58, 62], Am = [57, 60, 64];
const CH = [ [Dm, Dm], [Bb, C], [F, F], [F, C], [Bb, Bb], [F, Am], [Gm, C], [F, F], [Dm, Bb], [Bb, C], [F, F], [Bb, C], [F, F] ];
CH.forEach((pair, bar) => pair.forEach((ch, h) => { add(at(bar, h * 2), pad(ch.map((m) => m + 12), 2 * BEAT, bar < 2 ? 700 : 1100), bar < 2 ? 0.16 : 0.2, 0);
  const root = ch[0] - 12 + (ch === Bb || ch === C || ch === Dm ? 0 : 0);
  const pattern = bar < 2 ? [0] : bar < 5 || bar === 8 || bar === 9 ? [0, 1] : [0, 0.5, 1, 1.5];        // the bass grows busier with the story
  pattern.forEach((b) => add(at(bar, h * 2 + b), bass(root + (b === 1.5 ? 7 : 0), 0.45), 0.42, 0)); }));

// ---------------------------------------------------------------- the tune (original), [bar, beat, beats, midi]
const TUNE = [
  // shot 1: a hesitant question, then the answer on the 1
  [0, 0, 1, 69], [0, 1, 1, 67], [0, 2, 2, 65], [1, 0, 1, 70], [1, 1, 1, 69], [1, 2, 0.5, 67], [1, 2.5, 0.5, 69], [1, 3, 1, 72],
  [2, 0, 1.5, 77], [2, 1.5, 0.5, 76], [2, 2, 1, 77], [2, 3, 1, 81],
  // shot 2: (the sheets carry the rhythm) a rising answer, landing up on the growth
  [3, 2, 1, 72], [3, 3, 1, 74], [4, 0, 2, 77], [4, 2, 1, 79], [4, 3, 1, 77],
  // shot 3: the walking theme, confident
  [5, 0, 1, 72], [5, 1, 0.5, 74], [5, 1.5, 0.5, 76], [5, 2, 1, 77], [5, 3, 1, 72], [6, 0, 1, 74], [6, 1, 1, 70], [6, 2, 1, 72], [6, 3, 1, 76],
  [7, 0, 1, 77], [7, 1, 0.5, 81], [7, 1.5, 0.5, 79], [7, 2, 2, 77],
  // shot 4: holding its breath, then the fanfare is played by the brass below
  [8, 0, 2, 74], [8, 2, 2, 70], [9, 0, 1, 70], [9, 1, 1, 72], [9, 2, 1, 74], [9, 3, 1, 76],
  // shot 5
  [11, 0, 1, 77], [11, 1, 1, 76], [11, 2, 1, 74], [11, 3, 1, 72], [12, 0, 3, 77],
];
TUNE.forEach(([bar, beat, d, m]) => add(at(bar, beat), bell(m, d * BEAT, 1), 0.3, 0.15));

// shot 2: the seven graded sheets land on eighth notes: a plucked rising scale
[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75].forEach((s, i) => add(at(3) + s, pluck([65, 67, 69, 70, 72, 74, 76][i], 0.4, 10 + i), 0.5, -0.3 + i * 0.1));
// shot 3: coins: a shower of high bell notes from the F pentatonic, seeded
{ const r = rng(5), pent = [77, 79, 81, 84, 86, 89, 91, 93]; for (let i = 0; i < 46; i++) { const t = 14 + 1.6 * Math.pow(i / 46, 1.3) + r() * 0.04; add(t, bell(pent[Math.floor(r() * pent.length)] + 12, 0.15, 1.4), 0.12 * (1 - i / 60), r() * 1.6 - 0.8); } }
// shot 4: the fanfare on the reveal
[[10, 0, 0.75, [65, 69, 72]], [10, 0.75, 0.25, [65, 69, 72]], [10, 1, 1, [67, 70, 74]], [10, 2, 2, [69, 72, 77]]].forEach(([bar, beat, d, ns]) => ns.forEach((m, k) => add(at(bar, beat), brass(m, d * BEAT), 0.18, -0.3 + k * 0.3)));
// shot 5: the engine
add(at(12) - 0.05, engine(2.6), 0.22, 0.4);

// ---------------------------------------------------------------- drums
for (let bar = 0; bar < BARS; bar++) {
  const hush = bar === 8 || bar === 9, full = bar >= 5 && !hush, mid = bar >= 2 && bar !== 9; // shot 4 holds its breath before the reveal
  for (let b = 0; b < 4; b++) {
    if (mid && (b === 0 || (full && b === 2))) add(at(bar, b), kick(), 0.55);
    if (full && (b === 1 || b === 3)) add(at(bar, b), snare(100 + bar * 4 + b), 0.22, 0.1);
    if (mid) for (const e of [0, 0.5]) add(at(bar, b + e), hat(200 + bar * 8 + b * 2 + e * 2, e === 0.5 && b === 3), e ? 0.06 : 0.04, -0.25);
  }
}
// wind-ups: a snare roll that crescendos into each big moment, plus a riser
const roll = (t1, dur, seed) => { const steps = Math.round(dur / (BEAT / 4)); for (let i = 0; i < steps; i++) add(t1 - dur + i * (BEAT / 4), snare(seed + i), 0.05 + 0.18 * (i / steps), 0.1); };
roll(4, 1.0, 300); roll(8, 0.5, 340); roll(14, 0.5, 360); roll(20, 2.0, 380); roll(24, 0.5, 420);
add(4 - 1.2, riser(7, 1.2), 0.25); add(8 - 0.5, riser(8, 0.5), 0.2); add(20 - 2.0, riser(9, 2.0), 0.3); add(24 - 0.5, riser(10, 0.5), 0.2);
// accents: crash + boom + a stab of the chord on every big moment
const STAB = { 4: F, 8: Bb, 14: F, 20: F, 24: F };
BIG.forEach((t, i) => { add(t, crash(500 + i), 0.32, i % 2 ? 0.3 : -0.3); add(t, boom(), 0.5); add(t, kick(), 0.4);
  STAB[t].forEach((m, k) => add(t, brass(m + 12, 0.35), 0.12, -0.4 + k * 0.4)); });
// the final chord rings out under the last bar
add(at(12, 2), pad([65, 69, 72, 77], 2.4, 1400), 0.2);

// ---------------------------------------------------------------- master: gentle saturation, normalise, 16-bit WAV
let peak = 0; for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.2) / 1.2; R[i] = Math.tanh(R[i] * 1.2) / 1.2; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak, out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8); out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
const file = process.argv[2] ?? "out/score.wav"; mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, out);
console.log(`score: ${file}  ${(N / SR).toFixed(2)} s, ${BARS} bars at ${BPM} bpm, cuts at ${[0, 3, 5, 8, 11].map((b) => b * BAR + "s").join(" ")}, accents at ${BIG.join(", ")} s`);
