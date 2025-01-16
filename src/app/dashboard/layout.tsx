"use client";
import "../globals.css";
import styles from "../page.module.css";

import Link from "next/link";
import Header from "../components/Header";
import { usePathname } from "next/navigation";

// export const metadata = {
//   title: "Zach Liibbe Portfolio",
//   description: "Zach Liibbe's own little corner of the web",
//   icons: {
//     icon: {
//       url: "/favicon.png",
//       type: "image/png",
//     },
//     shortcut: { url: "/favicon.png", type: "image/png" },
//   },
// };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  return (
    <main>
      {isHomePage && <div className="layout_gradient"></div>}
      <Header />
      {children}
    </main>
  );
}
