import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { RenderMonitor } from 'react-render-pulse';
import { SOCIAL_LINKS } from '@constants/socialLinks';

// Fixed left rail (desktop only): back-to-top once past the hero, social icons, line to the bottom
const SocialRail = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setShowBackToTop(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  // Monitored inside, so the back-to-top toggle on scroll is measured
  return (
    <RenderMonitor id="social-rail">
      <aside className="fixed top-24 bottom-0 left-6 z-40 hidden flex-col items-center justify-between lg:flex">
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          tabIndex={showBackToTop ? 0 : -1}
          className={`group flex cursor-pointer flex-col items-center gap-3 text-zinc-400 transition-all duration-500 hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300 ${
            showBackToTop
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
        >
          <FaArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1" />
          <span className="text-xs tracking-[0.25em] [writing-mode:vertical-rl]">
            back to top
          </span>
        </button>

        <div className="flex flex-col items-center gap-5">
          <ul className="flex flex-col items-center gap-5">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="block text-zinc-400 transition-all duration-300 hover:-translate-y-0.5 hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
          <div className="h-24 w-px bg-zinc-500/60" />
        </div>
      </aside>
    </RenderMonitor>
  );
};

export default SocialRail;
