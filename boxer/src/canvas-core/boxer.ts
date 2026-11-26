// THE DAYS NOBODY SEES: a 9x16 motivational explainer about a boxer.
// Look: soft glowing white figures and thin glowing line icons on a near-black stage with a faint
// dot grid and a vignette; small spaced uppercase labels and counters; a dashed ground line.
// Story in three sentences: everyone dreams of the arena; the boxer is made in the empty gym,
// the tired days, the lost fight; the world sees the podium, only you know what is beneath it.
// The token: the 06:00 clock (it returns underground at the end).
// Every picture beat is keyed to the voiceover's word stamps (boxerTiming.ts, film seconds).
import { Ctx, Env, Layer, rng } from "./core";
import { Film } from "./film";
import { SEGS, FILM_END } from "./boxerTiming";

const FPS = 30, BPM = 75, DURATION = Math.round(FILM_END * FPS);
const W = 1080, H = 1920, GROUND = 1180;
type P = [number, number];

// ------------------------------------------------------------------ timing helpers
const S = (i: number) => SEGS[i].start;
const WD = (i: number, j: number) => SEGS[i].words[j][1];
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ramp = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const eo = (u: number) => 1 - Math.pow(1 - cl(u), 3);
const eio = (u: number) => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const back = (u: number) => { u = cl(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const mix = (a: number, b: number, u: number) => a + (b - a) * u;
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// ------------------------------------------------------------------ ink
const INK = "#f3f3f1";
let SC = 1; // device px per logical px, for shadow blur
const glow = (ctx: Ctx, blur = 14, a = 0.7) => { ctx.shadowColor = `rgba(255,255,255,${a})`; ctx.shadowBlur = blur * SC; };
const noGlow = (ctx: Ctx) => { ctx.shadowBlur = 0; ctx.shadowColor = "rgba(0,0,0,0)"; };

const circ = (cx: number, cy: number, r: number, a0 = -Math.PI / 2, n = 56): P[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P; });
const rrect = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const pts: P[] = [], arcp = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  pts.push([x + r, y]); pts.push([x + w - r, y]); arcp(x + w - r, y + r, -Math.PI / 2); pts.push([x + w, y + h - r]); arcp(x + w - r, y + h - r, 0);
  pts.push([x + r, y + h]); arcp(x + r, y + h - r, Math.PI / 2); pts.push([x, y + r]); arcp(x + r, y + r, Math.PI); return pts;
};
const seg = (x1: number, y1: number, x2: number, y2: number): P[] => [[x1, y1], [x2, y2]];
const plen = (pts: P[]) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };

