// SAY NOTHING: a 9x16 explainer-style story about a teenager whose parents don't believe in the dream.
// Same hand as the boxer film (glowKit): soft glowing white figures, thin glowing line icons.
// Story in three sentences: a kid sits in school with a fire nobody sees; the parents shout it down and it
// hurts; the kid keeps working in silence and one day walks back into that room, says nothing, and smiles.
// The token: the warm spark in the kid's chest. The payoff: the figures are faceless the whole film,
// until the one smile. Ends on an end card with a quote. Every beat is keyed to the voice (dreamerTiming.ts).
import { Ctx, Env, rng } from "./core";
import { Film } from "./film";
import { SEGS, FILM_END, QUOTE } from "./dreamerTiming";
import {
  P, W, H, GROUND, cl, ramp, eo, eio, back, mix, fmt, INK, glow, circ, rrect, seg, ink, dot, label, bigNum, counter, ground, shake, bubble, check,
  spotlight, aura, heartbeat, Pose, DOWN, TYPE, CROSS, UP, SHOUT, SAD, blend, person, frame, Scene,
} from "./glowKit";

const FPS = 30, BPM = 72, DURATION = Math.round(FILM_END * FPS);
const S = (i: number) => SEGS[i].start;
const WD = (i: number, j: number) => SEGS[i].words[j][1];
const cut = (i: number) => S(i) - 0.3;
const GREY = 0.42;

// icons
const book = (cx: number, cy: number, s: number): P[][] => [[[cx, cy - s * 0.35], [cx - s, cy - s * 0.5], [cx - s, cy + s * 0.45], [cx, cy + s * 0.6], [cx + s, cy + s * 0.45], [cx + s, cy - s * 0.5], [cx, cy - s * 0.35], [cx, cy + s * 0.6]], seg(cx - s * 0.75, cy - s * 0.15, cx - s * 0.2, cy - s * 0.05), seg(cx - s * 0.75, cy + s * 0.1, cx - s * 0.2, cy + s * 0.2), seg(cx + s * 0.2, cy - s * 0.05, cx + s * 0.75, cy - s * 0.15), seg(cx + s * 0.2, cy + s * 0.2, cx + s * 0.75, cy + s * 0.1)];
const blocks = (cx: number, by: number, s: number, n = 3): P[][] => { const out: P[][] = []; let k = 0; for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) { if (k++ >= n) break; out.push(rrect(cx - (3 - r) * s / 2 + c * s, by - (r + 1) * s, s - 6, s - 6, 4)); } return out; };
const retry = (cx: number, cy: number, r: number): P[][] => { const a = circ(cx, cy, r, -0.4, 40, Math.PI * 1.65); const e = a[a.length - 1]; return [a, [[e[0] - 16, e[1] - 6], e, [e[0] + 2, e[1] - 20]]]; };
const cross = (cx: number, cy: number, s: number): P[][] => [seg(cx - s, cy - s, cx + s, cy + s), seg(cx + s, cy - s, cx - s, cy + s)];
const heart = (cx: number, cy: number, s: number): P[] => Array.from({ length: 49 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [cx + s * Math.pow(Math.sin(t), 3), cy - (s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) / 16] as P; });
const tower = (cx: number, by: number, w: number, h: number): P[][] => { const out: P[][] = [rrect(cx - w / 2, by - h, w, h, 6)]; for (let y = by - h + 40; y < by - 30; y += 56) for (let x = cx - w / 2 + 22; x < cx + w / 2 - 30; x += 46) out.push(rrect(x, y, 22, 26, 3)); return out; };
const qmark = (ctx: Ctx, x: number, y: number, a: number, s = 44) => { if (a <= 0) return; label(ctx, "?", x, y, 1, { size: s, weight: 800, a: a * 0.9, sp: 0 }); };
const typing = (t: number, base: Pose = TYPE): Pose => ({ ...base, f2: base.f2 + Math.sin(t * 22) * 0.08, b2: base.b2 + Math.cos(t * 19) * 0.08 });
const walkLift = (t: number, on: number) => Math.abs(Math.sin(t * 8)) * 7 * on;

// A: nobody understands ---------------------------------------------------
const sceneAlone = (ctx: Ctx, t: number) => {
  ground(ctx, GROUND, ramp(t, 0.1, 1.6));
  spotlight(ctx, 540, 300, GROUND, eo(ramp(t, 0.3, 1.6)) * (1 + 0.1 * Math.sin(t * 2.5)));
  const pop = back(ramp(t, 0.35, 0.9));
  aura(ctx, 540, GROUND - 120, 420, 0.1 * ramp(t, 1.5, 3) * (1 + 0.6 * Math.sin(t * 3.2)));
  person(ctx, 540, GROUND, 1.05 * pop, { ...DOWN, spark: 0.45 * ramp(t, WD(0, 8), WD(0, 9) + 0.4) * (1 + 0.15 * Math.sin(t * 4)), lift: Math.sin(t * 2) * 2 }, cl(pop * 3));
  const nb = WD(0, 6);
  [[150, -1], [300, -1], [790, 1], [940, 1]].forEach(([x, d], i) => { const a = ramp(t, nb - 0.2 + i * 0.12, nb + 0.4 + i * 0.12); person(ctx, x, GROUND, 0.78, { ...DOWN, dir: d, tone: GREY, lift: Math.sin(t * 1.5 + i) * 2 }, a * 0.9); });
  label(ctx, "NOBODY UNDERSTANDS", 540, 430, ramp(t, nb, WD(0, 8)), { size: 32, weight: 800 });
};

