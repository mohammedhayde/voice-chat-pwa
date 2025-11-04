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
      console.log('🔐 [NextAuth] User:', JSON.stringify(user, null, 2));
      console.log('🔐 [NextAuth] Account:', JSON.stringify(account, null, 2));

      try {
        // Build backend URL correctly
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-chatroom-api.fly.dev/api';
        // Remove any trailing slashes and /auth suffix
        const baseUrl = apiUrl.replace(/\/auth\/?$/, '').replace(/\/$/, '');
        const fullUrl = `${baseUrl}/auth/google-login`;

        console.log('🔐 [NextAuth] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
        console.log('🔐 [NextAuth] Full URL:', fullUrl);

        const requestBody = {
          email: user.email,
          name: user.name || user.email?.split('@')[0],
          googleId: user.id,
          picture: user.image || '',
        };

        console.log('🔐 [NextAuth] Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🔐 [NextAuth] Backend response status:', response.status);
        console.log('🔐 [NextAuth] Backend response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [NextAuth] Backend returned:', JSON.stringify(data, null, 2));

          // Store JWT token and user data in user object (will be passed to jwt callback)
          (user as any).backendToken = data.token;
          (user as any).refreshToken = data.refreshToken;
          (user as any).userId = data.user?.id || data.userId;
          (user as any).userPicture = data.user?.picture || user.image;
          (user as any).userRole = data.user?.role || 'User';

          return true;
        } else {
          const errorText = await response.text();
          console.error('❌ [NextAuth] Backend error status:', response.status);
          console.error('❌ [NextAuth] Backend error response:', errorText);
          return false;
        }
      } catch (error) {
        console.error('❌ [NextAuth] Error calling backend:', error);
        console.error('❌ [NextAuth] Error details:', error instanceof Error ? error.message : String(error));
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
        token.userPicture = (user as any).userPicture;
        token.userRole = (user as any).userRole;
      }

      return token;
    },

    async session({ session, token }) {
      // Add backend JWT to session
      console.log('🔐 [NextAuth] session callback');
      (session as any).backendToken = token.backendToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).userId = token.userId;
      (session as any).userPicture = token.userPicture;
      (session as any).userRole = token.userRole;

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