/** Draw a set of polylines on, in order, to fraction p of their total length. Marks are drawn, never faded in. */
const ink = (ctx: Ctx, paths: P[][], p: number, lw = 4, a = 1, blur = 12) => {
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
const dot = (ctx: Ctx, x: number, y: number, r: number, a = 1, blur = 16) => {
  if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = INK; glow(ctx, blur, 0.9); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

/** Small spaced uppercase label, typed on letter by letter. */
const label = (ctx: Ctx, txt: string, x: number, y: number, reveal = 1, o: { size?: number; a?: number; align?: CanvasTextAlign; weight?: number; sp?: number } = {}) => {
  if (reveal <= 0) return;
  const n = Math.ceil(cl(reveal) * txt.length), s = txt.slice(0, n);
  ctx.save(); ctx.globalAlpha *= o.a ?? 0.9; ctx.fillStyle = INK; glow(ctx, 10, 0.55);
  ctx.font = `${o.weight ?? 700} ${o.size ?? 26}px Inter, sans-serif`; (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${o.sp ?? (o.size ?? 26) * 0.16}px`;
  ctx.textAlign = o.align ?? "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y); ctx.restore();
};
const bigNum = (ctx: Ctx, txt: string, x: number, y: number, a = 1, size = 76) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = INK; glow(ctx, 18, 0.7);
  ctx.font = `800 ${size}px "Inter Display", Inter, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y); ctx.restore();
};
const counter = (ctx: Ctx, title: string, value: string, x: number, y: number, a: number, size = 70) => {
  label(ctx, title, x, y, a < 1 ? cl(a * 2) : 1, { size: 22, a: 0.8 * cl(a * 3) }); bigNum(ctx, value, x, y + size * 0.78, cl(a * 3), size);
};

// ------------------------------------------------------------------ the boxer
type Pose = { f1: number; f2: number; b1: number; b2: number; lean?: number; rot?: number; dir?: number; lift?: number; tone?: number; belt?: number };
const GUARD: Pose = { f1: 0.5, f2: -2.0, b1: 0.6, b2: -1.75 };
const PUNCH: Pose = { f1: -0.12, f2: -0.08, b1: 0.6, b2: -1.75, lean: 0.12 };
const CROSS: Pose = { f1: 0.5, f2: -2.0, b1: -0.05, b2: -0.05, lean: 0.16 };
const UP: Pose = { f1: -1.25, f2: -1.45, b1: -1.9, b2: -1.7 };
const TIRED: Pose = { f1: 1.35, f2: 1.5, b1: 1.45, b2: 1.6, lean: 0.32 };
const blend = (a: Pose, b: Pose, u: number): Pose => {
  const k = eio(u), m = (x?: number, y?: number) => mix(x ?? 0, y ?? 0, k);
  return { f1: m(a.f1, b.f1), f2: m(a.f2, b.f2), b1: m(a.b1, b.b1), b2: m(a.b2, b.b2), lean: m(a.lean, b.lean), rot: m(a.rot, b.rot), dir: a.dir ?? b.dir, lift: m(a.lift, b.lift), tone: a.tone ?? b.tone, belt: m(a.belt, b.belt) };
};
const arm = (ctx: Ctx, sx: number, sy: number, a1: number, a2: number, col: string, glove: string) => {
  const ex = sx + Math.cos(a1) * 54, ey = sy + Math.sin(a1) * 54, hx = ex + Math.cos(a2) * 50, hy = ey + Math.sin(a2) * 50;
  ctx.strokeStyle = col; ctx.lineWidth = 25; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.fillStyle = glove; ctx.beginPath(); ctx.arc(hx + Math.cos(a2) * 6, hy + Math.sin(a2) * 6, 21, 0, Math.PI * 2); ctx.fill();
  return [hx + Math.cos(a2) * 6, hy + Math.sin(a2) * 6] as P;
};
/** The boxer: a soft clay-white bell body, round head, gloves. (x, y) is the ground point under the body. */
const boxer = (ctx: Ctx, x: number, y: number, k: number, p: Pose, a = 1) => {
  if (a <= 0) return;
  const tone = p.tone ?? 1, dir = p.dir ?? 1;
  const shade = (v: number) => { const c = Math.round(mix(70, v, tone)); return `rgb(${c},${c},${c + 3})`; };
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y - (p.lift ?? 0)); ctx.scale(k * dir, k); ctx.rotate(p.rot ?? 0);
  ctx.translate(0, -10); ctx.rotate(p.lean ?? 0); ctx.translate(0, 10);
  ctx.shadowColor = `rgba(255,255,255,${0.32 * tone})`; ctx.shadowBlur = 34 * SC * k;
  arm(ctx, -18, -140, p.b1, p.b2, shade(178), shade(205)); // back arm behind the body
  const g = ctx.createLinearGradient(-60, -190, 50, 0); g.addColorStop(0, shade(255)); g.addColorStop(1, shade(196));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.bezierCurveTo(-60, -62, -52, -122, -35, -150); ctx.quadraticCurveTo(0, -176, 35, -150); ctx.bezierCurveTo(52, -122, 60, -62, 60, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -207, 37, 0, Math.PI * 2); ctx.fill();
  const hand = arm(ctx, 26, -140, p.f1, p.f2, shade(236), shade(250));
  if ((p.belt ?? 0) > 0.01) { // the belt, held over the head between both gloves
    ctx.save(); ctx.globalAlpha *= cl(p.belt ?? 0); noGlow(ctx); glow(ctx, 26, 0.9);
    const bx = hand[0] - 48, by = hand[1] - 34; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(bx - 78, by - 16, 156, 32, 12); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(bx, by, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ props
const heavyBag = (ctx: Ctx, x: number, top: number, swing: number, p = 1) => {
  ctx.save(); ctx.translate(x, top); ctx.rotate(swing);
  ink(ctx, [seg(0, 0, 0, 120), rrect(-55, 120, 110, 260, 40), seg(-55, 180, 55, 180), seg(-55, 320, 55, 320)], p, 4);
  ctx.restore();
};
const wallClock = (ctx: Ctx, x: number, y: number, r: number, hours: number, p = 1) => {
  const ha = (hours % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (hours % 1) * Math.PI * 2 - Math.PI / 2;
  ink(ctx, [circ(x, y, r), seg(x, y, x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5), seg(x, y, x + Math.cos(ma) * r * 0.75, y + Math.sin(ma) * r * 0.75)], p, 4);
};
const windowNight = (ctx: Ctx, x: number, y: number, w: number, h: number, p: number, day = 0) => {
  ink(ctx, [rrect(x, y, w, h, 4), seg(x + w / 2, y, x + w / 2, y + h), seg(x, y + h / 2, x + w, y + h / 2)], p, 4);
  if (p < 0.6) return; const a = ramp(p, 0.6, 1);
  if (day < 0.5) { // a crescent moon and three stars
    ctx.save(); ctx.globalAlpha *= a * (1 - day * 2); ctx.fillStyle = INK; glow(ctx, 18, 0.9); ctx.beginPath(); ctx.arc(x + w * 0.28, y + h * 0.25, 20, 0, Math.PI * 2); ctx.fill();
    noGlow(ctx); ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(x + w * 0.28 + 10, y + h * 0.25 - 7, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    [[0.7, 0.18], [0.82, 0.36], [0.62, 0.4]].forEach(([u, v]) => dot(ctx, x + w * u, y + h * v, 2.5, a * (1 - day * 2), 8));
  } else { // the sun, rays turning
    const sa = (day - 0.5) * 2; ctx.save(); ctx.globalAlpha *= a * sa;
    dot(ctx, x + w * 0.72, y + h * 0.27, 18, 1, 24); ctx.restore();
  }
};
const battery = (ctx: Ctx, x: number, y: number, level: number, p: number, blink = 1) => {
  ink(ctx, [rrect(x - 55, y - 24, 104, 48, 8), seg(x + 53, y - 9, x + 53, y + 9)], p, 4);
  const bars = Math.ceil(level * 4 - 0.001);
  for (let i = 0; i < bars; i++) { ctx.save(); ctx.globalAlpha *= ramp(p, 0.7, 1); ctx.fillStyle = INK; glow(ctx, 10, 0.7); ctx.fillRect(x - 47 + i * 24, y - 16, 18, 32); ctx.restore(); }
  if (bars === 0 && p > 0.9) ink(ctx, [seg(x - 18, y - 12, x + 12, y + 12), seg(x + 12, y - 12, x - 18, y + 12)], 1, 4, blink);
};
const bubble = (ctx: Ctx, x: number, y: number, w: number, h: number, fx: number, fy: number, p: number) => {
  ink(ctx, [rrect(x - w / 2, y - h / 2, w, h, h / 2), circ(mix(x, fx, 0.45), mix(y + h / 2, fy, 0.45) + 6, 10), circ(mix(x, fx, 0.78), mix(y + h / 2, fy, 0.78), 6)], p, 4);
};
const house = (cx: number, cy: number, s: number): P[][] => [[[cx - s, cy], [cx, cy - s * 0.9], [cx + s, cy]], [[cx - s * 0.75, cy - 4], [cx - s * 0.75, cy + s * 0.75], [cx + s * 0.75, cy + s * 0.75], [cx + s * 0.75, cy - 4]], [[cx - s * 0.2, cy + s * 0.75], [cx - s * 0.2, cy + s * 0.25], [cx + s * 0.2, cy + s * 0.25], [cx + s * 0.2, cy + s * 0.75]]];
const octagon = (cx: number, cy: number, r: number): P[] => Array.from({ length: 9 }, (_, i) => { const a = Math.PI / 8 + (i / 8) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P; });
const glove = (cx: number, cy: number, s: number): P[][] => [rrect(cx - s * 0.55, cy - s * 0.7, s * 1.1, s * 1.05, s * 0.45), rrect(cx - s * 0.42, cy + s * 0.35, s * 0.84, s * 0.38, 6), [[cx - s * 0.55, cy - s * 0.05], [cx - s * 0.2, cy - s * 0.05]]];
const trophy = (cx: number, cy: number, s: number): P[][] => [[[cx - s * 0.5, cy - s * 0.6], [cx - s * 0.42, cy - s * 0.05], [cx, cy + s * 0.15], [cx + s * 0.42, cy - s * 0.05], [cx + s * 0.5, cy - s * 0.6], [cx - s * 0.5, cy - s * 0.6]], seg(cx, cy + s * 0.15, cx, cy + s * 0.45), seg(cx - s * 0.3, cy + s * 0.5, cx + s * 0.3, cy + s * 0.5), [[cx - s * 0.5, cy - s * 0.5], [cx - s * 0.75, cy - s * 0.45], [cx - s * 0.62, cy - s * 0.15], [cx - s * 0.42, cy - s * 0.1]], [[cx + s * 0.5, cy - s * 0.5], [cx + s * 0.75, cy - s * 0.45], [cx + s * 0.62, cy - s * 0.15], [cx + s * 0.42, cy - s * 0.1]]];
const check = (cx: number, cy: number, s: number): P[] => [[cx - s * 0.45, cy], [cx - s * 0.1, cy + s * 0.35], [cx + s * 0.5, cy - s * 0.4]];

/** The dashed ground line, drawn on from the left. */
const ground = (ctx: Ctx, y: number, p: number, a = 0.8, x0 = 60, x1 = 1020) => {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.setLineDash([16, 12]); glow(ctx, 8, 0.6);
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(mix(x0, x1, eo(p)), y); ctx.stroke(); ctx.restore();
};
/** An impact: a ring and short rays, ringing out over 0.35 s. */
const impact = (ctx: Ctx, x: number, y: number, t: number, t0: number, s = 1) => {
  const u = (t - t0) / 0.35; if (u < 0 || u > 1) return;
  const r = (18 + 70 * eo(u)) * s; ink(ctx, [circ(x, y, r, 0, 40)], 1, 4 * (1 - u) + 1, 1 - u);
  const rays: P[][] = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.3; return seg(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2, x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6); });
  ink(ctx, rays, 1, 4, 1 - u);
};
const shake = (t: number, t0: number, amp: number): P => { const u = t - t0; if (u < 0 || u > 0.5) return [0, 0]; const d = amp * Math.pow(1 - u / 0.5, 2); return [Math.sin(u * 63) * d, Math.cos(u * 51) * d * 0.7]; };
/** A punch cycle: 0 at guard, 1 fully extended; period seconds, alternate arms. */
const punchPose = (t: number, t0: number, period: number): { pose: Pose; hit: number } => {
  const u = (t - t0) / period, n = Math.floor(u), f = u - n;
  const ext = f < 0.35 ? eo(f / 0.35) : 1 - eio((f - 0.35) / 0.65);
  return { pose: blend(GUARD, n % 2 === 0 ? PUNCH : CROSS, ext), hit: t0 + (n + 0.35) * period };
};

// ------------------------------------------------------------------ the scenes (t = film seconds)
type Scene = { a: number; b: number; draw: (ctx: Ctx, t: number) => void };

// A: the dream ------------------------------------------------------------
const sceneDream = (ctx: Ctx, t: number) => {
  const zoomIn = eio(ramp(t, S(1) - 0.2, S(1) + 0.55));
  // the dreamer, before the zoom
  if (zoomIn < 1) {
    ctx.save(); const z = mix(1, 3.4, zoomIn); ctx.translate(540, 640); ctx.scale(z, z); ctx.translate(-540, -640);
    ctx.globalAlpha *= 1 - ramp(zoomIn, 0.6, 1);
    ground(ctx, GROUND, ramp(t, 0.05, 2.2));
    { const la = 0.3 * eo(ramp(t, 0.3, 3.2)) * (1 + 0.15 * Math.sin(t * 3)); const rg = ctx.createRadialGradient(540, GROUND - 160, 10, 540, GROUND - 160, 200 + 260 * ramp(t, 0.3, 3.2)); rg.addColorStop(0, `rgba(255,255,255,${la})`); rg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 300, W, 1200); }
    const pop = back(ramp(t, 0.25, 0.75)), bob = Math.sin(t * 5) * 3;
    boxer(ctx, 540, GROUND, 1.05 * pop, { ...GUARD, lift: bob }, cl(pop * 3));
    label(ctx, "THE DREAM", 540, 430, ramp(t, 0.9, WD(0, 4) + 0.2), { size: 34, weight: 800 });
    bubble(ctx, 540, 640, 470, 250, 560, 930, ramp(t, 0.85, WD(0, 7) + 0.3));
    const pin = ramp(t, WD(0, 7), WD(0, 7) + 0.6); // the arena, small, inside the bubble
    ink(ctx, [seg(390, 700, 690, 700), seg(410, 700, 410, 600), seg(670, 700, 670, 600), seg(410, 620, 670, 620), seg(410, 650, 670, 650), seg(410, 680, 670, 680)], pin, 3);
    dot(ctx, 540, 660, 9 * eo(ramp(t, WD(0, 7) + 0.3, WD(0, 7) + 0.6)), 1);
    ctx.restore();
  }
  if (zoomIn <= 0) return;
  // the arena, inside the dream
  ctx.save(); ctx.globalAlpha *= ramp(zoomIn, 0.35, 0.9);
  const z = mix(0.55, 1, eo(zoomIn)); ctx.translate(540, 1000); ctx.scale(z, z); ctx.translate(-540, -1000);
  const RING = 1150, vic = WD(1, 3), app = WD(1, 5), belt = WD(1, 7), name = WD(1, 11);
  // spotlight
  const sp = eo(ramp(t, vic - 0.1, vic + 0.6));
  if (sp > 0) { ctx.save(); const g = ctx.createLinearGradient(0, 380, 0, RING); g.addColorStop(0, `rgba(255,255,255,${(0.2 + 0.06 * Math.sin(t * 9)) * sp})`); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(500, 330); ctx.lineTo(580, 330); ctx.lineTo(780, RING); ctx.lineTo(300, RING); ctx.closePath(); ctx.fill(); ctx.restore(); }
  const rp = ramp(t, S(1) + 0.1, S(1) + 0.9);
  ink(ctx, [seg(120, RING, 960, RING), seg(170, RING, 170, 870), seg(910, RING, 910, 870)], rp, 5);
  ink(ctx, [seg(170, 900, 910, 900), seg(170, 970, 910, 970), seg(170, 1040, 910, 1040)], ramp(t, S(1) + 0.4, S(1) + 1.2), 3, 0.7);
  const up = ramp(t, vic, vic + 0.5), bp = ramp(t, belt, belt + 0.5);
  boxer(ctx, 540, RING, 1.0, { ...blend(GUARD, UP, up), belt: bp, lift: Math.abs(Math.sin(t * 4)) * 6 * up });
  if (bp > 0) { // glints off the belt
    for (let i = 0; i < 6; i++) { const a = t * 1.2 + (i / 6) * Math.PI * 2, r0 = 110, r1 = 150 + Math.sin(t * 6 + i) * 12; ink(ctx, [seg(548 + Math.cos(a) * r0, 760 + Math.sin(a) * r0, 548 + Math.cos(a) * r1, 760 + Math.sin(a) * r1)], 1, 3, 0.6 * bp); }
  }
  // the name in lights
  const np = ramp(t, name, name + 0.8);
  if (np > 0) {
    ink(ctx, [rrect(250, 420, 580, 130, 20)], np, 4);
    const R = rng(7); for (let i = 0; i < 26; i++) { const u = i / 26, per = 2 * (580 + 130), d = u * per; let x: number, y: number;
      if (d < 580) { x = 250 + d; y = 420; } else if (d < 710) { x = 830; y = 420 + d - 580; } else if (d < 1290) { x = 830 - (d - 710); y = 550; } else { x = 250; y = 550 - (d - 1290); }
      const on = (Math.floor(t * 6) + i) % 2 === 0 ? 1 : 0.35; R(); dot(ctx, x, y, 5, on * ramp(np, u * 0.5, u * 0.5 + 0.3), 10); }
    label(ctx, "YOUR NAME", 540, 486, ramp(t, name + 0.3, name + 0.9), { size: 54, weight: 800, sp: 10 });
  }
  // the crowd, foreground
  const cp = eo(ramp(t, app - 0.2, app + 0.5));
  if (cp > 0) { const R = rng(21); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1420); ctx.clip(); const cg = ctx.createLinearGradient(0, 1190, 0, 1420); cg.addColorStop(0, "#77777c"); cg.addColorStop(1, "rgba(60,60,64,0)");
    for (let i = 0; i < 11; i++) { const x = 40 + i * 100 + R() * 30, ph = R() * 6, jump = Math.abs(Math.sin(t * 7 + ph)) * 16 * cp, y = 1370 - jump + (1 - cp) * 300;
      ctx.save(); ctx.fillStyle = cg; ctx.globalAlpha *= 0.95; ctx.beginPath(); ctx.arc(x, y - 120, 34, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x - 55, y - 80, 110, 200, 46); ctx.fill();
      ctx.strokeStyle = cg; ctx.lineWidth = 20; ctx.lineCap = "round"; const wave = Math.sin(t * 9 + ph) * 0.3;
      ctx.beginPath(); ctx.moveTo(x + 38, y - 60); ctx.lineTo(x + 62 + wave * 20, y - 170); ctx.stroke(); if (i % 2) { ctx.beginPath(); ctx.moveTo(x - 38, y - 60); ctx.lineTo(x - 64 - wave * 20, y - 165); ctx.stroke(); } ctx.restore(); }
    // camera flashes in the crowd
    const fb = Math.floor(t * 5); const R2 = rng(1000 + fb); for (let i = 0; i < 3; i++) { const fx = 80 + R2() * 920, fy = 1250 + R2() * 120; if (t > name) dot(ctx, fx, fy, 10 + R2() * 8, (1 - (t * 5 - fb)) * 0.9, 30); }
    ctx.restore();
    counter(ctx, "FANS", fmt(Math.pow(ramp(t, app, S(2) - 0.3), 2) * 1000000), 540, 330, cp);
  }
  ctx.restore();
};

// B: before that ----------------------------------------------------------
const sceneBefore = (ctx: Ctx, t: number) => {
  const t0 = S(2), Y = 1000;
  label(ctx, "WHAT HAPPENS BEFORE", 540, 560, ramp(t, t0, t0 + 0.9));
  ink(ctx, [seg(170, Y, 910, Y)], ramp(t, t0 - 0.2, t0 + 0.5), 3, 0.7);
  ink(ctx, [seg(880, Y, 880, Y - 110), [[880, Y - 110], [940, Y - 92], [880, Y - 74]]], ramp(t, t0 + 0.1, t0 + 0.6), 4);
  label(ctx, "CHAMPION", 880, Y + 42, ramp(t, t0 + 0.4, t0 + 0.9), { size: 20 });
  ink(ctx, [seg(200, Y, 200, Y - 110), [[200, Y - 110], [260, Y - 92], [200, Y - 74]]], ramp(t, WD(2, 6), WD(2, 6) + 0.5), 4);
  label(ctx, "DAY 1", 200, Y + 42, ramp(t, WD(2, 6) + 0.2, WD(2, 6) + 0.7), { size: 20 });
  // the dot rewinds along the line, ticks passing
  const u = eio(ramp(t, WD(2, 5), S(3) - 0.3)), x = mix(880, 200, u);
  for (let i = 0; i < 24; i++) { const tx = 220 + i * 28; if (tx > x) ink(ctx, [seg(tx, Y - 10, tx, Y + 10)], 1, 2, 0.45); }
  dot(ctx, x, Y, 13, ramp(t, t0, t0 + 0.4), 22);
  counter(ctx, "YEARS BEFORE", fmt(u * 5), 540, 760, ramp(t, WD(2, 5), WD(2, 5) + 0.3));
  boxer(ctx, 200, Y, 0.45 * back(ramp(t, S(3) - 0.6, S(3) - 0.2)), GUARD, ramp(t, S(3) - 0.6, S(3) - 0.4));
};

// C: the gym --------------------------------------------------------------
const BAGX = 780;
const sceneGym = (ctx: Ctx, t: number) => {
  const t3 = S(3), t4 = S(4), t5 = S(5), t6 = S(6);
  const hardHit = WD(6, 4) + 0.05; // "difference"
  const [sx, sy] = shake(t, hardHit, 14); ctx.save(); ctx.translate(sx, sy);
  ground(ctx, GROUND, ramp(t, t3 - 0.4, t3 + 0.3));
  // time passing: the clock and the sky run while the hours go by
  const hours = 6 + Math.pow(ramp(t, t4, t6 + 2), 1.3) * 60, day = t < t4 ? 0 : (Math.sin((hours - 6) / 24 * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  windowNight(ctx, 120, 540, 230, 250, ramp(t, WD(3, 1), WD(3, 1) + 0.7), day);
  wallClock(ctx, 500, 620, 52, hours, ramp(t, WD(3, 4), WD(3, 4) + 0.6));
  label(ctx, `${String(Math.floor(hours) % 24).padStart(2, "0")}:${String(Math.floor((hours % 1) * 60)).padStart(2, "0")}`, 500, 715, ramp(t, WD(3, 4) + 0.2, WD(3, 4) + 0.7), { size: 30, weight: 800 });
  // the figure: walks in, trains, tires, turns to the door, comes back
  const walk = eo(ramp(t, t3 + 0.1, t4 - 0.1)); let x = mix(-100, 610, walk), pose: Pose = { ...GUARD, lift: Math.abs(Math.sin(t * 9)) * 8 * (walk < 1 ? 1 : 0) };
  let bagSwing = 0;
  const p0 = t4 + 0.2, period = 0.5;
  if (t >= p0 && t < t5 + 0.4) { const pp = punchPose(t, p0, period); pose = pp.pose; const lastHit = p0 + (Math.floor((t - p0) / period - 0.35) + 0.35) * period; const dt = t - lastHit; if (dt >= 0) bagSwing = 0.09 * Math.exp(-dt * 4) * Math.sin(dt * 9); impact(ctx, BAGX - 55, GROUND - 160, t, lastHit, 0.6); }
  const tired = ramp(t, WD(5, 5) - 0.2, WD(5, 5) + 0.6), home = WD(5, 14), turn = ramp(t, home + 0.4, home + 1.0), back = ramp(t, t6 - 0.1, t6 + 0.5);
  if (t >= t5 + 0.4) { pose = blend(GUARD, TIRED, tired); pose.lift = 0; }
  if (turn > 0 && back <= 0) { pose = { ...TIRED, dir: turn > 0.5 ? -1 : 1 }; x = mix(610, 470, eio(turn)); }
  if (back > 0) { x = mix(470, 610, eio(back)); pose = blend({ ...TIRED, dir: back < 0.3 ? -1 : 1 }, GUARD, back); }
  if (t > hardHit - 0.15) { const u = ramp(t, hardHit - 0.15, hardHit), d = ramp(t, hardHit + 0.15, hardHit + 0.6); pose = blend(blend(GUARD, CROSS, u), GUARD, d); if (t > hardHit) bagSwing = 0.22 * Math.exp(-(t - hardHit) * 1.6) * Math.sin((t - hardHit) * 5.5); }
  heavyBag(ctx, BAGX, 470, bagSwing, ramp(t, WD(3, 2) - 0.1, WD(3, 2) + 0.6));
  impact(ctx, BAGX - 50, GROUND - 165, t, hardHit, 1.6);
  boxer(ctx, x, GROUND, 1, pose);
  // sweat when tired
  if (tired > 0 && back < 1) { for (let i = 0; i < 3; i++) { const ph = ((t * 1.4 + i / 3) % 1); dot(ctx, x + 30 + i * 18 - 20, GROUND - 260 + ph * 90, 4, tired * (1 - ph) * (1 - back), 8); } }
  // counters
  counter(ctx, "HOURS TRAINED", fmt(Math.pow(ramp(t, t4, t6 + 2), 1.3) * 2190), 230, 380, ramp(t, t4, t4 + 0.4), 58);
  const nw = WD(4, 6) + 0.1; counter(ctx, "WATCHING", "0", 870, 380, ramp(t, nw, nw + 0.4), 58);
  // the tired days: battery, the mind's STOP, home, the door
  const bat = ramp(t, WD(5, 5) - 0.3, WD(5, 5) + 0.3), lvl = 1 - ramp(t, WD(5, 5), WD(5, 7) + 1.2);
  battery(ctx, 540, 440, lvl, bat * (1 - ramp(t, t6 + 1.2, t6 + 1.6)), Math.floor(t * 4) % 2 ? 1 : 0.4);
  label(ctx, "ENERGY", 540, 384, bat * (1 - ramp(t, t6 + 1.2, t6 + 1.6)), { size: 20 });
  const stop = WD(5, 11), bub = ramp(t, WD(5, 7), WD(5, 7) + 0.4) * (1 - ramp(t, t6 - 0.2, t6 + 0.2));
  if (bub > 0) {
    bubble(ctx, x - 160 * (pose.dir ?? 1) + 0, 900 - 20, 200, 120, x, GROUND - 260, bub);
    const bx = x - 160 * (pose.dir ?? 1), sw = ramp(t, home - 0.1, home + 0.2);
    ctx.save(); ctx.globalAlpha *= 1 - sw; ink(ctx, [octagon(bx, 880, 40)], ramp(t, stop - 0.2, stop + 0.2), 4); label(ctx, "STOP", bx, 880, ramp(t, stop, stop + 0.2), { size: 20, weight: 800, sp: 2 }); ctx.restore();
    ink(ctx, house(bx, 880, 34), sw, 4);
  }
  const door = ramp(t, WD(5, 17), home + 0.3), shut = ramp(t, t6, t6 + 0.7);
  if (door > 0 && shut < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - shut;
    const g = ctx.createLinearGradient(110, 0, 330, 0); g.addColorStop(0, `rgba(255,255,255,${0.22 * door})`); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(230, 950); ctx.lineTo(380, 1000); ctx.lineTo(380, GROUND); ctx.lineTo(230, GROUND); ctx.fill();
    ink(ctx, [[[100, GROUND], [100, 950], [230, 950], [230, GROUND]]], door, 4); label(ctx, "EXIT", 165, 915, door, { size: 20 }); ctx.restore();
  }
  label(ctx, "THE DIFFERENCE", 540, 1290, ramp(t, WD(6, 4), WD(6, 4) + 0.6), { size: 34, weight: 800 });
  ink(ctx, [seg(380, 1322, 700, 1322)], ramp(t, WD(6, 6), WD(6, 6) + 0.4), 3);
  ctx.restore();
};

// D: punches vs discipline ------------------------------------------------
const sceneDiscipline = (ctx: Ctx, t: number) => {
  const t7 = S(7), t8 = S(8), dis = WD(8, 2);
  ground(ctx, GROUND, 1);
  const pp = punchPose(t, t7, 0.42); boxer(ctx, 230, GROUND, 0.85, pp.pose);
  const h1 = 200 * eo(ramp(t, WD(7, 5), WD(7, 6) + 0.3)) * mix(1, 0.75, eo(ramp(t, dis, dis + 0.6)));
  const h2 = 620 * eo(ramp(t, dis - 0.1, dis + 0.9));
  const bar = (x: number, h: number, fill: number) => { if (h <= 1) return; ink(ctx, [rrect(x - 60, GROUND - h, 120, h, 10)], 1, 4); ctx.save(); ctx.fillStyle = `rgba(243,243,241,${fill})`; glow(ctx, 20, 0.6); ctx.beginPath(); ctx.roundRect(x - 52, GROUND - h + 8, 104, h - 16, 6); ctx.fill(); ctx.restore(); };
  bar(560, h1, 0.18); bar(820, h2, 0.85);
  ink(ctx, glove(560, GROUND - h1 - 80, 46), ramp(t, WD(7, 5), WD(7, 6) + 0.2), 4);
  label(ctx, "PUNCHES", 560, GROUND + 44, ramp(t, WD(7, 6), WD(7, 6) + 0.4), { size: 20 });
  label(ctx, "DISCIPLINE", 820, GROUND + 44, ramp(t, dis, dis + 0.5), { size: 20 });
  bigNum(ctx, "10%", 560, GROUND - h1 - 170, ramp(t, WD(7, 6), WD(7, 6) + 0.3), 44);
  bigNum(ctx, `${Math.round(90 * eo(ramp(t, dis, dis + 0.9)))}%`, 820, GROUND - h2 - 50, ramp(t, dis, dis + 0.3), 44);
  label(ctx, "WHAT BOXING IS MADE OF", 540, 440, ramp(t, t7, t7 + 1));
  if (t > t8 - 0.2) { const u = ramp(t, dis + 0.6, dis + 1.2); ink(ctx, [circ(820, GROUND - h2 / 2, 90 + 16 * Math.sin(t * 4), 0, 48)], u, 2, 0.5 * u); }
};

// E: showing up -----------------------------------------------------------
const sceneShowUp = (ctx: Ctx, t: number) => {
  const t9 = S(9);
  // rain
  const R = rng(99); ctx.save(); ctx.strokeStyle = "rgba(243,243,241,0.22)"; ctx.lineWidth = 2;
  for (let i = 0; i < 70; i++) { const x0 = R() * 1300, y0 = R() * 1920, sp = 1300 + R() * 600; const y = (y0 + t * sp) % 2100 - 100, x = ((x0 - t * 220) % 1300 + 1300) % 1300 - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 46); ctx.stroke(); }
  ctx.restore();
  ground(ctx, GROUND, 1);
  // alarm at 05:30, ringing
  const ring = Math.sin(t * 60) * 0.12 * (1 - ramp(t, WD(9, 3), WD(9, 4))), ax = 250, ay = 600;
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(ring); ink(ctx, [circ(0, 0, 50), seg(-30, -46, -46, -62), seg(30, -46, 46, -62), seg(-34, 40, -44, 56), seg(34, 40, 44, 56), seg(0, 0, 0, -30), seg(0, 0, 18, 10)], ramp(t, t9 - 0.3, t9 + 0.3), 4); ctx.restore();
  label(ctx, "05:30", ax, ay + 90, ramp(t, t9, t9 + 0.3), { size: 30, weight: 800 });
  if (ring !== 0) for (let i = 0; i < 3; i++) ink(ctx, [[[ax + 70 + i * 14, ay - 30], [ax + 82 + i * 14, ay], [ax + 70 + i * 14, ay + 30]]], 1, 3, 0.6);
  // the streak: seven days, checked one by one
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  days.forEach((d, i) => { const x = 600 + (i % 4) * 100 - (i >= 4 ? -50 : 0), y = i < 4 ? 560 : 670; const cx = i < 4 ? 600 + i * 100 - 50 : 650 + (i - 4) * 100 - 50;
    ink(ctx, [rrect(cx - 36, y - 36, 72, 72, 10)], ramp(t, t9 - 0.2 + i * 0.06, t9 + 0.3 + i * 0.06), 3, 0.8); void x;
    const ct = mix(WD(9, 2), WD(9, 9), i / 6); ink(ctx, [check(cx, y, 40)], ramp(t, ct, ct + 0.25), 5); label(ctx, d, cx, y + 54, ramp(t, t9, t9 + 0.4), { size: 16 }); });
  label(ctx, "SHOWED UP ANYWAY", 750, 470, ramp(t, WD(9, 3), WD(9, 3) + 0.7), { size: 22 });
  // the figure, hood up, walks to the gym door through the rain
  const walk = ramp(t, t9 - 0.4, S(10) - 0.1), x = mix(120, 700, walk);
  ink(ctx, [[[800, GROUND], [800, 930], [960, 930], [960, GROUND]]], ramp(t, t9 - 0.2, t9 + 0.4), 4); label(ctx, "GYM", 880, 895, ramp(t, t9, t9 + 0.4), { size: 22 });
  const hunch = 1 - ramp(t, WD(9, 6), WD(9, 9) + 0.2);
  boxer(ctx, x, GROUND, 0.95, { ...blend(GUARD, TIRED, hunch * 0.5), lift: Math.abs(Math.sin(t * 8)) * 8 });
};

// F: losing, learning, coming back ----------------------------------------
const sceneLoss = (ctx: Ctx, t: number) => {
  const hit = WD(10, 4) + 0.05, learn = WD(10, 5), comeback = WD(10, 9), stronger = WD(10, 11);
  const [sx, sy] = shake(t, hit, 18); ctx.save(); ctx.translate(sx, sy);
  ground(ctx, GROUND, 1);
  // the opponent, darker, from the right
  const oin = eo(ramp(t, S(10) - 0.4, S(10) + 0.2)), oout = ramp(t, comeback, comeback + 0.6);
  const op = t < hit - 0.2 ? GUARD : blend(blend(GUARD, PUNCH, ramp(t, hit - 0.2, hit)), GUARD, ramp(t, hit + 0.2, hit + 0.6));
  boxer(ctx, mix(1200, 760, oin) + oout * 400, GROUND, 1, { ...op, dir: -1, tone: 0.42 }, 1 - oout);
  // our boxer: knocked down, learns, gets up
  const fall = eo(ramp(t, hit, hit + 0.35)), rise = eio(ramp(t, comeback - 0.1, comeback + 0.8));
  const down = fall * (1 - rise);
  boxer(ctx, mix(470, 380, down) + Math.sin(t * 3) * 22 * ramp(t, comeback + 0.8, comeback + 1.1), GROUND, 1, { ...blend(GUARD, TIRED, down * 0.6), rot: -1.45 * down, lift: -30 * down + Math.abs(Math.sin(t * 6)) * 18 * ramp(t, comeback + 0.8, comeback + 1.1) });
  impact(ctx, 560, GROUND - 200, t, hit, 1.4);
  label(ctx, "LOST", 380, 470, ramp(t, hit, hit + 0.3), { size: 34, weight: 800 });
  // learning: a light bulb over the fallen boxer
  const lb = ramp(t, learn, learn + 0.5) * (1 - ramp(t, stronger, stronger + 0.4));
  if (lb > 0) { const bx = 250, by = 980; ink(ctx, [circ(bx, by, 34, Math.PI * 0.75, 48).slice(0, 38), seg(bx - 16, by + 30, bx - 16, by + 52), seg(bx + 16, by + 30, bx + 16, by + 52), seg(bx - 16, by + 52, bx + 16, by + 52)], lb, 4); dot(ctx, bx, by, 10 * ramp(t, learn + 0.4, learn + 0.7), 1, 30); label(ctx, "LESSON", bx, by - 70, ramp(t, learn + 0.2, learn + 0.6), { size: 20 }); }
  // the strength graph: dips at the loss, climbs past where it was
  const gx = 520, gy = 430, gw = 460, gh = 260;
  ink(ctx, [rrect(gx, gy, gw, gh, 14)], ramp(t, S(10) - 0.3, S(10) + 0.3), 3, 0.85);
  label(ctx, "STRENGTH", gx + gw / 2, gy - 26, ramp(t, S(10), S(10) + 0.4), { size: 20 });
  const curve = (u: number) => { const base = 0.45 + u * 0.05, dip = -0.3 * Math.exp(-Math.pow((u - 0.35) / 0.09, 2)), climb = u > 0.35 ? 0.45 * eio((u - 0.35) / 0.65) : 0; return cl(base + dip + climb, 0.05, 0.95); };
  const gu = ramp(t, S(10) - 0.1, S(11) - 0.3), pts: P[] = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([gx + 24 + u * (gw - 48), gy + gh - 20 - curve(u) * (gh - 40)]); }
  ink(ctx, [pts], gu, 4); const last = pts[Math.min(60, Math.floor(gu * 60))]; if (gu > 0) dot(ctx, last[0], last[1], 8, 1);
  ink(ctx, [seg(gx + 24, gy + gh - 20 - 0.5 * (gh - 40), gx + gw - 24, gy + gh - 20 - 0.5 * (gh - 40))], ramp(t, S(10), S(10) + 0.4), 2, 0.3);
  label(ctx, "STRONGER", gx + gw - 70, gy + 40, ramp(t, stronger, stronger + 0.4), { size: 18 });
  ctx.restore();
};

// G: the days -------------------------------------------------------------
const COLS = 24, ROWS = 15, CELL = 34, GX = (W - COLS * CELL) / 2 + 4, GY = 640;
const sceneDays = (ctx: Ctx, t: number, collapse = 0) => {
  const t11 = S(11), t12 = S(12), win = WD(11, 9), n = COLS * ROWS;
  const grid = ramp(t, t11 - 0.3, win), fill = ramp(t, WD(12, 3), WD(12, 12) + 0.1);
  label(ctx, collapse > 0 ? "" : t < t12 ? "ONE DAY" : "ALL THE OTHER DAYS", 540, 470, t < t12 ? ramp(t, WD(11, 6), WD(11, 7) + 0.3) : ramp(t, t12, t12 + 0.6), { size: 30, weight: 800 });
  for (let i = 0; i < n; i++) {
    const c = i % COLS, r = Math.floor(i / COLS), x = GX + c * CELL, y = GY + r * CELL, last = i === n - 1;
    const appear = ramp(grid, (r / ROWS) * 0.7, (r / ROWS) * 0.7 + 0.3); if (appear <= 0) continue;
    const lit = i < Math.floor(fill * (n - 1));
    let px = x, py = y; if (collapse > 0) { const k = eio(collapse); px = mix(x, 540 - CELL / 2 + 4, k); py = mix(y, 900, k); }
    ctx.save(); ctx.globalAlpha *= appear * (1 - ramp(collapse, 0.7, 1));
    if (last) { const wl = ramp(t, win - 0.2, win + 0.2); ctx.fillStyle = INK; glow(ctx, 30 * wl + 4, 1); ctx.fillRect(px + 2, py + 2, CELL - 12, CELL - 12); }
    else if (lit) { ctx.fillStyle = "rgba(243,243,241,0.92)"; glow(ctx, 6, 0.6); ctx.fillRect(px + 2, py + 2, CELL - 12, CELL - 12); }
    else { ctx.strokeStyle = `rgba(243,243,241,${0.3 + 0.2 * Math.sin(t * 4 - c * 0.35 - r * 0.2)})`; ctx.lineWidth = 2; ctx.strokeRect(px + 3, py + 3, CELL - 14, CELL - 14); }
    ctx.restore();
  }
  if (collapse > 0) return;
  { const sw = ramp(t, t11 - 0.2, win + 0.2); if (sw > 0 && sw < 1) { const bx = mix(GX - 200, GX + COLS * CELL + 200, eio(sw)); const sg = ctx.createLinearGradient(bx - 160, 0, bx + 160, 0); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.16)"); sg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = sg; ctx.fillRect(bx - 160, GY - 30, 320, ROWS * CELL + 60); } }
  // the day you win: one square, a trophy over it
  const lx = GX + (COLS - 1) * CELL + 11, ly = GY + (ROWS - 1) * CELL + 11, wp = ramp(t, win - 0.3, win + 0.4);
  ink(ctx, trophy(lx - 60, ly + 150, 56), wp, 4); ink(ctx, [[[lx, ly + 22], [lx - 30, ly + 100]]], wp, 2, 0.6);
  if (t < t12) label(ctx, "THE DAY YOU WIN", 330, ly + 150, ramp(t, win, win + 0.5), { size: 22 });
  const days = Math.floor(fill * (n - 1));
  if (t >= t12) { label(ctx, "DAYS YOU REFUSED TO QUIT", 330, ly + 150, ramp(t, WD(12, 3), WD(12, 4)), { size: 22 }); bigNum(ctx, fmt(days), 330, ly + 210, ramp(t, WD(12, 3), WD(12, 4)), 60); }
  const gu = WD(12, 11); if (t > gu) { const u = ramp(t, gu, gu + 0.6); ink(ctx, [rrect(GX - 14, GY - 14, COLS * CELL + 18, ROWS * CELL + 18, 12)], u, 4, 1 - ramp(t, gu + 0.8, gu + 1.4) * 0.5); }
};

// H: Remember ---------------------------------------------------------------
const sceneRemember = (ctx: Ctx, t: number) => {
  const c = ramp(t, S(13) - 0.4, S(13) + 0.15); if (c < 1) sceneDays(ctx, t, c);
  const pulse = 1 + 0.25 * Math.sin((t - S(13)) * 8);
  dot(ctx, 540, 900, 14 * pulse * eo(ramp(t, S(13) - 0.1, S(13) + 0.2)), 1, 40);
};

// I: what the world sees / what only you know ------------------------------
const SURF = 1040;
const sceneTruth = (ctx: Ctx, t: number) => {
  const t14 = S(14), t15 = S(15), sac = WD(15, 6), end = FILM_END;
  const pan = 720 * eio(ramp(t, WD(15, 1) - 0.2, WD(15, 5) + 0.3)) + 40 * ramp(t, sac + 1, end);
  ctx.save(); ctx.translate(0, -pan);
  // above: the podium, the champion, the light, the crowd
  const open = eo(ramp(t, t14 - 0.3, t14 + 0.4));
  const sp = eo(ramp(t, WD(14, 2), WD(14, 2) + 0.6));
  if (sp > 0) { ctx.save(); const g = ctx.createLinearGradient(0, 200, 0, SURF - 200); g.addColorStop(0, `rgba(255,255,255,${0.22 * sp})`); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(500, 160); ctx.lineTo(580, 160); ctx.lineTo(720, SURF - 200); ctx.lineTo(360, SURF - 200); ctx.fill(); ctx.restore(); }
  ink(ctx, [seg(60, SURF, 1020, SURF)], open, 4);
  ink(ctx, [[[400, SURF], [400, SURF - 200], [680, SURF - 200], [680, SURF]], [[230, SURF], [230, SURF - 120], [400, SURF - 120]], [[680, SURF - 90], [850, SURF - 90], [850, SURF]]], ramp(t, t14 - 0.1, t14 + 0.6), 4);
  bigNum(ctx, "1", 540, SURF - 100, ramp(t, t14 + 0.3, t14 + 0.7), 70);
  const up = ramp(t, WD(14, 3), WD(14, 4) + 0.2);
  boxer(ctx, 540, SURF - 200, 0.9 * back(ramp(t, t14, t14 + 0.4)), { ...blend(GUARD, UP, up), belt: up, lift: Math.abs(Math.sin(t * 3)) * 5 * up }, ramp(t, t14, t14 + 0.2));
  label(ctx, "WHAT THE WORLD SEES", 540, 330, ramp(t, WD(14, 1), WD(14, 3)), { size: 30, weight: 800 });
  const fb = Math.floor(t * 6), R2 = rng(500 + fb); if (t > WD(14, 2)) for (let i = 0; i < 2; i++) dot(ctx, 120 + R2() * 840, 560 + R2() * 300, 9 + R2() * 6, (1 - (t * 6 - fb)) * 0.85 * (1 - ramp(t, sac, sac + 1)), 30);
  // below: what only you know. The earlier days, buried under the surface, drawn on as we descend.
  const d = (k: number) => ramp(t, WD(15, 2) + k * 0.28, WD(15, 2) + k * 0.28 + 0.7);
  ctx.save(); const under = ctx.createLinearGradient(0, SURF, 0, SURF + 1500); under.addColorStop(0, "rgba(255,255,255,0.05)"); under.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = under; ctx.fillRect(0, SURF + 2, W, 1500); ctx.restore();
  label(ctx, "WHAT ONLY YOU KNOW", 540, SURF + 120, ramp(t, WD(15, 2), WD(15, 4)), { size: 30, weight: 800 });
  const A = 0.8;
  wallClock(ctx, 230, SURF + 330, 60, 6 + ramp(t, sac, end) * 0.5, d(0)); label(ctx, "06:00", 230, SURF + 430, d(0), { size: 26, weight: 800, a: A });
  ctx.save(); ctx.globalAlpha *= A; heavyBag(ctx, 840, SURF + 180, Math.sin(t * 1.6) * 0.04, d(1)); ctx.restore();
  battery(ctx, 540, SURF + 330, 0, d(2), 0.7); label(ctx, "EMPTY", 540, SURF + 390, d(2), { size: 18, a: A });
  ctx.save(); ctx.globalAlpha *= A * d(3); boxer(ctx, 300, SURF + 690, 0.62, { ...TIRED, rot: -1.45, lift: -20 }); ctx.restore(); label(ctx, "LOST", 300, SURF + 590, d(3), { size: 18, a: A });
  ctx.save(); ctx.globalAlpha *= A; for (let i = 0; i < 48; i++) { const c = i % 8, r = Math.floor(i / 8); const on = ramp(d(4), i / 48, i / 48 + 0.1); if (on <= 0) continue; ctx.fillStyle = `rgba(243,243,241,${0.9 * on})`; glow(ctx, 6, 0.5); ctx.fillRect(620 + c * 34, SURF + 560 + r * 34, 22, 22); } ctx.restore();
  label(ctx, "1,825 DAYS", 755, SURF + 790, d(4), { size: 18, a: A });
  ink(ctx, [[[150, SURF + 1080], [150, SURF + 860], [280, SURF + 860], [280, SURF + 1080]]], d(5), 4, A); label(ctx, "NOT TAKEN", 215, SURF + 830, d(5), { size: 16, a: A });
  ctx.save(); ctx.globalAlpha *= A; ink(ctx, [circ(540, SURF + 960, 44), seg(540, SURF + 960, 540, SURF + 932), seg(540, SURF + 960, 560, SURF + 970)], d(6), 4); ctx.restore(); label(ctx, "05:30", 540, SURF + 1040, d(6), { size: 22, weight: 800, a: A });
  ink(ctx, [...house(860, SURF + 960, 40), seg(810, SURF + 900, 910, SURF + 1020)], d(7), 4, A); label(ctx, "MISSED", 860, SURF + 1050, d(7), { size: 16, a: A });
  // roots: thin lines from every buried thing up to the podium
  const rootsP = ramp(t, sac + 0.6, sac + 2.2);
  ink(ctx, [[[230, SURF + 260], [400, SURF + 120], [470, SURF + 4]], [[840, SURF + 180], [700, SURF + 100], [610, SURF + 4]], [[540, SURF + 300], [540, SURF + 4]], [[300, SURF + 600], [420, SURF + 300], [500, SURF + 4]], [[755, SURF + 560], [620, SURF + 300], [580, SURF + 4]]], rootsP, 2, 0.45);
  ctx.restore();
  // the last word, after the voice
  const lw = SEGS[15].end + 1.75;
  label(ctx, "KEEP SHOWING UP.", 540, 1620, ramp(t, lw, lw + 1.0), { size: 34, weight: 800 });
};

// ------------------------------------------------------------------ scenes in order
const cut = (i: number) => S(i) - 0.35;
const SCENES: Scene[] = [
  { a: 0, b: cut(2), draw: sceneDream },
  { a: cut(2), b: cut(3), draw: sceneBefore },
  { a: cut(3), b: cut(7), draw: sceneGym },
  { a: cut(7), b: cut(9), draw: sceneDiscipline },
  { a: cut(9), b: cut(10), draw: sceneShowUp },
  { a: cut(10), b: cut(11), draw: sceneLoss },
  { a: cut(11), b: S(13) - 0.45, draw: (c, t) => sceneDays(c, t) },
  { a: S(13) - 0.45, b: S(14) - 0.35, draw: sceneRemember },
  { a: S(14) - 0.35, b: FILM_END + 1, draw: sceneTruth },
];
const XF = 0.32; // crossfade between scenes, seconds

// ------------------------------------------------------------------ captions (the voice, word by word)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export let BOXER_CAPTIONS = true;
export const setBoxerCaptions = (on: boolean) => { BOXER_CAPTIONS = on; };
const captions = (ctx: Ctx, t: number) => {
  if (!BOXER_CAPTIONS) return;
  const i = SEGS.findIndex((s, k) => t >= s.start - 0.15 && t < (SEGS[k + 1] ? Math.min(SEGS[k + 1].start - 0.12, s.end + 1.2) : s.end + 1.6));
  if (i < 0) return; const sg = SEGS[i];
  const a = ramp(t, sg.start - 0.15, sg.start) * (1 - ramp(t, (SEGS[i + 1] ? Math.min(SEGS[i + 1].start - 0.12, sg.end + 1.2) : sg.end + 1.6) - 0.15, SEGS[i + 1] ? Math.min(SEGS[i + 1].start - 0.12, sg.end + 1.2) : sg.end + 1.6));
  ctx.save(); ctx.font = `700 47px Inter, sans-serif`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const words = sg.words.map((w, k) => [k === 0 ? cap(w[0]) : w[0], w[1]] as [string, number]);
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

// ------------------------------------------------------------------ frame
const background = (env: Env): Layer => {
  const key = `bg${env.scale}`; let L = env.cache.get(key) as Layer | undefined; if (L) return L;
  L = env.canvas(W * env.scale, H * env.scale); const c = L.ctx; c.scale(env.scale, env.scale);
  c.fillStyle = "#0a0a0b"; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(540, 900, 60, 540, 900, 1150); g.addColorStop(0, "#232327"); g.addColorStop(0.55, "#141416"); g.addColorStop(1, "#060607"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,0.07)"; for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) { c.beginPath(); c.arc(x, y, 1.5, 0, Math.PI * 2); c.fill(); }
  env.cache.set(key, L); return L;
};
const layerFor = (env: Env, k: number): Layer => {
  const key = `L${k}_${env.scale}`; let L = env.cache.get(key) as Layer | undefined;
  if (!L) { L = env.canvas(W * env.scale, H * env.scale); env.cache.set(key, L); } return L;
};
const dust = (ctx: Ctx, t: number) => {
  const R = rng(3); for (let i = 0; i < 46; i++) { const x0 = R() * W, y0 = R() * H, sp = 8 + R() * 22, r = 1 + R() * 2.2, ph = R() * 6;
    const y = ((y0 - t * sp) % H + H) % H, x = x0 + Math.sin(t * 0.4 + ph) * 18; dot(ctx, x, y, r, 0.18 + 0.15 * Math.sin(t * 1.3 + ph), 6); }
};

const draw = (ctx: Ctx, local: number, env: Env) => {
  SC = env.scale; const t = local / FPS;
  ctx.drawImage(background(env).canvas, 0, 0);
  ctx.save(); ctx.scale(env.scale, env.scale); dust(ctx, t); ctx.restore();
  // the scene, and the one it is leaving during a crossfade
  const k = SCENES.findIndex((s) => t >= s.a && t < s.b), cur = SCENES[Math.max(0, k)];
  const parts: [Scene, number][] = [[cur, 1]];
  if (k > 0 && t < cur.a + XF) { const u = eio((t - cur.a) / XF); parts[0][1] = u; parts.unshift([SCENES[k - 1], 1 - u]); }
  parts.forEach(([sc, a], j) => {
    const L = layerFor(env, j), c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * env.scale, H * env.scale);
    c.save(); c.scale(env.scale, env.scale);
    const slow = 1 + 0.07 * eio(ramp(t, sc.a - 0.5, sc.b + 0.5)); c.translate(540, 900); c.scale(slow, slow); c.translate(-540, -900); // a slow push-in on every scene
    sc.draw(c, t); c.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(L.canvas, 0, 0); ctx.restore();
  });
  ctx.save(); ctx.scale(env.scale, env.scale); captions(ctx, t);
  // fade from and to black
  const fade = Math.max(1 - ramp(t, 0, 0.25), ramp(t, FILM_END - 1.4, FILM_END - 0.1));
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
};

export const boxer_film: Film = {
  meta: { title: "boxer", W, H, fps: FPS, bpm: BPM, durationFrames: DURATION, kind: "explainer", holds: [[DURATION - 6, DURATION, "fade to black at the end"]],
    captions: SEGS.map((s) => ({ from: Math.round(s.start * FPS), to: Math.round(s.end * FPS), text: s.text })), poster: Math.round((S(1) + 4.5) * FPS) },
  assets: { images: {} },
  shots: [{ id: "film", start: 0, end: DURATION, draw }],
};
export { boxer_film as boxer };
