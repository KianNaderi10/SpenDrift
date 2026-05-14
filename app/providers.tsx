'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-context';

// Wraps the app in both auth and theme context. Extracted into its own client component
// so the root layout (which must be a Server Component) can import it without becoming a client component.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
