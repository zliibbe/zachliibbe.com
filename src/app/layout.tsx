import { Lexend, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import React from "react";

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
      <body className={lexend.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: "Zach Liibbe - Always Iterating...",
  description:
    "Zach Liibbe's corner of the web—thinking, tinkering, and typing it all out. Part work, part words, all curiosity (with the occasional tangent).",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
};
