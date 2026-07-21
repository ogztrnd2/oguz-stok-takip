import type { Metadata } from 'next'
import './globals.css' // CSS DOSYAMIZI BURADAN ÇAĞIRIYORUZ

export const metadata: Metadata = {
  title: 'Oğuzhan Ticaret',
  description: 'İnşaat stok ve cari yönetim paneli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}