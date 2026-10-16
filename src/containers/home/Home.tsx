import Background from '@components/Background';
import Contact from './components/Contact/Contact';
import Expertise from './components/Expertise/Expertise';
import Hero from './components/Hero/Hero';

const PLACEHOLDER_SECTIONS = [
  { id: 'work', title: 'Work' },
  { id: 'projects', title: 'Projects' },
];

const Home = () => {
  return (
    <main className="relative flex flex-col items-center">
      <Background />
      <Hero />
      <Expertise />
      {PLACEHOLDER_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="flex min-h-dvh w-full scroll-mt-16 items-center justify-center"
        >
          <h2 className="text-3xl font-semibold text-zinc-300">
            {section.title}
          </h2>
        </section>
      ))}
      <Contact />
    </main>
  );
};

export default Home;
