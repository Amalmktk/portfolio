import SectionHeading from '@components/SectionHeading';
import SkillBadge from '@components/SkillBadge';
import { useInView } from '@hooks/useInView';
import { SKILLS } from './skills';

const STAGGER_MS = 50;

const Expertise = () => {
  const { ref, inView } = useInView<HTMLUListElement>();

  return (
    <section
      id="expertise"
      className="flex min-h-dvh w-full scroll-mt-16 flex-col items-center justify-center gap-14 px-6 py-24"
    >
      <SectionHeading title="I'm good at this" />
      <ul
        ref={ref}
        className="grid max-w-5xl grid-cols-3 gap-x-6 gap-y-10 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7"
      >
        {SKILLS.map((skill, index) => (
          <SkillBadge
            key={skill.name}
            {...skill}
            visible={inView}
            delayMs={index * STAGGER_MS}
          />
        ))}
      </ul>
    </section>
  );
};

export default Expertise;
