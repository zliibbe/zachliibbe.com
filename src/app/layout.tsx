import { Lexend, Roboto_Mono } from "next/font/google";
import styles from "./layout.module.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={lexend.className}>{children}</body>
    </html>
  );
}

export const metadata = {
  title: "Zach Liibbe",
  description: "Zach Liibbe's own little corner of the web",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
};
