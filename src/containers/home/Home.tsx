import { RenderMonitor } from 'react-render-pulse';
import Background from '@components/Background';
import Contact from './components/Contact/Contact';
import Experience from './components/Experience/Experience';
import Expertise from './components/Expertise/Expertise';
import Hero from './components/Hero/Hero';
import Performance from './components/Performance/Performance';
import Projects from './components/Projects/Projects';
import Writing from './components/Writing/Writing';

// Each section is a render-pulse area, so the Performance section can show
// how long each one takes to render on visitors' devices. Experience and
// Performance have state of their own, so they put the monitor inside
// themselves: a monitor only sees updates that re-render it.
const Home = () => {
  return (
    <main className="relative flex flex-col items-center">
      <RenderMonitor id="background">
        <Background />
      </RenderMonitor>
      <RenderMonitor id="hero">
        <Hero />
      </RenderMonitor>
      <RenderMonitor id="expertise">
        <Expertise />
      </RenderMonitor>
      <Experience />
      <RenderMonitor id="projects">
        <Projects />
      </RenderMonitor>
      <Performance />
      <RenderMonitor id="writing">
        <Writing />
      </RenderMonitor>
      <RenderMonitor id="contact">
        <Contact />
      </RenderMonitor>
    </main>
  );
};

export default Home;
