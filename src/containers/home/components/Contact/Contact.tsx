import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaRegCopy } from 'react-icons/fa';
import ContactRow from '@components/ContactRow';
import SectionHeading from '@components/SectionHeading';
import { EMAIL, SOCIAL_LINKS } from '@constants/socialLinks';

const COPIED_RESET_MS = 2000;

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    []
  );

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      return;
    }
    setCopied(true);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPIED_RESET_MS
    );
  };

  return (
    <section
      id="contact"
      className="flex min-h-dvh w-full scroll-mt-16 flex-col items-center justify-center gap-10 px-6 py-24"
    >
      <SectionHeading title="Contact" />
      <p className="max-w-2xl text-center leading-relaxed text-zinc-400">
        I'm a software architect focused on the frontend. If you'd like to talk
        about frontend architecture, scaling React and TypeScript codebases, or
        a role where that fits, feel free to reach out.
      </p>
      <ul className="w-full max-w-3xl rounded-2xl border border-cyan-400/30 bg-black/40 px-6 py-2 shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)] backdrop-blur-md sm:px-10">
        <ContactRow
          label="Email"
          value={EMAIL}
          href={`mailto:${EMAIL}`}
          action={
            <button
              type="button"
              onClick={copyEmail}
              aria-label={copied ? 'Email copied' : 'Copy email address'}
              className="cursor-pointer text-zinc-500 transition-colors duration-300 hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
            >
              {copied ? (
                <FaCheck className="h-4 w-4 text-cyan-300" />
              ) : (
                <FaRegCopy className="h-4 w-4" />
              )}
            </button>
          }
        />
        {SOCIAL_LINKS.map((link) => (
          <ContactRow
            key={link.label}
            label={link.label}
            value={link.display}
            href={link.href}
            external
          />
        ))}
      </ul>
    </section>
  );
};

export default Contact;
