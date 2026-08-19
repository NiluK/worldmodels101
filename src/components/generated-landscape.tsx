"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A toy Renderer.
 *
 * You walk with the arrow keys and it draws what you would see. There is no
 * terrain stored anywhere: every ridge is computed from your heading the moment
 * it is drawn, which is the defining property of the category.
 *
 * The "hold the world" switch is the room-turn test made playable. With it off,
 * the landmark's position is re-rolled whenever it leaves view, so turning
 * around gives you a different world. With it on, the landmark is pinned to a
 * world coordinate and survives being looked away from. Same renderer, and the
 * only thing that changed is whether anything persists behind the picture.
 */

/**
 * Depth is carried by alpha, so distant ridges blend toward the sky the way
 * haze works. The ramp stays modest: --actual is a light blue in dark mode, and
 * a near layer at high alpha floods the frame instead of receding.
 */
/**
 * Ridges are stroked contours over a faint wash rather than solid silhouettes.
 * Filled shapes turn the nearest layer into one flat block covering half the
 * frame, which reads as water; contour lines recede properly and match the
 * hairline language of the rest of the site.
 */
const LAYERS = [
  { depth: 0.18, amp: 0.075, base: 0.06, fill: 0.16, line: 0.42, w: 1,   freq: 1.4 },
  { depth: 0.36, amp: 0.105, base: 0.15, fill: 0.24, line: 0.58, w: 1.2, freq: 2.1 },
  { depth: 0.70, amp: 0.145, base: 0.26, fill: 0.34, line: 0.75, w: 1.5, freq: 3.0 },
  { depth: 1.30, amp: 0.190, base: 0.40, fill: 0.48, line: 0.95, w: 2,   freq: 4.4 },
];

const TURN = 0.022;
const WALK = 0.05;

/** Arrow keys and WASD both drive the same four actions. */
const BINDINGS: Record<string, "left" | "right" | "fwd" | "back"> = {
  ArrowLeft: "left",  a: "left",
  ArrowRight: "right", d: "right",
  ArrowUp: "fwd",     w: "fwd",
  ArrowDown: "back",  s: "back",
};

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
/** 1-D value noise, smoothed, a few octaves deep. */
function ridge(x: number) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    const i = Math.floor(x * f);
    const t = x * f - i;
    const u = t * t * (3 - 2 * t);
    v += (hash(i) * (1 - u) + hash(i + 1) * u) * amp;
    amp *= 0.5;
    f *= 2;
  }
  return v;
}

/** Hoisted: a component declared inside render is remounted on every render. */
function Pad({
  k, glyph, label, press,
}: {
  k: string;
  glyph: string;
  label: string;
  press: (action: string, down: boolean) => void;
}) {
  return (
    <button
      onPointerDown={() => press(k, true)}
      onPointerUp={() => press(k, false)}
      onPointerLeave={() => press(k, false)}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center border border-rule-strong bg-paper text-ink transition-colors hover:border-ink active:bg-imagine active:text-paper"
    >
      {glyph}
    </button>
  );
}

