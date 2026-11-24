// "Wieso können wir uns nicht selbst kitzeln?" - a vertical explainer, at least 60 s.
// Same house hand as schlaf.ts (night-glow vector): smoky ground, rim-lit silhouettes, badges, word captions.
// Facts: Blakemore, Wolpert & Frith 1998 (Nat Neurosci; cerebellum attenuates self-produced touch);
// Blakemore, Frith & Wolpert 1999 (J Cogn Neurosci; robot delays of 100-300 ms raise tickliness).
import { Ctx, Env, rng } from "./core";
import { Film } from "./film";
import { TIMING } from "./kitzelTiming";
import { W, H, Pt, clamp, prog, io, eo, back, mix, rgba, lerpC, smooth, rr, layer, silhouette, smoke, vignette, glowDot, headPath, badge, captions } from "./vkit";

const FPS = 30;
const L = TIMING.lines;
const VOICE_END = TIMING.total;
const DURATION = Math.max(61, Math.ceil(VOICE_END + 1.5)) * FPS; // never shorter than 61 s
const END = DURATION / FPS;
const ws = (li: number, wi: number) => L[li].words[Math.min(wi, L[li].words.length - 1)].s;
const ls = (li: number) => L[li].start;

// ---------------------------------------------------------------- props
// a hand, fingers pointing up (-y) at rot 0, palm centre (x,y); wig = finger wiggle 0..1
const handPath = (c: Ctx, x: number, y: number, s: number, rot: number, t: number, wig: number, arm = 420) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.roundRect(-44, -36, 88, 96, 30);
  c.rect(-36, 40, 72, arm);
  const fx = [-30, -10, 10, 30], fl = [66, 78, 74, 58];
  for (let i = 0; i < 4; i++) {
    c.save(); c.translate(fx[i], -26); c.rotate((i - 1.5) * 0.08 + Math.sin(t * 16 + i * 1.7) * 0.32 * wig);
    c.roundRect(-9.5, -fl[i], 19, fl[i] + 12, 9.5); c.restore();
  }
  c.save(); c.translate(-38, 18); c.rotate(-1.0 + Math.sin(t * 16 + 5) * 0.15 * wig); c.roundRect(-10, -56, 20, 62, 10); c.restore();
  c.restore();
};
// a front-facing bust; bounce/tilt when laughing
const bustPath = (c: Ctx, hx: number, hy: number, k = 1, tilt = 0) => {
  c.save(); c.translate(hx, hy); c.rotate(tilt); c.scale(k, k);
  c.ellipse(0, 0, 160, 205, 0, 0, Math.PI * 2);
  c.moveTo(-74, 160); c.lineTo(74, 160); c.lineTo(88, 300); c.quadraticCurveTo(400, 330, 450, 800); c.lineTo(-450, 800); c.quadraticCurveTo(-400, 330, -88, 300); c.closePath();
  c.restore();
};
const gauge = (ctx: Ctx, x: number, y: number, r: number, v: number, a: number) => {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  rr(ctx, -r - 40, -r - 40, 2 * r + 80, r + 110, 36); ctx.fillStyle = "rgba(10,10,16,0.72)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 3; ctx.stroke();
  const seg = 24; for (let i = 0; i < seg; i++) { const a0 = Math.PI + (i / seg) * Math.PI, a1 = Math.PI + ((i + 0.82) / seg) * Math.PI; ctx.strokeStyle = lerpC(i < seg / 2 ? "#3ae070" : "#ffd23a", i < seg / 2 ? "#ffd23a" : "#ff3a2a", (i % (seg / 2)) / (seg / 2)); ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(0, 0, r - 20, a0, a1); ctx.stroke(); }
  const ang = Math.PI + clamp(v) * Math.PI;
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (r - 44), Math.sin(ang) * (r - 44)); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.font = "800 34px Inter"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("KITZEL-METER", 0, 56);
  ctx.restore();
};
const haha = (ctx: Ctx, x: number, y: number, t: number, a: number, col = "#ffe07a") => {
  if (a <= 0) return;
  const r = rng(404);
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.9 + i / 6) % 1, ox = (r() - 0.5) * 560, sz = 56 + r() * 40;
    ctx.save(); ctx.globalAlpha = a * Math.sin(ph * Math.PI); ctx.translate(x + ox, y - ph * 300); ctx.rotate((r() - 0.5) * 0.5); ctx.scale(0.7 + ph * 0.5, 0.7 + ph * 0.5);
    ctx.font = `900 ${sz}px Inter`; ctx.textAlign = "center"; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.fillText("HA", 0, 0); ctx.restore();
  }
};
// a nerve signal as a waveform between x0 and x1
const waveLine = (ctx: Ctx, x0: number, x1: number, y: number, amp: number, t: number, col: string, freq = 0.045, spiky = 0) => {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineJoin = "round"; ctx.shadowColor = col; ctx.shadowBlur = 26; ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) {
    const u = (x - x0) / (x1 - x0), env = Math.sin(u * Math.PI);
    const v = Math.sin(x * freq - t * 9) + spiky * 0.6 * Math.sin(x * freq * 2.7 - t * 13) * Math.sin(x * 0.011 + t);
    x === x0 ? ctx.moveTo(x, y + v * amp * env) : ctx.lineTo(x, y + v * amp * env);
  }
  ctx.stroke(); ctx.restore();
};
const thought = (ctx: Ctx, x: number, y: number, w: number, h: number, a: number, tailTo: Pt) => {
  if (a <= 0) return; const k = back(a);
  ctx.save(); ctx.globalAlpha = clamp(a * 2); ctx.fillStyle = "rgba(245,248,255,0.95)"; ctx.shadowColor = "rgba(160,200,255,0.8)"; ctx.shadowBlur = 40;
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4; ctx.beginPath(); ctx.arc(mix(tailTo[0], x, u), mix(tailTo[1], y + h / 2, u), (8 + i * 8) * k, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); const pts: Pt[] = []; for (let i = 0; i < 9; i++) { const an = (i / 9) * Math.PI * 2; const bump = i % 2 ? 1.0 : 1.12; pts.push([x + Math.cos(an) * (w / 2) * bump * k, y + Math.sin(an) * (h / 2) * bump * k]); } smooth(ctx, pts); ctx.fill();
  ctx.restore();
};
const brainBlob = (ctx: Ctx, x: number, y: number, s: number, glow: number, seed = 9, warm = "#ffc4a8", deep = "#a2406a") => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); smooth(ctx, [[-200, 40], [-210, -40], [-150, -130], [-40, -170], [80, -160], [180, -100], [215, -10], [190, 70], [110, 110], [20, 100], [-90, 110], [-170, 95]]);
  const bg = ctx.createRadialGradient(-10, -30, 20, 0, 0, 260); bg.addColorStop(0, rgba(warm, 0.95 * glow)); bg.addColorStop(1, rgba(deep, 0.85 * glow));
  ctx.fillStyle = bg; ctx.shadowColor = rgba(warm, 0.6); ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0; ctx.clip();
  ctx.strokeStyle = rgba("#5a1438", 0.5); ctx.lineWidth = 7; ctx.lineCap = "round";
  const r = rng(seed); for (let i = 0; i < 16; i++) { let px = -220 + r() * 440, py = -170 + r() * 280; ctx.beginPath(); ctx.moveTo(px, py); for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2; const nx = px + Math.cos(a) * 46, ny = py + Math.sin(a) * 40; ctx.quadraticCurveTo((px + nx) / 2 + (r() - 0.5) * 40, (py + ny) / 2 + (r() - 0.5) * 40, nx, ny); px = nx; py = ny; } ctx.stroke(); }
  ctx.restore();
};
// the cerebellum: a ridged half-moon tucked under the back of the brain (facing left: back is +x)
const cerebellum = (ctx: Ctx, x: number, y: number, s: number, lit: number, t: number) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (lit > 0) glowDot(ctx, 0, 0, 220, "#5affc8", 0.7 * lit * (0.8 + 0.2 * Math.sin(t * 5)));
  ctx.beginPath(); ctx.ellipse(0, 0, 110, 64, -0.15, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, 120); g.addColorStop(0, lerpC("#e8a0b8", "#c8fff0", lit)); g.addColorStop(1, lerpC("#7a2a4a", "#1aa88a", lit));
  ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
  ctx.strokeStyle = rgba(lit > 0.5 ? "#0a5a4a" : "#4a1430", 0.6); ctx.lineWidth = 6;
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.ellipse(0, 70, 140, 20 + (i + 5) * 12, -0.15, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  ctx.restore(); ctx.restore();
};
const robotArm = (ctx: Ctx, bx: number, by: number, a1: number, a2: number) => {
  const metal = (x0: number, x1: number) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, "#e8eef6"); g.addColorStop(0.5, "#9aa6b8"); g.addColorStop(1, "#4a5464"); return g; };
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30;
  rr(ctx, bx - 110, by - 40, 220, 120, 24); ctx.fillStyle = metal(bx - 110, bx + 110); ctx.fill(); ctx.restore();
  ctx.fillStyle = "#2ad0ff"; ctx.shadowColor = "#2ad0ff"; ctx.shadowBlur = 20; ctx.fillRect(bx - 60, by + 10, 120, 10); ctx.shadowBlur = 0;
  ctx.save(); ctx.translate(bx, by - 30); ctx.rotate(a1);
  rr(ctx, -34, -330, 68, 340, 30); ctx.fillStyle = metal(-34, 34); ctx.fill();
  ctx.fillStyle = "#2a3040"; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#2ad0ff"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -310); ctx.rotate(a2);
  rr(ctx, -26, -250, 52, 260, 24); ctx.fillStyle = metal(-26, 26); ctx.fill();
  ctx.fillStyle = "#2a3040"; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#2ad0ff"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  // foam tip
  ctx.translate(0, -250); ctx.fillStyle = "#ffcf5a"; ctx.shadowColor = "#ffcf5a"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(0, -10, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
const bigGlyph = (ctx: Ctx, x: number, y: number, ch: string, size: number, col: string, p: number, rot = 0) => {
  if (p <= 0) return; const k = back(p);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.font = `900 ${size}px Inter`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 60; ctx.fillText(ch, 0, 0); ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `900 ${size * 0.96}px Inter`; ctx.fillText(ch, 0, -2); ctx.restore();
};

// ---------------------------------------------------------------- scenes
const SKIN = (ctx: Ctx, top: string, bot: string) => { const g = ctx.createLinearGradient(0, 700, 0, 1920); g.addColorStop(0, top); g.addColorStop(1, bot); return g; };

// 1: tickling yourself does nothing
const selfScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 111, { top: "#04121a", bottom: "#082230", blobs: ["#0f4a5a", "#155a6e", "#0a2e44", "#1f6a7a"], texA: 0.22 });
  const hx = 540, hy = 1060;
  silhouette(ctx, env, "b1", (c) => bustPath(c, hx, hy), SKIN(ctx, "#0b1a22", "#03080b"), "#5ad8ff", -0.4, -1, 9, 32);
  const reach = eo(prog(sec, ws(0, 4) - 0.6, ws(0, 5) + 0.1)), wig = prog(sec, ws(0, 5) - 0.1, ws(0, 5) + 0.3);
  silhouette(ctx, env, "h1", (c) => handPath(c, mix(240, 330, reach), mix(1900, 1540, reach), 1.25, 0.55, sec, wig), SKIN(ctx, "#10242e", "#050c10"), "#7ae0ff", 0.6, -1, 6, 22);
  // nothing happens: the meter twitches and falls back
  const g = mix(0.02, 0.07, Math.abs(Math.sin(sec * 9)) * wig);
  gauge(ctx, 780, 1620, 170, g, eo(prog(sec, ws(0, 5) - 0.2, ws(0, 5) + 0.3)));
  badge(ctx, 540, 1840, "KLAPPT NICHT", prog(sec, ws(1, 1) - 0.1, ws(1, 1) + 0.3), "#ff4a3a", "#b0100a", -0.05, 76);
  vignette(ctx, 0.7);
};
// 2: someone else does it and you burst out laughing
const otherScene = (ctx: Ctx, env: Env, sec: number) => {
  const laugh = eo(prog(sec, ws(2, 3) - 0.1, ws(2, 3) + 0.4));
  smoke(ctx, env, sec, 121, { top: "#1a0c04", bottom: "#3a1a06", blobs: ["#d06a10", "#ffa030", "#8a3a0a", "#ffcf5a"], texA: 0.24 });
  const bounce = Math.abs(Math.sin(sec * 11)) * 26 * laugh, tilt = Math.sin(sec * 7) * 0.07 * laugh;
  const hx = 500, hy = 1080 - bounce;
  silhouette(ctx, env, "b2", (c) => bustPath(c, hx, hy, 1, tilt), SKIN(ctx, "#1a0c06", "#060302"), "#ffb050", 0.3, -1, 9, 34);
  const come = eo(prog(sec, ls(2) - 0.3, ws(2, 2)));
  silhouette(ctx, env, "h2", (c) => handPath(c, mix(1250, 860, come), mix(1500, 1400, come), 1.3, -1.25, sec, come), SKIN(ctx, "#2a1206", "#0a0402"), "#ffd27a", -0.6, -1, 6, 24);
  haha(ctx, hx, hy - 260, sec, laugh);
  gauge(ctx, 270, 1640, 160, mix(0.05, 0.96, laugh) + Math.sin(sec * 13) * 0.03 * laugh, 1);
  vignette(ctx, 0.65);
};
// 3: why?
const whyScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 131, { top: "#0e0620", bottom: "#1c0a34", blobs: ["#5a2aa0", "#3a1a7a", "#8a4ad0", "#2a1050"], texA: 0.24 });
  silhouette(ctx, env, "b3", (c) => bustPath(c, 540, 1380, 0.8), SKIN(ctx, "#140a22", "#05030a"), "#b08aff", 0, -1, 8, 30);
  bigGlyph(ctx, 540, 930 + Math.sin(sec * 2) * 14, "?", 420, "#c09aff", prog(sec, ls(3) - 0.2, ls(3) + 0.3), Math.sin(sec * 1.5) * 0.08);
  vignette(ctx, 0.7);
};
// 4: the answer is the cerebellum
const cerebScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 141, { top: "#03141a", bottom: "#062028", blobs: ["#0a5a5a", "#127a6a", "#063a4a", "#1a8a7a"], texA: 0.22 });
  const hx = 560, hy = 1080, s = 4.6;
  const bust = (c: Ctx) => { headPath(c, hx, hy, s, 0, -1); c.moveTo(hx - 70, hy + 250); c.lineTo(hx + 130, hy + 250); c.lineTo(hx + 170, hy + 460); c.quadraticCurveTo(hx + 470, hy + 500, hx + 520, hy + 900); c.lineTo(hx - 640, hy + 900); c.quadraticCurveTo(hx - 560, hy + 520, hx - 150, hy + 470); c.closePath(); };
  silhouette(ctx, env, "b4", bust, SKIN(ctx, "#081418", "#020607"), "#5affd0", -1, -0.6, 9, 34);
  const lit = eo(prog(sec, ws(4, 5) - 0.3, ws(4, 5) + 0.3)), look = eo(prog(sec, ws(4, 3) - 0.3, ws(4, 3) + 0.4));
  brainBlob(ctx, hx + 30, hy - 80, 1, 0.5 + 0.3 * look);
  ctx.save(); ctx.globalAlpha = 0.45 + 0.55 * Math.max(look * 0.5, lit); cerebellum(ctx, hx + 170, hy + 60, 1, lit, sec); ctx.restore();
  if (lit > 0) { ctx.save(); ctx.strokeStyle = rgba("#5affd0", lit); ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.lineDashOffset = -sec * 40; ctx.beginPath(); ctx.arc(hx + 170, hy + 60, 160 + 8 * Math.sin(sec * 4), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  badge(ctx, 540, 1700, "KLEINHIRN", prog(sec, ws(4, 5) - 0.1, ws(4, 5) + 0.3), "#2ae0a8", "#0a8a6a", -0.05, 86);
  vignette(ctx, 0.65);
};
// 5: every movement sends a copy of the command along
const copyScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 151, { top: "#020a1e", bottom: "#061430", blobs: ["#123a8a", "#0a2a6a", "#1a5aaa", "#08204a"], texA: 0.2 });
  const bx = 400, by = 820, cx = 820, cy = 1000, hx = 420, hy = 1560;
  brainBlob(ctx, bx, by, 0.85, 0.9);
  // nerve to the hand
  ctx.save(); ctx.strokeStyle = "rgba(140,190,255,0.35)"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(bx, by + 90); ctx.bezierCurveTo(bx - 60, by + 300, hx + 40, hy - 360, hx, hy - 120); ctx.stroke(); ctx.restore();
  const wig = prog(sec, ws(5, 5) - 0.2, ws(5, 5) + 0.2);
  silhouette(ctx, env, "h5", (c) => handPath(c, hx, hy, 1.4, 0, sec, wig * 0.7), SKIN(ctx, "#0e1a34", "#04070f"), "#7ab8ff", 0, -1, 6, 22);
  const at = (u: number): Pt => { const p0: Pt = [bx, by + 90], p1: Pt = [bx - 60, by + 300], p2: Pt = [hx + 40, hy - 360], p3: Pt = [hx, hy - 120]; const v = 1 - u; return [v ** 3 * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u ** 3 * p3[0], v ** 3 * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u ** 3 * p3[1]]; };
  // the command pulses run down, repeating
  const go = prog(sec, ws(5, 6) - 0.2, ws(5, 6));
  if (go > 0) for (let i = 0; i < 3; i++) { const u = ((sec - ws(5, 6)) * 0.8 + i / 3) % 1; if (sec - ws(5, 6) + i / 3 / 0.8 < 0) continue; const [x, y] = at(u); glowDot(ctx, x, y, 50, "#9ad0ff", go); }
  // the copy splits off to the cerebellum
  const cp = eo(prog(sec, ws(5, 10) - 0.3, ws(5, 10) + 0.6));
  cerebellum(ctx, cx, cy, 0.9, cp, sec);
  if (cp > 0) {
    ctx.save(); ctx.strokeStyle = rgba("#5affd0", 0.6 * cp); ctx.lineWidth = 8; ctx.setLineDash([18, 14]); ctx.lineDashOffset = -sec * 60; ctx.beginPath(); ctx.moveTo(bx + 120, by + 60); ctx.quadraticCurveTo(cx - 40, by + 20, cx - 40, cy - 80); ctx.stroke(); ctx.restore();
    const u = ((sec - ws(5, 10)) * 0.9) % 1, x = mix(bx + 120, cx - 40, u), y = mix(by + 60, cy - 80, u * u);
    // a copied sheet travelling
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(sec * 3) * 0.15); ctx.globalAlpha = cp; ctx.shadowColor = "#5affd0"; ctx.shadowBlur = 30;
    rr(ctx, -38, -48, 76, 96, 10); ctx.fillStyle = "#e8fff8"; ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#1aa88a"; for (let k = 0; k < 4; k++) ctx.fillRect(-24, -30 + k * 18, k === 3 ? 30 : 48, 8); ctx.restore();
  }
  ctx.font = "800 46px Inter"; ctx.textAlign = "center"; ctx.fillStyle = rgba("#bcd8ff", go); ctx.fillText("Befehl", hx + 210, hy - 380);
  ctx.fillStyle = rgba("#8affdc", cp); ctx.fillText("Kopie", cx, cy + 130);
  badge(ctx, 540, 1780, "KOPIE", prog(sec, ws(5, 10) - 0.1, ws(5, 10) + 0.3), "#2ae0a8", "#0a8a6a", -0.05, 80);
  vignette(ctx, 0.6);
};
// 6: the copy predicts the touch, and the predicted touch is turned down
const predictScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 161, { top: "#03141a", bottom: "#061e28", blobs: ["#0a4a5a", "#126a6a", "#06304a", "#1a6a8a"], texA: 0.2 });
  const cx = 300, cy = 1420;
  cerebellum(ctx, cx, cy, 1.1, 1, sec);
  const tb = prog(sec, ws(6, 1) - 0.2, ws(6, 1) + 0.3);
  thought(ctx, 640, 860, 640, 330, tb, [cx + 60, cy - 90]);
  if (tb > 0) {
    ctx.save(); ctx.globalAlpha = clamp(tb * 2);
    ctx.font = "800 38px Inter"; ctx.textAlign = "center"; ctx.fillStyle = "#0a5a4a"; ctx.fillText("ERWARTET", 640, 760);
    ctx.restore();
    waveLine(ctx, 400, 880, 880, 46 * clamp(tb * 2), sec, "#1aa88a");
  }
  // the real touch arrives and is damped where it matches the prediction
  const damp = io(prog(sec, ws(7, 6) - 0.4, ws(7, 6) + 0.5)), real = prog(sec, ls(7) - 0.2, ls(7) + 0.3);
  if (real > 0) {
    ctx.font = "800 38px Inter"; ctx.textAlign = "left"; ctx.fillStyle = rgba("#ffd27a", real); ctx.fillText("GESPÜRT", 560, 1320);
    waveLine(ctx, 540, 1020, 1420, mix(120, 14, damp) * real, sec, lerpC("#ffb040", "#7a8aa0", damp));
    // a fader sliding down
    const fx = 980, fy0 = 1180, fy1 = 1660; ctx.fillStyle = "rgba(255,255,255,0.15)"; rr(ctx, fx - 10, fy0, 20, fy1 - fy0, 10); ctx.fill();
    const ky = mix(fy0 + 40, fy1 - 60, damp); rr(ctx, fx - 44, ky - 26, 88, 52, 14); ctx.fillStyle = lerpC("#ffb040", "#5affd0", damp); ctx.shadowColor = ctx.fillStyle as string; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
  }
  badge(ctx, 560, 1800, "GEDÄMPFT", prog(sec, ws(7, 6) - 0.1, ws(7, 6) + 0.3), "#5a7aa0", "#2a3a5a", -0.05, 84);
  vignette(ctx, 0.6);
};
// 7: "it's only me" - no danger
const safeScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 171, { top: "#03140a", bottom: "#062614", blobs: ["#0a6a3a", "#1a8a4a", "#064a2a", "#2aa060"], texA: 0.2 });
  const hx = 560, hy = 1080, s = 4.6;
  const bust = (c: Ctx) => { headPath(c, hx, hy, s, 0, -1); c.moveTo(hx - 70, hy + 250); c.lineTo(hx + 130, hy + 250); c.lineTo(hx + 170, hy + 460); c.quadraticCurveTo(hx + 470, hy + 500, hx + 520, hy + 900); c.lineTo(hx - 640, hy + 900); c.quadraticCurveTo(hx - 560, hy + 520, hx - 150, hy + 470); c.closePath(); };
  silhouette(ctx, env, "b7", bust, SKIN(ctx, "#061a0e", "#020804"), "#6affa0", -1, -0.6, 9, 34);
  const sp = prog(sec, ws(8, 3) - 0.2, ws(8, 3) + 0.4);
  if (sp > 0) {
    const k = back(sp), x = hx + 40, y = hy - 90; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    glowDot(ctx, 0, 0, 320, "#3aff8a", 0.5);
    ctx.beginPath(); ctx.moveTo(0, -150); ctx.quadraticCurveTo(110, -120, 130, -100); ctx.quadraticCurveTo(130, 60, 0, 150); ctx.quadraticCurveTo(-130, 60, -130, -100); ctx.quadraticCurveTo(-110, -120, 0, -150); ctx.closePath();
    const g = ctx.createLinearGradient(0, -150, 0, 150); g.addColorStop(0, "#5aff9a"); g.addColorStop(1, "#0a9a4a"); ctx.fillStyle = g; ctx.shadowColor = "#3aff8a"; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
    const ck = eo(prog(sec, ws(8, 5), ws(8, 6) + 0.2)); ctx.strokeStyle = "#fff"; ctx.lineWidth = 26; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(-56, 0);
    if (ck < 0.4) ctx.lineTo(mix(-56, -12, ck / 0.4), mix(0, 46, ck / 0.4)); else { ctx.lineTo(-12, 46); ctx.lineTo(mix(-12, 64, (ck - 0.4) / 0.6), mix(46, -50, (ck - 0.4) / 0.6)); } ctx.stroke();
    ctx.restore();
  }
  badge(ctx, 540, 1720, "KEINE GEFAHR", prog(sec, ws(8, 7) - 0.1, ws(8, 7) + 0.3), "#2ad070", "#0a8a3a", -0.05, 84);
  vignette(ctx, 0.65);
};
// 8: someone else: no prediction -> surprise -> laughter
const surpriseScene = (ctx: Ctx, env: Env, sec: number) => {
  const flash = prog(sec, ws(10, 3) - 0.1, ws(10, 3) + 0.15), laugh = eo(prog(sec, ws(11, 4) - 0.2, ws(11, 7) + 0.2));
  const hot = Math.max(eo(flash), laugh);
  smoke(ctx, env, sec, 181, { top: lerpC("#0e0620", "#2a0a04", hot), bottom: lerpC("#1c0a34", "#4a1606", hot), blobs: hot > 0.5 ? ["#ff6a1a", "#d03a0a", "#ffb040", "#8a1a0a"] : ["#5a2aa0", "#3a1a7a", "#8a4ad0", "#2a1050"], texA: 0.24 });
  const bounce = Math.abs(Math.sin(sec * 11)) * 26 * laugh, tilt = Math.sin(sec * 7) * 0.07 * laugh, jolt = flash > 0 && flash < 1 ? -30 * Math.sin(flash * Math.PI) : 0;
  const hx = 460, hy = 1150 - bounce + jolt;
  silhouette(ctx, env, "b8", (c) => bustPath(c, hx, hy, 0.95, tilt), SKIN(ctx, "#120a1a", "#050308"), lerpC("#b08aff", "#ffb050", hot), 0.4, -1, 9, 34);
  const come = eo(prog(sec, ws(9, 2) - 0.4, ws(9, 4) + 0.2));
  silhouette(ctx, env, "h8", (c) => handPath(c, mix(1300, 880, come), mix(1600, 1450, come), 1.3, -1.25, sec, come * (laugh > 0 ? 1 : 0.6)), SKIN(ctx, "#1a0c22", "#06030a"), "#ffd27a", -0.6, -1, 6, 24);
  // the prediction bubble is empty
  const tb = prog(sec, ws(9, 5) - 0.2, ws(9, 5) + 0.3) * (1 - prog(sec, ws(10, 3) - 0.1, ws(10, 3) + 0.1));
  if (tb > 0) { thought(ctx, 700, 720, 380, 260, tb, [hx + 60, hy - 220]); ctx.save(); ctx.globalAlpha = clamp(tb * 2); ctx.font = "900 160px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#8a6ad0"; ctx.fillText("?", 700, 730); ctx.restore(); }
  if (flash > 0 && flash < 1) { ctx.fillStyle = `rgba(255,240,220,${0.6 * Math.sin(flash * Math.PI)})`; ctx.fillRect(0, 0, W, H); }
  bigGlyph(ctx, 760, 740, "!", 360, "#ffb040", flash * (1 - prog(sec, ls(11) + 0.4, ls(11) + 0.8)), 0.1);
  if (laugh > 0) waveLine(ctx, 80, 1000, 680, 120 * laugh, sec, "#ff7a3a", 0.05, 1);
  haha(ctx, hx, hy - 260, sec, laugh);
  gauge(ctx, 800, 1660, 150, mix(0.05, 0.97, laugh) + Math.sin(sec * 13) * 0.03 * laugh, eo(prog(sec, ls(11) - 0.2, ls(11) + 0.3)));
  vignette(ctx, 0.65);
};
// 9: the robot experiment
const labScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 191, { top: "#020e14", bottom: "#04202a", blobs: ["#0a5a7a", "#0a3a5a", "#1a7a9a", "#062a3a"], texA: 0.18 });
  // a lab bench
  const bench = ctx.createLinearGradient(0, 1480, 0, 1920); bench.addColorStop(0, "#3a4a5a"); bench.addColorStop(0.05, "#1a2430"); bench.addColorStop(1, "#06090c");
  ctx.fillStyle = bench; ctx.fillRect(-60, 1480, W + 120, 500); ctx.fillStyle = "rgba(160,220,255,0.3)"; ctx.fillRect(-60, 1480, W + 120, 4);
  // the volunteer's hand moves a lever back and forth; the robot copies it, late
  const delay = mix(0, 0.45, eo(prog(sec, ws(13, 7) - 0.3, ws(13, 7) + 0.6)));
  const lever = (tt: number) => Math.sin(Math.max(0, tt - ls(12)) * 2.6) * eo(prog(tt, ls(12) + 0.3, ls(13)));
  const lv = lever(sec), rv = lever(sec - delay);
  const lx = 260, ly = 1470;
  ctx.fillStyle = "#2a3440"; rr(ctx, lx - 90, ly - 30, 180, 50, 14); ctx.fill();
  ctx.save(); ctx.translate(lx, ly - 20); ctx.rotate(lv * 0.5); ctx.fillStyle = "#c8d0dc"; ctx.fillRect(-8, -200, 16, 200); ctx.fillStyle = "#ff5a3a"; ctx.beginPath(); ctx.arc(0, -210, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const tipX = lx + Math.sin(lv * 0.5) * 210, tipY = ly - 20 - Math.cos(lv * 0.5) * 210;
  silhouette(ctx, env, "h9", (c) => handPath(c, tipX - 20, tipY + 50, 1.05, 0.45 + lv * 0.3, sec, 0, 600), SKIN(ctx, "#0e2430", "#03080b"), "#7ae0ff", 0.4, -1, 6, 22);
  // the robot touching the other palm
  silhouette(ctx, env, "p9", (c) => handPath(c, 1000, 1330, 1.05, -Math.PI / 2, sec, 0, 300), SKIN(ctx, "#0e2430", "#03080b"), "#7ae0ff", 0, -1, 6, 22);
  robotArm(ctx, 700, 1450, 0.28 + rv * 0.07, 2.32 + rv * 0.05);
  // timer readout
  const tp = prog(sec, ws(13, 7) - 0.2, ws(13, 7) + 0.3);
  if (tp > 0) {
    const k = back(tp); ctx.save(); ctx.translate(540, 900); ctx.scale(k, k);
    rr(ctx, -210, -80, 420, 160, 28); ctx.fillStyle = "rgba(4,10,14,0.85)"; ctx.fill(); ctx.strokeStyle = "#2ad0ff"; ctx.lineWidth = 4; ctx.stroke();
    ctx.font = "700 96px 'JetBrains Mono'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#5ae0ff"; ctx.shadowColor = "#2ad0ff"; ctx.shadowBlur = 24;
    ctx.fillText(`+${(Math.min(delay, 0.2) + (delay > 0.2 ? (Math.floor(sec * 2) % 2) * 0.1 : 0)).toFixed(1).replace(".", ",")} s`, 0, 4); ctx.restore();
  }
  // tickle meter rises with the delay
  const tick = eo(prog(sec, ws(14, 7) - 0.4, ws(14, 9) + 0.3));
  gauge(ctx, 260, 1730, 140, mix(0.08, 0.7, tick) + Math.sin(sec * 12) * 0.02 * tick, eo(prog(sec, ls(14) - 0.2, ls(14) + 0.3)));
  // the prediction no longer fits
  const nf = prog(sec, ws(15, 1) - 0.2, ws(15, 1) + 0.3);
  if (nf > 0) { thought(ctx, 720, 1080, 360, 220, nf, [800, 1250]); ctx.save(); ctx.globalAlpha = clamp(nf * 2); ctx.font = "900 140px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#e03a2a"; ctx.fillText("≠", 720, 1086); ctx.restore(); }
  badge(ctx, 540, 1070, "0,1–0,3 SEKUNDEN", prog(sec, ws(14, 2) - 0.1, ws(14, 2) + 0.3) * (1 - prog(sec, ls(15) - 0.3, ls(15))), "#2ab0ff", "#0a5ad0", -0.04, 64);
  vignette(ctx, 0.6);
};
// 10: tickling needs surprise; your brain is too clever to surprise itself
const endScene = (ctx: Ctx, env: Env, sec: number) => {
  const smart = eo(prog(sec, ws(17, 5) - 0.3, ws(17, 5) + 0.6));
  smoke(ctx, env, sec, 201, { top: "#140a02", bottom: "#2a1604", blobs: ["#b07a1a", "#e0a030", "#6a3a0a", "#ffd060"], texA: 0.22 });
  const hx = 560, hy = 1100, s = 4.6;
  // rays behind the head
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(hx + 40, hy - 100); ctx.rotate(sec * 0.08);
  for (let i = 0; i < 14; i++) { ctx.rotate((Math.PI * 2) / 14); const g = ctx.createLinearGradient(0, 0, 0, -900); g.addColorStop(0, `rgba(255,200,90,${0.16 + 0.12 * smart})`); g.addColorStop(1, "rgba(255,200,90,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(90, -900); ctx.lineTo(-90, -900); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const bust = (c: Ctx) => { headPath(c, hx, hy, s, 0, -1); c.moveTo(hx - 70, hy + 250); c.lineTo(hx + 130, hy + 250); c.lineTo(hx + 170, hy + 460); c.quadraticCurveTo(hx + 470, hy + 500, hx + 520, hy + 900); c.lineTo(hx - 640, hy + 900); c.quadraticCurveTo(hx - 560, hy + 520, hx - 150, hy + 470); c.closePath(); };
  silhouette(ctx, env, "b10", bust, SKIN(ctx, "#140c04", "#050301"), "#ffc060", -1, -0.6, 9, 34);
  brainBlob(ctx, hx + 30, hy - 80, 1, 0.75 + 0.25 * smart, 9, lerpC("#ffc4a8", "#fff0b0", smart), lerpC("#a2406a", "#d08a20", smart));
  // sparkles around the brain once it is "too clever"
  if (smart > 0) { const r = rng(9090); for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = 250 + r() * 120, ph = r() * 6; const tw = 0.5 + 0.5 * Math.sin(sec * 4 + ph); ctx.save(); ctx.translate(hx + 30 + Math.cos(a + sec * 0.2) * d, hy - 80 + Math.sin(a + sec * 0.2) * d * 0.8); ctx.scale(tw, tw); ctx.fillStyle = rgba("#fff3c0", smart); ctx.shadowColor = "#ffd060"; ctx.shadowBlur = 20; ctx.beginPath(); for (let k = 0; k < 8; k++) { const rr2 = k % 2 ? 6 : 22, aa = (k / 8) * Math.PI * 2; k ? ctx.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2) : ctx.moveTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2); } ctx.fill(); ctx.restore(); } }
  badge(ctx, 540, 1720, "NUR MIT ÜBERRASCHUNG", prog(sec, ws(16, 6) - 0.1, ws(16, 6) + 0.3) * (1 - prog(sec, ws(17, 5) - 0.3, ws(17, 5))), "#ff9a2a", "#c05a00", -0.04, 66);
  badge(ctx, 540, 1720, "ZU SCHLAU", prog(sec, ws(17, 5) - 0.1, ws(17, 5) + 0.3), "#ffc040", "#d07a00", -0.05, 90);
  vignette(ctx, 0.62);
};

