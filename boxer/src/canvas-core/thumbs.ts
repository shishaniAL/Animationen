// THUMBNAILS, composed for the feed rather than lifted from the film: one contrast you read in a glance,
// four or five huge words with one gold word, everything that matters inside the centre 3:4 (y 240-1680)
// because the profile grid crops the top and bottom of a 9:16 cover.
import { Ctx, Env, rng } from "./core";
import { Film } from "./film";
import { W, H, P, setScale, background, person, Pose, UP, SAD, CROSS, SHOUT, ink, rrect, seg, circ, dot, glow, noGlow, label, aura, mix } from "./glowKit";

const GOLD = "#ffd27a";
type Line = { text: string; size: number; color?: string };
const headline = (ctx: Ctx, env: Env, lines: Line[], y: number) => {
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let yy = y;
  for (const l of lines) {
    ctx.font = `900 ${l.size}px "Inter Display", Inter, sans-serif`; (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${-l.size * 0.02}px`;
    const gold = l.color === GOLD;
    ctx.shadowColor = gold ? "rgba(255,190,80,0.75)" : "rgba(255,255,255,0.5)"; ctx.shadowBlur = (gold ? 40 : 24) * env.scale;
    ctx.fillStyle = l.color ?? "#ffffff"; ctx.fillText(l.text, 540, yy + l.size / 2);
    ctx.shadowBlur = 0; ctx.fillText(l.text, 540, yy + l.size / 2); // a crisp pass over the glow
    yy += l.size * 1.05;
  }
  ctx.restore();
};
const goldLight = (ctx: Ctx, x: number, y: number, r: number, a: number) => {
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,205,120,${a})`); g.addColorStop(0.4, `rgba(255,190,100,${a * 0.4})`); g.addColorStop(1, "rgba(255,190,100,0)");
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
};
const cone = (ctx: Ctx, x: number, top: number, bottom: number, w: number, a: number) => {
  ctx.save(); const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 50, top); ctx.lineTo(x + 50, top); ctx.lineTo(x + w, bottom); ctx.lineTo(x - w, bottom); ctx.closePath(); ctx.fill(); ctx.restore();
};
const vignette = (ctx: Ctx, a: number) => { const g = ctx.createRadialGradient(540, 960, 380, 540, 960, 1250); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };

const still = (name: string, paint: (ctx: Ctx, env: Env) => void): Film => ({
  meta: { title: name, W, H, fps: 30, bpm: 60, durationFrames: 1 },
  assets: { images: {} },
  shots: [{ id: "thumb", start: 0, end: 1, draw: (ctx, _l, env) => { setScale(env.scale); ctx.drawImage(background(env).canvas, 0, 0); ctx.save(); ctx.scale(env.scale, env.scale); paint(ctx, env); ctx.restore(); } }],
});

