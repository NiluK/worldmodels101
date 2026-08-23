"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The thesis, running live.
 *
 * A ball moves under real physics (slate). Every so often an internal model
 * rolls out what it *thinks* will happen next (vermilion, dashed) using
 * slightly wrong constants. Those imagined futures hang in the air and decay,
 * so you can see prediction and reality peel apart in real time.
 *
 * Click anywhere to knock the ball — the model has no idea that is coming,
 * which is the other half of the lesson.
 */

type Vec = { x: number; y: number };

const TRUE_G = 0.082;
const TRUE_REST = 0.968;
const TRUE_DRAG = 0.9992;

/**
 * The model is *close*. Close is not the same as right. Its constants keep the
 * same ratio to the true ones as before, so the pace changed and the amount it
 * is wrong by did not.
 */
const MODEL_G = 0.0716;
const MODEL_REST = 0.992;
const MODEL_DRAG = 0.9998;

const BASE_VX = 4.3;
const ROLLOUT_STEPS = 220;
const ROLLOUT_EVERY = 20;
const GHOST_LIFE = 100;
const TRAIL_MAX = 200;

type Ghost = { pts: Vec[]; age: number; birth: number };
/** a mark left where the ball actually met the floor or ceiling */
type Tick = { x: number; y: number; age: number };
const TICK_LIFE = 90;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Strings = {
  happened: string;
  imagined: string;
  invite: string;
  /** one per knock, cycled, so the figure keeps answering you */
  knocks: string[];
  aria: string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    happened: "What happened",
    imagined: "What the model imagined",
    invite: "Click to knock it off course",
    knocks: [
      "It did not see that coming",
      "Nothing in the model knew about your hand",
      "The old predictions carry on regardless",
      "It is confidently wrong now, and will be for a while",
      "No amount of training data covers this",
      "Every arc since is drawn from a state already wrong",
      "Knock it again, it will not learn",
    ],
    aria:
      "An animation: a ball bounces along a path drawn in slate blue, while dashed vermilion arcs show where an internal model predicted it would go, and a label counts how far apart the two have grown.",
  },
  zh: {
    happened: "实际发生的",
    imagined: "模型想象的",
    invite: "点一下，把它撞偏",
    knocks: [
      "这一下它没料到",
      "模型里没有任何东西知道你会伸手",
      "旧的那些预测照旧往前走",
      "它现在自信地错着，而且还要错一阵子",
      "再多的训练数据也覆盖不到这一下",
      "从这里开始的每一条弧，都是从一个已经错了的状态画出来的",
      "再撞一次，它也不会学乖",
    ],
    aria:
      "一段动画：一个球沿着石板蓝的轨迹弹跳，朱红色的虚线弧显示内部模型预测它会去哪里，旁边的标签数着两者已经差了多远。",
  },
};

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  return {
    imagine: s.getPropertyValue("--imagine").trim() || "#c8410e",
    actual: s.getPropertyValue("--actual").trim() || "#2a4e6e",
    rule: s.getPropertyValue("--rule").trim() || "#ddd6c8",
    paper: s.getPropertyValue("--paper").trim() || "#f5f2ea",
    faint: s.getPropertyValue("--ink-faint").trim() || "#a9a093",
  };
}

