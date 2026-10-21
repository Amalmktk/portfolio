import PostCard from '@components/PostCard';
import Reveal from '@components/Reveal';
import Section from '@components/Section';
import SectionHeading from '@components/SectionHeading';
import { POSTS } from './posts';

const STAGGER_MS = 80;

const Writing = () => {
  return (
    <Section id="writing">
      <SectionHeading title="Things I've written" />
      <ul className="grid w-full gap-6 md:grid-cols-2">
        {POSTS.map((post, index) => (
          <li key={post.title}>
            <Reveal delayMs={index * STAGGER_MS} className="h-full">
              <PostCard {...post} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default Writing;
