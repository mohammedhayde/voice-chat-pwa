import { useState } from 'react';
import toast from 'react-hot-toast';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { ConnectedUser } from '@/hooks/useSignalR';
import { RoomPermissions, banUser, unbanUser, muteUser, unmuteUser, removeMember, banByIpHistory, promoteToAdmin, demoteFromAdmin, transferOwnership } from '@/lib/chatRoomsService';

interface ParticipantsSidebarProps {
  userName: string;
  isMuted: boolean;
  isSpeaking?: boolean;
  speakingUsers?: Set<number | string>;
  isVoiceJoined: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  connectedUsers: ConnectedUser[];
  roomId?: number;
  permissions?: RoomPermissions;
  onClose?: () => void;
}

export default function ParticipantsSidebar({
  userName,
  isMuted,
  isSpeaking = false,
  speakingUsers = new Set(),
  isVoiceJoined,
  remoteUsers,
  connectedUsers,
  roomId,
  permissions,
  onClose
}: ParticipantsSidebarProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);


  // Create a Set of Agora user IDs for quick lookup
  const voiceUserIds = new Set(remoteUsers.map(u => String(u.uid)));

  // Check if a user is in voice chat by matching their name or ID
  const isUserInVoiceChat = (user: ConnectedUser) => {
    // Check if user name matches or if their ID is in voice users
    return voiceUserIds.has(String(user.userId)) || voiceUserIds.has(user.username);
  };

  // Handle moderation actions
  const handleMuteUser = async (userId: number) => {
    if (!roomId) return;
    try {
      setActionLoading('mute');
      await muteUser(roomId, {
        userId,
        type: 2, // UserAndIp
        reason: 'كتم من قبل المشرف',
        isPermanent: false,
        durationInMinutes: 60
      });
      toast.success('✅ تم كتم المستخدم لمدة ساعة');
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل الكتم: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!roomId) return;
    if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;

    try {
      setActionLoading('ban');
      await banUser(roomId, {
        userId,
        type: 2, // UserAndIp
        reason: 'حظر من قبل المشرف',
        isPermanent: true
      });
      toast.success('✅ تم حظر المستخدم بشكل دائم');
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل الحظر: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmuteUser = async (userId: number) => {
    if (!roomId) return;
    try {
      setActionLoading('unmute');
      await unmuteUser(roomId, userId);
      toast.success('✅ تم رفع كتم المستخدم');
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل رفع الكتم: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickUser = async (userId: number) => {
    if (!roomId) return;
    if (!confirm('هل أنت متأكد من طرد هذا المستخدم؟')) return;

    try {
      setActionLoading('kick');
      await removeMember(roomId, userId);
      toast.success('✅ تم طرد المستخدم من الغرفة');
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل الطرد: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanByIpHistory = async (userId: number, username: string) => {
    if (!roomId) return;
    if (!confirm(`هل أنت متأكد من حظر ${username} بجميع عناوين IP المستخدمة؟`)) return;

    try {
      setActionLoading('ban-ip');
      const result = await banByIpHistory(roomId, {
        targetUserId: userId,
        reason: 'حظر بناءً على سجل عناوين IP',
        isPermanent: true,
        banAllIps: true
      });
      toast.success(`✅ تم حظر ${result.totalIpsBanned} عناوين IP`);
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل الحظر: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteToAdmin = async (userId: number, username: string) => {
    if (!roomId) return;
    if (!confirm(`هل أنت متأكد من ترقية ${username} إلى مشرف؟`)) return;

    try {
      setActionLoading('promote');
      await promoteToAdmin(roomId, userId);
      toast.success(`✅ تم ترقية ${username} إلى مشرف`);
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل الترقية: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteFromAdmin = async (userId: number, username: string) => {
    if (!roomId) return;
    if (!confirm(`هل أنت متأكد من إزالة صلاحيات ${username} كمشرف؟`)) return;

    try {
      setActionLoading('demote');
      await demoteFromAdmin(roomId, userId);
      toast.success(`✅ تم إزالة صلاحيات ${username}`);
      setShowActionsFor(null);
    } catch (error: any) {
      toast.error(`❌ فشل إزالة الصلاحيات: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferOwnership = async (userId: number, username: string) => {
    if (!roomId) return;
    if (!confirm(`⚠️ هل أنت متأكد من نقل ملكية الغرفة إلى ${username}؟\n\nسوف تفقد جميع صلاحيات المالك!`)) return;

    try {
      setActionLoading('transfer');
      await transferOwnership(roomId, userId);
      toast.success(`✅ تم نقل ملكية الغرفة إلى ${username}`);
      setShowActionsFor(null);
      // Reload page to reflect new permissions
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast.error(`❌ فشل نقل الملكية: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Check if current user can moderate
  const canModerate = permissions?.canModerate || false;

  return (
    <nav className="h-full lg:w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex flex-col">
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👥</span>
            <span>المتصلون</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{connectedUsers.length}</span>
          </h2>
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Role Badge */}
        {permissions && (
          <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
            permissions.role === 'Owner'
              ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
              : permissions.role === 'Admin'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
              : 'bg-gray-500/20 text-gray-200 border border-gray-500/30'
          }`}>
            <span>
              {permissions.role === 'Owner' ? '👑' : permissions.role === 'Admin' ? '⭐' : '👤'}
            </span>
            <span className="font-semibold">
              {permissions.role === 'Owner' ? 'مالك الغرفة' : permissions.role === 'Admin' ? 'مشرف' : 'عضو'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Show all connected users from Pusher */}
        {connectedUsers.map((user) => {
          const isCurrentUser = user.username === userName;
          const isInVoice = isCurrentUser ? isVoiceJoined : isUserInVoiceChat(user);
          const userId = user.userId;
          const showActions = showActionsFor === String(user.userId);

          // Check if user is speaking
          const isUserSpeaking = isCurrentUser
            ? (isSpeaking && !isMuted)
            : (speakingUsers.has(user.userId) || speakingUsers.has(user.username));

          return (
            <div
              key={user.userId}
              className={`backdrop-blur-xl rounded-xl p-3 border transition-colors ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/30'
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
                } ${isUserSpeaking ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-black/20' : ''}`}>
                  {isInVoice ? '🎤' : '👤'}
                  {/* Speaking animation */}
                  {isUserSpeaking && (
                    <>
                      <div className="absolute -inset-1 rounded-full bg-green-400 opacity-30 animate-ping"></div>
                      <div className="absolute -inset-1 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
                    </>
                  )}
                  {/* Online indicator for current user */}
                  {isInVoice && isCurrentUser && !isMuted && !isUserSpeaking && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/20 animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-white text-sm truncate">{user.username}</p>
                    {/* Show user's room role */}
                    {user.isRoomOwner && <span className="text-xs">👑</span>}
                    {user.isRoomAdmin && !user.isRoomOwner && <span className="text-xs">⭐</span>}
                    {/* Show global role badge */}
                    {user.role === 'SuperAdmin' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        Super
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {isCurrentUser && (
                      <span className="text-xs text-blue-200">أنت</span>
                    )}
                    {/* Show muted status */}
                    {user.isMuted && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30" title={user.muteReason || 'مكتوم'}>
                        🔇 مكتوم
                      </span>
                    )}
                    {/* Show voice status */}
                    {isInVoice && !user.isMuted && (
                      <span className={`text-xs ${
                        isCurrentUser
                          ? (isMuted ? 'text-red-300' : 'text-green-300')
                          : 'text-green-300'
                      }`}>
                        {isCurrentUser && isMuted ? '🔇' : '🔊'}
                      </span>
                    )}
                    {/* Show connection count if multiple devices */}
                    {user.connectionCount > 1 && (
                      <span className="text-xs text-gray-400" title={`متصل من ${user.connectionCount} أجهزة`}>
                        📱×{user.connectionCount}
                      </span>
                    )}
                    {!isInVoice && (
                      <span className="text-xs text-gray-400">💬 نص فقط</span>
                    )}
                  </div>
                </div>

                {/* Moderation Button - Only for moderators and not for current user */}
                {canModerate && !isCurrentUser && (
                  <button
                    onClick={() => setShowActionsFor(showActions ? null : String(user.userId))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white flex-shrink-0"
                    title="خيارات الإدارة"
                  >
                    ⚙️
                  </button>
                )}
              </div>

              {/* Moderation Actions Menu */}
              {canModerate && !isCurrentUser && showActions && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                  {/* User Status Info */}
                  {(user.isMuted || user.isBanned || user.isSuspended) && (
                    <div className="text-xs text-gray-300 space-y-1">
                      {user.isMuted && (
                        <div className="flex items-center gap-1">
                          <span>🔇</span>
                          <span>مكتوم {user.mutedUntil ? `حتى ${new Date(user.mutedUntil).toLocaleString('ar-SA')}` : 'بشكل دائم'}</span>
                        </div>
                      )}
                      {user.isSuspended && (
                        <div className="flex items-center gap-1">
                          <span>⏸️</span>
                          <span>معلق {user.suspendedUntil ? `حتى ${new Date(user.suspendedUntil).toLocaleString('ar-SA')}` : 'بشكل دائم'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!user.isMuted ? (
                      <button
                        onClick={() => handleMuteUser(userId)}
                        disabled={actionLoading === 'mute'}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'mute' ? '...' : '🔇 كتم'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnmuteUser(userId)}
                        disabled={actionLoading === 'unmute'}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'unmute' ? '...' : '🔊 رفع الكتم'}
                      </button>
                    )}
                    <button
                      onClick={() => handleKickUser(userId)}
                      disabled={actionLoading === 'kick'}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'kick' ? '...' : '👋 طرد'}
                    </button>
                    <button
                      onClick={() => handleBanUser(userId)}
                      disabled={actionLoading === 'ban'}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'ban' ? '...' : '🚫 حظر'}
                    </button>
                  </div>

                  {/* Ban by IP History */}
                  <button
                    onClick={() => handleBanByIpHistory(userId, user.username)}
                    disabled={actionLoading === 'ban-ip'}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-red-600/20 to-purple-600/20 hover:from-red-600/30 hover:to-purple-600/30 border border-red-500/30 text-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {actionLoading === 'ban-ip' ? '...' : '🚫 حظر بسجل IP'}
                  </button>

                  {/* Owner Only Actions */}
                  {permissions?.isOwner && (
                    <>
                      {/* Promote/Demote Admin */}
                      {permissions.role === 'Admin' || user.role === 'Admin' ? (
                        <button
                          onClick={() => handleDemoteFromAdmin(userId, user.username)}
                          disabled={actionLoading === 'demote'}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 border border-yellow-500/30 text-yellow-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {actionLoading === 'demote' ? '...' : '⬇️ إزالة كمشرف'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromoteToAdmin(userId, user.username)}
                          disabled={actionLoading === 'promote'}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-green-600/20 to-blue-600/20 hover:from-green-600/30 hover:to-blue-600/30 border border-green-500/30 text-green-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {actionLoading === 'promote' ? '...' : '⬆️ ترقية لمشرف'}
                        </button>
                      )}

                      {/* Transfer Ownership */}
                      <button
                        onClick={() => handleTransferOwnership(userId, user.username)}
                        disabled={actionLoading === 'transfer'}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 text-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {actionLoading === 'transfer' ? '...' : '👑 نقل الملكية'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {connectedUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/40 py-12">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-sm">لا يوجد متصلون</p>
          </div>
        )}
      </div>

    </nav>
  );
}
