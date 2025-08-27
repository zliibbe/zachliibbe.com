import styles from "./page.module.css";
import EmailCopy from "./EmailCopy";
import Footer from "../components/Footer";
import { Metadata } from "next";

export default function Contact() {
  return (
    <>
      <main className={styles.main}>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              <p className={styles.text}>
                The quickest way to reach me is to send me an email:
              </p>
              <EmailCopy />
            </div>
          </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: "Contact Zach Liibbe | Get in Touch with Full Stack Developer",
  description:
    "Get in touch with Zach Liibbe, full-stack software engineer. Quick response via email for collaboration opportunities, project inquiries, or just to say hello.",
  keywords: [
    "contact Zach Liibbe",
    "email developer",
    "hire full stack developer",
    "collaboration",
    "project inquiry",
    "software engineer contact",
  ],
  authors: [{ name: "Zach Liibbe" }],
  creator: "Zach Liibbe",
  openGraph: {
    title: "Contact Zach Liibbe | Get in Touch with Full Stack Developer",
    description:
      "Get in touch with Zach Liibbe, full-stack software engineer. Quick response via email for collaboration opportunities, project inquiries, or just to say hello.",
    url: "https://zachliibbe.com/contact",
    siteName: "Zach Liibbe",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Contact Zach Liibbe | Get in Touch with Full Stack Developer",
    description:
      "Get in touch with Zach Liibbe, full-stack software engineer. Quick response via email for collaboration opportunities.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://zachliibbe.com/contact",
  },
};
