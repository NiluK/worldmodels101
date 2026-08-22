"use client";

import { useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The masked autoencoder, the awkward counter-example.
 *
 * Hide most of the image, rebuild the pixels with a decoder, and the encoder
 * comes out good anyway. The bottom row repeats PredictTheSummary's verdict on
 * the decoder (built, then thrown away) so the two figures read as one
 * argument with an exception attached.
 */

const TEXT = {
  en: {
    image: (p: number) => `image, ${p}% hidden`,
    encoder: "encoder",
    decoder: "decoder",
    rebuilt: "rebuilt image",
    pixelLoss: "pixel loss",
    keep: "what you keep after training",
    thrown: "built, then thrown away",
    plot: "descriptions of 12 images, by shape",
    illustrative: "illustrative throughout",
    slider: "how much is hidden",
    rebuild: "Rebuild",
    test: "Test the encoder",
    cellHidden: "hidden",
    cellLoss: "pixel loss",
    cellClusters: "clusters the encoder separates",
    ofImage: (p: number) => `${p}% of the image`,
    notRebuilt: "not yet rebuilt",
    afterRebuild: "after rebuild",
    untested: "untested",
    threeOfThree: "3 of 3",
    v0: (p: number) =>
      `${p === 75 ? "Three quarters" : `${p} percent`} hidden. Press Rebuild and the decoder has to redraw it.`,
    v1: "It rebuilt the pixels, roughly. That is the job the last section called wasteful.",
    v2: "The encoder came out good anyway, and the decoder was thrown away. Keep this next to every JEPA claim.",
    aria: (p: number, rebuilt: boolean, tested: boolean) =>
      `A small image of a disc on a horizon with ${p} percent of its patches hidden, feeding an encoder and a decoder. ${
        rebuilt
          ? "The decoder has redrawn the hidden patches as a soft, roughly right version, and the pixel loss bar has shrunk."
          : "The hidden patches are hatched and the pixel loss bar is full."
      }${tested ? " Below, the descriptions of 12 images form three clean clusters by shape. The encoder is kept and the decoder is crossed out." : ""}`,
  },
  zh: {
    image: (p: number) => `图像，遮住 ${p}%`,
    encoder: "编码器",
    decoder: "解码器",
    rebuilt: "重建的图像",
    pixelLoss: "像素损失",
    keep: "训练后留下的",
    thrown: "造了，然后扔掉",
    plot: "12 张图像的描述，按形状分开",
    illustrative: "全部为示意",
    slider: "遮住多少",
    rebuild: "重建",
    test: "测试编码器",
    cellHidden: "遮住",
    cellLoss: "像素损失",
    cellClusters: "编码器分开的簇",
    ofImage: (p: number) => `图像的 ${p}%`,
    notRebuilt: "尚未重建",
    afterRebuild: "重建之后",
    untested: "尚未测试",
    threeOfThree: "3 个中的 3 个",
    v0: (p: number) =>
      `${p === 75 ? "遮住了四分之三" : `遮住了 ${p}%`}。按「重建」，解码器就得把它重新画出来。`,
    v1: "它把像素大致重建了出来。这正是上一节称为浪费的那份活。",
    v2: "编码器照样学得很好，而解码器被扔掉了。把这一点放在每一条 JEPA 主张旁边。",
    aria: (p: number, rebuilt: boolean, tested: boolean) =>
      `一张小图像，地平线上有一个圆盘，${p}% 的块被遮住，送进一个编码器和一个解码器。${
        rebuilt ? "解码器已把被遮住的块重画成柔和、大致正确的样子，像素损失条缩短了。" : "被遮住的块画成斜线，像素损失条是满的。"
      }${tested ? "下方，12 张图像的描述按形状聚成三个干净的簇。编码器留下，解码器被划掉。" : ""}`,
  },
};
type Text = (typeof TEXT)["en"];

/* ---------- the image stand-in: a disc on a horizon, 10 by 8 ---------- */

const COLS = 10;
const ROWS = 8;
const CELL = 22;
const N = COLS * ROWS;
const IMG_W = COLS * CELL;
const IMG_H = ROWS * CELL;

/** Brightness of a cell as ink opacity, 0 is paper and 1 is ink. */
function px(c: number, r: number) {
  const d = Math.hypot(c + 0.5 - 6.5, r + 0.5 - 4.2);
  if (d < 2.3) return 0.88;
  if (r >= 6) return 0.42 + (r - 6) * 0.12;
  return 0.1 + r * 0.025;
}

/** A fixed shuffle of the 80 cells; the first k of it are the hidden ones, so
 *  sliding the mask up only ever hides more, never reshuffles. */
const ORDER: number[] = (() => {
  const a = Array.from({ length: N }, (_, i) => i);
  let seed = 1729;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

/** The decoder's best guess for a hidden cell: the mean of the nearest
 *  visible cells, so it is roughly right and visibly soft. */
function guess(c: number, r: number, hidden: boolean[], fallback: number) {
  for (let rad = 1; rad <= 4; rad++) {
    let sum = 0;
    let n = 0;
    for (let dc = -rad; dc <= rad; dc++)
      for (let dr = -rad; dr <= rad; dr++) {
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS || hidden[rr * COLS + cc]) continue;
        sum += px(cc, rr);
        n++;
      }
    if (n > 0) return sum / n;
  }
  return fallback;
}

/* illustrative descriptions of 12 images: three shapes, four variants each */
const CLUSTERS: { shape: "circle" | "triangle" | "square"; pts: [number, number][] }[] = [
  { shape: "circle", pts: [[0.2, 0.28], [0.27, 0.36], [0.15, 0.4], [0.25, 0.22]] },
  { shape: "triangle", pts: [[0.74, 0.3], [0.82, 0.24], [0.8, 0.4], [0.7, 0.38]] },
  { shape: "square", pts: [[0.48, 0.74], [0.56, 0.8], [0.44, 0.84], [0.53, 0.68]] },
];

function Box({ x, y, w, h, label, fs, imagine, crossed }:
  { x: number; y: number; w: number; h: number; label: string; fs: number; imagine?: boolean; crossed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--paper)"
        stroke={imagine ? "var(--imagine)" : "var(--ink)"} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + h / 2 + fs * 0.36} textAnchor="middle" className="font-mono"
        fontSize={fs} fill={imagine ? "var(--imagine)" : "var(--ink)"}>{label}</text>
      {crossed && (
        <g stroke="var(--imagine)" strokeWidth="1.6">
          <line x1={x + 6} y1={y + 6} x2={x + w - 6} y2={y + h - 6} />
          <line x1={x + w - 6} y1={y + 6} x2={x + 6} y2={y + h - 6} />
        </g>
      )}
    </g>
  );
}

