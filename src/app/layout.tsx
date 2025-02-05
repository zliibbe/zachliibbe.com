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
  applicationName: "zachliibbe.com",
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
        sizes: "32x32",
      },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "zachliibbe.com",
    capable: true,
    statusBarStyle: "default",
  },
};
