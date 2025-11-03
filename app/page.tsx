'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VoiceChatRoom from '@/components/VoiceChatRoom';
import InstallPWAButton from '@/components/InstallPWAButton';
import { useAuth } from '@/contexts/AuthContext';
import { getChatRooms, sortRoomsByActivity, ChatRoom, joinChatRoom, joinChatRoomWithToken, JoinRoomResponse, createChatRoom } from '@/lib/chatRoomsService';

// Room visual themes for mapping
const ROOM_THEMES: Record<number, { emoji: string; color: string; iconBg: string; textColor: string }> = {
  1: { emoji: '🌍', color: 'from-blue-500 via-blue-600 to-indigo-600', iconBg: 'bg-blue-100', textColor: 'text-blue-600' },
  2: { emoji: '👥', color: 'from-purple-500 via-purple-600 to-pink-600', iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
  3: { emoji: '🎮', color: 'from-green-500 via-green-600 to-emerald-600', iconBg: 'bg-green-100', textColor: 'text-green-600' },
  4: { emoji: '🎵', color: 'from-pink-500 via-pink-600 to-rose-600', iconBg: 'bg-pink-100', textColor: 'text-pink-600' },
  5: { emoji: '📚', color: 'from-yellow-500 via-amber-600 to-orange-600', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
  6: { emoji: '⚽', color: 'from-red-500 via-red-600 to-rose-600', iconBg: 'bg-red-100', textColor: 'text-red-600' },
  7: { emoji: '💻', color: 'from-indigo-500 via-indigo-600 to-blue-600', iconBg: 'bg-indigo-100', textColor: 'text-indigo-600' },
  8: { emoji: '🎬', color: 'from-orange-500 via-orange-600 to-red-600', iconBg: 'bg-orange-100', textColor: 'text-orange-600' },
  9: { emoji: '🍳', color: 'from-teal-500 via-teal-600 to-cyan-600', iconBg: 'bg-teal-100', textColor: 'text-teal-600' },
  10: { emoji: '✈️', color: 'from-cyan-500 via-sky-600 to-blue-600', iconBg: 'bg-cyan-100', textColor: 'text-cyan-600' },
};

// Fallback theme for rooms without a specific theme
const DEFAULT_THEME = { emoji: '💬', color: 'from-gray-500 via-gray-600 to-slate-600', iconBg: 'bg-gray-100', textColor: 'text-gray-600' };

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Chat rooms state
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState('');

  // Load rooms from API
  useEffect(() => {
    async function loadRooms() {
      try {
        setRoomsLoading(true);
        const fetchedRooms = await getChatRooms();
        const sortedRooms = sortRoomsByActivity(fetchedRooms);
        setRooms(sortedRooms);
        console.log('✅ [ROOMS] Loaded', sortedRooms.length, 'rooms from API');
      } catch (error: any) {
        console.error('❌ [ROOMS] Failed to load rooms:', error);
        setRoomsError(error.message || 'فشل في تحميل الغرف');
      } finally {
        setRoomsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadRooms();
    }
  }, [isAuthenticated]);

  // Agora Configuration (for voice) - من .env.local
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const AGORA_TOKEN = process.env.NEXT_PUBLIC_AGORA_TOKEN || '';

  // Pusher Configuration (for text chat) - من .env.local
  const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
  const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

  // Log configuration on mount
  if (typeof window !== 'undefined') {
    console.log('\n═══════════════════════════════════════════');
    console.log('🔧 [APP CONFIG] Application Configuration');
    console.log('═══════════════════════════════════════════');
    console.log('📡 [AGORA] App ID:', AGORA_APP_ID ? `${AGORA_APP_ID.substring(0, 8)}...${AGORA_APP_ID.substring(AGORA_APP_ID.length - 4)}` : '❌ MISSING');
    console.log('🔑 [AGORA] Token:', AGORA_TOKEN ? 'present (static)' : 'will fetch from server');
    console.log('💬 [PUSHER] Key:', PUSHER_APP_KEY ? `${PUSHER_APP_KEY.substring(0, 6)}...${PUSHER_APP_KEY.substring(PUSHER_APP_KEY.length - 4)}` : '❌ MISSING');
    console.log('🌍 [PUSHER] Cluster:', PUSHER_CLUSTER);
    console.log('═══════════════════════════════════════════\n');
  }

  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [joinData, setJoinData] = useState<JoinRoomResponse | null>(null);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Create room modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRoomForm, setCreateRoomForm] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState('');

  // Use authenticated user's name
  const userName = user?.username || '';


  const handleRoomSelect = async (roomId: number) => {
    setJoiningRoom(true);
    setJoinError('');

    try {
      // Try to join room and get Agora token from Backend API
      console.log('🔐 [JOIN] Joining room', roomId, 'via API...');

      try {
        // Attempt to get token from Backend
        const response = await joinChatRoomWithToken(roomId);
        console.log('✅ [JOIN] Joined room and received Agora token from Backend');
        console.log('📋 [TOKEN] Token details:', {
          channelName: response.channelName,
          uid: response.uid,
          expiration: response.tokenExpiration
        });

        // Set join data from Backend response
        console.log('🔑 [PERMISSIONS] User permissions:', response.permissions);
        setJoinData({
          success: response.success,
          message: response.message,
          agoraToken: response.agoraToken,
          channelName: response.channelName,
          uid: response.uid,
          tokenExpiration: response.tokenExpiration,
          permissions: response.permissions
        });

        setSelectedRoom(roomId);
        setIsConfigured(true);
        return; // Success - exit early
      } catch (backendError: any) {
        console.warn('⚠️ [JOIN] Backend did not return token, falling back to Netlify Function...');
        console.warn('Backend error:', backendError.message);

        // Fallback: Register membership separately and get token from Netlify
        await joinChatRoom(roomId);
        console.log('✅ [JOIN] Registered as room member');

        // Get Agora token from Netlify Function
        console.log('🎫 [TOKEN] Getting Agora token from Netlify Function...');
        const channelName = `room-${roomId}`;
        const uid = Math.floor(Math.random() * 1000000);

        const tokenEndpoint = `https://un4chat.netlify.app/.netlify/functions/agora-token?channel=${channelName}&uid=${uid}`;
        const tokenResponse = await fetch(tokenEndpoint);

        if (!tokenResponse.ok) {
          throw new Error('Failed to get Agora token from Netlify Function');
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ [TOKEN] Got Agora token from Netlify Function');

        // Set join data from Netlify response
        // Note: In fallback mode, we don't get permissions from backend
        // Set default member permissions
        console.log('⚠️ [PERMISSIONS] Using default member permissions (fallback mode)');
        setJoinData({
          success: true,
          message: 'Joined successfully',
          agoraToken: tokenData.token,
          channelName: channelName,
          uid: uid,
          tokenExpiration: tokenData.expireTime,
          permissions: {
            isOwner: false,
            isAdmin: false,
            isMember: true,
            canModerate: false,
            canSendMessages: true,
            role: 'Member'
          }
        });

        setSelectedRoom(roomId);
        setIsConfigured(true);
      }
    } catch (err: any) {
      console.error('❌ [JOIN] Failed to join room:', err);
      setJoinError(err.message || 'فشل في الانضمام للغرفة');
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleEnterRoom = () => {
    if (selectedRoom) {
      setIsConfigured(true);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRoom(true);
    setCreateError('');

    try {
      console.log('🏗️ [CREATE] Creating new room...', createRoomForm);
      const newRoom = await createChatRoom(createRoomForm);
      console.log('✅ [CREATE] Room created successfully:', newRoom);

      // Reload rooms
      const fetchedRooms = await getChatRooms();
      const sortedRooms = sortRoomsByActivity(fetchedRooms);
      setRooms(sortedRooms);

      // Reset form and close modal
      setCreateRoomForm({ name: '', description: '', isPrivate: false });
      setShowCreateModal(false);

      // Auto-join the new room
      await handleRoomSelect(newRoom.id);
    } catch (err: any) {
      console.error('❌ [CREATE] Failed to create room:', err);
      setCreateError(err.message || 'فشل في إنشاء الغرفة');
    } finally {
      setCreatingRoom(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">جاري التحميل...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (isConfigured && selectedRoom && userName && joinData) {
    // Find the selected room details
    const selectedRoomData = rooms.find(r => r.id === selectedRoom);

    return (
      <VoiceChatRoom
        agoraAppId={AGORA_APP_ID}
        agoraToken={joinData.agoraToken}
        agoraUid={joinData.uid}
        channelName={joinData.channelName}
        userName={userName}
        userId={user?.userId ? Number(user.userId) : undefined}
        roomId={selectedRoom}
        permissions={joinData.permissions}
      />
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-8 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* User Info & Logout Button */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20">
            <p className="text-white font-bold">
              مرحباً، {userName} {user?.isGuest && '(ضيف)'}
            </p>
          </div>
          <div className="flex gap-3">
            {!user?.isGuest && (
              <Link
                href="/change-password"
                className="bg-blue-500/80 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/20 transition-all hover:scale-105"
              >
                تغيير كلمة المرور 🔐
              </Link>
            )}
            <button
              onClick={logout}
              className="bg-red-500/80 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/20 transition-all hover:scale-105"
            >
              تسجيل الخروج 🚪
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-7xl mb-4 animate-bounce-slow">🎙️</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            غرف الدردشة الصوتية
          </h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-6">
            اختر غرفة وابدأ الدردشة مع الأصدقاء
          </p>
          {/* Create Room Button - Only for registered users */}
          {!user?.isGuest && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform transition-all hover:scale-105"
            >
              <span className="text-2xl">➕</span>
              <span>إنشاء غرفة جديدة</span>
            </button>
          )}
        </div>


        {/* Join Error Message */}
        {joinError && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
              <p className="text-red-200 text-center">❌ {joinError}</p>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        {roomsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-white text-xl flex items-center gap-3">
              <span className="animate-spin">🔄</span> جاري تحميل الغرف...
            </div>
          </div>
        ) : roomsError ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
              <p className="text-red-200 text-center">❌ {roomsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-white text-xl">لا توجد غرف متاحة حالياً</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {rooms.map((room, index) => {
              const theme = ROOM_THEMES[room.id] || DEFAULT_THEME;
              return (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room.id)}
                  disabled={joiningRoom}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-right animate-fade-in-up"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center text-3xl mb-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {theme.emoji}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                    {room.name}
                  </h3>

                  <p className="text-sm text-white/70 mb-3">
                    {room.description || 'غرفة دردشة صوتية'}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>👥</span>
                      <span>{room.activeUsersCount} نشط</span>
                      {room.isPrivate && (
                        <>
                          <span>•</span>
                          <span>🔒 خاصة</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    {joiningRoom ? (
                      <span className="text-xs text-white/70 flex items-center gap-2">
                        <span className="animate-spin">🔄</span> جاري الانضمام...
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                          انقر للدخول
                        </span>
                        <span className="text-2xl transform group-hover:translate-x-1 transition-transform">
                          ←
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* User Settings Card - Only for registered users */}
        {!user?.isGuest && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-2xl">
              <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
                <span>⚙️</span> إعدادات الحساب
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/change-password"
                  className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-6 rounded-xl border border-white/20 transition-all hover:scale-105 text-center flex items-center justify-center gap-2"
                >
                  <span>🔐</span> تغيير كلمة المرور
                </Link>
                <div className="flex-1 bg-white/5 text-white/50 font-bold py-4 px-6 rounded-xl border border-white/10 text-center flex items-center justify-center gap-2 cursor-not-allowed">
                  <span>👤</span> تعديل الملف الشخصي (قريباً)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Features Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span>✨</span> المميزات
            </h3>
            <ul className="space-y-3">
              {[
                'محادثة صوتية فورية عالية الجودة',
                'دردشة نصية في الوقت الفعلي',
                'قائمة المستخدمين المتصلين',
                '10 غرف متنوعة للاختيار',
                'إشعارات صوتية عند وصول رسائل',
                'إمكانية إنشاء غرف خاصة',
              ].map((feature, i) => (
                <li key={i} className="text-white/80 flex items-start gap-2">
                  <span className="text-green-400 mt-1">●</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to use Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span>📱</span> كيفية الاستخدام
            </h3>
            <ol className="space-y-3">
              {[
                'اختر غرفة',
                'أدخل اسمك',
                'ابدأ الدردشة!',
              ].map((step, i) => (
                <li key={i} className="text-white/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>

      {/* PWA Install Button */}
      <InstallPWAButton />

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateError('');
                setCreateRoomForm({ name: '', description: '', isPrivate: false });
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏗️</div>
              <h2 className="text-3xl font-bold text-white mb-2">إنشاء غرفة جديدة</h2>
              <p className="text-white/70">أنشئ غرفتك الخاصة وادعُ أصدقائك</p>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-200 text-sm text-center">{createError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateRoom} className="space-y-5">
              {/* Room Name */}
              <div>
                <label htmlFor="roomName" className="block text-sm font-bold text-white mb-2">
                  اسم الغرفة *
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={createRoomForm.name}
                  onChange={(e) => setCreateRoomForm({ ...createRoomForm, name: e.target.value })}
                  placeholder="مثال: غرفة الأصدقاء"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all text-white placeholder:text-white/40 outline-none"
                  required
                  maxLength={50}
                  disabled={creatingRoom}
                />
              </div>

              {/* Room Description */}
              <div>
                <label htmlFor="roomDescription" className="block text-sm font-bold text-white mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  id="roomDescription"
                  value={createRoomForm.description}
                  onChange={(e) => setCreateRoomForm({ ...createRoomForm, description: e.target.value })}
                  placeholder="وصف مختصر عن الغرفة..."
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all text-white placeholder:text-white/40 outline-none resize-none"
                  rows={3}
                  maxLength={200}
                  disabled={creatingRoom}
                />
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={createRoomForm.isPrivate}
                  onChange={(e) => setCreateRoomForm({ ...createRoomForm, isPrivate: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 text-green-500 focus:ring-2 focus:ring-green-500/50"
                  disabled={creatingRoom}
                />
                <label htmlFor="isPrivate" className="flex-1 cursor-pointer">
                  <div className="text-white font-bold flex items-center gap-2">
                    <span>🔒</span>
                    <span>غرفة خاصة</span>
                  </div>
                  <p className="text-white/60 text-xs mt-1">
                    فقط الأعضاء المدعوين يمكنهم الدخول
                  </p>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creatingRoom || !createRoomForm.name.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {creatingRoom ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔄</span> جاري الإنشاء...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✨</span> إنشاء الغرفة
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
