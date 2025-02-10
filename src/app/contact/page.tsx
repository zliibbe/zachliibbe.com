import styles from "./page.module.css";
import EmailCopy from "./EmailCopy";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function Contact() {
  return (
    <>
      <div className="page_container">
        <div className="page_contentWrapper">
          <div className={styles.content}>
            <p className={styles.text}>
              The quickest way to reach me is to send me an email:
            </p>
            <EmailCopy />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: "Contact | zachliibbe.com",
};
