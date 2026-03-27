import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Spendrift — Know your spending personality',
  description: 'Track your spending, discover your money archetype, and drift toward better habits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#08090f' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Boogaloo&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#08090f', minHeight: '100vh', color: '#f0f2f8', fontFamily: '"Boogaloo", sans-serif' }}>
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: '#141720',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f0f2f8',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
