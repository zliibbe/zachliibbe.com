import Layout from "../dashboard/layout";
import styles from "./page.module.css";
import Image from "next/image";
import headshot from "../../assets/headshot.png";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function About() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <Image
            className={styles.headshot}
            alt="Zach's Face"
            src={headshot}
            width="200"
            decoding="async"
            placeholder="blur"
          />
        </div>
        <div className={styles.contentWrapper}>
          <h3 className={styles.title}>
            <strong>Welcome!</strong>
          </h3>
          <p className={styles.paragraph}>
            My name is Zach and I'm glad you've somehow ended up here.
          </p>
          <p>
            I'm a software engineer currently between jobs. I'm looking to join
            a company whose mission I believe in and whose values I share.
          </p>
          <br />
          <div>
            <p>
              I like working on things that can ultimately be simmered down to
              simple design and powerful impact.
            </p>
          </div>
          <br />
          <p className={styles.paragraph}>
            I love the complexity and creativity that frontend coding and design
            work brings.
          </p>
        </div>

        <hr className={styles.divider} />

        <ul className={styles.listContainer}>
          Outside of work hours, you are most likely to find me:
        </ul>
        <br />
        <li className={styles.listItem}>Out running with my dog, Panda.</li>
        <li className={styles.listItem}>
          Building websites in order to learn more about my craft.
        </li>
        <li className={styles.listItem}>
          Reading science-fiction books. I'm currently enjoying book one of
          four:{" "}
          <a href="https://www.amazon.com/We-Are-Legion-Bob-Bobiverse/dp/1680680587">
            We Are Legion (We Are Bob)
          </a>{" "}
          by Dennis E Taylor
        </li>
        <li className={styles.listItem}>
          Hanging out at home with my wife and two young daughters.
        </li>
        <br />
        <p className={styles.contentWrapper}>
          Everyone deserves a place on the web to call their own and this is my
          litte spot. I do my best to ensure my spot feels like a living,
          breathing thing. Thanks for stopping by!
        </p>
        <br />
        <br />
        <p className={styles.signature}>-Zach</p>
        <Footer />
      </div>
    </Layout>
  );
}

export const metadata: Metadata = {
  title: "About | zachliibbe.com",
};
