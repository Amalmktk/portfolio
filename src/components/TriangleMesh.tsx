import { useEffect, useRef } from 'react';

const CELL = 50;
const W = 1000,
  H = 600;
const CX = W / 2,
  CY = H / 2;

const PERIOD = 2 * CELL;
const HALF = 17 * CELL; // 850 — symmetric coverage radius
const SIDE = Math.ceil((2 * HALF) / CELL) + 1; // 35

const X_START = CX - HALF;
const Y_START = CY - HALF;

const COLS = SIDE;
const TOTAL_ROWS = SIDE;

const TRI = 3;
const RADIUS = 60;
const MAX_PUSH = 70;
const SPEED = 0.2;
const ROT_DURATION = 6000;
const VIEWPORT_DIAG = Math.ceil(Math.sqrt(CX * CX + CY * CY));
const CULL_R = VIEWPORT_DIAG + CELL * 4;

// Dot animation: active dots (up===true, checkerboard "1" in 1-x-1) spin ±90° and flash.
const DOT_SPIN_SPEED = (2 * Math.PI) / 10000; // rad/ms — one full ±90° oscillation per 10 s
const DOT_FLASH_SPEED = (2 * Math.PI) / 3000; // rad/ms — opacity pulse, period = 3 s

const RIPPLE_SPEED = 280; // SVG units / second
const RIPPLE_WIDTH = 35; // Gaussian σ of the wavefront bell in SVG units
const RIPPLE_STRENGTH = 22; // peak outward displacement in SVG units
const RIPPLE_MAX_RADIUS = 1400; // expire after wavefront reaches this radius (> max possible click-to-node dist)

// Equilateral triangle centred at (x,y), pointing in direction (base + extraRad).
// base = −π/2 for "up" nodes, +π/2 for "down" nodes.
function dotPoints(x: number, y: number, up: boolean, extraRad = 0): string {
  const s = TRI;
  const r = (up ? -Math.PI / 2 : Math.PI / 2) + extraRad;
  const c = (2 * Math.PI) / 3;
  return (
    `${(x + s * Math.cos(r)).toFixed(2)},${(y + s * Math.sin(r)).toFixed(2)} ` +
    `${(x + s * Math.cos(r + c)).toFixed(2)},${(y + s * Math.sin(r + c)).toFixed(2)} ` +
    `${(x + s * Math.cos(r + 2 * c)).toFixed(2)},${(y + s * Math.sin(r + 2 * c)).toFixed(2)}`
  );
}

const baseNodes = Array.from({ length: TOTAL_ROWS * COLS }, (_, i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  return {
    x: X_START + c * CELL,
    y: Y_START + r * CELL,
    up: (r + c) % 2 === 0,
  };
});

const segments: [number, number][] = [];
for (let r = 0; r < TOTAL_ROWS; r++)
  for (let c = 0; c < COLS - 1; c++)
    segments.push([r * COLS + c, r * COLS + c + 1]);
for (let r = 0; r < TOTAL_ROWS - 1; r++)
  for (let c = 0; c < COLS; c++)
    segments.push([r * COLS + c, (r + 1) * COLS + c]);
for (let r = 0; r < TOTAL_ROWS - 1; r++)
  for (let c = 0; c < COLS - 1; c++) {
    if ((r + c) % 2 === 0)
      segments.push([r * COLS + c, (r + 1) * COLS + c + 1]);
    else segments.push([r * COLS + c + 1, (r + 1) * COLS + c]);
  }

