"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Chapter 1's demonstration.
 *
 * Two identical cars approach identical walls. One is a reflex: it brakes when
 * the wall gets closer than a fixed distance. The other carries a model of its
 * own braking dynamics, rolls it forward every tick, and brakes the moment its
 * imagined future ends inside the wall.
 *
 * At low speed the two are indistinguishable — which is exactly why reflexes
 * survive so long before anyone notices the problem. Raise the speed and only
 * one of them is still doing its job.
 */

const WALL = 0.86;      // wall position, fraction of track
const DECEL = 0.0005;   // available braking, fraction of track per tick^2
// The reflex's trigger distance was tuned at the slider's default speed and is
// correct there. The crossover sits a little past the middle of the range.
const REFLEX_TRIGGER = 0.06;
const SAFETY = 0.012;   // margin the predictive agent leaves itself

type Car = {
  x: number;
  v: number;
  braking: boolean;
  crashed: boolean;
  stopped: boolean;
  /** the predictive car's imagined stopping point, if it has one */
  imagined: number | null;
};

const freshCar = (v: number): Car => ({
  x: 0.02,
  v,
  braking: false,
  crashed: false,
  stopped: false,
  imagined: null,
});

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  const g = (k: string, f: string) => s.getPropertyValue(k).trim() || f;
  return {
    imagine: g("--imagine", "#c8410e"),
    actual: g("--actual", "#2a4e6e"),
    ink: g("--ink", "#191714"),
    muted: g("--ink-muted", "#6b655b"),
    rule: g("--rule", "#ddd6c8"),
    paper: g("--paper", "#f5f2ea"),
    sunk: g("--paper-sunk", "#ece7db"),
  };
}

/** Roll the braking model forward to where it says we would come to rest. */
function imagineStop(x: number, v: number) {
  return x + (v * v) / (2 * DECEL);
}

