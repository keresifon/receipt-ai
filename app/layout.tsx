import '../styles/globals.css'
import type { ReactNode } from 'react'
import { NextAuthProvider } from './providers/NextAuthProvider'
import { AuthProvider } from './providers/AuthProvider'
import Navigation from './components/Navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'No-wahala.net - Smart Family Receipt Management',
  description: 'Transform your receipt management with AI-powered insights and family collaboration. Track expenses, analyze spending patterns, and manage household finances together.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
          crossOrigin="anonymous"
        />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
        />
      </head>
      <body>
        <NextAuthProvider>
          <AuthProvider>
            <Navigation />
            <div className="min-vh-100 d-flex flex-column">
              {children}
              {/* Footer */}
              <footer className="bg-dark text-white py-4 mt-auto w-100">
                <div className="container text-center">
                  <p className="mb-0">
                    © 2025 No-wahala.net. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </NextAuthProvider>
        
        {/* Bootstrap JavaScript for mobile navigation */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" 
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
