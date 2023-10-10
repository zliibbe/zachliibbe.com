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
          <p className={`tw-py-6 tw-text-2xl tw-text-white`}>
            Hey there, I'm Zach!
          </p>
          <h1 className={`tw-py-6 tw-text-5xl tw-flex-wrap tw-text-white`}>
            <strong className="tw-mb-2">Full Stack Web Developer </strong>
            <br></br>&<strong> code craftsman</strong>
          </h1>
          <p className={`tw-text-white tw-text-xl`}>
            Passionate about simple design and powerful impact
          </p>
        </section>

        <section className={`home-hero-image tw-flex-col`}>
          <div>
            <div className="background-shape">
              <Image
                src={zachPic}
                alt="Photo of Zach"
                width="350"
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
