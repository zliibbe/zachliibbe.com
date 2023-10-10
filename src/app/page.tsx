import Image from "next/image";
import zachPic from "../assets/just-zach.png";
import styles from "./page.module.css";
import Head from "next/head";
import Layout from "./dashboard/layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <main className={`tw-flex tw-justify-evenly`}>
        <section
          className={`tw-flex tw-flex-col tw-justify-center tw-content-center`}
        >
          <h5 className={styles.description}>{`Hey there, I'm Zach!`}</h5>
          <h1 className={styles.description}>Full Stack Software Engineer</h1>
          <br></br>
          <p className={styles.description}>
            I'm all about simple design and powerful impact
          </p>
        </section>

        <section className={`home-hero-image tw-flex-col`}>
          <div>
            <div className="background-shape">
              <Image
                src={zachPic}
                alt="Photo of Zach"
                width="250"
                height="400"
                decoding="async"
                placeholder="empty"
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
