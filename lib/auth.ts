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
        name: 'Demo Account',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                return null;
            }

            try {
                // Check if user exists in database
                const user = await db.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user) {
                    console.log('User not found in database:', credentials.email);
                    return null;
                }

                // For demo/development, we accept simple password validation
                // In production, you should hash passwords properly
                const validCredentials = [
                    { email: 'demo@example.com', password: 'password' },
                    { email: 'test@example.com', password: 'password' }
                ];

                const isValidCredential = validCredentials.some(
                    cred => cred.email === credentials.email && cred.password === credentials.password
                );

                if (!isValidCredential) {
                    console.log('Invalid credentials for:', credentials.email);
                    return null;
                }

                // Return the user from database with their actual plan
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || 'User',
                    plan: user.plan,
                };
            } catch (error) {
                console.error('Error during credentials authorization:', error);
                return null;
            }
        },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.plan = token.plan as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.plan = user.plan;
        token.sub = user.id;
        token.image = user.image;
      }
      
      // Always fetch fresh user data to get latest image and other updates
      if (token.sub) {
        try {
          const dbUser = await db.user.findUnique({ 
            where: { id: token.sub as string },
            select: { plan: true, image: true }
          });
          if (dbUser) {
            token.plan = dbUser.plan;
            token.image = dbUser.image;
          }
        } catch (error) {
          console.error('Error fetching user data for token:', error);
        }
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
          token.image = dbUser.image;
        } catch (error) {
          console.error('Error handling Google user:', error);
        }
      }
      
      // For credentials provider, the user data is already from database
      if (account?.provider === 'credentials' && user) {
        token.plan = user.plan;
        token.sub = user.id;
        token.image = user.image;
      }
      
      return token;
    },
    async signIn({ user, account }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /chat after successful sign in
      if (url.startsWith("/signin") || url === baseUrl || url.startsWith(baseUrl)) {
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
      
      return `${baseUrl}/chat`;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
});
