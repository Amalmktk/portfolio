import { useEffect, useRef, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'writing', label: 'Writing' },
];
const CONTACT_ID = 'contact';
const SECTION_IDS = [...NAV_ITEMS.map((item) => item.id), CONTACT_ID];

const TAGLINE = 'Amal Muraleedharan · Software Architect, Frontend';

const Header = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Underline direction, inferred from section order (index increases = down)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Mobile menu: close on Escape or when the viewport grows to desktop nav
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia('(min-width: 768px)');
    const close = () => setMenuOpen(false);
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onResize = () => desktop.matches && close();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const handleNavClick = (sectionId: string) => {
    setMenuOpen(false);
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
    <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={() => handleNavClick('about')}
        className="flex cursor-pointer items-center gap-3 focus:outline-none"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-400/60 text-xs font-semibold tracking-wider text-cyan-300 transition-transform duration-300 hover:scale-110">
          AM
        </span>
        <span className="hidden font-medium tracking-wide text-zinc-400 lg:flex">
          {TAGLINE}
        </span>
      </button>
      <nav className="flex items-center gap-3 md:gap-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              handleNavClick(item.id);
            }}
            className={`relative hidden cursor-pointer px-1 py-0.5 text-zinc-200 before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:scale-x-0 before:bg-cyan-400 before:transition-transform before:duration-300 before:ease-out before:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:transform-gpu after:bg-cyan-400 after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] after:will-change-transform after:content-[''] hover:after:origin-left hover:after:scale-x-100 focus:outline-none motion-reduce:after:transition-none md:block ${underlineClass(item.id)}`}
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
          className={`cursor-pointer rounded-md border border-cyan-400 px-3 py-1.5 text-sm whitespace-nowrap transition-all duration-300 focus:bg-cyan-400/10 focus:text-white focus:shadow-[inset_0_0_7px_1px_rgba(34,211,238,0.55)] focus:outline-none md:px-4 md:py-2 md:text-base ${
            activeSection === CONTACT_ID
              ? 'bg-[rgba(6,12,18,0.55)] text-zinc-300 shadow-[inset_0_0_10px_1px_rgba(34,211,238,0.55)] backdrop-blur-md'
              : 'bg-transparent text-zinc-200 hover:border-cyan-400/80 hover:bg-[rgba(6,12,18,0.55)] hover:text-zinc-300 hover:shadow-[inset_0_0_10px_1px_rgba(34,211,238,0.55)] hover:backdrop-blur-md'
          }`}
        >
          Contact me
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-zinc-200 transition-colors hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300 md:hidden"
        >
          {menuOpen ? (
            <FaTimes className="h-5 w-5" />
          ) : (
            <FaBars className="h-5 w-5" />
          )}
        </button>
      </nav>

      {menuOpen && (
        <nav
          id="mobile-menu"
          className="absolute top-full right-0 left-0 border-b border-white/10 bg-[rgba(6,12,18,0.95)] px-4 py-2 backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full cursor-pointer border-l-2 py-3 pl-4 text-left transition-colors focus:outline-none ${
                    activeSection === item.id
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-200 hover:text-cyan-300'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