export function PredictionHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [knocks, setKnocks] = useState(0);
  const locale = useLocale();
  const T = pickText(TEXT, locale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let palette = readPalette();

    const R = 7;
    const pos: Vec = { x: 0, y: 0 };
    const vel: Vec = { x: BASE_VX, y: 0 };
    let pass = 0;
    let trail: Vec[] = [];
    let ghosts: Ghost[] = [];
    let ticks: Tick[] = [];
    let frame = 0;
    let raf = 0;
    let seeded = false;

    /**
     * The one static frame reduced motion gets. It has to be rebuildable:
     * assigning canvas.width wipes the bitmap, so every resize would
     * otherwise leave an empty hero with no loop to redraw it.
     */
    function buildStill() {
      pos.x = W * 0.28;
      pos.y = H * 0.08;
      vel.x = BASE_VX;
      vel.y = 0;
      trail = [];
      ticks = [];
      ghosts = [{ pts: imagine(), age: 0, birth: 0 }];
      for (let i = 0; i < 110; i++) {
        step(pos, vel, TRUE_G, TRUE_REST, TRUE_DRAG);
        trail.push({ ...pos });
      }
      // stand the clock where the rollout has had time to be wrong, so the
      // still frame carries the gap rather than just the two paths
      frame = 110;
      render();
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!seeded) {
        pos.x = -R;
        pos.y = H * 0.08;
        seeded = true;
      }
      pos.y = Math.min(Math.max(pos.y, R), H - R);
      if (reduced && W > 0 && H > 0) buildStill();
    }

    /**
     * Advance a state with a given set of physical constants. The ball
     * traverses left to right and bounces off floor and ceiling; horizontally
     * it just keeps going, and the caller decides what to do at the edge.
     */
    function step(p: Vec, v: Vec, g: number, rest: number, drag: number) {
      v.y += g;
      v.x *= drag;
      v.y *= drag;
      p.x += v.x;
      p.y += v.y;

      if (p.y > H - R) {
        p.y = H - R;
        v.y *= -rest;
        if (p === pos) ticks.push({ x: p.x, y: H, age: 0 });
      }
      if (p.y < R) {
        p.y = R;
        v.y *= -rest;
        if (p === pos) ticks.push({ x: p.x, y: 0, age: 0 });
      }
    }

    /** Send the ball back to the left edge with a fresh drop height. */
    function relaunch() {
      pass += 1;
      pos.x = -R;
      pos.y = H * (0.06 + 0.1 * Math.abs(Math.sin(pass * 1.7)));
      vel.x = BASE_VX;
      vel.y = 0;
      trail = [];
      ghosts = [];
      ticks = [];
    }

    function imagine(): Vec[] {
      const p = { ...pos };
      const v = { ...vel };
      const pts: Vec[] = [{ ...p }];
      for (let i = 0; i < ROLLOUT_STEPS; i++) {
        step(p, v, MODEL_G, MODEL_REST, MODEL_DRAG);
        pts.push({ ...p });
        if (p.x > W + 40) break;
      }
      return pts;
    }

    function drawGrid() {
      ctx!.save();
      ctx!.strokeStyle = palette.rule;
      ctx!.globalAlpha = 0.5;
      ctx!.lineWidth = 1;
      const gap = 32;
      ctx!.beginPath();
      for (let x = gap; x < W; x += gap) {
        ctx!.moveTo(Math.round(x) + 0.5, 0);
        ctx!.lineTo(Math.round(x) + 0.5, H);
      }
      for (let y = gap; y < H; y += gap) {
        ctx!.moveTo(0, Math.round(y) + 0.5);
        ctx!.lineTo(W, Math.round(y) + 0.5);
      }
      ctx!.stroke();
      ctx!.restore();
    }

    function render() {
      ctx!.clearRect(0, 0, W, H);
      drawGrid();

      // the two surfaces, so the bounces have something to happen against
      ctx!.save();
      ctx!.strokeStyle = palette.faint;
      ctx!.globalAlpha = 0.55;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, 0.5);
      ctx!.lineTo(W, 0.5);
      ctx!.moveTo(0, H - 0.5);
      ctx!.lineTo(W, H - 0.5);
      ctx!.stroke();
      ctx!.restore();

      // where it actually met them
      for (const k of ticks) {
        const life = 1 - k.age / TICK_LIFE;
        ctx!.globalAlpha = life * 0.5;
        ctx!.strokeStyle = palette.actual;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(k.x, k.y === 0 ? 0 : H);
        ctx!.lineTo(k.x, k.y === 0 ? 9 : H - 9);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      // imagined futures, oldest and faintest first
      ctx!.lineWidth = 1.5;
      ctx!.setLineDash([3, 4]);
      for (const gh of ghosts) {
        const life = 1 - gh.age / GHOST_LIFE;
        ctx!.globalAlpha = Math.max(0, life * 0.72);
        ctx!.strokeStyle = palette.imagine;
        ctx!.beginPath();
        gh.pts.forEach((pt, i) => (i ? ctx!.lineTo(pt.x, pt.y) : ctx!.moveTo(pt.x, pt.y)));
        ctx!.stroke();

        // where the model thinks it will be when the rollout ends
        const end = gh.pts[gh.pts.length - 1];
        ctx!.setLineDash([]);
        ctx!.globalAlpha = Math.max(0, life * 0.85);
        ctx!.beginPath();
        ctx!.arc(end.x, end.y, 3.2, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.setLineDash([3, 4]);
      }
      ctx!.setLineDash([]);
      ctx!.globalAlpha = 1;

      // what actually happened
      if (trail.length > 1) {
        ctx!.strokeStyle = palette.actual;
        ctx!.lineCap = "round";
        for (let i = 1; i < trail.length; i++) {
          const u = i / trail.length;
          ctx!.lineWidth = 0.9 + u * 1.7;
          ctx!.globalAlpha = 0.18 + u * 0.66;
          ctx!.beginPath();
          ctx!.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx!.lineTo(trail[i].x, trail[i].y);
          ctx!.stroke();
        }
        ctx!.globalAlpha = 1;
      }

      // the present moment
      ctx!.fillStyle = palette.actual;
      ctx!.beginPath();
      ctx!.arc(pos.x, pos.y, R, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = palette.paper;
      ctx!.lineWidth = 2;
      ctx!.stroke();

      /**
       * The claim about now. Each rollout said where the ball would be at
       * every step, so the oldest surviving one has an opinion about this
       * exact instant. Drawing that opinion next to the truth, with the gap
       * between them, is the whole argument of the site in one line.
       */
      const oldest = ghosts[0];
      if (oldest) {
        const i = frame - oldest.birth;
        const claim = oldest.pts[Math.min(i, oldest.pts.length - 1)];
        const gap = Math.hypot(claim.x - pos.x, claim.y - pos.y);
        if (i > 6 && gap > 5 && claim.x < W + 20) {
          ctx!.save();
          ctx!.strokeStyle = palette.imagine;
          ctx!.globalAlpha = 0.9;
          ctx!.lineWidth = 1.25;
          ctx!.setLineDash([2, 3]);
          ctx!.beginPath();
          ctx!.moveTo(pos.x, pos.y);
          ctx!.lineTo(claim.x, claim.y);
          ctx!.stroke();
          ctx!.setLineDash([]);
          ctx!.beginPath();
          ctx!.arc(claim.x, claim.y, 5, 0, Math.PI * 2);
          ctx!.stroke();

          const label = `off by ${Math.round(gap)}`;
          // beyond the ring and away from the ball, so neither covers the other
          const ux = (claim.x - pos.x) / gap;
          const uy = (claim.y - pos.y) / gap;
          const lx = Math.min(W - 42, Math.max(42, claim.x + ux * 18));
          const ly = Math.min(H - 10, Math.max(15, claim.y + uy * 18));
          ctx!.font = `500 11px ${MONO}`;
          ctx!.textAlign = "center";
          // the connector runs under the text, so give it paper to sit on
          const tw = ctx!.measureText(label).width;
          ctx!.globalAlpha = 0.92;
          ctx!.fillStyle = palette.paper;
          ctx!.fillRect(lx - tw / 2 - 4, ly - 9, tw + 8, 13);
          ctx!.globalAlpha = 1;
          ctx!.fillStyle = palette.imagine;
          ctx!.fillText(label, lx, ly);
          ctx!.restore();
        }
      }
    }

    function loop() {
      frame++;
      step(pos, vel, TRUE_G, TRUE_REST, TRUE_DRAG);

      // off the right edge: start the next pass from a new drop height
      if (pos.x > W + R) {
        relaunch();
      }
      // a nudge can send it backwards; bring it home rather than lose it
      if (pos.x < -R * 6) relaunch();

      trail.push({ ...pos });
      if (trail.length > TRAIL_MAX) trail.shift();

      if (frame % ROLLOUT_EVERY === 0) ghosts.push({ pts: imagine(), age: 0, birth: frame });
      ghosts.forEach((g) => (g.age += 1));
      ghosts = ghosts.filter((g) => g.age < GHOST_LIFE);
      ticks.forEach((k) => (k.age += 1));
      ticks = ticks.filter((k) => k.age < TICK_LIFE);

      render();
      raf = requestAnimationFrame(loop);
    }

    function onPointer(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = pos.x - mx;
      const dy = pos.y - my;
      const d = Math.max(Math.hypot(dx, dy), 12);
      const power = 190 / d;
      vel.x += (dx / d) * power;
      vel.y += (dy / d) * power;
      vel.x = Math.max(Math.min(vel.x, 9), -9);
      vel.y = Math.max(Math.min(vel.y, 9), -9);
      setKnocks((n) => n + 1);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const themeObserver = new MutationObserver(() => (palette = readPalette()));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    canvas.addEventListener("pointerdown", onPointer);

    if (reduced) {
      buildStill();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <figure className="relative">
      <canvas
        ref={canvasRef}
        className="block h-[clamp(220px,30vh,330px)] w-full cursor-crosshair touch-none border-y border-rule"
        role="img"
        aria-label={T.aria}
      />
      <figcaption className="mx-auto flex max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-2 px-6 pt-3 md:px-10">
        <span className="key text-actual">{T.happened}</span>
        <span className="key text-imagine">{T.imagined}</span>
        <span className="ml-auto label" aria-live="polite">
          {knocks === 0 ? T.invite : T.knocks[(knocks - 1) % T.knocks.length]}
        </span>
      </figcaption>
    </figure>
  );
}
