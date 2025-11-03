import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getBannedUsers, BannedUsersResult, unbanUserById } from '@/lib/chatRoomsService';

interface BannedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  canModerate?: boolean;
}

export default function BannedUsersModal({
  isOpen,
  onClose,
  roomId,
  canModerate
}: BannedUsersModalProps) {
  const [bannedUsers, setBannedUsers] = useState<BannedUsersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [unbanningUserId, setUnbanningUserId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBannedUsers();
    }
  }, [isOpen, roomId]);

  const loadBannedUsers = async () => {
    setLoading(true);
    try {
      const data = await getBannedUsers(roomId);
      console.log('📊 [BANNED] Received data:', data);
      setBannedUsers(data);
    } catch (error: any) {
      console.error('❌ [BANNED] Error:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (userId: number, username: string) => {
    if (!confirm(`هل أنت متأكد من فك الحظر عن ${username}؟`)) return;

    try {
      setUnbanningUserId(userId);
      await unbanUserById(roomId, userId);
      toast.success(`✅ تم فك الحظر عن ${username}`);
      loadBannedUsers(); // Reload list
    } catch (error: any) {
      toast.error(`❌ فشل فك الحظر: ${error.message}`);
    } finally {
      setUnbanningUserId(null);
    }
  };

  const getBanTypeText = (banType: string) => {
    switch (banType) {
      case 'User': return 'مستخدم';
      case 'IP': return 'عنوان IP';
      case 'UserAndIP': return 'مستخدم + IP';
      default: return banType;
    }
  };

  const getBanTypeEmoji = (banType: string) => {
    switch (banType) {
      case 'User': return '👤';
      case 'IP': return '🌐';
      case 'UserAndIP': return '🔒';
      default: return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-900 to-red-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🚫</span>
              <span>قائمة المحظورين</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              إجمالي المحظورين: {bannedUsers?.totalBanned || 0}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400"></div>
              <p className="text-white/60 mt-4">جاري التحميل...</p>
            </div>
          ) : bannedUsers && bannedUsers.bannedUsers && bannedUsers.bannedUsers.length > 0 ? (
            <div className="space-y-3">
              {bannedUsers.bannedUsers.map((ban) => (
                <div
                  key={ban.banId}
                  className="bg-white/5 rounded-xl p-4 border border-red-500/30 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Ban Type Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getBanTypeEmoji(ban.banType)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white font-bold text-lg">{ban.username}</span>
                        <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          {getBanTypeText(ban.banType)}
                        </span>
                        {ban.isPermanent ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            حظر دائم
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            حظر مؤقت
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-white/60">📧 البريد:</span>
                          <span className="text-white truncate">{ban.email}</span>
                        </div>

                        {ban.ipAddress && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-white/60">🌐 IP:</span>
                            <span className="text-white font-mono">{ban.ipAddress}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-white/60">👮 حظر بواسطة:</span>
                          <span className="text-white">{ban.bannedByUsername}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-white/60">🕐 تاريخ الحظر:</span>
                          <span className="text-white">{new Date(ban.bannedAt).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>

                        {!ban.isPermanent && ban.expiresAt && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-white/60">⏰ ينتهي في:</span>
                            <span className="text-yellow-300">{new Date(ban.expiresAt).toLocaleString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}

                        {ban.reason && (
                          <div className="flex items-center gap-2 text-gray-400 col-span-full">
                            <span className="text-white/60">📝 السبب:</span>
                            <span className="text-red-300">{ban.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Unban Button */}
                      {canModerate && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleUnban(ban.userId, ban.username)}
                            disabled={unbanningUserId === ban.userId}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {unbanningUserId === ban.userId ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                <span>جاري فك الحظر...</span>
                              </>
                            ) : (
                              <>
                                <span>✅</span>
                                <span>فك الحظر</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-white/60">لا يوجد مستخدمين محظورين</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-400">
            {bannedUsers && (
              <>
                إجمالي المحظورين: {bannedUsers.totalBanned}
              </>
            )}
          </div>
          <button
            onClick={loadBannedUsers}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحديث...' : '🔄 تحديث'}
          </button>
        </div>
      </div>
    </div>
  );
}
