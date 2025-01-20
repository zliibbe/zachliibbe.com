import Image from "next/image";
import zachPic from "../assets/just-zach.png";
import styles from "./page.module.css";
import Head from "next/head";
import Layout from "./dashboard/layout";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <Layout>
      <div className={styles.heroContainer}>
        <div className={styles.heroGradient} />
        <main className={styles.main}>
          <section className={styles.heroSection}>
            <p className={styles.greeting}>Hey there, I'm Zach!</p>
            <h1 className={styles.title}>
              <strong className={styles.titleText}>
                Full Stack Web Developer{" "}
              </strong>
              <br />&<strong> code craftsman</strong>
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
                  width="350"
                  placeholder="empty"
                  priority={true}
                  className={styles.customImage}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </Layout>
  );
}