export function GeneratedLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [persist, setPersist] = useState(false);
  const [moved, setMoved] = useState(false);
  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);
  const keysRef = useRef<Record<string, boolean>>({});
  const movedRef = useRef(false);

  const press = useCallback((action: string, down: boolean) => {
    keysRef.current[action] = down;
    if (down && !movedRef.current) {
      movedRef.current = true;
      setMoved(true);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0;
    let heading = 0;
    let dist = 0;
    // the landmark: the one thing in view that could persist
    let markHeading = 0.9;
    let markSeen = true;

    const css = () => {
      const s = getComputedStyle(document.documentElement);
      const g = (k: string, f: string) => s.getPropertyValue(k).trim() || f;
      return {
        paper: g("--paper", "#f5f2ea"),
        ink: g("--ink", "#191714"),
        muted: g("--ink-muted", "#6b655b"),
        rule: g("--rule", "#ddd6c8"),
        imagine: g("--imagine", "#c23f0e"),
        actual: g("--actual", "#2a4e6e"),
        terrain: [
          g("--terrain-1", "#9ba58f"),
          g("--terrain-2", "#85937b"),
          g("--terrain-3", "#6e7a5c"),
          g("--terrain-4", "#6b5d43"),
        ],
      };
    };
    let C = css();

    function resize() {
      const r = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      const horizon = H * 0.46;

      // sky: a flat ground with a low sun, drawn in the site's own palette
      ctx!.fillStyle = C.paper;
      ctx!.fillRect(0, 0, W, H);
      const sunX = W * 0.5 - ((heading * 0.35) % 2 - 1) * W * 0.5;
      ctx!.globalAlpha = 0.16;
      ctx!.fillStyle = C.imagine;
      ctx!.beginPath();
      ctx!.arc(sunX, horizon - H * 0.16, Math.min(W, H) * 0.13, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;

      // horizon rule
      ctx!.strokeStyle = C.rule;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, Math.round(horizon) + 0.5);
      ctx!.lineTo(W, Math.round(horizon) + 0.5);
      ctx!.stroke();

      // ridgelines, far to near, each generated fresh from the heading
      LAYERS.forEach((L, li) => {
        const off = heading * L.depth * 2.2 + dist * L.depth * 0.35;
        const pts: [number, number][] = [];
        for (let px = 0; px <= W; px += 3) {
          const u = (px / W) * L.freq + off;
          const y = horizon + H * L.base - H * L.amp * (ridge(u) - 0.5) * 2;
          pts.push([px, y]);
        }
        // faint wash beneath the contour
        ctx!.beginPath();
        ctx!.moveTo(0, H);
        pts.forEach(([x, y], i) => (i ? ctx!.lineTo(x, y) : ctx!.lineTo(0, y)));
        ctx!.lineTo(W, H);
        ctx!.closePath();
        ctx!.globalAlpha = L.fill;
        ctx!.fillStyle = C.terrain[li];
        ctx!.fill();
        // the contour itself
        ctx!.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y)));
        ctx!.globalAlpha = L.line;
        ctx!.strokeStyle = C.terrain[li];
        ctx!.lineWidth = L.w;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      });

      // the landmark
      const rel = ((markHeading - heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const onScreen = Math.abs(rel) < 0.75;
      if (onScreen) {
        markSeen = true;
        const mx = W * 0.5 + (rel / 0.75) * W * 0.5;
        const h = H * 0.2;
        ctx!.strokeStyle = C.imagine;
        ctx!.lineWidth = 3;
        ctx!.beginPath();
        ctx!.moveTo(mx, horizon + H * 0.06);
        ctx!.lineTo(mx, horizon + H * 0.06 - h);
        ctx!.stroke();
        ctx!.fillStyle = C.imagine;
        ctx!.beginPath();
        ctx!.arc(mx, horizon + H * 0.06 - h, 6, 0, Math.PI * 2);
        ctx!.fill();
      } else if (markSeen) {
        // out of view. Without persistence there is nothing holding it in place.
        markSeen = false;
        if (!persistRef.current) {
          // nudge it somewhere else in front of you rather than anywhere at all,
          // so turning back shows a world that moved rather than one that vanished
          const jump = (hash(dist * 7.3 + heading * 3.1) - 0.5) * 2.2;
          markHeading = heading + (rel > 0 ? 1.1 : -1.1) + jump;
        }
      }
    }

    function loop() {
      const k = keysRef.current;
      if (k.left) heading -= TURN;
      if (k.right) heading += TURN;
      if (k.fwd) dist += WALK;
      if (k.back) dist -= WALK;
      draw();
      raf = requestAnimationFrame(loop);
    }

    const onKey = (e: KeyboardEvent) => {
      // WASD is matched case-insensitively so caps lock does not break it
      const action = BINDINGS[e.key] ?? BINDINGS[e.key.toLowerCase()];
      if (!action) return;
      // only while the canvas has focus, so W and S do not hijack the page
      if (document.activeElement !== canvas) return;
      e.preventDefault();
      press(action, e.type === "keydown");
    };

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    resize();
    const themeObs = new MutationObserver(() => { C = css(); draw(); });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    if (reduced) draw();
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [press]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="block h-[clamp(240px,42vh,420px)] w-full cursor-grab focus-visible:outline-2 focus-visible:outline-imagine"
        role="img"
        aria-label="A generated landscape you can walk through with the arrow keys or WASD. Ridgelines are computed from your heading each frame rather than stored."
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4">
        <div className="flex items-center gap-2">
          <Pad k="left" glyph="←" label="Turn left" press={press} />
          <Pad k="fwd" glyph="↑" label="Walk forward" press={press} />
          <Pad k="back" glyph="↓" label="Walk back" press={press} />
          <Pad k="right" glyph="→" label="Turn right" press={press} />
        </div>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {moved
            ? "Turn right around, then come back. Is the marker where you left it?"
            : "Click the picture, then use the arrow keys or WASD."}
        </p>
        <label className="ml-auto flex cursor-pointer items-center gap-3">
          <span className="label">Hold the world</span>
          <button
            role="switch"
            aria-checked={persist}
            onClick={() => setPersist((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              persist ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                persist ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
