import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scouta - Sistema de Evaluación de Jugadores',
  description: 'Plataforma profesional de evaluación y análisis de rendimiento para jugadores de fútbol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  )
}




