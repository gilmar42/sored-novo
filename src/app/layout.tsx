import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/utils/cn'
import Sidebar from '@/components/Sidebar'
import DashboardProvider from '@/components/DashboardProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

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
    <html lang="pt-BR" className={cn('h-full dark', inter.variable)} suppressHydrationWarning>
      <body className={`${inter.className} h-full font-sans`}>
        <ThemeProvider>
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
