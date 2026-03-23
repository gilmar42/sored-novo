import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/utils/cn'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'SORED - Sistema de Orçamento Industrial',
  description: 'Plataforma completa para gestão e geração de orçamentos industriais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={cn('h-full', inter.variable)} suppressHydrationWarning>
      <body className={`${inter.className} h-full font-sans`}>
        {children}
      </body>
    </html>
  )
}
