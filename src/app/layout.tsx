import {
  // EB_Garamond,
  Lexend,
  // Plus_Jakarta_Sans,
  Roboto_Mono,
} from "next/font/google";
import styles from "./layout.module.css";

// const plusJakartaSans = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-plus-jakarta-sans",
// });

// const garamond = EB_Garamond({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-garamond",
// });

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lexend.variable}`}>
      <body>{children}</body>
    </html>
  );
}
