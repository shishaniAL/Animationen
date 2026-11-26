// GLOW KIT: the shared hand of the glowing-figure explainers (soft clay-white figures and thin glowing
// line icons on a near-black stage). Pure helpers; every film passes its own time and timing.
import { Ctx, Env, Layer, rng } from "./core";

export type P = [number, number];
export const W = 1080, H = 1920, GROUND = 1180;
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ramp = (t: number, a: number, b: number) => cl((t - a) / (b - a));
export const eo = (u: number) => 1 - Math.pow(1 - cl(u), 3);
export const eio = (u: number) => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const back = (u: number) => { u = cl(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
export const mix = (a: number, b: number, u: number) => a + (b - a) * u;
export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const pulse = (t: number, t0: number, d = 0.5) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };

export const INK = "#f3f3f1";
let SC = 1;
export const setScale = (s: number) => { SC = s; };
export const glow = (ctx: Ctx, blur = 14, a = 0.7) => { ctx.shadowColor = `rgba(255,255,255,${a})`; ctx.shadowBlur = blur * SC; };
export const noGlow = (ctx: Ctx) => { ctx.shadowBlur = 0; ctx.shadowColor = "rgba(0,0,0,0)"; };

export const circ = (cx: number, cy: number, r: number, a0 = -Math.PI / 2, n = 56, sweep = Math.PI * 2): P[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (i / n) * sweep; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P; });
export const rrect = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const pts: P[] = [], arcp = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  pts.push([x + r, y]); pts.push([x + w - r, y]); arcp(x + w - r, y + r, -Math.PI / 2); pts.push([x + w, y + h - r]); arcp(x + w - r, y + h - r, 0);
  pts.push([x + r, y + h]); arcp(x + r, y + h - r, Math.PI / 2); pts.push([x, y + r]); arcp(x + r, y + r, Math.PI); return pts;
};
export const seg = (x1: number, y1: number, x2: number, y2: number): P[] => [[x1, y1], [x2, y2]];
const plen = (pts: P[]) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };

/** Polylines drawn on in order to fraction p of their total length. Marks are drawn, never faded in. */
export const ink = (ctx: Ctx, paths: P[][], p: number, lw = 4, a = 1, blur = 12) => {
  if (p <= 0 || a <= 0) return;
  const lens = paths.map(plen), tot = lens.reduce((x, y) => x + y, 0); let left = cl(p) * tot;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; glow(ctx, blur, 0.75);
  ctx.beginPath();
  paths.forEach((pts, k) => {
    if (left <= 0) return; let rem = Math.min(left, lens[k]); left -= lens[k];
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= rem) { ctx.lineTo(pts[i][0], pts[i][1]); rem -= d; } else { const u = rem / d; ctx.lineTo(mix(pts[i - 1][0], pts[i][0], u), mix(pts[i - 1][1], pts[i][1], u)); rem = 0; }
    }
  });
  ctx.stroke(); ctx.restore();
};
export const dot = (ctx: Ctx, x: number, y: number, r: number, a = 1, blur = 16) => {
  if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = INK; glow(ctx, blur, 0.9); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
export const label = (ctx: Ctx, txt: string, x: number, y: number, reveal = 1, o: { size?: number; a?: number; align?: CanvasTextAlign; weight?: number; sp?: number } = {}) => {
  if (reveal <= 0) return;
  const n = Math.ceil(cl(reveal) * txt.length), s = txt.slice(0, n);
  ctx.save(); ctx.globalAlpha *= o.a ?? 0.9; ctx.fillStyle = INK; glow(ctx, 10, 0.55);
  ctx.font = `${o.weight ?? 700} ${o.size ?? 26}px Inter, sans-serif`; (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${o.sp ?? (o.size ?? 26) * 0.16}px`;
  ctx.textAlign = o.align ?? "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y); ctx.restore();
};
export const bigNum = (ctx: Ctx, txt: string, x: number, y: number, a = 1, size = 76) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = INK; glow(ctx, 18, 0.7);
  ctx.font = `800 ${size}px "Inter Display", Inter, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y); ctx.restore();
};
export const counter = (ctx: Ctx, title: string, value: string, x: number, y: number, a: number, size = 70) => {
  label(ctx, title, x, y, a < 1 ? cl(a * 2) : 1, { size: 22, a: 0.8 * cl(a * 3) }); bigNum(ctx, value, x, y + size * 0.78, cl(a * 3), size);
};
export const ground = (ctx: Ctx, y: number, p: number, a = 0.8, x0 = 60, x1 = 1020) => {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.setLineDash([16, 12]); glow(ctx, 8, 0.6);
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(mix(x0, x1, eo(p)), y); ctx.stroke(); ctx.restore();
};
export const shake = (t: number, t0: number, amp: number, dur = 0.5): P => { const u = t - t0; if (u < 0 || u > dur) return [0, 0]; const d = amp * Math.pow(1 - u / dur, 2); return [Math.sin(u * 63) * d, Math.cos(u * 51) * d * 0.7]; };
export const bubble = (ctx: Ctx, x: number, y: number, w: number, h: number, fx: number, fy: number, p: number, a = 1) => {
  ink(ctx, [rrect(x - w / 2, y - h / 2, w, h, Math.min(h / 2, 60)), circ(mix(x, fx, 0.45), mix(y + h / 2, fy, 0.45) + 6, 10), circ(mix(x, fx, 0.78), mix(y + h / 2, fy, 0.78), 6)], p, 4, a);
};
export const check = (cx: number, cy: number, s: number): P[] => [[cx - s * 0.45, cy], [cx - s * 0.1, cy + s * 0.35], [cx + s * 0.5, cy - s * 0.4]];
export const spotlight = (ctx: Ctx, x: number, top: number, bottom: number, a: number, w = 220) => {
  if (a <= 0) return; ctx.save(); const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, `rgba(255,255,255,${0.2 * a})`); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 40, top); ctx.lineTo(x + 40, top); ctx.lineTo(x + w, bottom); ctx.lineTo(x - w, bottom); ctx.closePath(); ctx.fill(); ctx.restore();
};

