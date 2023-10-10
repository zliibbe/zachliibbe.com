import Layout from "../dashboard/layout";
import styles from "../page.module.css";

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
              <h1 className="tw-flex tw-justify-center tw-align-middle tw-py-4">
                Contact page
              </h1>
              <p className="tw-flex tw-justify-center tw-py-3">
                The quickest way to reach me is to send me an email:
                zliibbe@gmail.com
              </p>
              <p className="tw-flex tw-justify-center tw-py-3">...</p>
              <p className="tw-flex tw-justify-center tw-py-3">
                Check back here soon to see more features added to this work in
                progress...
              </p>
            </div>
          </main>
        </div>
      </Layout>
    </>
  );
}