// ---------------------------------------------------------------- the cut list and the camera
type Scene = { id: string; from: number; draw: (ctx: Ctx, env: Env, sec: number) => void; zoom: [number, number]; focus: [Pt, Pt] };
const cut = (li: number) => ls(li) - 0.3;
const SCENES: Scene[] = [
  { id: "selbst", from: 0, draw: selfScene, zoom: [1.0, 1.1], focus: [[540, 1160], [520, 1220]] },
  { id: "andere", from: cut(2), draw: otherScene, zoom: [1.08, 1.0], focus: [[520, 1150], [540, 1120]] },
  { id: "warum", from: cut(3), draw: whyScene, zoom: [1.0, 1.12], focus: [[540, 1100], [540, 1000]] },
  { id: "kleinhirn", from: cut(4), draw: cerebScene, zoom: [1.0, 1.18], focus: [[560, 1100], [640, 1100]] },
  { id: "kopie", from: cut(5), draw: copyScene, zoom: [1.06, 1.0], focus: [[560, 1150], [540, 1150]] },
  { id: "vorhersage", from: cut(6), draw: predictScene, zoom: [1.0, 1.06], focus: [[540, 1200], [560, 1220]] },
  { id: "sicher", from: cut(8), draw: safeScene, zoom: [1.12, 1.0], focus: [[600, 1060], [560, 1100]] },
  { id: "ueberraschung", from: cut(9), draw: surpriseScene, zoom: [1.0, 1.08], focus: [[540, 1150], [520, 1120]] },
  { id: "labor", from: cut(12), draw: labScene, zoom: [1.06, 1.0], focus: [[540, 1250], [540, 1200]] },
  { id: "schluss", from: cut(16), draw: endScene, zoom: [1.0, 1.12], focus: [[560, 1100], [600, 1040]] },
];
const XF = 0.4;
const drawScene = (ctx: Ctx, env: Env, i: number, sec: number) => {
  const sc = SCENES[i], end = i + 1 < SCENES.length ? SCENES[i + 1].from : END;
  const p = io(prog(sec, sc.from, end + XF)), z = mix(sc.zoom[0], sc.zoom[1], p);
  const fx = mix(sc.focus[0][0], sc.focus[1][0], p), fy = mix(sc.focus[0][1], sc.focus[1][1], p);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy); sc.draw(ctx, env, sec); ctx.restore();
};
const draw = (ctx: Ctx, frame: number, env: Env) => {
  const sec = frame / FPS; ctx.scale(env.scale, env.scale);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  let i = 0; for (let k = 0; k < SCENES.length; k++) if (sec >= SCENES[k].from) i = k;
  drawScene(ctx, env, i, sec);
  if (i + 1 < SCENES.length && sec > SCENES[i + 1].from - XF) {
    const a = io(prog(sec, SCENES[i + 1].from - XF, SCENES[i + 1].from));
    const l = layer(env, "xf"); l.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); drawScene(l.ctx, env, i + 1, sec);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(l.canvas as CanvasImageSource, 0, 0); ctx.restore();
  }
  const fadeOut = prog(sec, END - 0.8, END); if (fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${fadeOut})`; ctx.fillRect(0, 0, W, H); }
  captions(ctx, sec, L);
};

export const kitzel: Film = {
  meta: { title: "kitzel", W, H, fps: FPS, bpm: 60, durationFrames: DURATION, kind: "explainer", poster: 0,
    captions: L.map((l, i) => ({ from: Math.round(l.start * FPS), to: Math.round((i + 1 < L.length ? L[i + 1].start : l.end + 1) * FPS), text: l.text })) },
  assets: { images: {} },
  shots: [{ id: "film", start: 0, end: DURATION, draw }],
};
