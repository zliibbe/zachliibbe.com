import Image from "next/image";
import zachPic from "../../public/just-zach.png";
import styles from "./page.module.css";
import Layout from "./dashboard/layout";
import Footer from "./components/Footer";

export const metadata = {
  title: "Zach Liibbe Webpage",
  description: "Zach Liibbe's own little corner of the web",
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: { url: "/favicon.png", type: "image/png" },
  },
};

export default async function Home() {
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
        </main>
      </div>
      <Footer />
    </Layout>
  );
}
