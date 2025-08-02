import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Disaster Detection System',
  description: 'Real-time disaster detection and monitoring system',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
