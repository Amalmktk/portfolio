import ContactRow from '@components/ContactRow';
import CopyButton from '@components/CopyButton';
import Reveal from '@components/Reveal';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import { EMAIL, SOCIAL_LINKS } from '@constants/socialLinks';

const Contact = () => {
  return (
    <Section id="contact" className="pb-32 md:pb-40">
      <SectionHeading title="Contact" />
      <p className="max-w-2xl text-center leading-relaxed text-zinc-400">
        I'm a software architect focused on the frontend. If you'd like to talk
        about frontend architecture, scaling React and TypeScript codebases, or
        a role where that fits, feel free to reach out.
      </p>
      <Reveal className="w-full max-w-3xl">
        <ul className="w-full rounded-2xl border border-cyan-400/30 bg-black/40 px-6 py-2 shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)] backdrop-blur-md sm:px-10">
          <ContactRow
            label="Email"
            value={EMAIL}
            href={`mailto:${EMAIL}`}
            action={<CopyButton text={EMAIL} label="email address" />}
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
      </Reveal>
    </Section>
  );
};

export default Contact;
