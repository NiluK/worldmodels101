"use client";

import { useState } from "react";

/**
 * The object underneath all five definitions.
 *
 * World → observation → belief → imagined futures → action → changed world.
 * Each sense is a different grab on the same loop, which is the whole argument
 * of the chapter: they are not rivals, they are specialists on different arcs.
 * Hover a sense to see which span of the loop it owns.
 */

const NODES = [
  { id: "world", x: 18, label: "World", sub: "hidden state sₜ" },
  { id: "obs", x: 196, label: "Observation", sub: "oₜ" },
  { id: "belief", x: 374, label: "Belief", sub: "internal state bₜ" },
  { id: "imag", x: 552, label: "Imagination", sub: "possible futures" },
  { id: "act", x: 730, label: "Action", sub: "aₜ" },
];
const W = 160;
const H = 62;
const Y = 74;

const ARROWS = [
  { from: 0, to: 1, label: "observe" },
  { from: 1, to: 2, label: "infer + remember" },
  { from: 2, to: 3, label: "model dynamics" },
  { from: 3, to: 4, label: "choose" },
];

/** Which arc of the loop each sense is specialised on. */
const CLAIMS: Record<string, { span: [number, number]; note: string }> = {
  renderer: { span: [2, 1], note: "Turns latent history back into observations." },
  simulator: { span: [0, 0], note: "Represents the world side explicitly enough to query." },
  controller: { span: [2, 4], note: "Compresses the loop into state you can roll forward." },
  representation: { span: [1, 2], note: "Asks what latent space makes prediction useful." },
  implicit: { span: [2, 2], note: "Asks whether a belief state formed without being asked for." },
};

const NAMES: Record<string, string> = {
  renderer: "Renderer",
  simulator: "Simulator",
  controller: "Controller",
  representation: "Representation",
  implicit: "Implicit Model",
};

export function AgentLoop() {
  const [hot, setHot] = useState<string | null>(null);
  const claim = hot ? CLAIMS[hot] : null;

  const lit = (i: number) => {
    if (!claim) return false;
    const [a, b] = claim.span;
    return i >= Math.min(a, b) && i <= Math.max(a, b);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 908 216" className="block w-full min-w-[640px]" role="img"
          aria-label="The agent–environment loop: world, observation, belief, imagination, action, and back to the world.">
          <defs>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />
            </marker>
            <marker id="ahHot" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--imagine)" strokeWidth="1.6" />
            </marker>
          </defs>

          {ARROWS.map((a, i) => {
            const x1 = NODES[a.from].x + W;
            const x2 = NODES[a.to].x;
            const on = claim ? lit(a.from) && lit(a.to) : false;
            return (
              <g key={a.label}>
                <line
                  x1={x1 + 6} y1={Y + H / 2} x2={x2 - 8} y2={Y + H / 2}
                  stroke={on ? "var(--imagine)" : "var(--ink-muted)"}
                  strokeWidth={on ? 1.8 : 1.2}
                  markerEnd={on ? "url(#ahHot)" : "url(#ah)"}
                />
                <text
                  x={(x1 + x2) / 2} y={Y - 14} textAnchor="middle"
                  className="font-mono" fontSize="10" letterSpacing="1"
                  fill={on ? "var(--imagine)" : "var(--ink-faint)"}
                >
                  {a.label}
                </text>
              </g>
            );
          })}

          {/* the return: the action changes the world, and round again */}
          <path
            d={`M ${NODES[4].x + W / 2} ${Y + H} L ${NODES[4].x + W / 2} 178 L ${NODES[0].x + W / 2} 178 L ${NODES[0].x + W / 2} ${Y + H + 4}`}
            fill="none"
            stroke={claim && lit(4) && lit(0) ? "var(--imagine)" : "var(--ink-muted)"}
            strokeWidth="1.2"
            strokeDasharray="4 4"
            markerEnd="url(#ah)"
          />
          <text x={454} y={172} textAnchor="middle" className="font-mono" fontSize="10"
            letterSpacing="1" fill="var(--ink-faint)">
            intervene · the world is now different
          </text>

          {NODES.map((n, i) => {
            const on = lit(i);
            return (
              <g key={n.id}>
                <rect
                  x={n.x} y={Y} width={W} height={H}
                  fill={on ? "var(--imagine-soft)" : "var(--paper)"}
                  stroke={on ? "var(--imagine)" : "var(--rule-strong)"}
                  strokeWidth={on ? 2 : 1.2}
                />
                <text x={n.x + W / 2} y={Y + 26} textAnchor="middle"
                  fontFamily="var(--font-display)" fontSize="19" fill="var(--ink)">
                  {n.label}
                </text>
                <text x={n.x + W / 2} y={Y + 46} textAnchor="middle"
                  className="font-mono" fontSize="10.5" fill="var(--ink-muted)">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4">
        {Object.keys(CLAIMS).map((id) => (
          <button
            key={id}
            onPointerEnter={() => setHot(id)}
            onFocus={() => setHot(id)}
            onPointerLeave={() => setHot(null)}
            onBlur={() => setHot(null)}
            onClick={() => setHot(hot === id ? null : id)}
            className={`border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
              hot === id
                ? "border-imagine bg-imagine text-paper"
                : "border-rule-strong text-ink-muted hover:border-ink hover:text-ink"
            }`}
          >
            {NAMES[id]}
          </button>
        ))}
      </div>

      <p className="mt-3 min-h-[2.6em] text-[0.95rem] leading-relaxed text-ink-muted">
        {claim ? claim.note : "Every definition is a specialist on one arc of this loop. Hover any of them."}
      </p>
    </div>
  );
}
