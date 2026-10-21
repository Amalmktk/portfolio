import ExpertiseCard from '@components/ExpertiseCard';
import Reveal from '@components/Reveal';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import SkillBadge from '@components/SkillBadge';
import { useInView } from '@hooks/useInView';
import { EXPERTISE, EXPERTISE_INTRO } from './expertise';
import { SKILLS } from './skills';

const CARD_STAGGER_MS = 80;
const SKILL_STAGGER_MS = 50;

const Expertise = () => {
  const { ref, inView } = useInView<HTMLUListElement>();

  return (
    <Section id="expertise">
      <SectionHeading title="I'm good at this" />
      <Reveal>
        <p className="max-w-2xl text-center leading-relaxed text-zinc-400">
          {EXPERTISE_INTRO}
        </p>
      </Reveal>

      <ul className="grid w-full gap-6 md:grid-cols-2">
        {EXPERTISE.map((item, index) => (
          <li key={item.title}>
            <Reveal delayMs={index * CARD_STAGGER_MS} className="h-full">
              <ExpertiseCard {...item} />
            </Reveal>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-sm tracking-[0.3em] text-zinc-400 uppercase">
        Tech I work with
      </h3>
      <ul
        ref={ref}
        className="flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-10"
      >
        {SKILLS.map((skill, index) => (
          <SkillBadge
            key={skill.name}
            {...skill}
            visible={inView}
            delayMs={index * SKILL_STAGGER_MS}
          />
        ))}
      </ul>
    </Section>
  );
};

export default Expertise;
