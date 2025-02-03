import React from "react";
import styles from "./page.module.css";
import Image from "next/image";
import headshot from "../../../public/headshot.png";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function About() {
  return (
    <>
      <div className={styles.container}>
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
        <div className={styles.contentWrapper}>
          <h3 className={styles.title}>
            <strong>Welcome!</strong>
          </h3>
          <p className={styles.paragraph}>
            My name is Zach and I&apos;m glad you&apos;ve somehow ended up here.
          </p>
          <p>I&apos;m a software engineer currently between jobs.</p>
          <p>
            I&apos;m looking to join a company whose mission I believe in and
            whose values I share.
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

        <p className={styles.listTitle}>
          Outside of work hours, you are most likely to find me:
        </p>
        <ul className={styles.listContainer}>
          <br />
          <li className={styles.listItem}>
            Out on a run with my dog, Panda, or swimming laps in my local pool.
          </li>
          <li className={styles.listItem}>
            Curled up with a good book. Check out my{" "}
            <a
              href="https://www.goodreads.com/review/list/24890536-zach?shelf=zach-read"
              target="_blank"
              rel="noopener noreferrer"
            >
              Goodreads
            </a>{" "}
            to see what I&apos;m reading or what I&apos;ve read recently.
          </li>
          <li className={styles.listItem}>
            Building websites in order to learn more about my craft.
          </li>
          <li className={styles.listItem}>
            Hanging out at home with my wife, Laura, and our two young
            daughters.
          </li>
        </ul>
        <br />
        <p className={styles.personalNote}>
          Everyone deserves a place on the web to call their own and this is my
          litte spot. I do my best to ensure my spot feels like a living,
          breathing thing. Thanks for stopping by!
        </p>
        <br />
        <br />
        <p className={styles.signature}>-Zach</p>
        <Footer />
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: "About | zachliibbe.com",
};
