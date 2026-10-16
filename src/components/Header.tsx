import { useEffect, useRef, useState } from 'react';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'work', label: 'Work' },
  { id: 'projects', label: 'Projects' },
];
const CONTACT_ID = 'contact';
const SECTION_IDS = [...NAV_ITEMS.map((item) => item.id), CONTACT_ID];

const TAGLINE = 'Amal Muraleedharan · Software Architect, Frontend';

const Header = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Underline direction, inferred from section order (index increases = down)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const activeIndexRef = useRef(0);
  const lockActiveRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const sectionEls = SECTION_IDS.map((id) =>
      document.getElementById(id)
    ).filter((el): el is HTMLElement => el !== null);
    if (sectionEls.length === 0) return;

    // Which section holds the viewport middle?
    const pickActive = () => {
      if (lockActiveRef.current) return;
      const viewportMiddle = window.innerHeight / 2;
      let newId: string | null = null;
      let newIndex = -1;
      for (let i = 0; i < sectionEls.length; i++) {
        const rect = sectionEls[i].getBoundingClientRect();
        if (rect.top <= viewportMiddle && rect.bottom > viewportMiddle) {
          newId = sectionEls[i].id;
          newIndex = SECTION_IDS.indexOf(newId);
          break;
        }
      }
      setActiveSection((prev) => (prev === newId ? prev : newId));
      if (newIndex >= 0 && newIndex !== activeIndexRef.current) {
        setScrollDirection(newIndex > activeIndexRef.current ? 'down' : 'up');
        activeIndexRef.current = newIndex;
      }
    };

    const observer = new IntersectionObserver(pickActive, {
      // Keep the detection band around the viewport middle
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    });
    sectionEls.forEach((el) => observer.observe(el));
    pickActive();

    return () => {
      observer.disconnect();
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    const targetIndex = SECTION_IDS.indexOf(sectionId);
    if (targetIndex !== activeIndexRef.current) {
      setScrollDirection(targetIndex > activeIndexRef.current ? 'down' : 'up');
    }

    // Hold the clicked item active while the smooth scroll settles
    lockActiveRef.current = true;
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    setActiveSection(sectionId);

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });

    settleTimerRef.current = window.setTimeout(() => {
      lockActiveRef.current = false;
    }, 500);
  };

  const underlineClass = (id: string) => {
    if (activeSection === id) {
      return scrollDirection === 'down'
        ? 'before:origin-left before:scale-x-100'
        : 'before:origin-right before:scale-x-100';
    }
    return scrollDirection === 'down'
      ? 'before:origin-right'
      : 'before:origin-left';
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-6 py-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => handleNavClick('about')}
        className="flex cursor-pointer items-center gap-3 focus:outline-none"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-400/60 text-xs font-semibold tracking-wider text-cyan-300 transition-transform duration-300 hover:scale-110">
          AM
        </span>
        <span className="hidden font-medium tracking-wide text-zinc-400 md:flex">
          {TAGLINE}
        </span>
      </button>
      <nav className="flex items-center gap-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              handleNavClick(item.id);
            }}
            className={`relative cursor-pointer px-1 py-0.5 text-zinc-200 before:absolute before:-bottom-0.5 before:left-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-cyan-400 before:transition-transform before:duration-300 before:ease-out before:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-right after:scale-x-0 after:transform-gpu after:bg-cyan-400 after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] after:will-change-transform after:content-[''] hover:after:origin-left hover:after:scale-x-100 focus:outline-none motion-reduce:after:transition-none ${underlineClass(item.id)}`}
          >
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            handleNavClick(CONTACT_ID);
          }}
          className={`cursor-pointer rounded-md border border-cyan-400 px-4 py-2 transition-all duration-300 focus:bg-cyan-400/10 focus:text-white focus:shadow-[inset_0_0_7px_1px_rgba(34,211,238,0.55)] focus:outline-none ${
            activeSection === CONTACT_ID
              ? 'bg-[rgba(6,12,18,0.55)] text-zinc-300 shadow-[inset_0_0_10px_1px_rgba(34,211,238,0.55)] backdrop-blur-md'
              : 'bg-transparent text-zinc-200 hover:border-cyan-400/80 hover:bg-[rgba(6,12,18,0.55)] hover:text-zinc-300 hover:shadow-[inset_0_0_10px_1px_rgba(34,211,238,0.55)] hover:backdrop-blur-md'
          }`}
        >
          Contact me
        </button>
      </nav>
    </header>
  );
};

export default Header;
