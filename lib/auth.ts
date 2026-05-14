import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  // JWT strategy keeps sessions stateless — no session table in the DB.
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        // createdAt is forwarded so the dashboard can show "member since" without an extra DB call.
        return { id: user._id.toString(), name: user.name, email: user.email, createdAt: user.createdAt?.toISOString() ?? null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist user id and createdAt into the JWT on initial sign-in.
      if (user) {
        token.id = user.id;
        token.createdAt = user.createdAt;
      }
      // Allow the name to be updated in the token without requiring a full re-login.
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id and createdAt on the client-side session object.
      if (token?.id) session.user.id = token.id as string;
      if (token?.createdAt) (session.user as Record<string, unknown>).createdAt = token.createdAt;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
