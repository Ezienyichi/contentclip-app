import type { Metadata } from 'next';
import '@/styles/globals.css';
export const metadata: Metadata = { title: 'VangelClip — Clip. Spread. Transform.', description: "Africa's AI-powered clip platform for gospel creators, educators, and inspirational voices." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="preload" as="image" href="/hero-1.webp" type="image/webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/hero-2.webp" type="image/webp" />
        <link rel="preload" as="image" href="/hero-3.webp" type="image/webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
