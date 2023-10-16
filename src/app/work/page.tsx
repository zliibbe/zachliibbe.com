import Layout from "../dashboard/layout";
import styles from "./page.module.css";
import Footer from "../components/Footer";

export default function Work() {
  return (
    <Layout>
      <div
        className={`tw-flex tw-flex-col tw-bg-white tw-h-screen tw-mx-32 tw-my-0 tw-rounded-lg tw-p-8 tw-opac`}
      >
        <div className="tw-flex tw-border-dashed">
          <div className="overview tw-mx-16 tw-mb-4 tw-align-middle">
            <h2 className="tw-text-xl tw-my-4 tw-bord">Overview</h2>
            <p className=" tw-mb-4" >
              Experienced Front End Engineer with a passion for simple, clean
              design that deliver a clear message to users.
            </p>
            <p className="tw-mb-4">I am excited about finding a team of people who I can collaborate with. My observation in tech, is there are often </p>
            <p className="tw-mb-4">
              In the past, I was a cardiac nurse manager.
            </p>
            <p className="tw-mb-4">
              In the past, I studied Philosophy & English in undergrad. Studying and discussing these subjects has filled me with a zest for life. 
            </p>
          </div>
          <div className="work_recently tw-p-4 tw-flex tw-flex-col tw-rounded-lg">
            <h6 className="tw-py-3">What I've been up to recently...</h6>
            <li className="tw-py-2">
              Studying for the AWS Certified Cloud Solutions Architect exam. 🤓
            </li>
            <li className="tw-py-2">
              Running and walking as much as I can (check my Strava!) to get
              back in shape following a broken scapula & clavicle after a
              mountain bike crash in June. 😅
            </li>
            <li className="tw-py-2">
              Spending quality time with my 3.5 & 1 year-old daughters. 🥰
            </li>
          </div>
        </div>
        <br />
        <br />
        <div className="tw-flex-col tw-justify-center">
          <h2 className="overview tw-flex tw-justify-start tw-m-2 tw-text-xl">
            Experience
          </h2>
          <p className="overview tw-flex tw-justify-start tw-m-2">
            Job component(s) go here (coming soon)
          </p>
          <hr />
          <p className="overview tw-flex tw-justify-start tw-m-2">
            Job component(s) go here (coming soon)
          </p>
          <hr />
          <p className="overview tw-flex tw-justify-start tw-m-2">
            Job component(s) go here (coming soon)
          </p>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
