import Image from 'next/image'
import zachPic from '../assets/just-zach.png'
import styles from './page.module.css'
import Head from 'next/head'
import Layout from './dashboard/layout'
import Link from 'next/link'


export default function Home() {
  return (
    <Layout>
      <main className={styles.description}>
        <section className={styles.description}>
          <h5 className={styles.description}>{`Hey there, I'm Zach!`}</h5>
          <h1 className={styles.description}>Full Stack Engineer</h1>
          <br></br>
          <p className={styles.description}>simple design, powerful impact</p>
        </section>
        <section>
          <div className="background-shape"></div>
          <Image 
            src={zachPic}
            alt="Zach standing" 
            />
        </section>
        
        <h1>Heading in <code>src/app/page.tsx</code></h1>
        <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempore dolorem perferendis et eveniet rem expedita accusantium eius, voluptatum sequi blanditiis quibusdam beatae quasi enim, ullam ratione libero? Inventore, beatae amet.</p>
        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Possimus sed dolore deleniti dolorum hic vero!</p>
      </main>
    </Layout>
  )
}
