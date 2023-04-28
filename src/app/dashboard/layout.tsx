import '../globals.css';
import styles from '../page.module.css'

import { Inter } from 'next/font/google'
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Zach Liibbe Portfolio',
  description: 'A site to demonstrate the who and what of Zach',
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: { url: "/favicon.png", type: "image/png" },
  },
}

export default function Layout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Header/>
      {children} 
      <Footer/>
    </main>
  )
}
