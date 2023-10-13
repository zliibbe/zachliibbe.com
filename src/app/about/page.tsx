import Layout from "../dashboard/layout";
import styles from "../page.module.css";
import Image from "next/image";
import headshot from "../../assets/headshot.png";
import Footer from "../components/Footer";

export default function About() {
  return (
    <Layout>
      <div
        className={`${styles.page_page} tw-flex tw-flex-col tw-bg-white tw-h-screen tw-mx-32 tw-my-0 tw-rounded-lg tw-p-8`}
      >
        <div className="image-circle tw-flex tw-content-center tw-justify-center">
          <Image
            className="headshot_circle"
            alt="Zach's Face"
            src={headshot}
            width="200"
            decoding="async"
            placeholder="blur"
          />
        </div>
        <div>
          <p>Welcome!</p>
          <p>
            My name's Zach and I'm glad you've somehow ended up here at my work
            in progress.
          </p>
          <p>I'm currently a software engineer at location.</p>
          <br />
          <div>
            <p>
              I like working on things that can ultimately be simmered down to
              simple design and powerful impact.
            </p>
          </div>
          <br />
          <p>
            And I love the complexity that font end coding and design work
            brings.
          </p>
          `
        </div>

        <hr className="hr_about tw-flex-row tw-justify-center tw-content-center tw-align-middle tw-w-32 tw-p-6 tw-c" />
        <p>Outside of work hours, you are most likely to find me:</p>
        <ul>
          <li>Example activity 1</li>
        </ul>
        <ul>
          <li>Example activity 2</li>
        </ul>
        <ul>
          <li>Example activity 3</li>
        </ul>
        <p>
          "Everyone deserves a place on the web to call their own, and this is
          my litte spot. I do my best to ensure my spot feels like a living,
          breathing thing. Thanks for stopping by!"
        </p>
        <br />
        <br />
        <p className="tw-flex tw-justify-end tw-content-end tw-mr-4">-Zach</p>
        <Footer/> 
      </div>
    </Layout>
  );
}
