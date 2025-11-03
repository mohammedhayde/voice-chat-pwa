// Chat Rooms Service - يتصل بالـ API حسب التوثيق

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '') || 'https://backend-chatroom-api.fly.dev/api';
const CHATROOMS_URL = `${API_BASE_URL}/ChatRooms`;

export interface ChatRoom {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  createdByUserId: number;
  createdByUsername: string;
  isPrivate: boolean;
  membersCount: number;
  moderatorsCount: number;
  activeUsersCount: number;
}

export interface RoomPermissions {
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  canModerate: boolean;
  canSendMessages: boolean;
  role: 'Owner' | 'Admin' | 'Member';
}

export interface JoinRoomResponse {
  success: boolean;
  message: string;
  agoraToken: string;
  channelName: string;
  uid: number;
  tokenExpiration: number;
  permissions: RoomPermissions;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

// 1. الحصول على قائمة الغرف
export async function getChatRooms(userId?: number): Promise<ChatRoom[]> {
  const url = userId ? `${CHATROOMS_URL}?userId=${userId}` : CHATROOMS_URL;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('فشل في جلب قائمة الغرف');
  }

  return response.json();
}

// 2. إنشاء غرفة جديدة
export async function createChatRoom(
  data: CreateRoomRequest
): Promise<ChatRoom> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(CHATROOMS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'فشل في إنشاء الغرفة');
  }

  return result;
}

// 3. الانضمام إلى غرفة (للتسجيل في API فقط، بدون Agora token)
export async function joinChatRoom(roomId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في الانضمام للغرفة');
  }

  // لا نحفظ Agora token هنا - سنحصل عليه من agora-token function
}

// 3b. الانضمام إلى غرفة والحصول على Agora Token من API (للاستخدام القديم)
export async function joinChatRoomWithToken(roomId: number): Promise<JoinRoomResponse> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في الانضمام للغرفة');
  }

  // حفظ معلومات Agora للاستخدام
  localStorage.setItem('agoraToken', data.agoraToken);
  localStorage.setItem('agoraChannel', data.channelName);
  localStorage.setItem('agoraUid', data.uid.toString());

  return data;
}

// 4. مغادرة غرفة
export async function leaveChatRoom(roomId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في مغادرة الغرفة');
  }

  // تنظيف البيانات المحلية
  localStorage.removeItem('agoraToken');
  localStorage.removeItem('agoraChannel');
  localStorage.removeItem('agoraUid');
}

// 5. إزالة عضو من غرفة
export async function removeMember(roomId: number, userId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/members/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في إزالة العضو');
  }
}

// 6. حظر مستخدم
export interface BanUserRequest {
  userId?: number;
  ipAddress?: string;
  type: 0 | 1 | 2; // 0=UserOnly, 1=IpOnly, 2=UserAndIp
  reason?: string;
  isPermanent: boolean;
  durationInMinutes?: number;
}

