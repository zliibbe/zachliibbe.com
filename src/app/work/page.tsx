import React from "react";
import Layout from "../dashboard/layout";
import styles from "./page.module.css";
import Footer from "../components/Footer";
import { Metadata } from "next";
import { Jobs } from "../components/Jobs";

export default function Work() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.overviewSection}>
            <h2 className={styles.overviewTitle}>Overview</h2>
            <p className={styles.overviewText}>
              Experienced Front End Engineer with a passion for simple, clean
              design that delivers a clear message and user experience.
            </p>
            <p className={styles.overviewText}>
              I am excited about finding a team of people who I can collaborate
              with. My observation in tech, is there are often
            </p>
            <p className={styles.overviewText}>
              In the past, I was a cardiac nurse manager. I started at the
              bottom of the totem pole pushing patients around the hospital and
              then worked my up to CNA, then RN, then Nurse Manager. I
              eventually discovered website development to help my cardiac team
              and eventually pursued a fulltime career in tech.
            </p>
            <p className={styles.overviewText}>
              I studied Philosophy & English in undergrad. My foundation in
              Philosophy and English has proven surprisingly powerful in
              software engineering. Philosophyu&apos;s emphasis on logical
              analysis and breaking down complex arguments mirrors the process
              of system design, while the pattern recognition I developed
              studying literature translates directly to understanding
              programming languages. Combined with the ability to question
              fundamental assumptions and communicate complex ideas clearly,
              this unconventional background helps me create elegant,
              well-documented systems that others can readily build upon.
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
    </Layout>
  );
}

export const metadata: Metadata = {
  title: "Work | zachliibbe.com",
};
