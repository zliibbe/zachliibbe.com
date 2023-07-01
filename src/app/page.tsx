import Image from "next/image";
import zachPic from "../assets/just-zach.png";
import styles from "./page.module.css";
import Head from "next/head";
import Layout from "./dashboard/layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <main className={`flex`}>
        <h1>
          <code>currently a Work In Progress...</code>
        </h1>
        <section className={`flex-col`}>
          <h5 className={styles.description}>{`Hey there, I'm Zach!`}</h5>
          <h1 className={styles.description}>Full Stack Software Engineer</h1>
          <br></br>
          <p className={styles.description}>simple design, powerful impact</p>
        </section>
        <section>
          <div className="background-shape"></div>
          <Image src={zachPic} alt="Photo of Zach" height="350" />
        </section>

        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempore
          dolorem perferendis et eveniet rem expedita accusantium eius,
          voluptatum sequi blanditiis quibusdam beatae quasi enim, ullam ratione
          libero? Inventore, beatae amet.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Possimus sed
          dolore deleniti dolorum hic vero!
        </p>
      </main>
    </Layout>
  );
}
