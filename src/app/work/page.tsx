import React from "react";
import styles from "./page.module.css";
import Footer from "../components/Footer";
import { Metadata } from "next";
import { Jobs } from "../components/Jobs";

export default function Work() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.overviewSection}>
            <h2 className={styles.overviewTitle}>Overview</h2>
            <p className={styles.overviewText}>
              I&apos;m an experienced Software Engineer and Web Developer with a
              passion for simple, clean design that delivers clear messages and
              intuitive user experiences.
            </p>
            <p className={styles.overviewText}>
              I love being part of a collaborative team where I can contribute
              meaningful work and grow. In my experience, the best tech
              solutions come from diverse perspectives and strong teamwork.
            </p>
            <p className={styles.overviewText}>
              Before transitioning to tech, I was a cardiac nurse manager. I
              started my career transporting patients, then worked my way up to
              CNA, RN, and eventually Nurse Manager. Along the way, I discovered
              web development while creating tools to support my cardiac team,
              which inspired me to pursue it full-time.
            </p>
            <p className={styles.overviewText}>
              With a background in Philosophy and English, I bring strong
              analytical, pattern recognition, and communication skills to
              software engineering, helping me build clear, well-structured
              systems.
            </p>
          </div>
          <div className={styles.recentSection}>
            <h6 className={styles.recentTitle}>
              What I&apos;ve been up to recently...
            </h6>
            <li className={styles.recentItem}>
              Lifting weights at the gym in the early morning (I&apos;m really
              enjoying the progressive overload of{" "}
              <a href="https://stronglifts.com/5x5/">Stronglifts 5x5</a>) 🏋🏼
            </li>
            <li className={styles.recentItem}>
              Just finished{" "}
              <a href="hhttps://www.amazon.com/Foundation-Isaac-Asimov-ebook/dp/B000FC1PWA/ref=sr_1_5?crid=1AIBKJGWB9F1F&dib=eyJ2IjoiMSJ9.9PSaSltk2VkF7VWEcGfBdtrjDg4h5PRwAWgcWO1GuRoblHPddYm7Kv0A_Vg-gr7vhBMiJylTg208KfZ0M63LZeIbNOY9_c6dKfXbXdHSripuAwBC1xEl_KiPnjJD0rrUYSAdvL2IF8DqCXVcttRMyZrzgTAPHYJn_c_vRXuPh2p6rSFmfa4Y-bfn5EklryDrRZWQyJJCDIySPXsm49eNED2Gcxn90Dsl73qHSXFCbU4.550BBpbokiaNvPfG68sOg9TiRjiOK1ngEQ2Xk8n2VUY&dib_tag=se&keywords=foundations+asimov&qid=1736969242&sprefix=foundations+as%2Caps%2C406&sr=8-5">
                Foundation
              </a>{" "}
              by Isaac Asimov. 📚 I thought it was underwhelming based on my
              expectations. ¯\_(ツ)_/¯
            </li>
            <li className={styles.recentItem}>
              Spending quality time with my 5 & 2.5 year-old daughters. 🥰
            </li>
          </div>
        </div>
        <br />
        <br />
        <div className={styles.experienceSection}>
          <h2 className={styles.experienceTitle}>Experience</h2>
          <Jobs />
        </div>
      </div>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: "Work | zachliibbe.com",
};
