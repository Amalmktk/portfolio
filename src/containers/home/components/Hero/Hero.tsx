import TriangleMesh from '@components/TriangleMesh';

const Hero = () => {
  return (
    <section
      id="about"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden"
    >
      <TriangleMesh />
      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-4 text-center">
        <span className="text-xs tracking-[0.3em] text-zinc-300">HI, I'M</span>
        <div className="h-px w-40 bg-cyan-400/40" />
        <h1 className="text-4xl font-bold md:text-6xl">Amal Muraleedharan</h1>
        <p className="text-sm text-zinc-300 md:text-base">
          Software Architect · Frontend
        </p>
      </div>
    </section>
  );
};

export default Hero;
