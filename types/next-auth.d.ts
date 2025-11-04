import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    refreshToken?: string;
    userId?: string;
    userPicture?: string;
    userRole?: string;
  }

  interface User {
    backendToken?: string;
    refreshToken?: string;
    userId?: string;
    userPicture?: string;
    userRole?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    refreshToken?: string;
    userId?: string;
    userPicture?: string;
    userRole?: string;
  }
}
