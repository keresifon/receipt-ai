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
      </head>
      <body>
        <NextAuthProvider>
          <AuthProvider>
            <Navigation />
            {children}
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