// B: school, every day; deep down -----------------------------------------
const sceneSchool = (ctx: Ctx, t: number) => {
  const deep = WD(2, 1), zoom = eio(ramp(t, deep - 0.2, deep + 0.9));
  const walk = eo(ramp(t, S(1) - 0.3, S(1) + 1.6)), x = mix(80, 470, walk);
  const chest: P = [x + 4, GROUND - 100];
  ctx.save(); const z = mix(1, 2.4, zoom); ctx.translate((540 - chest[0]) * zoom, (1080 - chest[1]) * zoom);
  ctx.translate(chest[0], chest[1]); ctx.scale(z, z); ctx.translate(-chest[0], -chest[1]);
  ground(ctx, GROUND, 1);
  // the school
  const sp = ramp(t, S(1) - 0.3, WD(1, 3) + 0.4);
  ink(ctx, [[[620, GROUND], [620, 860], [1000, 860], [1000, GROUND]], [[600, 870], [810, 740], [1020, 870]], [[770, GROUND], [770, 1060], [850, 1060], [850, GROUND]]], sp, 4);
  ink(ctx, [circ(810, 810, 26)], ramp(t, WD(1, 3), WD(1, 3) + 0.4), 3);
  for (let i = 0; i < 4; i++) ink(ctx, [rrect(i < 2 ? 655 + i * 60 : 885 + (i - 2) * 60 - 10, 920, 40, 46, 3)], ramp(t, WD(1, 3) + i * 0.08, WD(1, 3) + 0.3 + i * 0.08), 3);
  label(ctx, "SCHOOL", 810, 1210, ramp(t, WD(1, 3), WD(1, 3) + 0.4), { size: 20 });
  // every day: the days tick by, Monday to Friday, again and again
  const ev = WD(1, 4), days = Math.floor(Math.pow(ramp(t, ev, deep + 0.4), 1.2) * 180) + 1;
  counter(ctx, "DAY", fmt(days), 540, 420, ramp(t, ev - 0.1, ev + 0.3), 64);
  ["M", "T", "W", "T", "F"].forEach((d, i) => { const cx = 380 + i * 80, on = (days - 1) % 5 >= i || days > 5;
    ink(ctx, [rrect(cx - 28, 560, 56, 56, 8)], ramp(t, ev + i * 0.05, ev + 0.3 + i * 0.05), 3, 0.8); if (on && t > ev) ink(ctx, [check(cx, 588, 30)], 1, 4, (days - 1) % 5 >= i ? 1 : 0.35); label(ctx, d, cx, 640, ramp(t, ev, ev + 0.3), { size: 16 }); });
  const pose: Pose = { ...DOWN, pack: 1, lift: walkLift(t, walk < 1 ? 1 : 0), spark: mix(0.25, 1.3, ramp(t, deep, deep + 1.2)) * (1 + 0.1 * Math.sin(t * 5)) };
  person(ctx, x, GROUND, 1, pose);
  ctx.restore();
  // deep down: a fire
  label(ctx, "DEEP DOWN", 540, 380, ramp(t, deep + 0.3, deep + 0.9) * (1 - ramp(t, WD(2, 8) - 0.1, WD(2, 8))), { size: 32, weight: 800 });
  label(ctx, "THIS ISN'T THE LIFE I WANT", 540, 380, ramp(t, WD(2, 8), WD(2, 10) + 0.4), { size: 30, weight: 800 });
};