export async function banUser(
  roomId: number,
  data: BanUserRequest
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/ban`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'فشل في حظر المستخدم');
  }
}

// 7. إلغاء حظر مستخدم
export async function unbanUser(roomId: number, userId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/ban/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في إلغاء الحظر');
  }
}

// 8. كتم مستخدم
export interface MuteUserRequest {
  userId?: number;
  ipAddress?: string;
  type: 0 | 1 | 2; // 0=UserOnly, 1=IpOnly, 2=UserAndIp
  reason?: string;
  isPermanent?: boolean;
  durationInMinutes?: number;
}

export async function muteUser(
  roomId: number,
  data: MuteUserRequest
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/mute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'فشل في كتم المستخدم');
  }
}

// 9. إلغاء كتم مستخدم
export async function unmuteUser(roomId: number, userId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/mute/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في إلغاء الكتم');
  }
}

// ==================== NEW APIs ====================

// 10. Room Settings - Get
export interface RoomSettingsDto {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  maxMembers: number | null;
  slowModeSeconds: number;
  onlyAdminsCanPost: boolean;
  requireJoinApproval: boolean;
  welcomeMessage: string | null;
  roomColor: string | null;
  roomIconUrl: string | null;
  createdAt: string;
  createdByUserId: number;
  createdByUsername: string;
  membersCount: number;
}

export async function getRoomSettings(roomId: number): Promise<RoomSettingsDto> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/settings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في جلب إعدادات الغرفة');
  }

  return data;
}

// 11. Room Settings - Update
export interface UpdateRoomSettingsRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number | null;
  slowModeSeconds?: number;
  onlyAdminsCanPost?: boolean;
  requireJoinApproval?: boolean;
  welcomeMessage?: string;
  roomColor?: string;
  roomIconUrl?: string;
}

export async function updateRoomSettings(
  roomId: number,
  data: UpdateRoomSettingsRequest
): Promise<RoomSettingsDto> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'فشل في تحديث إعدادات الغرفة');
  }

  return result;
}

// 12. Room Membership History (all users)
export interface MembershipHistoryDto {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  leftAt: string | null;
  duration: string | null;
  leaveReason: string | null;
  ipAddress: string;
  isCurrentlyInRoom: boolean;
}

export interface MembershipHistoryResult {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  history: MembershipHistoryDto[];
}

export async function getRoomMembershipHistory(
  roomId: number,
  pageNumber: number = 1,
  pageSize: number = 50,
  isCurrentlyInRoom?: boolean | null,
  searchUsername?: string
): Promise<MembershipHistoryResult> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  // Build query parameters
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  if (isCurrentlyInRoom !== undefined && isCurrentlyInRoom !== null) {
    params.append('isCurrentlyInRoom', isCurrentlyInRoom.toString());
  }

  if (searchUsername && searchUsername.trim()) {
    params.append('searchUsername', searchUsername.trim());
  }

  const url = `${CHATROOMS_URL}/${roomId}/membership-history?${params.toString()}`;
  console.log('🌐 [API] Fetching membership history:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  console.log('🌐 [API] Response status:', response.status, 'data:', data);

  if (!response.ok) {
    throw new Error(data.message || 'فشل في جلب سجل الأعضاء');
  }

  return data;
}

// 13. Ban by IP History
export interface BanByIpHistoryRequest {
  targetUserId: number;
  reason?: string;
  isPermanent?: boolean;
  durationInMinutes?: number | null;
  banAllIps?: boolean;
}

export interface BanByIpHistoryResult {
  userId: number;
  username: string;
  bannedIpAddresses: string[];
  totalIpsBanned: number;
  bannedByUsername: string;
  reason: string | null;
  isPermanent: boolean;
  expiresAt: string | null;
}

export async function banByIpHistory(
  roomId: number,
  data: BanByIpHistoryRequest
): Promise<BanByIpHistoryResult> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/ban-by-ip-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'فشل في حظر المستخدم بسجل IP');
  }

  return result;
}

// 15. Promote Member to Admin
export async function promoteToAdmin(roomId: number, targetUserId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/promote-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetUserId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في ترقية العضو إلى مشرف');
  }
}

// 16. Demote Admin to Member
export async function demoteFromAdmin(roomId: number, targetUserId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/demote-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetUserId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في إزالة صلاحيات المشرف');
  }
}

// 17. Transfer Room Ownership
export async function transferOwnership(roomId: number, newOwnerUserId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/transfer-ownership`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ newOwnerUserId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في نقل ملكية الغرفة');
  }
}

// 18. Get Banned Users
export interface BannedUserDto {
  banId: number;
  userId: number;
  username: string;
  email: string;
  ipAddress: string | null;
  banType: 'User' | 'IP' | 'UserAndIP';
  reason: string | null;
  bannedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  bannedByUserId: number;
  bannedByUsername: string;
}

export interface BannedUsersResult {
  totalBanned: number;
  bannedUsers: BannedUserDto[];
}

export async function getBannedUsers(roomId: number): Promise<BannedUsersResult> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/banned`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في جلب قائمة المحظورين');
  }

  return data;
}

// 19. Unban User
export async function unbanUserById(roomId: number, userId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/unban/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في فك الحظر');
  }
}

// دوال مساعدة
export function sortRoomsByActivity(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => b.activeUsersCount - a.activeUsersCount);
}

export function filterPublicRooms(rooms: ChatRoom[]): ChatRoom[] {
  return rooms.filter(room => !room.isPrivate);
}

export function filterPrivateRooms(rooms: ChatRoom[]): ChatRoom[] {
  return rooms.filter(room => room.isPrivate);
}
