import 'next-auth';

// Augments NextAuth's built-in types to include the extra fields we attach in lib/auth.ts.
// Without this, TypeScript would not know that session.user.id or session.user.createdAt exist.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: string | null;
    };
  }

  interface User {
    id: string;
    createdAt?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    createdAt?: string | null;
  }
}
