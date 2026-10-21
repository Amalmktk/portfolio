import Background from '@components/Background';
import Contact from './components/Contact/Contact';
import Experience from './components/Experience/Experience';
import Expertise from './components/Expertise/Expertise';
import Hero from './components/Hero/Hero';
import Projects from './components/Projects/Projects';
import Writing from './components/Writing/Writing';

const Home = () => {
  return (
    <main className="relative flex flex-col items-center">
      <Background />
      <Hero />
      <Expertise />
      <Experience />
      <Projects />
      <Writing />
      <Contact />
    </main>
  );
};

export default Home;
