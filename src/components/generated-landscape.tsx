"use client";

import {
  useCallback, useEffect, useRef, useState,
  type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent,
} from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * A toy Renderer.
 *
 * You look around and walk, and it draws what you would see from where you
 * stand: sky, a sun fixed in the world, ridgelines generated from noise, a
 * ground plane in perspective, and a few posts. There is no terrain stored
 * anywhere; every ridge is computed from your heading the moment it is drawn.
 *
 * The "hold the world" switch is the turn-around test made playable. With it
 * off, the landmarks live only in the frame: while one is in view it moves
 * consistently with your heading, but once it leaves view nothing remembers
 * where it was, and when that side of the view comes back a landmark is drawn
 * fresh from the current heading, somewhere else. With it on, every landmark
 * has a world coordinate, survives being looked away from, and the map panel
 * shows exactly what is being stored. Same renderer; the only thing that
 * changed is whether anything persists behind the picture.
 */

const FOV = 1.2217;            // 70 degrees across the frame
const HALF = FOV / 2;
const EYE = 1;                 // eye height, in strides
const POST = 1.6;              // post height, in strides
const NEAR = 0.5;              // anything nearer than this is behind you for drawing purposes
const GRID_R = 28;             // ground grid radius, in strides
const MARGIN = 0.25;           // how far past the edge a landmark is kept during one gesture
const TURN_STEP = Math.PI / 12; // 15 degrees per tap
const WALK_STEP = 1;            // one stride per tap
const TURN_RATE = 1.4;          // radians per second while held
const WALK_RATE = 3;            // strides per second while held
const HOLD_DELAY = 300;
const HOLD_REPEAT = 240;        // reduced motion: one full step per tick while held
const SWEEP_MS = 1200;
const PAUSE_MS = 500;
const SUN_BEARING = -0.42;
const SUN_ELEV = 0.2;

type Action = "left" | "right" | "fwd" | "back";

/** Arrow keys and WASD both drive the same four actions. */
const BINDINGS: Record<string, Action> = {
  ArrowLeft: "left",  a: "left",
  ArrowRight: "right", d: "right",
  ArrowUp: "fwd",     w: "fwd",
  ArrowDown: "back",  s: "back",
};

/**
 * Ridges are stroked contours over a faint wash rather than solid silhouettes,
 * which matches the hairline language of the rest of the site. Each layer is a
 * ring of noise at radius R around the origin, so walking gives real parallax
 * (near ridges slide against far ones) and turning slides them all together.
 * `cells` is the noise period around the ring, so there is no seam.
 */
type Ridge = { R: number; cells: number; base: number; amp: number; fill: number; line: number; w: number };
const RIDGES: Ridge[] = [
  { R: 420, cells: 8,  base: 0.15,  amp: 0.10,  fill: 0.16, line: 0.42, w: 1 },
  { R: 220, cells: 12, base: 0.10,  amp: 0.075, fill: 0.24, line: 0.58, w: 1.2 },
  { R: 110, cells: 16, base: 0.06,  amp: 0.048, fill: 0.34, line: 0.75, w: 1.5 },
  { R: 55,  cells: 24, base: 0.028, amp: 0.025, fill: 0.48, line: 0.95, w: 2 },
];

/** Where the posts start. Bearing is radians from north, distance in strides. */
const START_LANDMARK = { bearing: 0.22, dist: 5.5 };
const START_QUIET = [
  { bearing: -0.38, dist: 7.5 },
  { bearing: 0.52, dist: 4.2 },
  { bearing: 0.04, dist: 13 },
];

type Mark = { x: number; y: number; id: number };
type Slot = Mark | null;

