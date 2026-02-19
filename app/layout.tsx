import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resumize',
  description: 'Filter resumes efficiently',
  generator: 'Tech Zodia',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
