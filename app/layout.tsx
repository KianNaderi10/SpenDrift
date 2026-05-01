import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Spendrift — Know your spending personality',
  description: 'Track your spending, discover your money archetype, and drift toward better habits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable} style={{ background: '#08090f' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ background: '#08090f', minHeight: '100vh', color: '#f0f2f8', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
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
