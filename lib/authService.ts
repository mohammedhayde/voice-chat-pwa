// Authentication Service - يتصل بالـ API حسب التوثيق

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
  : 'https://backend-chatroom-api.fly.dev/api/auth';

export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface ErrorResponse {
  message: string;
  retryAfter?: number;
}

// تسجيل حساب جديد
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في التسجيل');
  }

  // حفظ الـ tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.userId.toString());
  localStorage.setItem('username', data.username);

  return data;
}

// تسجيل الدخول
export async function login(
  usernameOrEmail: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usernameOrEmail, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في تسجيل الدخول');
  }

  // حفظ الـ tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.userId.toString());
  localStorage.setItem('username', data.username);

  return data;
}

// تسجيل دخول كضيف
export async function guestLogin(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/guest-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل في تسجيل الدخول كضيف');
    }

    // حفظ الـ tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.userId.toString());
    localStorage.setItem('username', data.username);
    localStorage.setItem('isGuest', 'true');

    return data;
  } catch (error) {
    // Fallback: إنشاء جلسة ضيف بدون Backend
    console.warn('⚠️ Backend unavailable, creating offline guest session');
    const guestId = Math.floor(Math.random() * 1000000);
    const guestData: AuthResponse = {
      userId: guestId,
      username: `Guest_${guestId}`,
      email: '',
      role: 'Guest',
      accessToken: `offline-guest-${guestId}-${Date.now()}`,
      refreshToken: `offline-refresh-${guestId}-${Date.now()}`,
    };

    // حفظ الـ tokens
    localStorage.setItem('accessToken', guestData.accessToken);
    localStorage.setItem('refreshToken', guestData.refreshToken);
    localStorage.setItem('userId', guestData.userId.toString());
    localStorage.setItem('username', guestData.username);
    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('offlineMode', 'true');

    console.log('✅ Offline guest mode activated:', guestData.username);
    return guestData;
  }
}

// تحديث الـ Access Token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } else {
      // Refresh token منتهي، يجب تسجيل الدخول مرة أخرى
      logout();
      return null;
    }
  } catch (error) {
    logout();
    return null;
  }
}

// تسجيل الخروج
export async function logout(): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // مسح جميع البيانات المحلية
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('isGuest');
}

// تغيير كلمة المرور
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('غير مصرح');
  }

  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في تغيير كلمة المرور');
  }
}

// طلب API مع معالجة تلقائية للـ token
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // إذا كان الـ token منتهي
  if (response.status === 401) {
    // جرب تحديث الـ token
    const newToken = await refreshAccessToken();

    if (newToken) {
      // أعد المحاولة مع الـ token الجديد
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } else {
      // فشل التحديث، إعادة توجيه لصفحة تسجيل الدخول
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}

// التحقق من حالة تسجيل الدخول
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

// الحصول على معلومات المستخدم من localStorage
export function getCurrentUser(): {
  userId: string | null;
  username: string | null;
  isGuest: boolean;
} | null {
  if (typeof window === 'undefined') return null;

  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  const isGuest = localStorage.getItem('isGuest') === 'true';

  if (!userId || !username) return null;

  return { userId, username, isGuest };
}

// التحقق من صحة كلمة المرور (frontend validation)
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'يجب أن تحتوي على حرف كبير واحد على الأقل' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'يجب أن تحتوي على حرف صغير واحد على الأقل' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'يجب أن تحتوي على رقم واحد على الأقل' };
  }

  return { valid: true };
}