export function BrakingDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(0.0055);
  const [running, setRunning] = useState(false);
  const [verdict, setVerdict] = useState<{ reflex: string; model: string } | null>(null);

  const carsRef = useRef<{ reflex: Car; model: Car }>({
    reflex: freshCar(speed),
    model: freshCar(speed),
  });
  const runningRef = useRef(false);
  const speedRef = useRef(speed);
  const drawRef = useRef<() => void>(() => {});

  const reset = useCallback(() => {
    carsRef.current = { reflex: freshCar(speedRef.current), model: freshCar(speedRef.current) };
    runningRef.current = false;
    setRunning(false);
    setVerdict(null);
    drawRef.current();
  }, []);

  useEffect(() => {
    speedRef.current = speed;
    if (!runningRef.current) reset();
  }, [speed, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let raf = 0;
    let palette = readPalette();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function lane(i: number) {
      const pad = 34;
      const usable = H - pad * 2;
      return pad + usable * (i === 0 ? 0.26 : 0.82);
    }

    const px = (f: number) => 26 + f * (W - 52);

    function drawLane(i: number, car: Car, label: string, isModel: boolean) {
      const y = lane(i);
      const wallX = px(WALL);

      // lane body — the road, so the figure reads as a scene not a wireframe
      ctx!.fillStyle = palette.sunk;
      ctx!.fillRect(px(0), y - 16, wallX - px(0), 32);

      // the last stretch before the wall, where a mistake stops being recoverable
      ctx!.save();
      ctx!.globalAlpha = 0.16;
      ctx!.fillStyle = palette.imagine;
      ctx!.fillRect(px(WALL - 0.1), y - 16, wallX - px(WALL - 0.1), 32);
      ctx!.restore();

      // centre line
      ctx!.strokeStyle = palette.rule;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(px(0), Math.round(y) + 0.5);
      ctx!.lineTo(wallX, Math.round(y) + 0.5);
      ctx!.stroke();

      // distance ticks
      ctx!.globalAlpha = 0.7;
      for (let t = 0; t <= 10; t++) {
        const x = px((WALL / 10) * t);
        ctx!.beginPath();
        ctx!.moveTo(Math.round(x) + 0.5, y - 4);
        ctx!.lineTo(Math.round(x) + 0.5, y + 4);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      // wall
      ctx!.fillStyle = car.crashed ? palette.imagine : palette.ink;
      ctx!.fillRect(wallX, y - 22, 4, 44);

      // the model's imagined stopping point
      if (isModel && car.imagined !== null && !car.stopped) {
        const ix = px(Math.min(car.imagined, 1.02));
        ctx!.strokeStyle = palette.imagine;
        ctx!.lineWidth = 1.5;
        ctx!.setLineDash([3, 4]);
        ctx!.beginPath();
        ctx!.moveTo(px(car.x), y);
        ctx!.lineTo(ix, y);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.beginPath();
        ctx!.moveTo(ix, y - 11);
        ctx!.lineTo(ix, y + 11);
        ctx!.stroke();
      }

      // car
      const cx = px(Math.min(car.x, WALL));
      ctx!.fillStyle = car.crashed ? palette.imagine : palette.actual;
      ctx!.fillRect(cx - 15, y - 9, 30, 18);
      if (car.braking) {
        ctx!.fillStyle = palette.imagine;
        ctx!.fillRect(cx - 15, y - 9, 5, 18);
      }

      // labels
      ctx!.fillStyle = palette.muted;
      ctx!.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx!.letterSpacing = "1.5px";
      ctx!.fillText(label.toUpperCase(), px(0), y - 26);
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      const { reflex, model } = carsRef.current;
      drawLane(0, reflex, "Reflex / brakes at a fixed distance", false);
      drawLane(1, model, "Model / brakes when it predicts a crash", true);
    }
    drawRef.current = draw;

    function tick(car: Car, isModel: boolean) {
      if (car.crashed || car.stopped) return;

      if (isModel) {
        car.imagined = imagineStop(car.x, car.v);
        if (car.imagined >= WALL - SAFETY) car.braking = true;
      } else if (WALL - car.x < REFLEX_TRIGGER) {
        car.braking = true;
      }

      if (car.braking) car.v = Math.max(0, car.v - DECEL);
      car.x += car.v;

      if (car.x >= WALL) {
        car.x = WALL;
        car.crashed = true;
        car.v = 0;
      } else if (car.v <= 0.000001) {
        car.stopped = true;
      }
    }

    function loop() {
      if (runningRef.current) {
        const { reflex, model } = carsRef.current;
        tick(reflex, false);
        tick(model, true);

        const done =
          (reflex.crashed || reflex.stopped) && (model.crashed || model.stopped);
        if (done) {
          runningRef.current = false;
          setRunning(false);
          const gap = (WALL - model.x) * 100;
          setVerdict({
            reflex: reflex.crashed
              ? "Hit the wall."
              : `Stopped ${((WALL - reflex.x) * 100).toFixed(1)} units short.`,
            model: model.crashed
              ? "Hit the wall."
              : `Stopped ${gap.toFixed(1)} units short.`,
          });
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  function run() {
    const { reflex, model } = carsRef.current;
    if (reflex.crashed || reflex.stopped || model.crashed || model.stopped) {
      carsRef.current = { reflex: freshCar(speed), model: freshCar(speed) };
      setVerdict(null);
    }
    runningRef.current = true;
    setRunning(true);
  }

  const kph = Math.round((speed / 0.0055) * 30);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="block h-[188px] w-full"
        role="img"
        aria-label="Two cars approach two walls. The upper car brakes at a fixed distance; the lower car brakes when its forward simulation predicts it would overshoot."
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4">
        <button
          onClick={running ? () => { runningRef.current = false; setRunning(false); } : run}
          className="border border-ink bg-ink px-5 py-2 text-paper transition-colors hover:border-imagine hover:bg-imagine"
        >
          <span className="label !text-paper">{running ? "Pause" : "Run"}</span>
        </button>
        <button onClick={reset} className="label hover:text-ink transition-colors">
          Reset
        </button>

        <label className="flex flex-1 items-center gap-3 min-w-[16rem]">
          <span className="label whitespace-nowrap">Approach speed</span>
          <input
            type="range"
            min={0.0025}
            max={0.013}
            step={0.0005}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-14 text-right !text-ink">{kph}</span>
        </label>
      </div>

      {verdict && (
        <dl className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
          {[
            ["Reflex", verdict.reflex],
            ["Model", verdict.model],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper-raised px-5 py-3">
              <dt className="label">{k}</dt>
              <dd
                className={`mt-1 text-[0.95rem] ${
                  v.startsWith("Hit") ? "text-imagine" : "text-ink"
                }`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