// ------------------------------------------------------------------ people
/** Arms: upper-arm and forearm angles (absolute, radians; 0 = facing direction, + = down). */
export type Pose = { f1: number; f2: number; b1: number; b2: number; lean?: number; rot?: number; dir?: number; lift?: number; tone?: number; nod?: number; smile?: number; spark?: number; pack?: number; gloves?: boolean };
export const DOWN: Pose = { f1: 1.72, f2: 1.62, b1: 1.82, b2: 1.7 };
export const TYPE: Pose = { f1: 0.95, f2: 0.12, b1: 1.0, b2: 0.2 };
export const CROSS: Pose = { f1: 1.35, f2: 3.05, b1: 1.35, b2: 0.05 };
export const UP: Pose = { f1: -1.25, f2: -1.45, b1: -1.9, b2: -1.7 };
export const POINT: Pose = { f1: -0.25, f2: -0.35, b1: 1.82, b2: 1.7 };
export const SHOUT: Pose = { f1: 0.15, f2: -0.7, b1: 0.1, b2: -0.9, lean: 0.12 };
export const SAD: Pose = { f1: 1.85, f2: 1.75, b1: 1.95, b2: 1.8, lean: 0.22, nod: 0.35 };
export const HOLD: Pose = { f1: 0.9, f2: -0.5, b1: 1.0, b2: -0.4 }; // holding something in front (a book, a phone)
export const blend = (a: Pose, b: Pose, u: number): Pose => {
  const k = eio(u), m = (x?: number, y?: number) => mix(x ?? 0, y ?? 0, k);
  return { ...a, f1: m(a.f1, b.f1), f2: m(a.f2, b.f2), b1: m(a.b1, b.b1), b2: m(a.b2, b.b2), lean: m(a.lean, b.lean), rot: m(a.rot, b.rot), lift: m(a.lift, b.lift), nod: m(a.nod, b.nod), smile: m(a.smile, b.smile), dir: u < 0.5 ? a.dir ?? b.dir : b.dir ?? a.dir, tone: a.tone ?? b.tone, spark: a.spark ?? b.spark, pack: a.pack ?? b.pack };
};
const arm = (ctx: Ctx, sx: number, sy: number, a1: number, a2: number, col: string, hand: string, fist: number, lw: number) => {
  const ex = sx + Math.cos(a1) * 50, ey = sy + Math.sin(a1) * 50, hx = ex + Math.cos(a2) * 46, hy = ey + Math.sin(a2) * 46;
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.fillStyle = hand; ctx.beginPath(); ctx.arc(hx + Math.cos(a2) * 4, hy + Math.sin(a2) * 4, fist, 0, Math.PI * 2); ctx.fill();
  return [hx, hy] as P;
};
/** A person: a soft clay-white bell body and a round head; faceless, except for one smile. (x, y) is the ground point. */
export const person = (ctx: Ctx, x: number, y: number, k: number, p: Pose, a = 1) => {
  if (a <= 0 || k <= 0) return;
  const tone = p.tone ?? 1, dir = p.dir ?? 1;
  const shade = (v: number) => { const c = Math.round(mix(64, v, tone)); return `rgb(${c},${c},${c + 3})`; };
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y - (p.lift ?? 0)); ctx.scale(k * dir, k); ctx.rotate(p.rot ?? 0);
  ctx.translate(0, -10); ctx.rotate(p.lean ?? 0); ctx.translate(0, 10);
  ctx.shadowColor = `rgba(255,255,255,${0.3 * tone})`; ctx.shadowBlur = 30 * SC * k;
  if ((p.pack ?? 0) > 0) { ctx.fillStyle = shade(170); ctx.beginPath(); ctx.roundRect(-74, -150, 44, 92, 16); ctx.fill(); }
  const gl = p.gloves ?? false;
  arm(ctx, -18, -138, p.b1, p.b2, shade(176), shade(196), gl ? 21 : 13, gl ? 25 : 21);
  const g = ctx.createLinearGradient(-60, -190, 50, 0); g.addColorStop(0, shade(255)); g.addColorStop(1, shade(194));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-58, 0); ctx.bezierCurveTo(-58, -62, -50, -122, -34, -150); ctx.quadraticCurveTo(0, -174, 34, -150); ctx.bezierCurveTo(50, -122, 58, -62, 58, 0); ctx.closePath(); ctx.fill();
  const nod = p.nod ?? 0; ctx.save(); ctx.translate(0, -165); ctx.rotate(nod); ctx.translate(0, 165);
  ctx.beginPath(); ctx.arc(5, -205, 36, 0, Math.PI * 2); ctx.fill();
  if ((p.smile ?? 0) > 0.01) { // the only face in the film
    noGlow(ctx); ctx.strokeStyle = "rgba(40,40,44,0.85)"; ctx.lineWidth = 4.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(22, -204, 15, 0.35, 0.35 + 1.5 * cl(p.smile ?? 0)); ctx.stroke();
  }
  ctx.restore();
  ctx.shadowColor = `rgba(255,255,255,${0.3 * tone})`; ctx.shadowBlur = 30 * SC * k;
  arm(ctx, 24, -138, p.f1, p.f2, shade(234), shade(248), gl ? 21 : 13, gl ? 25 : 21);
  if ((p.spark ?? 0) > 0.01) { // the spark inside: what they want, kept alive
    noGlow(ctx); const s = p.spark ?? 0; const rg = ctx.createRadialGradient(4, -96, 0, 4, -96, 46 * s); rg.addColorStop(0, `rgba(255,236,190,${0.95 * cl(s)})`); rg.addColorStop(0.35, `rgba(255,220,160,${0.5 * cl(s)})`); rg.addColorStop(1, "rgba(255,220,160,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(4, -96, 46 * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ frame plumbing
export const background = (env: Env): Layer => {
  const key = `bg${env.scale}`; let L = env.cache.get(key) as Layer | undefined; if (L) return L;
  L = env.canvas(W * env.scale, H * env.scale); const c = L.ctx; c.scale(env.scale, env.scale);
  c.fillStyle = "#0a0a0b"; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(540, 900, 60, 540, 900, 1150); g.addColorStop(0, "#232327"); g.addColorStop(0.55, "#141416"); g.addColorStop(1, "#060607"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,0.07)"; for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) { c.beginPath(); c.arc(x, y, 1.5, 0, Math.PI * 2); c.fill(); }
  env.cache.set(key, L); return L;
};
export const layerFor = (env: Env, k: number): Layer => {
  const key = `L${k}_${env.scale}`; let L = env.cache.get(key) as Layer | undefined;
  if (!L) { L = env.canvas(W * env.scale, H * env.scale); env.cache.set(key, L); } return L;
};
export const dust = (ctx: Ctx, t: number, a = 1) => {
  const R = rng(3); for (let i = 0; i < 46; i++) { const x0 = R() * W, y0 = R() * H, sp = 8 + R() * 22, r = 1 + R() * 2.2, ph = R() * 6;
    const y = ((y0 - t * sp) % H + H) % H, x = x0 + Math.sin(t * 0.4 + ph) * 18; dot(ctx, x, y, r, (0.18 + 0.15 * Math.sin(t * 1.3 + ph)) * a, 6); }
};
export type Seg = { text: string; start: number; end: number; words: [string, number, number][] };
/** The voice's words, burned in; each lights up as it is spoken. */
export let CAPTIONS = true;
export const setCaptions = (on: boolean) => { CAPTIONS = on; };
export const captions = (ctx: Ctx, t: number, SEGS: Seg[]) => {
  if (!CAPTIONS) return;
  const endOf = (k: number) => (SEGS[k + 1] ? Math.min(SEGS[k + 1].start - 0.12, SEGS[k].end + 1.2) : SEGS[k].end + 1.6);
  const i = SEGS.findIndex((s, k) => t >= s.start - 0.15 && t < endOf(k));
  if (i < 0) return; const sg = SEGS[i];
  const a = ramp(t, sg.start - 0.15, sg.start) * (1 - ramp(t, endOf(i) - 0.15, endOf(i)));
  ctx.save(); ctx.font = `700 47px Inter, sans-serif`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const words = sg.words.map((w, k) => [k === 0 ? w[0].charAt(0).toUpperCase() + w[0].slice(1) : w[0], w[1]] as [string, number]);
  const lines: [string, number][][] = [[]]; let lw = 0; const sp = ctx.measureText(" ").width, maxW = 960;
  for (const w of words) { const ww = ctx.measureText(w[0]).width; if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(w); lw += ww + sp; }
  const LH = 60, y0 = 1650 - (lines.length - 1) * LH;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((s, w) => s + ctx.measureText(w[0]).width, 0) + sp * (ln.length - 1); let x = 540 - tw / 2;
    for (const [txt, ts] of ln) { const on = ramp(t, ts - 0.05, ts + 0.12);
      ctx.globalAlpha = a * mix(0.3, 1, on); ctx.fillStyle = INK; ctx.shadowColor = `rgba(255,255,255,${0.55 * on})`; ctx.shadowBlur = 16 * SC * on;
      ctx.fillText(txt, x, y0 + li * LH - 4 * on * (1 - ramp(t, ts + 0.12, ts + 0.3))); x += ctx.measureText(txt).width + sp; }
  });
  ctx.restore();
};
export type Scene = { a: number; b: number; draw: (ctx: Ctx, t: number) => void };
/** One frame: background, dust, the scene (crossfaded from the last), a slow push, captions, fades. */
export const frame = (ctx: Ctx, env: Env, t: number, scenes: Scene[], SEGS: Seg[], end: number, xf = 0.32, dim = (_t: number) => 1) => {
  setScale(env.scale);
  ctx.drawImage(background(env).canvas, 0, 0);
  ctx.save(); ctx.scale(env.scale, env.scale); dust(ctx, t, dim(t)); ctx.restore();
  const k = scenes.findIndex((s) => t >= s.a && t < s.b), cur = scenes[Math.max(0, k)];
  const parts: [Scene, number][] = [[cur, 1]];
  if (k > 0 && t < cur.a + xf) { const u = eio((t - cur.a) / xf); parts[0][1] = u; parts.unshift([scenes[k - 1], 1 - u]); }
  parts.forEach(([sc, a], j) => {
    const L = layerFor(env, j), c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * env.scale, H * env.scale);
    c.save(); c.scale(env.scale, env.scale);
    const slow = 1 + 0.07 * eio(ramp(t, sc.a - 0.5, sc.b + 0.5)); c.translate(540, 900); c.scale(slow, slow); c.translate(-540, -900);
    sc.draw(c, t); c.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(L.canvas, 0, 0); ctx.restore();
  });
  ctx.save(); ctx.scale(env.scale, env.scale); captions(ctx, t, SEGS);
  const fade = Math.max(1 - ramp(t, 0, 0.25), ramp(t, end - 1.4, end - 0.1));
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
};

/** A soft breathing light around a point: large and faint, so stillness still breathes. */
export const aura = (ctx: Ctx, x: number, y: number, r: number, a: number) => {
  if (a <= 0) return; ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
};
/** The heartbeat: two quick pulses per beat period, as a darkening at the frame's edges. */
export const heartbeat = (ctx: Ctx, t: number, period: number, a: number) => {
  if (a <= 0) return; const u = (t % period) / period, k = Math.exp(-Math.pow((u - 0.05) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((u - 0.25) / 0.05, 2));
  ctx.save(); const g = ctx.createRadialGradient(540, 900, 300, 540, 900, 1150); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${0.55 * a * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
};
