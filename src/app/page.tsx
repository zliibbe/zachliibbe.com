import React from "react";
import Image from "next/image";
import zachPic from "../../public/just-zach.png";
import styles from "./page.module.css";
import Footer from "./components/Footer";
import HomeContent from "./components/HomeContent";

export const metadata = {
  title: "Zach Liibbe | Always Iterating",
  description:
    "Zach Liibbe&apos;s corner of the web—thinking, tinkering, and typing it all out. Part work, part words, all curiosity (with the occasional tangent).",
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: { url: "/favicon.png", type: "image/png" },
  },
};

export default function Home() {
  return (
    <HomeContent>
      {/* Design for this site courtesy of Brendan Luna (brendanluna.com) and used with permission. Thanks Brendan! */}
      <div className={styles.heroContainer}>
        <div className={styles.heroGradient} />
        <div className={styles.main}>
          <section className={styles.heroSection}>
            <p className={styles.greeting}>Hey there, I&apos;m Zach!</p>
            <h1 className={styles.title}>
              <span>
                <span className={styles.titleText}>
                  Full Stack Web Developer{" "}
                </span>
                <br />
                &amp;<span className={styles.titleText}> code craftsman</span>
              </span>
            </h1>
            <p className={styles.subtitle}>
              Passionate about simple design and powerful impact
            </p>
          </section>

          <section className={styles.homeImage}>
            <div>
              <div className={styles.archBlur}>
                <Image
                  src={zachPic}
                  alt="Photo of Zach"
                  width={0}
                  height={0}
                  sizes="(min-width: 1024px) 600px,
                  (min-width: 768px) 450px,
                  350px"
                  style={{
                    width: "auto",
                    height: "100%",
                  }}
                  placeholder="empty"
                  priority={true}
                  className={styles.customImage}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </HomeContent>
  );
}
