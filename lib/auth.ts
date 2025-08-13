import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
        name: 'Demo User',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (credentials?.email === 'demo@example.com' && credentials?.password === 'password') {
                // For demo user, return the user object directly
                return {
                    id: 'demo-user-id',
                    email: 'demo@example.com',
                    name: 'Demo User',
                    plan: 'PRO',
                };
            }
            return null;
        },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.plan = user.plan;
        token.sub = user.id;
      }
      
      // For Google OAuth, get or create user in database
      if (account?.provider === 'google' && user?.email) {
        try {
          let dbUser = await db.user.findUnique({ where: { email: user.email } });
          if (!dbUser) {
            dbUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                plan: 'NONE', // New Google users start with no plan
              },
            });
          }
          token.plan = dbUser.plan;
          token.sub = dbUser.id;
        } catch (error) {
          console.error('Error handling Google user:', error);
        }
      }
      
      return token;
    },
    async signIn({ user, account }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /chat after successful sign in
      if (url.startsWith("/signin") || url === baseUrl) {
        return `${baseUrl}/chat`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
});
