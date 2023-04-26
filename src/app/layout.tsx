import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Zach Liibbe',
  description: 'A site to demonstrate the who and what of Zach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <html lang="en">
    //   <body className={inter.className}>{children}</body>
    // </html>
    <html lang="en">
      <body>
        <main>
          <nav>
            {/* <Link href="/">
              Home
            </Link>
            <Link href="/notes">
              Notes
            </Link> */}
          </nav>
          {children}
        </main>
      </body>
    </html>
  )
}
