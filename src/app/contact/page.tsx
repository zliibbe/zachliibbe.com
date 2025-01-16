import Layout from "../dashboard/layout";
import styles from "./page.module.css";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function Contact() {
  return (
    <Layout>
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.content}>
            <h1 className={styles.heading}>Contact page</h1>
            <p className={styles.text}>
              The quickest way to reach me is to send me an email:
            </p>
            <p className={styles.emailText}>zliibbe@gmail.com</p>
          </div>
        </main>
      </div>
      <Footer />
    </Layout>
  );
}

export const metadata: Metadata = {
  title: "Contact | zachliibbe.com",
};