// C: a normal job, a whole life, waiting for the weekend -------------------
const sceneJob = (ctx: Ctx, t: number) => {
  const t3 = S(3), job = WD(3, 6), life = WD(3, 8), week = WD(3, 13), FY = 930;
  ink(ctx, [seg(60, FY, 1020, FY)], ramp(t, t3 - 0.3, t3 + 0.4), 2, 0.5);
  for (let i = 0; i < 5; i++) { const x = 140 + i * 200, a = ramp(t, t3 + i * 0.12, t3 + 0.4 + i * 0.12);
    ink(ctx, [[[x + 20, FY], [x + 20, FY - 92], [x + 130, FY - 92], [x + 130, FY]], rrect(x + 52, FY - 168, 70, 50, 5), seg(x + 87, FY - 118, x + 87, FY - 92)], a, 3, 0.8);
    person(ctx, x, FY, 0.6, { ...typing(t + i * 0.01), tone: GREY }, a); }
  // the clock runs 9 to 5, over and over
  const loops = ramp(t, t3, S(4)) * 6, hr = 9 + (loops % 1) * 8;
  label(ctx, `${String(Math.floor(hr)).padStart(2, "0")}:${String(Math.floor((hr % 1) * 60)).padStart(2, "0")}`, 300, 470, ramp(t, t3, t3 + 0.4), { size: 44, weight: 800 });
  label(ctx, "9 TO 5", 300, 420, ramp(t, t3, t3 + 0.4), { size: 20 });
  counter(ctx, "YEARS", fmt(45 * eio(ramp(t, life, week))), 780, 400, ramp(t, life - 0.1, life + 0.3), 64);
  label(ctx, "A NORMAL JOB", 540, 590, ramp(t, job, job + 0.5), { size: 28, weight: 800 });
  // the week: the weekdays crawl, the weekend glows
  const wd = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], wa = ramp(t, week - 0.2, week + 0.3), crawl = ramp(t, week, S(4) + 0.4) * 4.6;
  wd.forEach((d, i) => { const cx = 120 + i * 140, y = 1300; ink(ctx, [rrect(cx - 56, y - 34, 112, 68, 10)], ramp(wa, i / 10, i / 10 + 0.4), 3, i < 5 ? 0.6 : 1);
    if (i < 5 && crawl > i) { ctx.save(); ctx.fillStyle = "rgba(243,243,241,0.18)"; ctx.fillRect(cx - 50, y - 28, 100 * cl(crawl - i), 56); ctx.restore(); }
    if (i >= 5) { ctx.save(); ctx.globalAlpha *= wa * (0.5 + 0.5 * Math.sin(t * 5)); ctx.fillStyle = "rgba(243,243,241,0.4)"; glow(ctx, 20, 0.8); ctx.fillRect(cx - 50, y - 28, 100, 56); ctx.restore(); }
    label(ctx, d, cx, y, wa, { size: 20, weight: 800 }); });
  // the kid, in front, watching it
  person(ctx, 140, GROUND + 70, 1.0, { ...DOWN, pack: 1, spark: 0.55 + 0.1 * Math.sin(t * 4), nod: -0.05 }, ramp(t, t3 - 0.2, t3 + 0.3));
};

// D: build something of my own; freedom, success, millionaire --------------
const sceneBuild = (ctx: Ctx, t: number) => {
  const t4 = S(4), own = WD(4, 7), fr = WD(5, 2), su = WD(5, 5), mil = WD(5, 11);
  ground(ctx, GROUND, 1);
  // blocks fall into place, one by one, into something that is the kid's own
  const order: [number, number][] = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0.5, 2]];
  order.forEach(([c, r], i) => { const t0 = t4 + 0.1 + i * 0.28, u = ramp(t, t0, t0 + 0.35); if (u <= 0) return;
    const x = 660 + c * 100, y = GROUND - (r + 1) * 100 - (1 - eo(u)) * 400; ink(ctx, [rrect(x, y + 4, 92, 92, 8)], 1, 4, cl(u * 3)); });
  label(ctx, "SOMETHING OF MY OWN", 810, 1250, ramp(t, own - 0.3, own + 0.4), { size: 22 });
  // freedom, success, a million
  const bird = (bx: number, by: number, s: number): P[] => [[bx - s, by - s * 0.4], [bx - s * 0.4, by - s * 0.1], [bx, by + s * 0.2], [bx + s * 0.4, by - s * 0.1], [bx + s, by - s * 0.4]];
  const fa = ramp(t, fr - 0.2, fr + 0.4);
  if (fa > 0) { for (let i = 0; i < 3; i++) { const fly = ramp(t, fr + i * 0.15, fr + 4), bx = 130 + fly * 150 + i * 60, by = 640 - fly * 180 - i * 40 + Math.sin(t * 6 + i) * 8; ink(ctx, [bird(bx, by, 26 - i * 4)], fa, 4); }
    ink(ctx, [[[80, 720], [80, 600], [200, 600], [200, 720], [80, 720]], seg(120, 600, 120, 720), seg(160, 600, 160, 690)], fa, 3, 0.5); label(ctx, "FREEDOM", 180, 780, fa, { size: 20 }); }
  const sa = ramp(t, su - 0.2, su + 0.6);
  if (sa > 0) { ink(ctx, [[[400, 720], [440, 720], [440, 680], [480, 680], [480, 630], [520, 630], [520, 570], [560, 570], [560, 500], [600, 500]]], sa, 4); dot(ctx, 600, 500, 9, ramp(sa, 0.9, 1)); label(ctx, "SUCCESS", 500, 780, sa, { size: 20 }); }
  const ma = ramp(t, mil - 0.6, mil);
  if (ma > 0) { bigNum(ctx, "$" + fmt(1000000 * Math.pow(ramp(t, mil - 0.6, mil + 0.6), 2)), 820, 640, ma, 50); label(ctx, "MILLIONAIRE", 820, 780, ma, { size: 20 }); }
  const up = ramp(t, mil, mil + 0.4) * (1 - ramp(t, S(6) - 0.6, S(6) - 0.1));
  person(ctx, 360, GROUND, 1, { ...blend(DOWN, UP, up), spark: 0.6 + 0.6 * up + 0.08 * Math.sin(t * 5), lift: Math.abs(Math.sin(t * 5)) * 8 * up });
};

