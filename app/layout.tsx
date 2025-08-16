import '../styles/globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
          <div className="container">
            <Link href="/" className="navbar-brand">
              Receipt AI
            </Link>
            <div className="navbar-nav ms-auto">
              <Link href="/" className="nav-link">
                Upload
              </Link>
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link href="/records" className="nav-link">
                Records
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
