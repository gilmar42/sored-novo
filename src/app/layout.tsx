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
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚙️</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
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
