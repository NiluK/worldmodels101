"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * One scene, two ways of getting more of it.
 *
 * The left panel is a real stage: each press of Another costs a day and moves
 * one box, and putting the stage back takes a visible moment. The right panel
 * is a generated world: each press makes a batch at once, with the lighting,
 * the clutter and the camera all moved, and it is ready again the instant you
 * ask. Stage versions are drawn in slate (real); generated ones in vermilion
 * (made up). The day, the batch size and the reset delay are all stand-ins.
 */

const W = 320;
const H = 200;
const CX = 160;
const CY = 100;
const BATCH = 25;
const RESET_MS = 2500;
const STAGING_MS = 600;

type Variant = { a: [number, number]; b: [number, number]; light: number; cam: number; zoom: number };
type Status = "ready" | "staging" | "resetting" | "paused";

const BASE: Variant = { a: [98, 69], b: [192, 103], light: -2.35, cam: 0, zoom: 1 };
/** on a real stage one version is one box moved by hand */
const STAGE_MOVES: [number, number][] = [[150, 67], [118, 113], [206, 69], [96, 105], [168, 87], [132, 77]];

/** deterministic so the server and the client draw the same scene */
const rnd = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const stageVariant = (i: number): Variant => ({ ...BASE, a: STAGE_MOVES[(i - 1) % STAGE_MOVES.length] });
const worldVariant = (i: number): Variant => ({
  a: [84 + rnd(i, 1) * 64, 55 + rnd(i, 2) * 70],
  b: [172 + rnd(i, 3) * 64, 55 + rnd(i, 4) * 70],
  light: rnd(i, 5) * Math.PI * 2,
  cam: (rnd(i, 6) - 0.5) * 30,
  zoom: 0.88 + rnd(i, 7) * 0.26,
});

const TEXT = {
  en: {
    stage: "a real stage",
    world: "a generated world",
    stageShort: "stage",
    worldShort: "generated",
    soFar: "versions so far",
    more: (n: number) => `+${n} more`,
    another: "Another",
    reset: "Reset",
    plusDay: "+1 day",
    plusBatch: `+${BATCH} at once`,
    versions: "versions",
    time: "time spent",
    contacts: "real contacts",
    status: "status",
    days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
    frames: (n: number) => `${n} frames of GPU time`,
    ready: "ready",
    staging: "staging",
    resetting: "resetting",
    paused: "ready after a pause",
    vStart: "Same scene on both sides. Press Another.",
    vMany: "A day a version on the left; a batch a press on the right, paid for in GPU time.",
    vReset: "The stage takes a while to put back. The generated world was ready before you let go of the button.",
    ariaStage: (n: number, d: number, st: string) =>
      `Top-down view of a real stage: a table, two boxes, a robot arm and a light. ${n} versions so far, ${d} days spent, status ${st}.`,
    ariaWorld: (n: number, st: string) =>
      `Top-down view of a generated world, the same table, boxes, arm and light, drawn in vermilion with the lighting, the clutter and the camera moved. ${n} versions so far, status ${st}.`,
  },
  zh: {
    stage: "一个真实的布景",
    world: "一个生成的世界",
    stageShort: "布景",
    worldShort: "生成",
    soFar: "到目前为止的版本",
    more: (n: number) => `还有 ${n} 个`,
    another: "再来一个",
    reset: "重置",
    plusDay: "+1 天",
    plusBatch: `一次 +${BATCH}`,
    versions: "版本",
    time: "花费的时间",
    contacts: "接触真实环境",
    status: "状态",
    days: (n: number) => `${n} 天`,
    frames: (n: number) => `${n} 帧 GPU 时间`,
    ready: "就绪",
    staging: "布置中",
    resetting: "重置中",
    paused: "稍候即可就绪",
    vStart: "两边是同一个场景。按「再来一个」。",
    vMany: "左边一天一个版本；右边一按一批，用 GPU 时间来付账。",
    vReset: "布景要花一阵子才能放回原样。生成的世界在你松开按钮之前就已经就绪。",
    ariaStage: (n: number, d: number, st: string) =>
      `真实布景的俯视图：一张桌子、两个箱子、一只机械臂和一盏灯。到目前为止 ${n} 个版本，花费 ${d} 天，状态：${st}。`,
    ariaWorld: (n: number, st: string) =>
      `生成世界的俯视图：同样的桌子、箱子、机械臂和灯，用朱红色画出，光照、杂物和相机都变了。到目前为止 ${n} 个版本，状态：${st}。`,
  },
};

