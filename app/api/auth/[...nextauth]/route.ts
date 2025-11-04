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
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '') || 'https://backend-chatroom-api.fly.dev';
        const response = await fetch(`${backendUrl}/api/auth/google-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name || user.email?.split('@')[0],
            googleId: user.id,
            picture: user.image || '',
          }),
        });

        console.log('🔐 [NextAuth] Backend response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [NextAuth] Backend returned:', data);

          // Store JWT token and user data in user object (will be passed to jwt callback)
          (user as any).backendToken = data.token;
          (user as any).userId = data.user?.id || data.userId;
          (user as any).userPicture = data.user?.picture || user.image;

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
        token.userId = (user as any).userId;
        token.userPicture = (user as any).userPicture;
      }

      return token;
    },

    async session({ session, token }) {
      // Add backend JWT to session
      console.log('🔐 [NextAuth] session callback');
      (session as any).backendToken = token.backendToken;
      (session as any).userId = token.userId;
      (session as any).userPicture = token.userPicture;

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