// E: the parents ------------------------------------------------------------
const sceneParents = (ctx: Ctx, t: number) => {
  const und = WD(6, 4), dreams = WD(7, 6), focus = WD(7, 11), angry = WD(8, 3), shout = WD(8, 6);
  const [sx, sy] = shake(t, angry, 10); const [sx2, sy2] = shake(t, shout, 16, 0.7);
  ctx.save(); ctx.translate(sx + sx2 - 40 * eio(ramp(t, S(6), S(9))), sy + sy2);
  ground(ctx, GROUND, 1);
  const pin = eo(ramp(t, S(6) - 0.3, S(6) + 0.5));
  const lean = ramp(t, angry, angry + 0.3) * 0.12, sh = Math.sin(t * 14) * 0.05 * ramp(t, shout, shout + 0.2) * (1 - ramp(t, S(9) - 0.8, S(9)));
  person(ctx, mix(1200, 740, pin), GROUND, 1.28, { ...blend(CROSS, SHOUT, ramp(t, shout - 0.1, shout + 0.2)), dir: -1, tone: 0.5, lean: lean + sh }, 1);
  person(ctx, mix(1300, 910, pin), GROUND, 1.2, { ...blend(CROSS, SHOUT, ramp(t, angry - 0.1, angry + 0.2)), dir: -1, tone: 0.45, lean: lean - sh }, 1);
  label(ctx, "MY PARENTS", 825, 1250, ramp(t, WD(6, 2), WD(6, 2) + 0.4), { size: 22 });
  const qa = ramp(t, und, und + 0.3) * (1 - ramp(t, S(7), S(7) + 0.3)); qmark(ctx, 740, 780, qa); qmark(ctx, 910, 800, qa);
  // the kid: small, then smaller
  const shrink = 1 - 0.14 * ramp(t, shout, shout + 0.5), recoil = ramp(t, angry, angry + 0.3) * -0.12;
  person(ctx, 280, GROUND, shrink, { ...DOWN, lean: recoil, spark: mix(0.9, 0.25, ramp(t, angry, shout + 0.6)) * (1 + 0.1 * Math.sin(t * 5)) });
  // the kid's dream, in a bubble ... and the parents' answer, which pushes it out
  const kb = ramp(t, WD(7, 3), dreams + 0.3), squash = 1 - 0.55 * eio(ramp(t, focus, focus + 0.6));
  if (kb > 0) { ctx.save(); ctx.translate(300, 700); ctx.scale(squash, squash); ctx.translate(-300, -700);
    bubble(ctx, 300, 700, 300, 230, 300, 900, kb, 1 - ramp(t, angry, angry + 0.4)); ink(ctx, tower(260, 770, 70, 120), ramp(kb, 0.5, 1), 3, 1 - ramp(t, angry, angry + 0.4)); dot(ctx, 350, 650, 8, ramp(kb, 0.8, 1) * (1 - ramp(t, angry, angry + 0.4))); ctx.restore(); }
  const pb = ramp(t, WD(7, 7), focus + 0.3), spiky = ramp(t, angry - 0.1, angry + 0.2);
  if (pb > 0) {
    const bx = 760, by = 560, w = 380 * mix(1, 1.15, spiky), h = 230 * mix(1, 1.15, spiky);
    if (spiky < 1) bubble(ctx, bx, by, w, h, 760, 860, pb, 1 - spiky);
    if (spiky > 0) { const R = rng(31), pts: P[] = []; for (let i = 0; i <= 22; i++) { const a = (i / 22) * Math.PI * 2, r = i % 2 ? 0.8 : 1.12 + R() * 0.1; pts.push([bx + Math.cos(a) * w * 0.5 * r, by + Math.sin(a) * h * 0.5 * r]); } ink(ctx, [pts], spiky, 4); label(ctx, "!", bx + 120, by - 20, spiky, { size: 60, weight: 800, sp: 0 }); }
    ink(ctx, book(bx - 80, by, 48), ramp(pb, 0.4, 1), 3, 1 - spiky * 0.6); label(ctx, "FOCUS ON", bx + 70, by - 18, ramp(t, focus, focus + 0.3), { size: 20 }); label(ctx, "SCHOOL", bx + 70, by + 16, ramp(t, focus + 0.15, focus + 0.45), { size: 26, weight: 800 });
  }
  // they shout: sound hits the kid
  if (t > shout - 0.1) for (let i = 0; i < 4; i++) { const u = ((t - shout) * 1.6 + i / 4) % 1; const cx = mix(680, 360, u); ink(ctx, [circ(cx, 900, 60 + u * 40, Math.PI * 0.75, 20, Math.PI * 0.5)], 1, 4, (1 - u) * (1 - ramp(t, S(9) - 0.6, S(9) - 0.1))); }
  ctx.restore();
  heartbeat(ctx, t, 60 / 72, ramp(t, S(6), S(6) + 0.6));
};

