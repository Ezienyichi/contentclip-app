import type { Metadata } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import '@/styles/globals.css';

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
});

export const metadata: Metadata = { title: 'VangelClip: Clip. Spread. Transform.', description: "Africa's AI-powered clip platform for gospel creators, educators, and inspirational voices." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bodoni.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
