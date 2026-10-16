import { useEffect } from 'react';

function CursorGold() {
  useEffect(() => {
    // Don't initialize on mobile/touch devices
    const isMobile =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768;

    // Don't initialize for visitors who prefer reduced motion
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isMobile || prefersReducedMotion) {
      return;
    }

    const trailLength = 30;
    const cursors: HTMLDivElement[] = [];
    const positions: { x: number; y: number }[] = [];

    // Create trail elements
    for (let i = 0; i < trailLength; i++) {
      const cursor = document.createElement('div');
      const size = 8 - i * 0.15;
      const baseOpacity = Math.max(0, 0.5 - i * 0.015);

      cursor.style.position = 'fixed';
      cursor.style.top = '0';
      cursor.style.left = '0';
      cursor.style.width = `${size}px`;
      cursor.style.height = `${size}px`;
      cursor.style.pointerEvents = 'none';
      cursor.style.borderRadius = '50%';
      cursor.style.background = `radial-gradient(circle at 30% 30%, rgba(255,220,150,${
        baseOpacity * 0.8
      }), rgba(255,200,120,${baseOpacity * 0.6}), rgba(200,150,80,${
        baseOpacity * 0.4
      }), rgba(150,100,50,${baseOpacity * 0.2}), transparent)`;
      cursor.style.mixBlendMode = 'screen';
      cursor.style.boxShadow = `0 0 ${size * 0.8}px rgba(255,200,120,${
        baseOpacity * 0.3
      }), inset -1px -1px 2px rgba(150,100,50,${
        baseOpacity * 0.2
      }), inset 1px 1px 2px rgba(255,220,150,${baseOpacity * 0.3})`;
      cursor.style.zIndex = '9999';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.willChange = 'transform';

      document.body.appendChild(cursor);
      cursors.push(cursor);
      positions.push({ x: 0, y: 0 });
    }

    let mouseX = 0;
    let mouseY = 0;
    let animationFrameId: number;

    const updateCursor = () => {
      for (let i = 0; i < trailLength; i++) {
        if (i === 0) {
          positions[i].x = mouseX;
          positions[i].y = mouseY;
        } else {
          const prev = positions[i - 1];
          const current = positions[i];
          const ease = 0.4 + i * 0.01;

          current.x += (prev.x - current.x) * ease;
          current.y += (prev.y - current.y) * ease;
        }

        cursors[i].style.transform =
          `translate(${positions[i].x}px, ${positions[i].y}px)`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    updateCursor();
    window.addEventListener('mousemove', move);

    return () => {
      window.removeEventListener('mousemove', move);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      cursors.forEach((cursor) => cursor.remove());
    };
  }, []);

  return null;
}

export default CursorGold;
