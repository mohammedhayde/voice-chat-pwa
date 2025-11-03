import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getRoomMembershipHistory, MembershipHistoryResult, banUser, muteUser } from '@/lib/chatRoomsService';

interface RoomMembershipHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  canModerate?: boolean;
}

export default function RoomMembershipHistoryModal({
  isOpen,
  onClose,
  roomId,
  canModerate
}: RoomMembershipHistoryModalProps) {
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUsername, setSearchUsername] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in' | 'out'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 50;

  useEffect(() => {
    if (isOpen) {
      loadMembershipHistory(1);
    }
  }, [isOpen, roomId]);

  const loadMembershipHistory = async (page: number) => {
    setLoading(true);
    try {
      const isCurrentlyInRoom = filterStatus === 'all' ? undefined : filterStatus === 'in';
      console.log('📊 [MEMBERSHIP] Loading page:', page, 'roomId:', roomId, 'filter:', isCurrentlyInRoom);
      const data = await getRoomMembershipHistory(
        roomId,
        page,
        pageSize,
        isCurrentlyInRoom,
        searchUsername || undefined
      );
      console.log('📊 [MEMBERSHIP] Received data:', data);
      setMembershipHistory(data);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('❌ [MEMBERSHIP] Error:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMembershipHistory(1);
  };

  const handleFilterChange = (newFilter: 'all' | 'in' | 'out') => {
    setFilterStatus(newFilter);
    setCurrentPage(1);
    const isCurrentlyInRoom = newFilter === 'all' ? undefined : newFilter === 'in';
    setLoading(true);
    getRoomMembershipHistory(roomId, 1, pageSize, isCurrentlyInRoom, searchUsername || undefined)
      .then(data => {
        setMembershipHistory(data);
        setCurrentPage(1);
      })
      .catch((error: any) => toast.error(`❌ ${error.message}`))
      .finally(() => setLoading(false));
  };

  const handleBan = async (userId: number, username: string, ipAddress: string) => {
    if (!confirm(`هل أنت متأكد من حظر ${username}؟`)) return;

    const reason = prompt('سبب الحظر (اختياري):');
    const isPermanent = confirm('حظر دائم؟ (إلغاء = مؤقت)');
    let durationInMinutes: number | undefined;

    if (!isPermanent) {
      const duration = prompt('مدة الحظر بالدقائق:', '60');
      if (duration) {
        durationInMinutes = parseInt(duration);
      }
    }

    try {
      setActionLoading(`ban-${userId}`);
      await banUser(roomId, {
        userId,
        ipAddress,
        type: 2, // UserAndIp
        reason: reason || undefined,
        isPermanent,
        durationInMinutes
      });
      toast.success(`✅ تم حظر ${username}`);
      loadMembershipHistory(currentPage); // Reload data
    } catch (error: any) {
      toast.error(`❌ فشل الحظر: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMute = async (userId: number, username: string, ipAddress: string) => {
    if (!confirm(`هل أنت متأكد من كتم ${username}؟`)) return;

    const reason = prompt('سبب الكتم (اختياري):');
    const isPermanent = confirm('كتم دائم؟ (إلغاء = مؤقت)');
    let durationInMinutes: number | undefined;

    if (!isPermanent) {
      const duration = prompt('مدة الكتم بالدقائق:', '30');
      if (duration) {
        durationInMinutes = parseInt(duration);
      }
    }

    try {
      setActionLoading(`mute-${userId}`);
      await muteUser(roomId, {
        userId,
        ipAddress,
        type: 2, // UserAndIp
        reason: reason || undefined,
        isPermanent,
        durationInMinutes
      });
      toast.success(`✅ تم كتم ${username}`);
      loadMembershipHistory(currentPage); // Reload data
    } catch (error: any) {
      toast.error(`❌ فشل الكتم: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = membershipHistory ? Math.ceil(membershipHistory.totalRecords / pageSize) : 0;

  const getLeaveReasonEmoji = (leaveReason: string | null) => {
    if (!leaveReason) return '🟢';
    if (leaveReason === 'Voluntary') return '👋';
    if (leaveReason.startsWith('Kicked:')) return '👞';
    if (leaveReason.startsWith('Banned:')) return '🚫';
    return '❓';
  };

  const getLeaveReasonText = (leaveReason: string | null) => {
    if (!leaveReason) return 'نشط الآن';
    if (leaveReason === 'Voluntary') return 'خروج عادي';
    if (leaveReason.startsWith('Kicked:')) {
      const reason = leaveReason.substring(8);
      return `طرد: ${reason || 'بدون سبب'}`;
    }
    if (leaveReason.startsWith('Banned:')) {
      const reason = leaveReason.substring(8);
      return `حظر: ${reason || 'بدون سبب'}`;
    }
    return leaveReason;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>👥</span>
              <span>سجل الأعضاء</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              جميع عمليات الدخول والخروج - {membershipHistory?.totalRecords || 0} سجل
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث عن مستخدم..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold transition-colors"
              >
                🔍 بحث
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => handleFilterChange('in')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filterStatus === 'in'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                🟢 نشط
              </button>
              <button
                onClick={() => handleFilterChange('out')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filterStatus === 'out'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                ⚫ خرج
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
              <p className="text-white/60 mt-4">جاري التحميل...</p>
            </div>
          ) : membershipHistory && membershipHistory.history && membershipHistory.history.length > 0 ? (
            <div className="space-y-3">
              {membershipHistory.history.map((record) => (
                <div
                  key={record.id}
                  className={`bg-white/5 rounded-xl p-4 border transition-colors ${
                    record.isCurrentlyInRoom
                      ? 'border-green-500/30 bg-green-500/10'
                      : record.leaveReason?.startsWith('Banned:')
                      ? 'border-red-500/30 bg-red-500/10'
                      : record.leaveReason?.startsWith('Kicked:')
                      ? 'border-yellow-500/30 bg-yellow-500/10'
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getLeaveReasonEmoji(record.leaveReason)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white font-bold text-lg">{record.username}</span>
                        {record.isCurrentlyInRoom && (
                          <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse">
                            نشط الآن
                          </span>
                        )}
                        {!record.isCurrentlyInRoom && record.leaveReason && (
                          <span className={`px-2 py-0.5 text-xs rounded border ${
                            record.leaveReason.startsWith('Banned:')
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : record.leaveReason.startsWith('Kicked:')
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}>
                            {getLeaveReasonText(record.leaveReason)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-white/60">🔵 الدخول:</span>
                          <span className="text-white">{new Date(record.joinedAt).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>

                        {record.leftAt && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-white/60">🔴 الخروج:</span>
                            <span className="text-white">{new Date(record.leftAt).toLocaleString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}

                        {record.duration && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-white/60">⏱️ المدة:</span>
                            <span className="text-white">{record.duration}</span>
                          </div>
                        )}

                        {!record.isCurrentlyInRoom && record.leftAt && (
                          <div className="flex items-center gap-2 text-gray-400 col-span-full">
                            <span className="text-white/60">📝 السبب:</span>
                            <span className={
                              record.leaveReason?.startsWith('Banned:')
                                ? 'text-red-300'
                                : record.leaveReason?.startsWith('Kicked:')
                                ? 'text-yellow-300'
                                : 'text-white'
                            }>
                              {getLeaveReasonText(record.leaveReason)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {canModerate && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button
                            onClick={() => handleBan(record.userId, record.username, record.ipAddress)}
                            disabled={actionLoading === `ban-${record.userId}`}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {actionLoading === `ban-${record.userId}` ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                <span>جاري الحظر...</span>
                              </>
                            ) : (
                              <>
                                <span>🚫</span>
                                <span>حظر</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleMute(record.userId, record.username, record.ipAddress)}
                            disabled={actionLoading === `mute-${record.userId}`}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {actionLoading === `mute-${record.userId}` ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                <span>جاري الكتم...</span>
                              </>
                            ) : (
                              <>
                                <span>🔇</span>
                                <span>كتم</span>
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
              <p className="text-5xl mb-3">👥</p>
              <p className="text-white/60">لا يوجد سجل أعضاء</p>
            </div>
          )}
        </div>

        {/* Footer - Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-400">
            {membershipHistory && (
              <>
                صفحة {currentPage} من {totalPages} ({membershipHistory.totalRecords} سجل)
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadMembershipHistory(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <button
              onClick={() => loadMembershipHistory(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