export default function TriangleMesh() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const NS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.cssText = 'width:100%;height:100%;display:block';

    const g = document.createElementNS(NS, 'g');
    svg.appendChild(g);

    const lineEls = segments.map(() => {
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('stroke', 'rgba(34, 211, 238, 0.14)');
      el.setAttribute('stroke-width', '0.8');
      el.style.pointerEvents = 'none';
      g.appendChild(el);
      return el;
    });

    const dotEls = baseNodes.map((n) => {
      const el = document.createElementNS(NS, 'polygon');
      // Active ("1") dots start at base opacity; inactive ("x") dots stay dim
      el.setAttribute(
        'fill',
        n.up ? 'rgba(34, 211, 238, 0.35)' : 'rgba(34, 211, 238, 0.12)'
      );
      el.style.pointerEvents = 'none';
      el.setAttribute('points', dotPoints(n.x, n.y, n.up));
      g.appendChild(el);
      return el;
    });

    for (let i = 0; i < segments.length; i++) {
      const [i1, i2] = segments[i];
      lineEls[i].setAttribute('x1', `${baseNodes[i1].x}`);
      lineEls[i].setAttribute('y1', `${baseNodes[i1].y}`);
      lineEls[i].setAttribute('x2', `${baseNodes[i2].x}`);
      lineEls[i].setAttribute('y2', `${baseNodes[i2].y}`);
    }

    container.appendChild(svg);

    // Reduced motion: render the mesh once, statically, with no animation
    // loop, no pointer repulsion, and no click ripples.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => container.removeChild(svg);
    }

    let scrollY = 0;
    let rotAngle = 0,
      rotFrom = 0,
      rotTo = 0,
      rotStart: number | null = null;
    let mouseX = NaN,
      mouseY = NaN;
    let prevRotAngle = NaN,
      prevMouseX = NaN,
      prevMouseY = NaN;

    const posX = new Float32Array(baseNodes.length);
    const posY = new Float32Array(baseNodes.length);
    const ripX = new Float32Array(baseNodes.length);
    const ripY = new Float32Array(baseNodes.length);
    const changed = new Uint8Array(baseNodes.length);
    for (let i = 0; i < baseNodes.length; i++) {
      posX[i] = baseNodes[i].x;
      posY[i] = baseNodes[i].y;
    }

    // Active ripples: origin in SVG viewport space (same coords as mouseX/mouseY)
    const ripples: Array<{ vx: number; vy: number; start: number }> = [];

    const svgCoords = (clientX: number, clientY: number) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = svgCoords(e.clientX, e.clientY);
      if (!p) return;
      mouseX = p.x;
      mouseY = p.y;
    };
    const onMouseLeave = () => {
      mouseX = NaN;
      mouseY = NaN;
    };
    const onClick = (e: MouseEvent) => {
      const p = svgCoords(e.clientX, e.clientY);
      if (!p) return;
      ripples.push({ vx: p.x, vy: p.y, start: performance.now() });
    };
    svg.addEventListener('mousemove', onMouseMove);
    svg.addEventListener('mouseleave', onMouseLeave);
    svg.addEventListener('click', onClick);

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          rotFrom = rotAngle;
          rotTo = rotAngle + 90;
          rotStart = performance.now();
        },
        3000 + Math.random() * 2000
      );
    };
    schedule();

    let raf: number;
    const tick = (now: number) => {
      scrollY += SPEED;

      if (rotStart !== null) {
        const t = Math.min((now - rotStart) / ROT_DURATION, 1);
        rotAngle =
          rotFrom + (rotTo - rotFrom) * (0.5 - Math.cos(Math.PI * t) / 2);
        if (t >= 1) {
          rotStart = null;
          schedule();
        }
      } else {
        scrollY = scrollY % PERIOD;
      }

      g.setAttribute(
        'transform',
        `translate(0,${-scrollY}) translate(${CX},${CY}) rotate(${rotAngle}) translate(${-CX},${-CY})`
      );

      // Rotation state shared by both repulsion and dot-animation culling
      const a = (rotAngle * Math.PI) / 180;
      const cosA = Math.cos(a),
        sinA = Math.sin(a);
      const visCX = CX + scrollY * sinA;
      const visCY = CY + scrollY * cosA;

      // ── Repulsion + Ripple ───────────────────────────────────────────────────
      const hasMouse = !isNaN(mouseX);
      // scrollY changes every frame, so repulsion viewport distances change even when mouse is
      // stationary — always recompute when the cursor is active.
      const dirty =
        hasMouse ||
        mouseX !== prevMouseX ||
        mouseY !== prevMouseY ||
        rotAngle !== prevRotAngle;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      prevRotAngle = rotAngle;

      const hasRipple = ripples.length > 0;

      if (dirty || hasRipple) {
        changed.fill(0);

        // Repulsion
        if (dirty) {
          if (hasMouse) {
            for (let i = 0; i < baseNodes.length; i++) {
              const nx = baseNodes[i].x,
                ny = baseNodes[i].y;
              if (
                Math.abs(nx - visCX) > CULL_R ||
                Math.abs(ny - visCY) > CULL_R
              )
                continue;
              const dx = nx - CX,
                dy = ny - CY;
              const vx = dx * cosA - dy * sinA + CX;
              const vy = dx * sinA + dy * cosA + CY - scrollY;
              const rdx = vx - mouseX,
                rdy = vy - mouseY;
              const dist2 = rdx * rdx + rdy * rdy;
              if (dist2 < RADIUS * RADIUS && dist2 > 0) {
                const dist = Math.sqrt(dist2);
                const f =
                  (Math.sin((Math.PI * dist) / RADIUS) * MAX_PUSH) / dist;
                const dvx = rdx * f,
                  dvy = rdy * f;
                const nx2 = nx + dvx * cosA + dvy * sinA;
                const ny2 = ny - dvx * sinA + dvy * cosA;
                if (nx2 !== posX[i] || ny2 !== posY[i]) {
                  posX[i] = nx2;
                  posY[i] = ny2;
                  changed[i] = 1;
                }
              } else if (posX[i] !== nx || posY[i] !== ny) {
                posX[i] = nx;
                posY[i] = ny;
                changed[i] = 1;
              }
            }
          } else {
            for (let i = 0; i < baseNodes.length; i++) {
              if (posX[i] !== baseNodes[i].x || posY[i] !== baseNodes[i].y) {
                posX[i] = baseNodes[i].x;
                posY[i] = baseNodes[i].y;
                changed[i] = 1;
              }
            }
          }
        }

        // Ripple: radial shockwave outward from click, displacing nodes at wavefront
        if (hasRipple) {
          for (let i = 0; i < baseNodes.length; i++) {
            const nx = baseNodes[i].x,
              ny = baseNodes[i].y;
            // Node in viewport space (base position, before repulsion)
            const dx = nx - CX,
              dy = ny - CY;
            const vx = dx * cosA - dy * sinA + CX;
            const vy = dx * sinA + dy * cosA + CY - scrollY;

            let newRipX = 0,
              newRipY = 0;

            for (let r = 0; r < ripples.length; r++) {
              const rip = ripples[r];
              const R = ((now - rip.start) / 1000) * RIPPLE_SPEED;
              const rdx = vx - rip.vx,
                rdy = vy - rip.vy;
              const dist2 = rdx * rdx + rdy * rdy;

              // Ring culling: skip nodes outside the active wavefront band (±3σ)
              const Rmin = R - RIPPLE_WIDTH * 3;
              if (Rmin > 0 && dist2 < Rmin * Rmin) continue;
              if (dist2 > (R + RIPPLE_WIDTH * 3) * (R + RIPPLE_WIDTH * 3))
                continue;

              const d = Math.sqrt(dist2);
              if (d < 0.5) continue;

              const dR = (d - R) / RIPPLE_WIDTH;
              const amp =
                RIPPLE_STRENGTH * Math.exp(-dR * dR * 0.5) * Math.exp(-R / 350); // amplitude half-life ~350 SVG units

              // Outward viewport displacement → group space
              const dvx = (rdx / d) * amp,
                dvy = (rdy / d) * amp;
              newRipX += dvx * cosA + dvy * sinA;
              newRipY += -dvx * sinA + dvy * cosA;
            }

            if (newRipX !== ripX[i] || newRipY !== ripY[i]) {
              ripX[i] = newRipX;
              ripY[i] = newRipY;
              changed[i] = 1;
            }
          }

          // Expire ripples AFTER computation so the last frame zeroes all affected ripX/ripY
          for (let r = ripples.length - 1; r >= 0; r--) {
            if (
              ((now - ripples[r].start) / 1000) * RIPPLE_SPEED >
              RIPPLE_MAX_RADIUS
            )
              ripples.splice(r, 1);
          }
        }

        // DOM update: segments + inactive dots (ripple offset layered on top of repulsion)
        for (let i = 0; i < segments.length; i++) {
          const [i1, i2] = segments[i];
          if (!changed[i1] && !changed[i2]) continue;
          const el = lineEls[i];
          el.setAttribute('x1', `${posX[i1] + ripX[i1]}`);
          el.setAttribute('y1', `${posY[i1] + ripY[i1]}`);
          el.setAttribute('x2', `${posX[i2] + ripX[i2]}`);
          el.setAttribute('y2', `${posY[i2] + ripY[i2]}`);
        }
        for (let i = 0; i < baseNodes.length; i++) {
          if (changed[i] && !baseNodes[i].up)
            dotEls[i].setAttribute(
              'points',
              dotPoints(posX[i] + ripX[i], posY[i] + ripY[i], false)
            );
        }
      }

      // ── Active dot animation: spin ±90° + flash, every frame ─────────────────
      const spinRad = Math.sin(now * DOT_SPIN_SPEED) * (Math.PI / 2);
      const flashOpacity =
        0.05 + 0.5 * Math.max(0, Math.sin(now * DOT_FLASH_SPEED));

      for (let i = 0; i < baseNodes.length; i++) {
        if (!baseNodes[i].up) continue;
        const nx = baseNodes[i].x,
          ny = baseNodes[i].y;
        if (Math.abs(nx - visCX) > CULL_R || Math.abs(ny - visCY) > CULL_R)
          continue;
        const r = Math.floor(i / COLS),
          c = i % COLS;
        const sign = ((r + c) / 2) % 2 === 0 ? 1 : -1;
        dotEls[i].setAttribute(
          'points',
          dotPoints(posX[i] + ripX[i], posY[i] + ripY[i], true, spinRad * sign)
        );
        dotEls[i].setAttribute(
          'fill',
          `rgba(34,211,238,${flashOpacity.toFixed(3)})`
        );
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      svg.removeEventListener('mousemove', onMouseMove);
      svg.removeEventListener('mouseleave', onMouseLeave);
      svg.removeEventListener('click', onClick);
      container.removeChild(svg);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden" />
  );
}
