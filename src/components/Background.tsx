// Page-wide backdrop: teal radial glow plus a faint SVG film-grain noise layer
const Background = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(10,70,90,0.45),rgba(0,0,0,0.9))]" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.004]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
};

export default Background;