const TEXT = {
  en: {
    hint: "Drag the picture to look around, or click it and use the arrow keys.",
    keys: "Keys active. Arrows or WASD to turn and walk.",
    test: "Turn away and back",
    away: "Turning away",
    back: "Turning back",
    hold: "Hold the world",
    stored: "What is stored",
    nothing: "nothing. each frame is drawn from the heading",
    left: "Turn left",
    right: "Turn right",
    fwd: "Walk forward",
    backStep: "Walk back",
    heading: "Heading",
    fromStart: "From start",
    landmark: "Landmark",
    strides: (n: string) => `${n} strides`,
    notInView: "not in view",
    ahead: (d: string) => `ahead, ${d} strides`,
    bearing: (deg: number, side: "left" | "right", d: string) => `${deg}° ${side}, ${d} strides`,
    moved: (deg: number, side: "left" | "right") =>
      `Landmark moved ${deg} degrees to the ${side}. Nothing behind the picture was holding it.`,
    chance: "Landmark is back within a degree of where it was, by chance. Nothing behind the picture was holding it.",
    gone: "Landmark gone. Nothing behind the picture was holding it.",
    stayed: "Landmark where you left it. A stored coordinate was read back.",
    mapAria: (n: number) => `Top-down map: your position and heading, and ${n} stored landmark positions.`,
    aria: (hdg: number, lm: string, on: boolean) =>
      `A generated first-person landscape seen from heading ${hdg} degrees. Landmark ${lm}. Hold the world is ${on ? "on" : "off"}.`,
  },
  zh: {
    hint: "拖动画面环顾四周，或点击画面后用方向键。",
    keys: "按键已启用。方向键或 WASD 可以转向和行走。",
    test: "转开再转回",
    away: "正在转开",
    back: "正在转回",
    hold: "保持世界不变",
    stored: "存着什么",
    nothing: "什么都没有。每一帧都是从朝向画出来的",
    left: "向左转",
    right: "向右转",
    fwd: "向前走",
    backStep: "向后退",
    heading: "朝向",
    fromStart: "离起点",
    landmark: "标记",
    strides: (n: string) => `${n} 步`,
    notInView: "不在视野内",
    ahead: (d: string) => `正前方，${d} 步`,
    bearing: (deg: number, side: "left" | "right", d: string) => `${side === "left" ? "左" : "右"} ${deg}°，${d} 步`,
    moved: (deg: number, side: "left" | "right") =>
      `标记向${side === "left" ? "左" : "右"}移了 ${deg} 度。画面背后没有任何东西在撑着它。`,
    chance: "标记碰巧回到了原处一度之内。画面背后没有任何东西在撑着它。",
    gone: "标记不见了。画面背后没有任何东西在撑着它。",
    stayed: "标记还在原处。读回的是一条存下来的坐标。",
    mapAria: (n: number) => `俯视地图：你的位置和朝向，以及 ${n} 个存下来的标记位置。`,
    aria: (hdg: number, lm: string, on: boolean) =>
      `一片生成出来的第一人称风景，朝向 ${hdg} 度。标记${lm}。「保持世界不变」${on ? "已开启" : "已关闭"}。`,
  },
};

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/** 1-D value noise, smoothed, a few octaves deep, periodic in `period`. */
function ridge(x: number, period: number, seed: number) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    const p = period * f;
    const i = Math.floor(x * f);
    const t = x * f - i;
    const u = t * t * (3 - 2 * t);
    const a = hash(((i % p) + p) % p + o * 1013 + seed);
    const b = hash((((i + 1) % p) + p) % p + o * 1013 + seed);
    v += (a * (1 - u) + b * u) * amp;
    amp *= 0.5;
    f *= 2;
  }
  return v;
}

const wrap = (a: number) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
const toDeg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** The tokens are hex in both themes; anything else is passed through and the alpha is ignored. */
function rgba(hex: string, a: number) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  const g = (k: string, f: string) => s.getPropertyValue(k).trim() || f;
  return {
    paper: g("--paper", "#f5f2ea"),
    ink: g("--ink", "#191714"),
    faint: g("--ink-faint", "#716b62"),
    rule: g("--rule", "#ddd6c8"),
    ruleStrong: g("--rule-strong", "#918a7c"),
    imagine: g("--imagine", "#c23f0e"),
    terrain: [
      g("--terrain-1", "#9ba58f"),
      g("--terrain-2", "#85937b"),
      g("--terrain-3", "#6e7a5c"),
      g("--terrain-4", "#6b5d43"),
    ],
  };
}

