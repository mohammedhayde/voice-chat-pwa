import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          console.log("🔐 [GOOGLE AUTH] Signing in with Google...");

          // Send user data to backend API
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '')}/api/auth/external-login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                provider: "Google",
                idToken: account.id_token,
                email: user.email,
                name: user.name,
                profilePicture: user.image,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ [GOOGLE AUTH] Backend error:", errorData);
            return false;
          }

          const data = await response.json();
          console.log("✅ [GOOGLE AUTH] Backend response:", data);

          // Store backend tokens in user object
          user.backendToken = data.token;
          user.refreshToken = data.refreshToken;
          user.userId = data.user.id;
          user.username = data.user.username;
          user.role = data.user.role;
          user.isNewUser = data.user.isNewUser;

          return true;
        } catch (error) {
          console.error("❌ [GOOGLE AUTH] Error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          backendToken: user.backendToken,
          refreshToken: user.refreshToken,
          userId: user.userId,
          username: user.username,
          role: user.role,
          isNewUser: user.isNewUser,
        };
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.backendToken = token.backendToken as string;
      session.user.refreshToken = token.refreshToken as string;
      session.user.userId = token.userId as number;
      session.user.username = token.username as string;
      session.user.role = token.role as string;
      session.user.isNewUser = token.isNewUser as boolean;

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