// F: it hurts. All I want is for them to believe in me. Maybe not right now. -
const sceneHurt = (ctx: Ctx, t: number) => {
  const hurt = WD(9, 3), bel = WD(10, 8), rn = WD(11, 9);
  ground(ctx, GROUND, 1, 0.5);
  aura(ctx, 540, GROUND - 140, 520, 0.09 * (1 + 0.7 * Math.sin(t * 2.2)));
  heartbeat(ctx, t, 60 / 72, 0.8);
  const turn = ramp(t, rn - 0.1, rn + 0.5);
  person(ctx, mix(540, 470, eio(turn)), GROUND, 1, { ...SAD, dir: turn > 0.4 ? -1 : 1, nod: mix(0.35, 0.05, ramp(t, S(10), S(10) + 0.6)), spark: (0.22 + 0.12 * Math.sin(t * 9) * Math.sin(t * 2.3)) * (1 + ramp(t, rn, rn + 1)) });
  // a heart, and the crack
  const ha = ramp(t, WD(9, 1), WD(9, 1) + 0.6) * (1 - ramp(t, S(10) - 0.3, S(10) + 0.2));
  ink(ctx, [heart(540, 760 + Math.sin(t * 2) * 8, 90 * (1 + 0.05 * Math.sin(t * 7.5)))], ha, 4);
  ink(ctx, [[[540, 690], [520, 735], [556, 770], [526, 812], [540, 850]]], ramp(t, hurt, hurt + 0.4), 4, ha);
  // believe in me: the parents, far away; the meter stays at zero
  const pa = ramp(t, S(10) - 0.1, S(10) + 0.6) * (1 - ramp(t, rn, rn + 0.7));
  person(ctx, 860, GROUND - 140, 0.75, { ...CROSS, dir: -1, tone: 0.32 }, pa); person(ctx, 960, GROUND - 140, 0.7, { ...CROSS, dir: -1, tone: 0.28 }, pa);
  ink(ctx, [seg(700, GROUND - 140, 1040, GROUND - 140)], pa, 2, 0.35);
  const ma = ramp(t, bel - 0.3, bel + 0.3) * (1 - ramp(t, rn + 0.3, rn + 0.9));
  ink(ctx, [rrect(240, 560, 600, 60, 30)], ma, 3); label(ctx, "BELIEF IN ME", 540, 520, ma, { size: 22 });
  bigNum(ctx, "0%", 540, 680, ma * (0.55 + 0.45 * (Math.floor(t * 3) % 2)), 48);
  label(ctx, "MAYBE NOT RIGHT NOW", 540, 450, ramp(t, rn, rn + 0.6), { size: 28, weight: 800 });
};