function Marker({ shape, x, y }: { shape: "circle" | "triangle" | "square"; x: number; y: number }) {
  const s = 5;
  if (shape === "circle") return <circle cx={x} cy={y} r={s} fill="var(--actual)" />;
  if (shape === "square") return <rect x={x - s} y={y - s} width={2 * s} height={2 * s} fill="var(--actual)" />;
  return <path d={`M ${x} ${y - s - 1} L ${x + s + 1} ${y + s} L ${x - s - 1} ${y + s} Z`} fill="var(--actual)" />;
}

export function MaskedRebuild() {
  const locale = useLocale();
  const s: Text = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const uid = useId();
  const [pct, setPct] = useState(75);
  const [rebuilt, setRebuilt] = useState(false);
  const [tested, setTested] = useState(false);

  const k = Math.round((pct / 100) * N);

  const { hidden, rank, recon, lossFrac } = useMemo(() => {
    const hidden = Array<boolean>(N).fill(false);
    const rank = Array<number>(N).fill(-1);
    for (let i = 0; i < k; i++) {
      hidden[ORDER[i]] = true;
      rank[ORDER[i]] = i;
    }
    let visSum = 0;
    let visN = 0;
    for (let i = 0; i < N; i++) if (!hidden[i]) { visSum += px(i % COLS, Math.floor(i / COLS)); visN++; }
    const mean = visN ? visSum / visN : 0.4;
    const recon = Array<number>(N).fill(0);
    let errBlank = 0;
    let errRecon = 0;
    for (let i = 0; i < N; i++) {
      if (!hidden[i]) continue;
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const truth = px(c, r);
      recon[i] = guess(c, r, hidden, mean);
      errBlank += truth * truth;
      errRecon += (recon[i] - truth) ** 2;
    }
    return { hidden, rank, recon, lossFrac: errBlank ? Math.min(1, errRecon / errBlank) : 0 };
  }, [k]);

  const setMask = (p: number) => { setPct(p); setRebuilt(false); setTested(false); };
  const rebuild = () => { setRebuilt(true); setTested(false); };

  /* ---------- layout: one row when wide, stacked when compact ---------- */
  const W = compact ? 460 : 900;
  const fs = compact ? 12.5 : 11;
  const bfs = compact ? 14 : 13;
  const img = { x: 20, y: 36 };
  const L = compact
    ? { enc: { x: 290, y: 56, w: 150, h: 48 }, dec: { x: 290, y: 140, w: 150, h: 48 },
        reb: { x: 20, y: 270 }, lossX: 270, lossW: 170, lossY: 300,
        keepY: 500, kEnc: { x: 20, y: 516, w: 140, h: 40 }, kDec: { x: 180, y: 516, w: 140, h: 40 }, noteX: 180, noteY: 582,
        plot: { x: 20, y: 610, w: 220, h: 150 }, plotLabelY: 782, hBase: 470, hFull: 800 }
    : { enc: { x: 284, y: 100, w: 100, h: 52 }, dec: { x: 428, y: 100, w: 100, h: 52 },
        reb: { x: 620, y: 36 }, lossX: 620, lossW: 220, lossY: 242,
        keepY: 322, kEnc: { x: 284, y: 300, w: 100, h: 40 }, kDec: { x: 428, y: 300, w: 100, h: 40 }, noteX: 428, noteY: 362,
        plot: { x: 620, y: 300, w: 220, h: 150 }, plotLabelY: 472, hBase: 270, hFull: 490 };
  const H = tested ? L.hFull : L.hBase;
  const arrow = `url(#${uid}-arrow)`;
  const encMidY = L.enc.y + L.enc.h / 2;
  const decMidY = L.dec.y + L.dec.h / 2;
  const flow = compact
    ? [
        `M ${img.x + IMG_W} ${encMidY} H ${L.enc.x - 3}`,
        `M ${L.enc.x + L.enc.w / 2} ${L.enc.y + L.enc.h} V ${L.dec.y - 3}`,
        `M ${L.dec.x + L.dec.w / 2} ${L.dec.y + L.dec.h} V 246 H 200 V ${L.reb.y - 3}`,
      ]
    : [
        `M ${img.x + IMG_W} ${encMidY} H ${L.enc.x - 3}`,
        `M ${L.enc.x + L.enc.w} ${encMidY} H ${L.dec.x - 3}`,
        `M ${L.dec.x + L.dec.w} ${decMidY} H ${L.reb.x - 3}`,
      ];
  const barW = rebuilt ? Math.max(4, lossFrac * L.lossW) : L.lossW;
  const ease = still ? undefined : "width 480ms ease";

  const verdict = tested ? s.v2 : rebuilt ? s.v1 : s.v0(pct);

  const cells = Array.from({ length: N }, (_, i) => ({ i, c: i % COLS, r: Math.floor(i / COLS) }));

  return (
    <div>
      <div ref={ref} className="px-4 pt-4 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={s.aria(pct, rebuilt, tested)}>
          <defs>
            <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-faint)" strokeWidth="1.2" />
            </pattern>
            <marker id={`${uid}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--ink)" />
            </marker>
          </defs>

          {/* the image, most of it hidden */}
          <text x={img.x} y={img.y - 12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.image(pct)}</text>
          <rect x={img.x} y={img.y} width={IMG_W} height={IMG_H} fill="var(--paper)" />
          {cells.map(({ i, c, r }) =>
            hidden[i] ? (
              <rect key={i} x={img.x + c * CELL} y={img.y + r * CELL} width={CELL} height={CELL} fill={`url(#${uid}-hatch)`} />
            ) : (
              <rect key={i} x={img.x + c * CELL} y={img.y + r * CELL} width={CELL} height={CELL} fill="var(--ink)" opacity={px(c, r)} />
            ),
          )}
          <rect x={img.x} y={img.y} width={IMG_W} height={IMG_H} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />

          {/* encoder sees only the visible patches; the decoder redraws the rest */}
          {flow.map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--ink)" strokeWidth="1.2" markerEnd={arrow} />
          ))}
          <Box {...L.enc} label={s.encoder} fs={bfs} />
          <Box {...L.dec} label={s.decoder} fs={bfs} imagine />

          {/* the rebuilt image: visible cells as they were, hidden ones as the decoder's guess */}
          <text x={L.reb.x} y={L.reb.y - 12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--imagine)">{s.rebuilt}</text>
          <rect x={L.reb.x} y={L.reb.y} width={IMG_W} height={IMG_H} fill="var(--paper)" />
          {cells.map(({ i, c, r }) => {
            const x = L.reb.x + c * CELL;
            const y = L.reb.y + r * CELL;
            if (!hidden[i])
              return <rect key={i} x={x} y={y} width={CELL} height={CELL} fill="var(--ink)" opacity={px(c, r)} />;
            return (
              <g key={i}>
                <rect x={x} y={y} width={CELL} height={CELL} fill="var(--imagine)"
                  style={{
                    opacity: rebuilt ? recon[i] : 0,
                    transition: still || !rebuilt ? undefined : `opacity 260ms ease ${Math.min(700, rank[i] * 9)}ms`,
                  }} />
                {!rebuilt && <rect x={x} y={y} width={CELL} height={CELL} fill={`url(#${uid}-hatch)`} />}
              </g>
            );
          })}
          <rect x={L.reb.x} y={L.reb.y} width={IMG_W} height={IMG_H} fill="none" stroke="var(--imagine)" strokeWidth="1.2"
            strokeDasharray={rebuilt ? undefined : "4 4"} />

          {/* pixel loss: full until the decoder has drawn something, then smaller */}
          <text x={L.lossX} y={L.lossY - 8} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.pixelLoss}</text>
          <rect x={L.lossX} y={L.lossY} width={L.lossW} height={6} fill="var(--paper-sunk)" />
          <rect x={L.lossX} y={L.lossY} height={6} fill="var(--imagine)" style={{ width: barW, transition: ease }} />

          {/* after training: the encoder is kept, the decoder is not, and the test */}
          {tested && (
            <>
              <line x1={20} y1={L.keepY - 26} x2={W - 20} y2={L.keepY - 26} stroke="var(--rule)" strokeWidth="1" />
              <text x={20} y={L.keepY} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.keep}</text>
              <Box {...L.kEnc} label={s.encoder} fs={bfs} />
              <Box {...L.kDec} label={s.decoder} fs={bfs} crossed />
              <text x={L.noteX} y={L.noteY} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--imagine)">{s.thrown}</text>

              <rect x={L.plot.x} y={L.plot.y} width={L.plot.w} height={L.plot.h} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />
              {CLUSTERS.map(({ shape, pts }) =>
                pts.map(([u, v], j) => (
                  <Marker key={`${shape}-${j}`} shape={shape} x={L.plot.x + u * L.plot.w} y={L.plot.y + v * L.plot.h} />
                )),
              )}
              <text x={L.plot.x} y={L.plotLabelY} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.plot}</text>
            </>
          )}
          {!compact && (
            <text x={W - 20} y={H - 10} textAnchor="end" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
              {s.illustrative}
            </text>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[16rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{s.slider}</span>
          <input
            type="range"
            min={25}
            max={90}
            step={5}
            value={pct}
            onChange={(e) => setMask(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{pct}%</span>
        </label>
        <button type="button" onClick={rebuild}
          className={`label h-9 border px-4 transition-colors ${
            rebuilt ? "border-imagine bg-imagine !text-paper" : "border-rule-strong bg-paper !text-ink hover:border-ink"
          }`}>
          {s.rebuild}
        </button>
        <button type="button" onClick={() => setTested(true)} disabled={!rebuilt}
          className={`label h-9 border px-4 transition-colors ${
            tested
              ? "border-imagine bg-imagine !text-paper"
              : rebuilt
                ? "border-rule-strong bg-paper !text-ink hover:border-ink"
                : "cursor-not-allowed border-rule bg-paper"
          }`}>
          {s.test}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.cellHidden}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{s.ofImage(pct)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.cellLoss}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="block h-1.5 w-24 bg-paper-sunk" aria-hidden="true">
              <span className="block h-full bg-imagine" style={{ width: `${Math.round((rebuilt ? lossFrac : 1) * 100)}%`, transition: ease }} />
            </span>
            <span className="text-[0.98rem] text-ink">{rebuilt ? s.afterRebuild : s.notRebuilt}</span>
          </div>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.cellClusters}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{tested ? s.threeOfThree : s.untested}</p>
        </div>
      </div>
    </div>
  );
}