/** Hoisted: a component declared inside render is remounted on every render. */
function Pad({
  k, glyph, label, press,
}: {
  k: Action;
  glyph: string;
  label: string;
  press: (action: Action, down: boolean) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => { e.preventDefault(); press(k, true); }}
      onPointerUp={() => press(k, false)}
      onPointerLeave={() => press(k, false)}
      onPointerCancel={() => press(k, false)}
      onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(k, true); } }}
      onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") press(k, false); }}
      onBlur={() => press(k, false)}
      aria-label={label}
      className="flex h-10 w-10 touch-none select-none items-center justify-center border border-rule-strong bg-paper text-ink transition-colors hover:border-ink active:bg-imagine active:text-paper"
    >
      {glyph}
    </button>
  );
}

type Verdict =
  | { kind: "moved"; deg: number; side: "left" | "right" }
  | { kind: "chance" }
  | { kind: "gone" }
  | { kind: "stayed" };

type Snap = {
  hdg: number;            // degrees from north, 0..359
  from: string;           // strides from the start, one decimal
  lm: { deg: number; dist: string } | null;  // landmark relative bearing, signed degrees; null if not in view
  stored: number;         // how many landmark coordinates exist (for the map label)
};

export function GeneratedLandscape() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const { ref: rootRef, compact } = useCompact(640);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);

  const [persist, setPersist] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "away" | "back">("idle");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [snap, setSnap] = useState<Snap>({ hdg: 0, from: "0.0", lm: { deg: 13, dist: "5.5" }, stored: 4 });

  // The world and the input machinery live in refs: the draw loop must not see
  // a stale closure, and a turn must not re-render the whole figure.
  const persistRef = useRef(persist);
  const reducedRef = useRef(false);
  const scriptingRef = useRef(false);
  const api = useRef<{
    step: (a: Action) => void;
    release: () => void;
    draw: () => void;
    runTest: () => void;
    holdChanged: (on: boolean) => void;
    drag: (dx: number, w: number) => void;
  } | null>(null);

  const keysRef = useRef<Record<Action, boolean>>({ left: false, right: false, fwd: false, back: false });
  const holdTimer = useRef<number>(0);
  const holdRaf = useRef<number>(0);
  const holdInterval = useRef<number>(0);

  // The ref is set in the handler, not an effect, so a test started in the
  // same tick as the toggle already sees the new setting.
  const toggleHold = () => {
    const next = !persistRef.current;
    persistRef.current = next;
    setPersist(next);
    api.current?.holdChanged(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext("2d");
    const mctx = map.getContext("2d");
    if (!ctx || !mctx) return;

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = reducedMq.matches;
    const onReduced = () => { reducedRef.current = reducedMq.matches; };
    reducedMq.addEventListener("change", onReduced);

    let W = 0, H = 0, MW = 0, MH = 0;
    let C = readPalette();

    // ---- the world -------------------------------------------------------
    let heading = 0;
    let px = 0, py = 0;
    let prevHeading = 0;
    let lastTurn = 1;          // which way the last sweep went, for the entering edge
    let seed = Math.floor(Math.random() * 1e4) + 1;  // so a fresh page does not replay one scripted outcome
    let nextId = 1;

    const place = (bearing: number, dist: number): Mark => ({
      x: px + Math.sin(bearing) * dist,
      y: py + Math.cos(bearing) * dist,
      id: nextId++,
    });
    let landmark: Slot = place(START_LANDMARK.bearing, START_LANDMARK.dist);
    let quiet: Slot[] = START_QUIET.map((q) => place(q.bearing, q.dist));

    /** Camera-frame view of a world point: depth z along the heading, x to the right. */
    function see(m: Mark) {
      const vx = m.x - px, vy = m.y - py;
      const s = Math.sin(heading), c = Math.cos(heading);
      const z = vx * s + vy * c;
      const x = vx * c - vy * s;
      return { z, x, rel: Math.atan2(x, z), dist: Math.hypot(vx, vy) };
    }
    const inView = (m: Mark) => {
      const v = see(m);
      return v.z > NEAR && Math.abs(v.rel) <= HALF;
    };

    /**
     * With the world not held, a landmark is only what the frame is showing.
     * Past the edge (plus a little margin, so a wobble mid-drag does not flicker)
     * it is dropped; an empty slot is filled from the current heading, at the
     * edge the view is sweeping into, or anywhere in view after a snap.
     */
    function spawn(edgeInset: number, spread: number, dh: number): Mark {
      const r = hash(seed++ * 0.731 + 3.1);
      const sweeping = dh !== 0 && Math.abs(dh) < HALF;
      const rel = sweeping
        ? Math.sign(dh) * (HALF - 0.01 - edgeInset * r)
        : (hash(seed++ * 1.37 + 7.7) - 0.5) * 2 * spread;
      const dist = 4 + 6 * hash(seed++ * 2.11 + 0.3);
      return place(heading + rel, dist);
    }
    /**
     * After a slot is dropped mid-sweep, the view turns a random further amount
     * before a new post is drawn at the entering edge. Without that gap the
     * away-and-back script is its own mirror image and the regenerated post
     * lands back near where it started, which would look like memory.
     */
    let landmarkDebt = 0;
    const quietDebt = [0, 0, 0];
    function forgetAndFill(dh: number, atRest: boolean) {
      if (persistRef.current) return;
      const keep = (m: Slot, margin: number): Slot => {
        if (!m) return null;
        const v = see(m);
        if (v.z <= NEAR * 1.2) return null;
        if (Math.abs(v.rel) > HALF + margin) return null;
        return m;
      };
      // at rest (the end of a gesture) the frame is final: what is not in it does not exist
      const margin = atRest ? 0 : MARGIN;
      const snap = Math.abs(dh) >= HALF;
      const sweepDir = dh !== 0 ? dh : atRest ? lastTurn * 0.1 : 0;
      const fill = (m: Slot, debt: number, gap: number, inset: number, spread: number): [Slot, number] => {
        const kept = keep(m, margin);
        if (kept) return [kept, 0];
        if (m) debt = gap * hash(seed++ * 0.913 + 2.2);  // just dropped: owe a gap
        if (atRest || snap || debt <= Math.abs(dh)) return [spawn(inset, spread, sweepDir), 0];
        return [null, debt - Math.abs(dh)];
      };
      [landmark, landmarkDebt] = fill(landmark, landmarkDebt, 0.8, 0.2, HALF * 0.8);
      quiet = quiet.map((q, i) => {
        const [m, d] = fill(q, quietDebt[i], 1.2, 0.5, HALF * 1.2);
        quietDebt[i] = d;
        return m;
      });
    }

    // ---- drawing --------------------------------------------------------
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas!.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mr = map!.getBoundingClientRect();
      MW = mr.width; MH = mr.height;
      map!.width = Math.round(MW * dpr);
      map!.height = Math.round(MH * dpr);
      mctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawScene() {
      const g = ctx!;
      g.clearRect(0, 0, W, H);
      const horizon = Math.round(H * 0.46) + 0.5;
      const f = (W / 2) / Math.tan(HALF);

      // sky
      g.fillStyle = C.paper;
      g.fillRect(0, 0, W, H);

      // the sun, fixed in the world
      const sunRel = wrap(SUN_BEARING - heading);
      if (Math.abs(sunRel) < HALF + 0.25) {
        g.globalAlpha = 0.16;
        g.fillStyle = C.imagine;
        g.beginPath();
        g.arc(W / 2 + f * Math.tan(sunRel), horizon - f * Math.tan(SUN_ELEV), clamp(f * 0.05, 14, 40), 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }

      // ridgelines, far to near, each generated fresh from where you stand and look
      const plen = Math.hypot(px, py);
      RIDGES.forEach((L, li) => {
        // you cannot walk through a ridge ring; soft-clamp the eye inside it
        const k = plen > L.R * 0.8 ? (L.R * 0.8) / plen : 1;
        const ex = px * k, ey = py * k;
        const pts: [number, number][] = [];
        for (let sx = 0; sx <= W + 3; sx += 3) {
          const b = heading + Math.atan((sx - W / 2) / f);
          const dx = Math.sin(b), dy = Math.cos(b);
          const pd = ex * dx + ey * dy;
          const t = -pd + Math.sqrt(Math.max(0, pd * pd - (ex * ex + ey * ey) + L.R * L.R));
          const hx = ex + t * dx, hy = ey + t * dy;
          const theta = Math.atan2(hx, hy);
          const u = (theta / (Math.PI * 2) + 0.5) * L.cells;
          const n = (ridge(u, L.cells, li * 7919) - 0.5) * 2;
          const scale = clamp(L.R / t, 0.6, 2.2);
          const y = horizon - H * (L.base + L.amp * n) * scale;
          pts.push([sx, y]);
        }
        g.beginPath();
        g.moveTo(0, horizon + 1);
        pts.forEach(([x, y]) => g.lineTo(x, y));
        g.lineTo(W, horizon + 1);
        g.closePath();
        g.globalAlpha = L.fill;
        g.fillStyle = C.terrain[li];
        g.fill();
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.globalAlpha = L.line;
        g.strokeStyle = C.terrain[li];
        g.lineWidth = L.w;
        g.stroke();
        g.globalAlpha = 1;
      });

      // ground plane: a faint wash, the horizon rule, then a world-fixed grid in perspective
      g.globalAlpha = 0.1;
      g.fillStyle = C.terrain[3];
      g.fillRect(0, horizon, W, H - horizon);
      g.globalAlpha = 1;
      g.strokeStyle = C.rule;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, horizon);
      g.lineTo(W, horizon);
      g.stroke();

      const yFar = horizon + (f * EYE) / GRID_R;
      const zBottom = (f * EYE) / Math.max(1, H - horizon);
      const zNear = Math.max(NEAR, zBottom);
      const grad = g.createLinearGradient(0, yFar, 0, H);
      grad.addColorStop(0, rgba(C.ruleStrong, 0));
      grad.addColorStop(1, rgba(C.ruleStrong, 0.55));
      g.strokeStyle = grad;
      g.lineWidth = 1;
      g.beginPath();
      const s = Math.sin(heading), c = Math.cos(heading);
      const seg = (ax: number, ay: number, bx: number, by: number) => {
        let az = (ax - px) * s + (ay - py) * c, axx = (ax - px) * c - (ay - py) * s;
        let bz = (bx - px) * s + (by - py) * c, bxx = (bx - px) * c - (by - py) * s;
        if (az < zNear && bz < zNear) return;
        if (az < zNear) { const t = (zNear - az) / (bz - az); axx += (bxx - axx) * t; az = zNear; }
        if (bz < zNear) { const t = (zNear - bz) / (az - bz); bxx += (axx - bxx) * t; bz = zNear; }
        g.moveTo(W / 2 + (f * axx) / az, horizon + (f * EYE) / az);
        g.lineTo(W / 2 + (f * bxx) / bz, horizon + (f * EYE) / bz);
      };
      for (let i = Math.ceil(px - GRID_R); i <= Math.floor(px + GRID_R); i++) {
        const d = i - px;
        const half = Math.sqrt(Math.max(0, GRID_R * GRID_R - d * d));
        seg(i, py - half, i, py + half);
      }
      for (let j = Math.ceil(py - GRID_R); j <= Math.floor(py + GRID_R); j++) {
        const d = j - py;
        const half = Math.sqrt(Math.max(0, GRID_R * GRID_R - d * d));
        seg(px - half, j, px + half, j);
      }
      g.stroke();

      // posts, far to near
      const posts: { m: Mark; main: boolean; z: number; x: number }[] = [];
      const consider = (m: Slot, main: boolean) => {
        if (!m) return;
        const v = see(m);
        if (v.z > NEAR) posts.push({ m, main, z: v.z, x: v.x });
      };
      quiet.forEach((q) => consider(q, false));
      consider(landmark, true);
      posts.sort((a, b) => b.z - a.z);
      for (const p of posts) {
        const sx = W / 2 + (f * p.x) / p.z;
        if (sx < -20 || sx > W + 20) continue;
        const foot = horizon + (f * EYE) / p.z;
        const top = horizon - (f * (POST - EYE)) / p.z;
        const w = clamp((f * 0.014) / p.z, 1.2, 3.5);
        const r = clamp((f * 0.035) / p.z, 2.5, 7);
        g.strokeStyle = p.main ? C.imagine : C.faint;
        g.fillStyle = p.main ? C.imagine : C.faint;
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(sx, foot);
        g.lineTo(sx, top);
        g.stroke();
        g.beginPath();
        g.arc(sx, top, r, 0, Math.PI * 2);
        g.fill();
      }
    }

    function drawMap() {
      const g = mctx!;
      g.clearRect(0, 0, MW, MH);
      if (!persistRef.current) return;
      const S = 5; // px per stride
      const cx = MW / 2, cy = MH / 2;
      const toMap = (x: number, y: number) => [cx + (x - px) * S, cy - (y - py) * S] as const;
      // grid every two strides, world-fixed, so walking moves it
      g.strokeStyle = C.rule;
      g.lineWidth = 1;
      g.beginPath();
      const x0 = Math.ceil((px - cx / S) / 2) * 2, x1 = px + cx / S;
      for (let x = x0; x <= x1; x += 2) { const [mx] = toMap(x, 0); g.moveTo(Math.round(mx) + 0.5, 0); g.lineTo(Math.round(mx) + 0.5, MH); }
      const y0 = Math.ceil((py - cy / S) / 2) * 2, y1 = py + cy / S;
      for (let y = y0; y <= y1; y += 2) { const [, my] = toMap(0, y); g.moveTo(0, Math.round(my) + 0.5); g.lineTo(MW, Math.round(my) + 0.5); }
      g.stroke();
      // the field of view
      g.fillStyle = C.imagine;
      g.globalAlpha = 0.12;
      g.beginPath();
      g.moveTo(cx, cy);
      const reach = Math.max(MW, MH);
      g.arc(cx, cy, reach, heading - HALF - Math.PI / 2, heading + HALF - Math.PI / 2);
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
      // the landmarks: this is the store
      const dot = (m: Slot, main: boolean) => {
        if (!m) return;
        const [mx, my] = toMap(m.x, m.y);
        if (mx < -4 || mx > MW + 4 || my < -4 || my > MH + 4) return;
        g.fillStyle = main ? C.imagine : C.faint;
        g.beginPath();
        g.arc(mx, my, main ? 4 : 2.5, 0, Math.PI * 2);
        g.fill();
      };
      quiet.forEach((q) => dot(q, false));
      dot(landmark, true);
      // you
      g.strokeStyle = C.ink;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.sin(heading) * 10, cy - Math.cos(heading) * 10);
      g.stroke();
      g.fillStyle = C.ink;
      g.beginPath();
      g.arc(cx, cy, 3, 0, Math.PI * 2);
      g.fill();
    }

    let lastSig = "";
    function publish() {
      const hdg = ((Math.round(toDeg(heading)) % 360) + 360) % 360;
      const from = Math.hypot(px, py).toFixed(1);
      let lm: Snap["lm"] = null;
      if (landmark && inView(landmark)) {
        const v = see(landmark);
        lm = { deg: Math.round(toDeg(v.rel)), dist: v.dist.toFixed(1) };
      }
      const stored = (landmark ? 1 : 0) + quiet.filter(Boolean).length;
      const sig = `${hdg}|${from}|${lm?.deg}|${lm?.dist}|${stored}`;
      if (sig === lastSig) return;
      lastSig = sig;
      setSnap({ hdg, from, lm, stored });
    }

    /** One frame. `atRest` marks the end of a gesture, when the frame becomes final. */
    function draw(atRest = false) {
      const dh = heading - prevHeading;
      if (dh !== 0) lastTurn = Math.sign(dh);
      forgetAndFill(dh, atRest);
      prevHeading = heading;
      drawScene();
      drawMap();
      publish();
    }

    // ---- input ----------------------------------------------------------
    function apply(a: Action, turn: number, walk: number) {
      if (a === "left") heading -= turn;
      if (a === "right") heading += turn;
      if (a === "fwd") { px += Math.sin(heading) * walk; py += Math.cos(heading) * walk; }
      if (a === "back") { px -= Math.sin(heading) * walk; py -= Math.cos(heading) * walk; }
    }
    const anyHeld = () => (Object.keys(keysRef.current) as Action[]).some((k) => keysRef.current[k]);

    function stopHold() {
      window.clearTimeout(holdTimer.current);
      window.clearInterval(holdInterval.current);
      cancelAnimationFrame(holdRaf.current);
      holdTimer.current = 0; holdInterval.current = 0; holdRaf.current = 0;
    }
    function startHold() {
      if (holdTimer.current || holdInterval.current || holdRaf.current) return;
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = 0;
        if (!anyHeld()) return;
        if (reducedRef.current) {
          holdInterval.current = window.setInterval(() => {
            (Object.keys(keysRef.current) as Action[]).forEach((k) => keysRef.current[k] && apply(k, TURN_STEP, WALK_STEP));
            draw();
          }, HOLD_REPEAT);
        } else {
          let last = performance.now();
          const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            (Object.keys(keysRef.current) as Action[]).forEach((k) => keysRef.current[k] && apply(k, TURN_RATE * dt, WALK_RATE * dt));
            draw();
            holdRaf.current = requestAnimationFrame(tick);
          };
          holdRaf.current = requestAnimationFrame(tick);
        }
      }, HOLD_DELAY);
    }

    // ---- the scripted test ----------------------------------------------
    let scriptTimer = 0, scriptRaf = 0;
    function finishTest(beforeRel: number | null, beforeId: number | null) {
      draw(true);
      scriptingRef.current = false;
      setPhase("idle");
      let v: Verdict;
      if (!landmark || !inView(landmark)) v = { kind: "gone" };
      else if (landmark.id === beforeId) v = { kind: "stayed" };
      else if (beforeRel === null) v = { kind: "gone" };
      else {
        const delta = toDeg(see(landmark).rel - beforeRel);
        const deg = Math.round(Math.abs(delta));
        v = deg < 1 ? { kind: "chance" } : { kind: "moved", deg, side: delta > 0 ? "right" : "left" };
      }
      setVerdict(v);
    }
    function runTest() {
      if (scriptingRef.current) return;
      scriptingRef.current = true;
      stopHold();
      (Object.keys(keysRef.current) as Action[]).forEach((k) => { keysRef.current[k] = false; });
      setVerdict(null);
      setPhase("away");
      const before = landmark && inView(landmark) ? see(landmark).rel : null;
      const beforeId = landmark ? landmark.id : null;
      const h0 = heading;
      if (reducedRef.current) {
        heading = h0 + Math.PI;
        draw(true);
        scriptTimer = window.setTimeout(() => {
          setPhase("back");
          heading = h0;
          finishTest(before, beforeId);
        }, PAUSE_MS + 200);
        return;
      }
      const sweep = (from: number, to: number, then: () => void) => {
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = clamp((now - t0) / SWEEP_MS, 0, 1);
          heading = from + (to - from) * easeInOut(t);
          draw();
          if (t < 1) scriptRaf = requestAnimationFrame(tick);
          else then();
        };
        scriptRaf = requestAnimationFrame(tick);
      };
      sweep(h0, h0 + Math.PI, () => {
        draw(true);
        scriptTimer = window.setTimeout(() => {
          setPhase("back");
          sweep(h0 + Math.PI, h0, () => finishTest(before, beforeId));
        }, PAUSE_MS);
      });
    }

    api.current = {
      step: (a) => {
        if (scriptingRef.current) return;
        apply(a, TURN_STEP, WALK_STEP);
        draw();
        startHold();
      },
      release: () => {
        if (!anyHeld()) { stopHold(); if (!scriptingRef.current) draw(true); }
      },
      draw: () => draw(true),
      runTest,
      holdChanged: (on) => {
        if (on) {
          // switching on with an empty slot would leave nothing to hold; fill it from the heading
          if (!landmark) landmark = spawn(0.2, HALF * 0.8, 0);
          quiet = quiet.map((q) => q ?? spawn(0.5, HALF * 1.2, 0));
        }
        draw(true);
      },
      drag: (dx, w) => {
        if (scriptingRef.current) return;
        heading -= (dx / w) * FOV;
        draw();
      },
    };

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    ro.observe(map);
    resize();
    const themeObs = new MutationObserver(() => { C = readPalette(); draw(); });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
    const onDark = () => { C = readPalette(); draw(); };
    darkMq.addEventListener("change", onDark);
    draw(true);

    return () => {
      stopHold();
      window.clearTimeout(scriptTimer);
      cancelAnimationFrame(scriptRaf);
      ro.disconnect();
      themeObs.disconnect();
      darkMq.removeEventListener("change", onDark);
      reducedMq.removeEventListener("change", onReduced);
      api.current = null;
    };
  }, []);

  const press = useCallback((action: Action, down: boolean) => {
    if (down) {
      if (keysRef.current[action]) return;
      keysRef.current[action] = true;
      api.current?.step(action);
    } else {
      if (!keysRef.current[action]) return;
      keysRef.current[action] = false;
      api.current?.release();
    }
  }, []);

  // drag to look around
  const dragX = useRef<number | null>(null);
  const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.focus();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events have no active pointer */ }
    dragX.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    if (dx === 0) return;
    dragX.current = e.clientX;
    api.current?.drag(dx, e.currentTarget.getBoundingClientRect().width);
  };
  const onPointerUp = () => {
    if (dragX.current === null) return;
    dragX.current = null;
    setDragging(false);
    api.current?.draw();
  };
  const onKeyDown = (e: RKeyboardEvent<HTMLCanvasElement>) => {
    const action = BINDINGS[e.key] ?? BINDINGS[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    press(action, true);
  };
  const onKeyUp = (e: RKeyboardEvent<HTMLCanvasElement>) => {
    const action = BINDINGS[e.key] ?? BINDINGS[e.key.toLowerCase()];
    if (!action) return;
    press(action, false);
  };
  const releaseAll = () => {
    (Object.keys(keysRef.current) as Action[]).forEach((k) => press(k, false));
  };

  const lmText = snap.lm
    ? Math.abs(snap.lm.deg) < 1
      ? T.ahead(snap.lm.dist)
      : T.bearing(Math.abs(snap.lm.deg), snap.lm.deg > 0 ? "right" : "left", snap.lm.dist)
    : T.notInView;
  const aria = T.aria(snap.hdg, lmText, persist);

  const verdictText =
    verdict?.kind === "moved" ? T.moved(verdict.deg, verdict.side)
    : verdict?.kind === "chance" ? T.chance
    : verdict?.kind === "gone" ? T.gone
    : verdict?.kind === "stayed" ? T.stayed
    : null;
  const status = phase === "away" ? T.away : phase === "back" ? T.back : verdictText ?? (focused ? T.keys : T.hint);

  const panel = (
    <div className={compact ? "flex flex-col gap-2 border-t border-rule px-5 py-4" : "flex flex-col gap-2 border-l border-rule p-3"}>
      <p className="label">{T.stored}</p>
      <div
        className={`relative border border-rule bg-paper ${compact ? "h-32 w-full" : "aspect-square w-full"}`}
        role={persist ? "img" : undefined}
        aria-label={persist ? T.mapAria(snap.stored) : undefined}
      >
        <canvas ref={mapRef} className="block h-full w-full" aria-hidden="true" />
        {!persist && (
          <p className="label absolute inset-0 flex items-center justify-center p-3 text-center !normal-case !tracking-normal !text-[0.72rem] leading-snug">
            {T.nothing}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div ref={rootRef}>
      <div className={compact ? "" : "grid grid-cols-[1fr_11.5rem]"}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label={aria}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); releaseAll(); }}
          className={`block h-[clamp(240px,42vh,420px)] w-full touch-pan-y select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-imagine ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        />
        {panel}
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <Pad k="left" glyph="←" label={T.left} press={press} />
          <Pad k="fwd" glyph="↑" label={T.fwd} press={press} />
          <Pad k="back" glyph="↓" label={T.backStep} press={press} />
          <Pad k="right" glyph="→" label={T.right} press={press} />
        </div>
        <button
          type="button"
          onClick={() => api.current?.runTest()}
          disabled={phase !== "idle"}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60"
        >
          {T.test}
        </button>
        <label className="ml-auto flex cursor-pointer items-center gap-3">
          <span className="label">{T.hold}</span>
          <button
            type="button"
            role="switch"
            aria-checked={persist}
            onClick={toggleHold}
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
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.heading, `${snap.hdg}°`],
          [T.fromStart, T.strides(snap.from)],
          [T.landmark, lmText],
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