// G: keep working, at night; they think I'm wasting my time -----------------
const sceneNight = (ctx: Ctx, t: number) => {
  const t12 = S(12), kw = WD(12, 5), ev = WD(13, 2), dr = WD(13, 8);
  ground(ctx, GROUND, 1);
  // window and moon
  ink(ctx, [rrect(90, 470, 220, 240, 4), seg(200, 470, 200, 710), seg(90, 590, 310, 590)], ramp(t, t12 - 0.3, t12 + 0.4), 4);
  dot(ctx, 150, 525, 18, ramp(t, t12, t12 + 0.4), 20);
  // the desk, the lamp, the laptop
  ink(ctx, [[[300, GROUND], [300, 1030], [640, 1030], [640, GROUND]], [[440, 1030], [480, 950], [610, 950], [580, 1030]], [[600, 1030], [600, 880], [560, 840]], [[520, 830], [600, 830], [560, 800], [520, 830]]], ramp(t, t12 - 0.2, t12 + 0.5), 4);
  const la = ramp(t, t12 + 0.2, t12 + 0.6); if (la > 0) { ctx.save(); const g = ctx.createRadialGradient(560, 840, 5, 560, 960, 260); g.addColorStop(0, `rgba(255,240,210,${0.28 * la * (1 + 0.04 * Math.sin(t * 7))})`); g.addColorStop(1, "rgba(255,240,210,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(530, 840); ctx.lineTo(600, 840); ctx.lineTo(700, 1030); ctx.lineTo(400, 1030); ctx.fill(); ctx.restore(); }
  person(ctx, 250, GROUND, 1, { ...typing(t), spark: 0.6 + 0.5 * ramp(t, kw, kw + 1.5) + 0.08 * Math.sin(t * 5) });
  const hrs = 1 + 0.5 + ramp(t, t12, S(14)) * 3.2;
  label(ctx, `0${Math.floor(hrs)}:${String(Math.floor((hrs % 1) * 60)).padStart(2, "0")}`, 470, 470, ramp(t, t12, t12 + 0.4), { size: 44, weight: 800 });
  counter(ctx, "HOURS WORKED", fmt(Math.pow(ramp(t, kw, S(14) + 1), 1.2) * 1460), 470, 560, ramp(t, kw, kw + 0.4), 50);
  // what they think
  const ca = ramp(t, ev - 0.2, ev + 0.4);
  [[780, 0.82], [890, 0.78], [1000, 0.8]].forEach(([x, k], i) => { const laugh = Math.max(0, Math.sin(t * 9 + i * 1.3)) * 0.12 * ramp(t, WD(13, 5), WD(13, 5) + 0.3);
    person(ctx, x, GROUND, k, { ...DOWN, dir: -1, tone: GREY, lean: -laugh, lift: laugh * 30 }, ca); });
  bubble(ctx, 860, 690, 340, 150, 860, 930, ramp(t, WD(13, 5), WD(13, 5) + 0.5));
  label(ctx, "WASTING TIME", 860, 690, ramp(t, WD(13, 5) + 0.2, dr), { size: 24, weight: 800 });
  label(ctx, "WHAT THEY THINK", 860, 560, ramp(t, ev, ev + 0.5), { size: 20 });
};

// H: learning, building, failing, trying again -----------------------------
const sceneGrind = (ctx: Ctx, t: number) => {
  const L = WD(14, 2), B = WD(14, 3), F = WD(14, 4), T = WD(14, 5);
  ground(ctx, GROUND, 1);
  const cell = (cx: number, cy: number, t0: number, name: string, icon: P[][]) => { const a = ramp(t, t0 - 0.15, t0 + 0.4); ink(ctx, [rrect(cx - 190, cy - 140, 380, 280, 20)], a, 3, 0.6); ink(ctx, icon, a, 4); label(ctx, name, cx, cy + 105, a, { size: 22, weight: 800 });
    const on = ramp(t, t0, t0 + 0.2) * (1 - ramp(t, t0 + 0.6, t0 + 1.0)); if (on > 0) { ctx.save(); ctx.globalAlpha *= on * 0.35; ctx.fillStyle = INK; glow(ctx, 30, 1); ctx.fillRect(cx - 186, cy - 136, 372, 272); ctx.restore(); } };
  cell(320, 560, L, "LEARNING", book(320, 540, 70));
  const fallen = ramp(t, F, F + 0.4);
  cell(760, 560, B, "BUILDING", blocks(760, 600, 64, Math.min(6, Math.floor(ramp(t, B, B + 0.5) * 6) + 1)).map((pp, i) => i === 5 && fallen > 0 ? pp.map(([x, y]) => [x + fallen * 40, y + fallen * 70] as P) : pp));
  cell(320, 880, F, "FAILING", cross(320, 860, 50));
  const spin = (t - T) * 3; cell(760, 880, T, "TRYING AGAIN", retry(760, 860, 52).map((pp) => pp.map(([x, y]) => { const c = Math.cos(t > T ? spin : 0), s = Math.sin(t > T ? spin : 0); return [760 + (x - 760) * c - (y - 860) * s, 860 + (x - 760) * s + (y - 860) * c] as P; })));
  // the kid, working the loop
  const cyc = Math.floor(t * 2) % 2; person(ctx, 540, GROUND, 0.8, { ...(cyc ? typing(t) : blend(DOWN, TYPE, 0.6)), spark: 0.9 + 0.1 * Math.sin(t * 5) });
  // the line: down, up, down, higher
  const pts: P[] = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([140 + u * 800, 1110 - (u * 90 + Math.sin(u * 14) * 24)]); }
  ink(ctx, [pts], ramp(t, L, S(15) - 0.2), 3, 0.7);
};

// I: no words ----------------------------------------------------------------
const sceneWords = (ctx: Ctx, t: number) => {
  const pr = WD(15, 4), wo = WD(15, 7);
  ground(ctx, GROUND, 1);
  person(ctx, 540, GROUND, 1.05, { ...DOWN, spark: 1 + 0.1 * Math.sin(t * 5), nod: -0.04 });
  const draw = ramp(t, S(15) - 0.2, pr + 0.3), erase = ramp(t, wo + 0.2, wo + 0.9);
  bubble(ctx, 540, 620, 620, 360, 560, 900, draw * (1 - erase));
  const lines = [[300, 560, 780], [300, 620, 720], [300, 680, 760]];
  lines.forEach(([x0, y, x1], i) => { ink(ctx, [seg(x0, y, x1, y)], ramp(draw, 0.4 + i * 0.15, 0.7 + i * 0.15) * (1 - erase), 6, 0.8);
    ink(ctx, [seg(x0 - 10, y + 6, x1 + 10, y - 6)], ramp(t, wo - 0.1 + i * 0.1, wo + 0.2 + i * 0.1) * (1 - erase), 4); });
  label(ctx, "NO WORDS. JUST WORK.", 540, 1290, ramp(t, wo, wo + 0.7), { size: 30, weight: 800 });
};

// J: one day, that same room. Say nothing. Smile. Results. Silence. ---------
const sceneRoom = (ctx: Ctx, t: number) => {
  const od = WD(16, 0), walk = WD(16, 5), look = WD(17, 0), doubted = WD(17, 4), fin = WD(18, 1), noth = WD(18, 3), smile = WD(19, 1), res = WD(20, 2), spk = WD(20, 4), sil = WD(21, 6);
  const end = ramp(t, QUOTE - 0.6, QUOTE + 0.4);
  // camera: push into the face for the smile, back out for the results
  const head: P = [395, GROUND - 230];
  const zin = eio(ramp(t, smile - 0.6, smile + 0.1)) * (1 - eio(ramp(t, res - 0.2, res + 0.7)));
  ctx.save(); ctx.translate(-70 * eio(ramp(t, look - 0.3, smile - 0.6)) * (1 - zin), 0); const z = mix(1, 2.5, zin); ctx.translate((540 - head[0]) * zin, (820 - head[1]) * zin); ctx.translate(head[0], head[1]); ctx.scale(z, z); ctx.translate(-head[0], -head[1]);
  ctx.globalAlpha *= 1 - 0.75 * end;
  ground(ctx, GROUND, 1);
  // the results, behind: rise when the results speak
  const rr = eo(ramp(t, res - 0.2, spk + 0.8));
  if (rr > 0) { ink(ctx, tower(540, GROUND, 220, 640 * rr), ramp(t, res - 0.2, res + 0.8), 3, 0.9);
    ink(ctx, [[[140, 820], [260, 760], [330, 790], [450, 640], [560, 690], [700, 470], [760, 420]], [[730, 410], [760, 420], [752, 450]]], ramp(t, spk - 0.1, spk + 0.9), 4, 0.85);
    bigNum(ctx, "$" + fmt(1000000 * eo(ramp(t, spk, spk + 1.2))), 540, 330, ramp(t, spk, spk + 0.3), 70); label(ctx, "RESULTS", 540, 260, ramp(t, res, res + 0.4), { size: 24 }); }
  // the door, the light, the kid walks in
  const da = ramp(t, od - 0.2, od + 0.5), open = eio(ramp(t, walk - 0.4, walk + 0.2));
  ink(ctx, [[[100, GROUND], [100, 880], [250, 880], [250, GROUND]]], da, 4);
  if (open > 0) { ctx.save(); const g = ctx.createLinearGradient(250, 0, 600, 0); g.addColorStop(0, `rgba(255,255,255,${0.25 * open})`); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(250, 880); ctx.lineTo(600, 960); ctx.lineTo(620, GROUND); ctx.lineTo(250, GROUND); ctx.fill(); ctx.restore();
    ink(ctx, [[[250, GROUND], [250 - 110 * open, GROUND + 30 * open], [250 - 110 * open, 880 - 20 * open], [250, 880]]], 1, 3, 0.7); }
  label(ctx, "ONE DAY", 540, 430, ramp(t, od, od + 0.5) * (1 - ramp(t, look, look + 0.3)), { size: 40, weight: 800 });
  const wk = eo(ramp(t, walk, look - 0.1)), kx = mix(175, 380, wk);
  // the doubters, on the right; the room goes quiet when the results rise
  const people: [number, number, number][] = [[620, 1.0, 0.36], [730, 1.22, 0.5], [860, 1.16, 0.46], [980, 0.82, 0.38]];
  people.forEach(([x, k, tone], i) => { const qa = ramp(t, look + 0.15 * i, look + 0.15 * i + 0.3) * (1 - ramp(t, fin, fin + 0.5));
    const lookUp = ramp(t, res + 0.2 * i, res + 0.6 + 0.2 * i) * -0.12, fade = 1 - 0.6 * ramp(t, sil - 0.3, sil + 0.8);
    person(ctx, x, GROUND, k, { ...(i === 1 || i === 2 ? CROSS : DOWN), dir: -1, tone, lean: lookUp, nod: lookUp * 1.5 }, ramp(t, od + 0.2 * i, od + 0.5 + 0.2 * i) * fade);
    qmark(ctx, x, GROUND - 300 * k, qa); });
  label(ctx, "EVERYONE WHO DOUBTED ME", 800, 600, ramp(t, doubted - 0.2, doubted + 0.5) * (1 - ramp(t, fin, fin + 0.4)), { size: 20 });
  // say nothing: a bubble starts, and is let go
  const sb = ramp(t, fin, fin + 0.4) * (1 - ramp(t, noth + 0.2, noth + 0.8));
  bubble(ctx, kx + 40, 780, 200, 110, kx + 10, 920, sb); [0, 1, 2].forEach((i) => dot(ctx, kx + 10 + i * 30, 780, 7, sb * ramp(t, fin + 0.3 + i * 0.12, fin + 0.4 + i * 0.12) * (1 - ramp(t, noth, noth + 0.3))));
  aura(ctx, kx, GROUND - 130, 380, 0.08 * ramp(t, fin, fin + 0.5) * (1 + 0.6 * Math.sin(t * 3)) * (1 - zin));
  label(ctx, "SAY NOTHING", 540, 430, ramp(t, noth, noth + 0.4) * (1 - ramp(t, smile - 0.4, smile - 0.2)), { size: 34, weight: 800 });
  person(ctx, kx, GROUND, 1.05, { ...DOWN, lift: walkLift(t, wk > 0 && wk < 1 ? 1 : 0), smile: eo(ramp(t, smile - 0.1, smile + 0.5)), spark: 1.1 + 0.15 * Math.sin(t * 4) + 0.4 * ramp(t, res, res + 1) });
  // the silence: one flat line across the room
  ink(ctx, [seg(80, 1290, 1000, 1290)], ramp(t, sil - 0.1, sil + 0.9), 3, 0.85);
  label(ctx, "SILENCE", 540, 1330, ramp(t, sil + 0.3, sil + 0.9), { size: 18 });
  ctx.restore();
  // the end card: the quote
  if (end > 0) { ctx.fillStyle = `rgba(6,6,7,${0.78 * end})`; ctx.fillRect(0, 0, W, H); }
  const q1 = QUOTE, q2 = QUOTE + 3.0, q3 = QUOTE + 6.0, dim1 = 1 - 0.45 * ramp(t, q2, q2 + 0.6);
  if (end > 0) { const sw = ((t - QUOTE) / 4.5) % 1; aura(ctx, mix(-150, 1230, sw), 820, 420, 0.07 * end); aura(ctx, 540, 820, 560, 0.06 * end * (1 + 0.5 * Math.sin(t * 2.4))); }
  const quoteLine = (txt: string, y: number, t0: number, dur: number, a: number, size = 58) => label(ctx, txt, 540, y, ramp(t, t0, t0 + dur), { size, weight: 800, sp: 1, a });
  quoteLine("Nobody has to believe", 640, q1, 0.9, dim1); quoteLine("in your dream.", 715, q1 + 0.9, 0.7, dim1);
  quoteLine("You just can't stop", 880, q2, 0.8, 1); quoteLine("believing in it.", 955, q2 + 0.8, 0.8, 1);
  label(ctx, "KEEP GOING.", 540, 1150, ramp(t, q3, q3 + 0.6), { size: 30, weight: 800 }); ink(ctx, [seg(430, 1190, 650, 1190)], ramp(t, q3 + 0.5, q3 + 1.1), 3);
};

const SCENES: Scene[] = [
  { a: 0, b: cut(1), draw: sceneAlone },
  { a: cut(1), b: cut(3), draw: sceneSchool },
  { a: cut(3), b: cut(4), draw: sceneJob },
  { a: cut(4), b: cut(6), draw: sceneBuild },
  { a: cut(6), b: cut(9), draw: sceneParents },
  { a: cut(9), b: cut(12), draw: sceneHurt },
  { a: cut(12), b: cut(14), draw: sceneNight },
  { a: cut(14), b: cut(15), draw: sceneGrind },
  { a: cut(15), b: cut(16), draw: sceneWords },
  { a: cut(16), b: FILM_END + 1, draw: sceneRoom },
];

// the dust thins when it hurts and in the silence
const dim = (t: number) => 1 - 0.6 * ramp(t, S(9) - 0.3, S(9) + 0.5) * (1 - ramp(t, S(12) - 0.3, S(12) + 0.5));
const draw = (ctx: Ctx, local: number, env: Env) => frame(ctx, env, local / FPS, SCENES, SEGS, FILM_END, 0.32, dim);

export const dreamer: Film = {
  meta: { title: "dreamer", W, H, fps: FPS, bpm: BPM, durationFrames: DURATION, kind: "explainer", holds: [
      [100, 125, "the pause after 'nobody understands about me': the line lands"],
      [905, 940, "the silence right after the parents shout"],
      [975, 1095, "'it hurts' / 'believe in me': the kid alone, still on purpose; only the light breathes"],
      [2060, 2250, "the end card: the quote is read"],
      [DURATION - 6, DURATION, "fade to black at the end"]],
    captions: SEGS.map((s) => ({ from: Math.round(s.start * FPS), to: Math.round(s.end * FPS), text: s.text })), poster: Math.round(QUOTE * FPS) + 150 },
  assets: { images: {} },
  shots: [{ id: "film", start: 0, end: DURATION, draw }],
};