function Scene({ v, stroke }: { v: Variant; stroke: string }) {
  const lx = CX + 100 * Math.cos(v.light);
  const ly = CY + 72 * Math.sin(v.light);
  const rays = [0.6, 2.2, 3.9, 5.5];
  return (
    <g
      transform={`rotate(${v.cam} ${CX} ${CY}) translate(${CX} ${CY}) scale(${v.zoom}) translate(${-CX} ${-CY})`}
      fill="var(--paper)" stroke={stroke} strokeWidth="1.4" vectorEffect="non-scaling-stroke"
    >
      <rect x="72" y={CY - 53} width="176" height="106" vectorEffect="non-scaling-stroke" />
      <rect x="306" y={CY - 16} width="20" height="32" vectorEffect="non-scaling-stroke" />
      <line x1="306" y1={CY} x2="262" y2={CY} vectorEffect="non-scaling-stroke" />
      <circle cx="258" cy={CY} r="7" vectorEffect="non-scaling-stroke" />
      <rect x={v.a[0]} y={v.a[1]} width="22" height="22" vectorEffect="non-scaling-stroke" />
      <rect x={v.b[0]} y={v.b[1]} width="22" height="22" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="5" fill={stroke} vectorEffect="non-scaling-stroke" />
      {rays.map((r) => (
        <line key={r} x1={lx + 8 * Math.cos(r)} y1={ly + 8 * Math.sin(r)} x2={lx + 14 * Math.cos(r)} y2={ly + 14 * Math.sin(r)}
          vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

export function ThousandVersions() {
  const locale = useLocale();
  const s = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(480);

  const [presses, setPresses] = useState(0);
  const [resets, setResets] = useState(0);
  const [last, setLast] = useState<"none" | "another" | "reset">("none");
  const [stage, setStage] = useState({ versions: 0, days: 0, contacts: 0 });
  const [stageStatus, setStageStatus] = useState<Status>("ready");
  const [world, setWorld] = useState({ versions: 0, frames: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = (ms: number, then: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(then, ms);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const another = () => {
    setPresses((p) => p + 1);
    setLast("another");
    setWorld((w) => ({ versions: w.versions + BATCH, frames: w.frames + BATCH }));
    if (stageStatus === "resetting") return;
    setStage((st) => ({ versions: st.versions + 1, days: st.days + 1, contacts: st.contacts + 1 }));
    if (still) setStageStatus("ready");
    else { setStageStatus("staging"); arm(STAGING_MS, () => setStageStatus("ready")); }
  };
  const reset = () => {
    setResets((r) => r + 1);
    setLast("reset");
    setWorld((w) => ({ ...w, versions: 0 }));
    setStage((st) => ({ ...st, versions: 0, contacts: st.contacts + 1 }));
    if (still) { if (timer.current) clearTimeout(timer.current); setStageStatus("paused"); }
    else { setStageStatus("resetting"); arm(RESET_MS, () => setStageStatus("ready")); }
  };

  const verdict = last === "reset" || stageStatus === "resetting" ? s.vReset : presses > 0 ? s.vMany : s.vStart;
  const stageText = s[stageStatus];
  const N = 4;
  const stageIds = Array.from({ length: Math.min(N, stage.versions) }, (_, i) => stage.versions - i).reverse();
  const worldIds = Array.from({ length: Math.min(N, world.versions) }, (_, i) => world.frames - i).reverse();

  const panel = (
    key: "stage" | "world",
    title: string,
    tick: string | null,
    status: string,
    stroke: string,
    v: Variant,
    ids: number[],
    variant: (i: number) => Variant,
    total: number,
    aria: string,
  ) => (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="label !text-ink">{title}</p>
        <p className="label tnum whitespace-nowrap">{status}</p>
      </div>
      <div className="relative mt-2 h-px bg-rule">
        {key === "stage" && stageStatus === "resetting" && !still && (
          <motion.div key={resets} className="absolute inset-y-0 left-0 w-full origin-left" style={{ background: stroke }}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: RESET_MS / 1000, ease: "linear" }} />
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full" role="img" aria-label={aria}>
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="var(--rule)" />
        <motion.g key={`${key}-${total}-${resets}`} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}>
          <Scene v={v} stroke={stroke} />
        </motion.g>
      </svg>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="label">{s.soFar}</p>
        {tick && (
          <motion.p key={`${key}-${presses}`} initial={still ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }} className="label tnum whitespace-nowrap" style={{ color: stroke }}>
            {tick}
          </motion.p>
        )}
      </div>
      <div className="mt-1 flex min-h-6 flex-wrap items-center gap-1.5">
        {ids.map((i) => (
          <svg key={i} viewBox={`0 0 ${W} ${H}`} className="h-6 w-9 shrink-0" aria-hidden="true">
            <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
            <Scene v={variant(i)} stroke={stroke} />
          </svg>
        ))}
        {ids.length === 0 && <span className="label tnum">0</span>}
        {total > ids.length && <span className="label tnum ml-1 whitespace-nowrap">{s.more(total - ids.length)}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <div ref={ref} className={`grid gap-x-8 gap-y-8 px-4 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        {panel("stage", s.stage, last === "another" && stageStatus !== "resetting" ? s.plusDay : null, stageText, "var(--actual)",
          stage.versions ? stageVariant(stage.versions) : BASE, stageIds, stageVariant, stage.versions,
          s.ariaStage(stage.versions, stage.days, stageText))}
        {panel("world", s.world, last === "another" ? s.plusBatch : null, s.ready, "var(--imagine)",
          world.versions ? worldVariant(world.frames) : BASE, worldIds, worldVariant, world.versions,
          s.ariaWorld(world.versions, s.ready))}
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button type="button" onClick={another}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink">
          {s.another}
        </button>
        <button type="button" onClick={reset}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink">
          {s.reset}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [`${s.stageShort} · ${s.versions}`, String(stage.versions)],
          [`${s.stageShort} · ${s.time}`, s.days(stage.days)],
          [`${s.stageShort} · ${s.contacts}`, String(stage.contacts)],
          [`${s.stageShort} · ${s.status}`, stageText],
          [`${s.worldShort} · ${s.versions}`, String(world.versions)],
          [`${s.worldShort} · ${s.time}`, s.frames(world.frames)],
          [`${s.worldShort} · ${s.contacts}`, "0"],
          [`${s.worldShort} · ${s.status}`, s.ready],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
