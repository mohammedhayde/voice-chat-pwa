import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    userId?: string;
    userPicture?: string;
  }

  interface User {
    backendToken?: string;
    userId?: string;
    userPicture?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    userId?: string;
    userPicture?: string;
  }
}
