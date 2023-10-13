import Layout from "../dashboard/layout";
import styles from "../page.module.css";
import Image from "next/image";
import headshot from "../../assets/headshot.png";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function About() {
  return (
    <Layout>
      <div
        className={`${styles.page_page} tw-flex tw-flex-col tw-bg-white tw-h-screen tw-mx-32 tw-my-0 tw-rounded-lg tw-p-8 tw-m-8`}
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
        <div className="tw-flex tw-flex-col tw-align-middle tw-justify-center tw-ml-6">
          <h3 className="tw-text-lg">
            <strong>Welcome!</strong>
          </h3>
          <p className="tw-flex tw-py-4">
            My name is Zach and I'm glad you've somehow ended up here.
          </p>
          <p>
            I'm a software engineer currently between jobs. I'm looking to join
            a company whose mission I believe in and whose values I share.{" "}
          </p>
          <br />
          <div>
            <p>
              I like working on things that can ultimately be simmered down to
              simple design and powerful impact.
            </p>
          </div>
          <br />
          <p className="tw-pb-6">
            I love the complexity and creativity that frontend coding and design
            work brings.
          </p>
        </div>

        <hr className="about_hr hr_about tw-flex-row tw-justify-center tw-content-center tw-align-middle tw-w-32 tw-p-6 tw-c" />

        <ul className="tw-flex tw-flex-col tw-align-middle tw-justify-center tw-ml-6">
          Outside of work hours, you are most likely to find me:
        </ul>
        <br />
        <li className="tw-ml-8">Out running with my dog, Panda. </li>
        <li className="tw-ml-8">Building websites in order to learn more about my craft.</li>
        <li  className="tw-ml-8">
          Reading science-fiction books. I'm currently enjoying book one of
          four:{" "}
          <a href="https://www.amazon.com/We-Are-Legion-Bob-Bobiverse/dp/1680680587">
            We Are Legion (We Are Bob)
          </a> by Dennis E Taylor
          </li>
          <li className="tw-ml-8">Hanging out at home with my wife and two young daughters.</li>
          <br />
          <p className="tw-flex tw-flex-col tw-align-middle tw-justify-center tw-ml-6">
            Everyone deserves a place on the web to call their own and this is my litte spot. I do my best to ensure my spot feels like a living, breathing thing. Thanks for stopping by!
          </p>
        <br />
        <br />
        <p className="tw-flex tw-justify-end tw-content-end tw-mr-4">-Zach</p>
        <Footer />
      </div>
    </Layout>
  );
}
 export const metadata: Metadata = {
    title: 'About | zachliibbe.com'
 }