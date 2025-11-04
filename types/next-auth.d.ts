import "next-auth";

declare module "next-auth" {
  interface User {
    backendToken?: string;
    refreshToken?: string;
    userId?: number;
    username?: string;
    role?: string;
    isNewUser?: boolean;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      backendToken?: string;
      refreshToken?: string;
      userId?: number;
      username?: string;
      role?: string;
      isNewUser?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    refreshToken?: string;
    userId?: number;
    username?: string;
    role?: string;
    isNewUser?: boolean;
  }
}
