// THUMBNAILS: one frame of each film (without captions), darkened where the title sits, with the title
// drawn large in the films' own lettering. Frame numbers are picked from the films' strongest beats.
import { Ctx, Env } from "./core";
import { Film } from "./film";
import { boxer, setBoxerCaptions } from "./boxer";
import { dreamer } from "./dreamer";
import { setCaptions, setScale, W, H } from "./glowKit";

const title = (ctx: Ctx, env: Env, lines: string[], y: number, size: number, sub?: string, band: [number, number] = [y - 260, y + 260]) => {
  ctx.save(); ctx.scale(env.scale, env.scale);
  const g = ctx.createLinearGradient(0, band[0], 0, band[1]); g.addColorStop(0, "rgba(5,5,6,0)"); g.addColorStop(0.3, "rgba(5,5,6,0.82)"); g.addColorStop(0.7, "rgba(5,5,6,0.82)"); g.addColorStop(1, "rgba(5,5,6,0)");
  ctx.fillStyle = g; ctx.fillRect(0, band[0], W, band[1] - band[0]);
  ctx.font = `800 ${size}px "Inter Display", Inter, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const lh = size * 1.12, y0 = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => { ctx.fillStyle = "#f6f6f3"; ctx.shadowColor = "rgba(255,255,255,0.55)"; ctx.shadowBlur = 26 * env.scale; ctx.fillText(l, 540, y0 + i * lh); });
  if (sub) { ctx.shadowBlur = 10 * env.scale; ctx.font = `700 30px Inter, sans-serif`; (ctx as Ctx & { letterSpacing: string }).letterSpacing = "6px"; ctx.globalAlpha = 0.85; ctx.fillText(sub, 540, y0 + lines.length * lh + 20); }
  ctx.restore();
};

const thumb = (name: string, src: Film, frame: number, paint: (ctx: Ctx, env: Env) => void): Film => ({
  meta: { title: name, W, H, fps: 30, bpm: 60, durationFrames: 1 },
  assets: { images: {} },
  shots: [{ id: "thumb", start: 0, end: 1, draw: (ctx, _l, env) => {
    setCaptions(false); setBoxerCaptions(false);
    src.shots[0].draw(ctx, frame, env);
    setCaptions(true); setBoxerCaptions(true); setScale(env.scale);
    paint(ctx, env);
  } }],
});

// boxer: the reveal under the podium, "what only you know"
export const boxerThumb = thumb("boxerThumb", boxer, 1590, (ctx, env) => title(ctx, env, ["Nobody sees", "this part."], 1500, 112, "THE WORLD ONLY SEES THE BELT", [1250, 1800]));
// dreamer: the one smile
export const dreamerThumb = thumb("dreamerThumb", dreamer, 1800, (ctx, env) => title(ctx, env, ["My parents didn't", "believe in me."], 1480, 96, "SO I STAYED SILENT", [1220, 1780]));
