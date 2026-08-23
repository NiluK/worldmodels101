"use client";

import { useEffect, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The four measures, ordered twice.
 *
 * On the left, how often each one gets reported. On the right, how much an
 * agent needs it. Nearly every line crosses, and the crossing is the argument:
 * the easy measures were taken first, so the reporting order came out close to
 * the reverse of the order that matters.
 *
 * Neither ordering is a survey. They are the chapter's judgement, so the figure
 * prints ranks and adverbs and no scores at all.
 */

type Id = "frame" | "holds" | "action" | "cost";

/** left column, top to bottom: how often it is reported */
const REPORTED: Id[] = ["frame", "holds", "action", "cost"];
/** right column, top to bottom: how much an agent needs it */
const NEEDED: Id[] = ["holds", "action", "cost", "frame"];

type Strings = {
  headReported: string;
  headReportedShort: string;
  headNeeded: string;
  headNeededShort: string;
  name: Record<Id, string>;
  shortName: Record<Id, string>;
  adverb: Record<Id, string>;
  need: Record<Id, string>;
  rank: [string, string, string, string];
  reportedCell: string;
  neededCell: string;
  gapCell: string;
  gapValue: (reported: string, needed: string) => string;
  pick: string;
  verdict: Record<Id | "none", string>;
  aria: (pairs: string, selected: string) => string;
  ariaNone: string;
  ariaSelected: (name: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    headReported: "How often it is reported",
    headReportedShort: "Reported",
    headNeeded: "How much an agent needs it",
    headNeededShort: "Needed",
    name: {
      frame: "Frame quality",
      holds: "Holds together over a thousand steps",
      action: "Action fidelity",
      cost: "Cost",
    },
    shortName: {
      frame: "Frame quality",
      holds: "Holds together",
      action: "Action fidelity",
      cost: "Cost",
    },
    adverb: {
      frame: "always",
      holds: "sometimes",
      action: "almost never",
      cost: "least of all",
    },
    need: { frame: "least", holds: "most", action: "second", cost: "third" },
    rank: ["1st", "2nd", "3rd", "4th"],
    reportedCell: "Reported",
    neededCell: "An agent needs it",
    gapCell: "The gap",
    gapValue: (reported, needed) => `Reported ${reported}, needed ${needed}`,
    pick: "Press a measure.",
    verdict: {
      none: "Four measures, two orderings, and nearly every line crosses.",
      frame: "Reported always and needed least. It is measurable, and it is what demos are made of.",
      holds: "What an agent needs most, and no demo is long enough to show it.",
      action:
        "This is what separates a world model from a video generator, and it is almost never reported.",
      cost: "Reported least of all, and it decides whether you can run the thing at all.",
    },
    aria: (pairs, selected) =>
      `A slope chart. Four measures ordered by how often they are reported and by how much an agent needs them. ${pairs}. ${selected}`,
    ariaNone: "Nothing selected.",
    ariaSelected: (name) => `Selected: ${name}.`,
  },
  zh: {
    headReported: "它被报告得有多频繁",
    headReportedShort: "被报告",
    headNeeded: "智能体有多需要它",
    headNeededShort: "被需要",
    name: {
      frame: "画面质量",
      holds: "一千步内是否还撑得住",
      action: "动作保真度",
      cost: "成本",
    },
    shortName: {
      frame: "画面质量",
      holds: "是否还撑得住",
      action: "动作保真度",
      cost: "成本",
    },
    adverb: { frame: "总是", holds: "有时", action: "几乎从不", cost: "最少" },
    need: { frame: "最不需要", holds: "最需要", action: "第二需要", cost: "第三需要" },
    rank: ["第一", "第二", "第三", "第四"],
    reportedCell: "报告频率",
    neededCell: "智能体的需要",
    gapCell: "这中间的落差",
    gapValue: (reported, needed) => `报告排${reported}，需要排${needed}`,
    pick: "按一项指标看看。",
    verdict: {
      none: "四项指标，两种排序，几乎每一条线都交叉。",
      frame: "总是被报告，却最不被需要。它好测量，也正是演示的材料。",
      holds: "智能体最需要的东西，而没有哪个演示长到足以显示它。",
      action: "正是它把世界模型和视频生成器分开，而它几乎从不被报告。",
      cost: "报告得最少的一项，它却决定了你究竟跑不跑得起这东西。",
    },
    aria: (pairs, selected) =>
      `一张斜率图。四项指标各按「被报告的频繁程度」和「智能体的需要程度」排了一次序。${pairs}。${selected}`,
    ariaNone: "未选择。",
    ariaSelected: (name) => `已选：${name}。`,
  },
};

export function MeasuredInReverse() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref } = useCompact(560);
  const [sel, setSel] = useState<Id | null>(null);

  /**
   * Drawn at one unit per CSS pixel: the rows are long strings of type, and a
   * fixed viewBox would shrink them to nothing in a narrow column.
   */
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(300, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  const long = w >= 700;
  const fs = w < 420 ? 11 : 12;
  const rowH = w < 420 ? 46 : 42;
  const top = 30;
  const H = top + REPORTED.length * rowH + 8;
  const LX = w * 0.4;
  const RX = w * 0.6;
  const yc = (i: number) => top + i * rowH + 16;
  const label = (id: Id) => (long ? s.name[id] : s.shortName[id]);

  const move = (delta: number) =>
    setSel((prev) => {
      const i = prev ? REPORTED.indexOf(prev) : -1;
      return REPORTED[(i + delta + REPORTED.length) % REPORTED.length];
    });

  const pairs = REPORTED.map(
    (id, i) => `${s.name[id]}: ${s.rank[i]} / ${s.rank[NEEDED.indexOf(id)]}`,
  ).join("; ");
  const aria = s.aria(pairs, sel ? s.ariaSelected(s.name[sel]) : s.ariaNone);

  const row = (id: Id, side: "left" | "right") => {
    const i = side === "left" ? REPORTED.indexOf(id) : NEEDED.indexOf(id);
    const y = yc(i);
    const on = sel === id;
    const anchorX = side === "left" ? LX : RX;
    return (
      <g
        key={`${side}-${id}`}
        role="button"
        tabIndex={0}
        aria-pressed={on}
        aria-label={`${label(id)}, ${side === "left" ? s.headReportedShort : s.headNeededShort} ${s.rank[i]}`}
        onClick={() => setSel(on ? null : id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSel(on ? null : id);
          } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Escape") {
            setSel(null);
          }
        }}
        className="cursor-pointer"
      >
        <rect
          x={side === "left" ? 0 : RX - 6}
          y={y - rowH / 2 + 2}
          width={side === "left" ? LX + 6 : w - RX + 6}
          height={rowH - 4}
          fill="transparent"
        />
        {/* the rank sits against the name, so the crossing can be read as numbers too */}
        <text
          x={anchorX + (side === "left" ? -10 : 10)}
          y={y - 3}
          textAnchor={side === "left" ? "end" : "start"}
          fontSize={fs}
          fill={on ? "var(--ink)" : "var(--ink-muted)"}
        >
          {side === "left" ? (
            <>
              <tspan
                className="font-mono tnum"
                fontSize={fs - 2}
                fill={on ? "var(--imagine)" : "var(--ink-faint)"}
              >
                {s.rank[i]}
              </tspan>
              <tspan dx={6}>{label(id)}</tspan>
            </>
          ) : (
            <>
              <tspan>{label(id)}</tspan>
              <tspan
                dx={6}
                className="font-mono tnum"
                fontSize={fs - 2}
                fill={on ? "var(--imagine)" : "var(--ink-faint)"}
              >
                {s.rank[i]}
              </tspan>
            </>
          )}
        </text>
        <text
          x={anchorX + (side === "left" ? -10 : 10)}
          y={y + 12}
          textAnchor={side === "left" ? "end" : "start"}
          className="font-mono"
          fontSize={fs - 2}
          fill={on ? "var(--imagine)" : "var(--ink-faint)"}
        >
          {side === "left" ? s.adverb[id] : s.need[id]}
        </text>
      </g>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 pb-2 md:px-8">
        <svg viewBox={`0 0 ${w} ${H}`} className="block w-full" role="img" aria-label={aria}>
          <text
            x={LX - 10}
            y={14}
            textAnchor="end"
            className="font-mono"
            fontSize={10}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {w < 560 ? s.headReportedShort : s.headReported}
          </text>
          <text
            x={RX + 10}
            y={14}
            className="font-mono"
            fontSize={10}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {w < 560 ? s.headNeededShort : s.headNeeded}
          </text>
          <line x1={0} y1={top - 8} x2={w} y2={top - 8} stroke="var(--rule)" strokeWidth="1" />

          {/* the connectors: three of the four cross */}
          {REPORTED.map((id) => {
            const y1 = yc(REPORTED.indexOf(id));
            const y2 = yc(NEEDED.indexOf(id));
            const on = sel === id;
            const dim = sel !== null && !on;
            return (
              <g key={id}>
                <line
                  x1={LX + 8}
                  y1={y1}
                  x2={RX - 8}
                  y2={y2}
                  stroke={on ? "var(--imagine)" : dim ? "var(--ink-faint)" : "var(--rule-strong)"}
                  strokeWidth={on ? 2.4 : 1}
                  opacity={dim ? 0.4 : 1}
                />
                {on && (
                  <>
                    <circle cx={LX + 8} cy={y1} r={3.5} fill="var(--imagine)" />
                    <circle cx={RX - 8} cy={y2} r={3.5} fill="var(--imagine)" />
                  </>
                )}
              </g>
            );
          })}

          {REPORTED.map((id) => row(id, "left"))}
          {NEEDED.map((id) => row(id, "right"))}
        </svg>
      </div>

      <div data-print-hide className="border-t border-rule px-5 py-4 md:px-8">
        <p className="label !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {s.verdict[sel ?? "none"]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.reportedCell, sel ? s.adverb[sel] : s.pick],
          [s.neededCell, sel ? s.need[sel] : s.pick],
          [
            s.gapCell,
            sel ? s.gapValue(s.rank[REPORTED.indexOf(sel)], s.rank[NEEDED.indexOf(sel)]) : s.pick,
          ],
        ].map(([label2, value]) => (
          <div key={label2} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label2}</p>
            <p className={`mt-1 text-[0.9rem] leading-snug ${sel ? "text-ink" : "text-ink-muted"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
