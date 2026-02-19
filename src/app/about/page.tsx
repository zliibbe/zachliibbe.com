import type { Metadata } from 'next';
import Image from 'next/image';
import headshot from '../../../public/headshot.png';
import Footer from '../components/Footer';
import styles from './page.module.css';

export default function About() {
  return (
    <>
      <main>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
            <div className={styles.contentWrapper}>
              <div className={styles.content}>
                <div className={styles.imageContainer}>
                  <Image
                    className={styles.headshot}
                    alt="Zach's Face"
                    src={headshot}
                    width={200}
                    decoding="async"
                    placeholder="blur"
                  />
                </div>

                <div className={styles.introAndRecentContainer}>
                  <div className={styles.introSection}>
                    <h3 className={styles.title}>
                      <strong>Welcome!</strong>
                    </h3>
                    <p className={styles.paragraph}>
                      My name is Zach and I&apos;m glad you&apos;ve somehow
                      ended up here.
                    </p>
                    <p>
                      I&apos;m a full-stack software engineer currently working
                      on backend Java/Spring services at Raytheon. I love teams
                      where diverse viewpoints are genuinely valued and we focus
                      on solving meaningful business problems, whether through
                      code or other solutions.
                    </p>
                    <br />
                    <p>
                      Being an effective team member means caring about both the
                      work and the people doing it. I bring high emotional
                      intelligence and genuine consideration for my teammates as
                      individuals.
                    </p>
                    <br />
                    <div>
                      <p>
                        I like building things that cut through complexity to
                        deliver simple design with powerful impact - like
                        transforming a feature that required reading
                        documentation into something users intuitively
                        understand in seconds.
                      </p>
                    </div>
                    <br />
                    <p className={styles.paragraph}>
                      I love the complexity and creativity that full stack
                      coding and design work brings - solving both technical
                      challenges and user experience puzzles in the same
                      project.
                    </p>
                  </div>

                  <div className={styles.recentSection}>
                    <h6 className={styles.recentTitle}>
                      What I&apos;ve been up to recently...
                    </h6>
                    <li className={styles.recentItem}>
                      Building a home server and migrating services into Docker
                      containers — slowly replacing cloud subscriptions one
                      self-hosted app at a time.
                    </li>
                    <li className={styles.recentItem}>
                      Training for the{' '}
                      <a
                        className={styles.link}
                        href="https://www.runcolfax.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Colfax Marathon
                      </a>{' '}
                      in May 2026. First marathon — the long runs are humbling
                      but I&apos;m loving the process.
                    </li>
                    <li className={styles.recentItem}>
                      My oldest just turned 6 and has gotten completely hooked
                      on rock climbing. Watching her tackle routes that scared
                      her not too long ago is one of the best things I&apos;ve
                      ever seen.
                    </li>
                  </div>
                </div>

                <hr className={styles.divider} />

                <p className={styles.listTitle}>
                  Outside of work hours, you are most likely to find me:
                </p>
                <ul className={styles.listContainer}>
                  <br />
                  <li className={styles.listItem}>
                    Out on a run with my dog, Panda, mountain biking on my local
                    trails, or swimming laps in my local pool.
                  </li>
                  <li className={styles.listItem}>
                    Building websites for therapists in order to learn more
                    about my craft, design, and how digital marketing can have a
                    big impact.
                  </li>
                  <li className={styles.listItem}>
                    Curled up with a good book. Check out my{' '}
                    <a
                      className={styles.link}
                      href="https://www.goodreads.com/review/list/24890536-zach?shelf=zach-read"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Goodreads
                    </a>{' '}
                    to see what I&apos;m reading or what I&apos;ve read
                    recently.
                  </li>
                  <li className={styles.listItem}>
                    Hanging out at home with my wife, Laura, and our two young
                    daughters in imagination land.
                  </li>
                </ul>
                <br />
                <p className={styles.personalNote}>
                  Everyone deserves a place on the web to call their own and
                  this is my litte spot. I do my best to ensure my spot feels
                  like a living, breathing thing. Thanks for stopping by!
                </p>
                <br />
                <br />
                <p className={styles.signature}>-Zach</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: 'About | zachliibbe.com',
};