// ------------------------------------------------------------------ BOXER: what the world sees / what only you know
export const boxerThumb = still("boxerThumb", (ctx, env) => {
  const SURF = 1110;
  // above: the champion, lit, the belt in gold
  cone(ctx, 540, 120, SURF, 330, 0.3);
  aura(ctx, 540, 820, 420, 0.16);
  const R = rng(9); for (let i = 0; i < 9; i++) { const x = 90 + R() * 900, y = 640 + R() * 330; if (Math.abs(x - 540) > 200) dot(ctx, x, y, 7 + R() * 9, 0.9, 30); }
  ink(ctx, [[[380, SURF], [380, SURF - 150], [700, SURF - 150], [700, SURF]], [[200, SURF], [200, SURF - 90], [380, SURF - 90]], [[700, SURF - 70], [880, SURF - 70], [880, SURF]]], 1, 5);
  label(ctx, "1", 540, SURF - 72, 1, { size: 70, weight: 900, sp: 0 });
  const champ: Pose = { ...UP, gloves: true };
  person(ctx, 540, SURF - 150, 1.2, champ);
  // the belt, held high (hands sit ~245 px above the feet at this size)
  ctx.save(); ctx.translate(548, SURF - 150 - 1.2 * 282); glow(ctx, 40, 1); ctx.shadowColor = "rgba(255,190,80,0.9)";
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.roundRect(-110, -22, 220, 44, 16); ctx.fill();
  ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.ellipse(0, 0, 46, 36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.ellipse(0, 0, 30, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2, r0 = 150, r1 = 205; ink(ctx, [seg(548 + Math.cos(a) * r0, 622 + Math.sin(a) * r0 * 0.6, 548 + Math.cos(a) * r1, 622 + Math.sin(a) * r1 * 0.6)], 1, 4, 0.55); }
  // the surface
  ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5; glow(ctx, 22, 1); ctx.beginPath(); ctx.moveTo(0, SURF); ctx.lineTo(W, SURF); ctx.stroke(); ctx.restore();
  // below: darker, colder, alone at 6 AM
  ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.42)"; ctx.fillRect(0, SURF + 3, W, H - SURF); ctx.restore();
  label(ctx, "WHAT ONLY YOU KNOW", 430, SURF + 60, 1, { size: 30, weight: 800, a: 0.95 });
  ctx.save(); ctx.translate(840, SURF); ctx.rotate(0.05);
  ink(ctx, [seg(0, 0, 0, 150), rrect(-70, 150, 140, 330, 50), seg(-70, 230, 70, 230), seg(-70, 400, 70, 400)], 1, 5); ctx.restore();
  ink(ctx, [circ(250, SURF + 220, 62), seg(250, SURF + 220, 250, SURF + 178), seg(250, SURF + 220, 250, SURF + 262)], 1, 5);
  label(ctx, "6:00 AM", 250, SURF + 330, 1, { size: 44, weight: 900, sp: 2 });
  const tired: Pose = { ...SAD, gloves: true, lean: 0.26, nod: 0.3 };
  person(ctx, 470, 1640, 1.15, tired, 1);
  ink(ctx, [seg(60, 1640, 1020, 1640)], 1, 3, 0.5);
  for (let i = 0; i < 4; i++) dot(ctx, 510 + i * 22, 1310 + (i % 2) * 40 + i * 18, 6, 0.85, 10);
  vignette(ctx, 0.75);
  // the words
  headline(ctx, env, [{ text: "NOBODY SEES", size: 128 }, { text: "THIS PART.", size: 150, color: GOLD }], 205);
});

// ------------------------------------------------------------------ DREAMER: dark giants, a small light
export const dreamerThumb = still("dreamerThumb", (ctx, env) => {
  const G = 1690;
  // the parents: huge, dark, shouting down
  const parent = (x: number, k: number, dir: number, tone: number, pose: Pose) => person(ctx, x, G + 40, k, { ...pose, dir, tone, lean: 0.14 });
  parent(170, 2.75, 1, 0.34, SHOUT); parent(915, 2.6, -1, 0.3, CROSS);
  // the shouting: spiky bubbles and sound waves aimed at the kid
  const spiky = (cx: number, cy: number, w: number, h: number, seed: number): P[] => { const R = rng(seed), pts: P[] = []; for (let i = 0; i <= 26; i++) { const a = (i / 26) * Math.PI * 2, r = i % 2 ? 0.78 : 1.15 + R() * 0.12; pts.push([cx + Math.cos(a) * w * 0.5 * r, cy + Math.sin(a) * h * 0.5 * r]); } return pts; };
  ink(ctx, [spiky(290, 800, 330, 190, 4)], 1, 6); label(ctx, "FOCUS ON", 290, 778, 1, { size: 30, weight: 900 }); label(ctx, "SCHOOL!", 290, 822, 1, { size: 42, weight: 900, sp: 2 });
  ink(ctx, [spiky(830, 770, 330, 200, 8)], 1, 6); label(ctx, "STOP", 830, 748, 1, { size: 34, weight: 900 }); label(ctx, "DREAMING!", 830, 792, 1, { size: 32, weight: 900, sp: 2 });
  for (let i = 0; i < 3; i++) { ink(ctx, [circ(330, 1220, 70 + i * 34, -0.55, 18, 1.1)], 1, 5, 0.8 - i * 0.2); ink(ctx, [circ(760, 1220, 70 + i * 34, Math.PI - 0.55, 18, 1.1)], 1, 5, 0.8 - i * 0.2); }
  // the kid: small, bright, the warm spark kept alive
  goldLight(ctx, 545, G - 120, 380, 0.42);
  aura(ctx, 545, G - 140, 300, 0.16);
  person(ctx, 545, G, 1.35, { ...SAD, lean: 0.12, nod: 0.25, spark: 1.6, pack: 1 });
  ink(ctx, [seg(60, G, 1020, G)], 1, 3, 0.6);
  vignette(ctx, 0.7);
  headline(ctx, env, [{ text: "THEY SAID I WAS", size: 96 }, { text: "WASTING", size: 156, color: GOLD }, { text: "MY TIME.", size: 156, color: GOLD }], 230);
  void mix; void noGlow;
});
