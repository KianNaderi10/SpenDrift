import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// [...nextauth] catch-all handles all NextAuth endpoints:
// GET  /api/auth/session, /api/auth/providers, /api/auth/csrf
// POST /api/auth/callback/credentials, /api/auth/signout
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
