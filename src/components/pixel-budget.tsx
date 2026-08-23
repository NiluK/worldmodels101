"use client";

import { useId, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The same squeeze as Figure 4.2, with the rigging taken off.
 *
 * Bottleneck kept the factors a decision turns on first. A redraw score does
 * not know what the decision is; it pays for whatever covers the most pixels.
 * So the slots go, in order, to the wall, the sky, the light, the gravel, and
 * only then to the cyclist, who is a handful of pixels and the only thing on
 * the street you needed to see.
 *
 * Everything here is illustrative. The shares behind the score bar are the
 * rough fraction of the frame each factor's pixels change, chosen so the bar
 * is nearly full before the cyclist arrives, which is the point.
 */

const W = 400;
const H = 250;

/** every factor of the scene, most pixels first */
const FACTORS = ["wall", "sky", "light", "gravel", "cyclist"] as const;
type Factor = (typeof FACTORS)[number];
/** rough share of the redraw each factor buys (illustrative) */
const SHARE: Record<Factor, number> = { wall: 0.42, sky: 0.3, light: 0.16, gravel: 0.09, cyclist: 0.03 };

const SKY_H = 80;
const WALL = { x: 20, y: SKY_H, w: 280, h: 130 };
const ROAD_Y = WALL.y + WALL.h;
const GRAVEL = Array.from({ length: 72 }, (_, i) => ({
  x: 24 + ((i * 61) % (W - 48)),
  y: ROAD_Y + 8 + ((i * 37) % (H - ROAD_Y - 14)),
}));
const CYCLIST = { x: 338, y: ROAD_Y + 14 };

const TEXT = {
  en: {
    wall: "the wall",
    sky: "the sky",
    light: "the light",
    gravel: "the gravel",
    cyclist: "the cyclist",
    width: "Numbers allowed through",
    score: "Redraw score",
    s0: "none",
    s1: "most of it",
    s2: "nearly all",
    s3: "all",
    cyclistCell: "The cyclist",
    gone: "gone",
    kept: "kept",
    v0: "Nothing came through.",
    v1: "The wall and the sky are back, and the redraw already scores well.",
    v2: "Light and gravel too. The redraw is nearly perfect and the one thing you needed to avoid is still missing.",
    v3: "The cyclist arrives last, because the cyclist is a handful of pixels and the score never asked for more.",
    note: "Figure 4.2 kept the decision's two factors first. A redraw score keeps the biggest first.",
    none: "nothing",
    aria: (k: number, names: string, cyclist: boolean) =>
      `A street scene rebuilt from ${k} of 5 factors: ${names}. The cyclist is ${cyclist ? "kept" : "gone"}.`,
  },
  zh: {
    wall: "墙",
    sky: "天空",
    light: "光线",
    gravel: "碎石",
    cyclist: "骑车的人",
    width: "放行的数字个数",
    score: "重绘得分",
    s0: "没有",
    s1: "大半",
    s2: "几乎全部",
    s3: "全部",
    cyclistCell: "那个骑车的人",
    gone: "丢了",
    kept: "留下了",
    v0: "什么都没过来。",
    v1: "墙和天空回来了，重绘已经得分不低。",
    v2: "光线和碎石也回来了。重绘几乎完美，而你本来需要避开的那一样东西仍然不在。",
    v3: "骑车的人最后才到，因为他只占一小撮像素，而得分从没要求过更多。",
    note: "图 4.2 先留下了决策所依赖的两个因素。重绘得分先留下最大的。",
    none: "什么都没有",
    aria: (k: number, names: string, cyclist: boolean) =>
      `一幅街景，由五个因素中的 ${k} 个重建：${names}。骑车的人${cyclist ? "留下了" : "丢了"}。`,
  },
};

export function PixelBudget() {
  const locale = useLocale();
  const s = TEXT[locale] ?? TEXT.en;
  const { ref, compact } = useCompact(520);
  const hatch = useId();
  const [k, setK] = useState(0);
  const kept = (f: Factor) => FACTORS.indexOf(f) < k;

  const score = FACTORS.filter(kept).reduce((sum, f) => sum + SHARE[f], 0);
  const scoreWord = k === 0 ? s.s0 : k <= 2 ? s.s1 : k <= 4 ? s.s2 : s.s3;
  const verdict = k === 0 ? s.v0 : k <= 2 ? s.v1 : k <= 4 ? s.v2 : s.v3;
  const names = k === 0 ? s.none : FACTORS.filter(kept).map((f) => s[f]).join(locale === "zh" ? "、" : ", ");

  return (
    <div>
      <div ref={ref} className="grid gap-6 px-5 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)] md:px-8">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
            aria-label={s.aria(k, names, kept("cyclist"))}>
            <defs>
              <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 8 L8 0" fill="none" stroke="var(--rule-strong)" strokeWidth="1" opacity={0.55} />
              </pattern>
            </defs>

            {/* the sky: a band across the top, or a flat placeholder for one */}
            {kept("sky") ? (
              <rect width={W} height={SKY_H} fill="var(--paper-sunk)" />
            ) : (
              <rect x={0.5} y={0.5} width={W - 1} height={SKY_H - 1} fill="var(--rule)" opacity={0.4}
                stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="3 3" />
            )}

            {/* the road, which is structure, not a factor */}
            <line x1={0} y1={ROAD_Y} x2={W} y2={ROAD_Y} stroke="var(--rule-strong)" strokeWidth="1" />

            {/* the wall: textured when kept, flat grey until then */}
            {kept("wall") ? (
              <g>
                <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill={`url(#${hatch})`} />
                <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill="none"
                  stroke="var(--ink)" strokeWidth="1.6" />
              </g>
            ) : (
              <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill="var(--rule)" opacity={0.4}
                stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="3 3" />
            )}

            {/* the gravel: texture that costs pixels and changes nothing */}
            {kept("gravel") &&
              GRAVEL.map((g, i) => (
                <circle key={i} cx={g.x} cy={g.y} r={1.5} fill="var(--ink)" opacity={0.35} />
              ))}

            {/* the cyclist: a few pixels, and the only thing you needed */}
            {kept("cyclist") && (
              <g stroke="var(--imagine)" strokeWidth="1.6" fill="none" strokeLinecap="round">
                <circle cx={CYCLIST.x - 6} cy={CYCLIST.y} r={3.6} />
                <circle cx={CYCLIST.x + 6} cy={CYCLIST.y} r={3.6} />
                <path d={`M${CYCLIST.x - 6} ${CYCLIST.y} L${CYCLIST.x} ${CYCLIST.y - 7} L${CYCLIST.x + 6} ${CYCLIST.y} M${CYCLIST.x + 6} ${CYCLIST.y} L${CYCLIST.x + 3} ${CYCLIST.y - 9}`} />
                <path d={`M${CYCLIST.x - 1} ${CYCLIST.y - 7} L${CYCLIST.x + 1} ${CYCLIST.y - 14}`} />
                <circle cx={CYCLIST.x + 1.5} cy={CYCLIST.y - 16.5} r={2.2} fill="var(--imagine)" />
              </g>
            )}

            {/* the light: overall brightness, dull until it is kept */}
            <rect width={W} height={H} fill="var(--ink)" opacity={kept("light") ? 0.04 : 0.2}
              pointerEvents="none" />
          </svg>
        </div>

        <ul className={compact ? "flex flex-wrap gap-x-5 gap-y-1.5" : "space-y-1.5 self-start"}>
          {FACTORS.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 ${kept(f) ? "bg-imagine" : "bg-rule-strong"}`} />
              <span className={`label !text-[0.6rem] ${kept(f) ? "!text-ink" : ""}`}>{s[f]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{s.width}</span>
          <input type="range" min={0} max={FACTORS.length} value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-8 text-right !text-ink">{k}</span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.score}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-1.5 w-full max-w-[10rem] bg-rule" aria-hidden>
              <span className="block h-full bg-imagine transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${score * 100}%` }} />
            </span>
            <span className="text-[0.98rem] leading-snug text-ink">{scoreWord}</span>
          </div>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.cyclistCell}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{kept("cyclist") ? s.kept : s.gone}</p>
        </div>
      </div>

      <div className="border-t border-rule px-5 py-3 md:px-8">
        <p className="label !normal-case !tracking-normal">{s.note}</p>
      </div>
    </div>
  );
}
