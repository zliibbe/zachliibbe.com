import Layout from "../dashboard/layout";
import styles from "../page.module.css";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <>
      <Layout>
        <div
          className={`${styles.page_page} tw-flex tw-flex-col tw-bg-white tw-h-screen tw-mx-32 tw-my-0 tw-rounded-lg tw-p-8`}
        >
          <main
            className={`${styles.main} tw-flex tw-content-center tw-justify-center`}
          >
            <div className="tw-flex-col">
              <h1 className="tw-flex tw-justify-center tw-align-middle tw-py-4 tw-text-xl">
                Contact page
              </h1>
              <p className="tw-flex tw-justify-center tw-py-3">
                The quickest way to reach me is to send me an email:
              </p>
              <p className="tw-flex tw-justify-center tw-text-lg">
                zliibbe@gmail.com
              </p>
              <br />
              <p className="tw-flex tw-justify-center tw-py-3">
                <i>
                  Check back here to see more features on this work in
                  progress...
                </i>
              </p>
            </div>
          </main>
        </div>
        <Footer />
      </Layout>
    </>
  );
}
