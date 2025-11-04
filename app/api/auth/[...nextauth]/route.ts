import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 [NextAuth] signIn callback triggered');
      console.log('User:', user);
      console.log('Account:', account);

      try {
        // Send user data to Backend to get JWT token
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-chatroom-api.fly.dev/api/auth';
        const response = await fetch(`${backendUrl}/external-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'Google',
            providerKey: user.id,
            email: user.email,
            username: user.name || user.email?.split('@')[0],
          }),
        });

        console.log('🔐 [NextAuth] Backend response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [NextAuth] Backend returned JWT');

          // Store JWT token in user object (will be passed to jwt callback)
          (user as any).backendToken = data.token;
          (user as any).refreshToken = data.refreshToken;
          (user as any).userId = data.userId;

          return true;
        } else {
          const errorText = await response.text();
          console.error('❌ [NextAuth] Backend error:', errorText);
          return false;
        }
      } catch (error) {
        console.error('❌ [NextAuth] Error calling backend:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in - save backend JWT to token
      if (user) {
        console.log('🔐 [NextAuth] jwt callback - initial sign in');
        token.backendToken = (user as any).backendToken;
        token.refreshToken = (user as any).refreshToken;
        token.userId = (user as any).userId;
      }

      return token;
    },

    async session({ session, token }) {
      // Add backend JWT to session
      console.log('🔐 [NextAuth] session callback');
      (session as any).backendToken = token.backendToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).userId = token.userId;

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
