import styles from "./page.module.css";
import EmailCopy from "./EmailCopy";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function Contact() {
  return (
    <>
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.content}>
            <p className={styles.text}>
              The quickest way to reach me is to send me an email:
            </p>
            <EmailCopy />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: "Contact | zachliibbe.com",
};
