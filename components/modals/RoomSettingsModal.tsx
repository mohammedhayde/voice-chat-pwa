import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getRoomSettings, updateRoomSettings, RoomSettingsDto } from '@/lib/chatRoomsService';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  isOwner: boolean;
  canModerate: boolean;
}

export default function RoomSettingsModal({
  isOpen,
  onClose,
  roomId,
  isOwner,
  canModerate
}: RoomSettingsModalProps) {
  const [settings, setSettings] = useState<RoomSettingsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState<number | null>(null);
  const [slowModeSeconds, setSlowModeSeconds] = useState(0);
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [requireJoinApproval, setRequireJoinApproval] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [roomColor, setRoomColor] = useState('#6366F1');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, roomId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getRoomSettings(roomId);
      setSettings(data);

      // Populate form
      setName(data.name);
      setDescription(data.description || '');
      setIsPrivate(data.isPrivate);
      setMaxMembers(data.maxMembers);
      setSlowModeSeconds(data.slowModeSeconds);
      setOnlyAdminsCanPost(data.onlyAdminsCanPost);
      setRequireJoinApproval(data.requireJoinApproval);
      setWelcomeMessage(data.welcomeMessage || '');
      setRoomColor(data.roomColor || '#6366F1');
    } catch (error: any) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('❌ يجب إدخال اسم الغرفة');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: name.trim(),
        description: description.trim() || null,
        maxMembers,
        slowModeSeconds,
        onlyAdminsCanPost,
        requireJoinApproval,
        welcomeMessage: welcomeMessage.trim() || null,
        roomColor,
      };

      // Only owner can change isPrivate
      if (isOwner) {
        updateData.isPrivate = isPrivate;
      }

      await updateRoomSettings(roomId, updateData);
      toast.success('✅ تم تحديث إعدادات الغرفة بنجاح');
      onClose();
    } catch (error: any) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>إعدادات الغرفة</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isOwner ? 'مالك الغرفة' : canModerate ? 'مشرف' : 'عرض فقط'}
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
              <p className="text-white/60 mt-4">جاري التحميل...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  المعلومات الأساسية
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    اسم الغرفة *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canModerate}
                    maxLength={100}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="أدخل اسم الغرفة"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canModerate}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                    placeholder="وصف الغرفة (اختياري)"
                  />
                </div>

                {/* Room Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    لون الغرفة
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={roomColor}
                      onChange={(e) => setRoomColor(e.target.value)}
                      disabled={!canModerate}
                      className="h-10 w-20 rounded border border-white/20 bg-white/10 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-gray-400 font-mono text-sm">{roomColor}</span>
                  </div>
                </div>
              </div>

              {/* Privacy & Access */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  الخصوصية والوصول
                </h3>

                {/* Is Private */}
                {isOwner && (
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div>
                      <div className="text-white font-medium">غرفة خاصة</div>
                      <div className="text-sm text-gray-400">فقط المالك يمكنه تغيير هذا الإعداد</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </label>
                )}

                {/* Require Join Approval */}
                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div>
                    <div className="text-white font-medium">يتطلب موافقة للانضمام</div>
                    <div className="text-sm text-gray-400">يجب موافقة المشرفين على الأعضاء الجدد</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireJoinApproval}
                    onChange={(e) => setRequireJoinApproval(e.target.checked)}
                    disabled={!canModerate}
                    className="w-5 h-5 rounded border-gray-300 disabled:opacity-50"
                  />
                </label>

                {/* Max Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    الحد الأقصى للأعضاء
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={maxMembers || ''}
                      onChange={(e) => setMaxMembers(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={!canModerate}
                      min={2}
                      placeholder="غير محدود"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={() => setMaxMembers(null)}
                      disabled={!canModerate}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                    >
                      بلا حد
                    </button>
                  </div>
                </div>
              </div>

              {/* Messaging */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  إعدادات المراسلة
                </h3>

                {/* Slow Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slow Mode (ثواني بين الرسائل)
                  </label>
                  <input
                    type="range"
                    value={slowModeSeconds}
                    onChange={(e) => setSlowModeSeconds(parseInt(e.target.value))}
                    disabled={!canModerate}
                    min={0}
                    max={300}
                    step={5}
                    className="w-full disabled:opacity-50"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>معطل</span>
                    <span className="text-white font-bold">{slowModeSeconds} ثانية</span>
                    <span>5 دقائق</span>
                  </div>
                </div>

                {/* Only Admins Can Post */}
                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div>
                    <div className="text-white font-medium">المشرفون فقط يمكنهم الإرسال</div>
                    <div className="text-sm text-gray-400">منع الأعضاء العاديين من إرسال الرسائل</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyAdminsCanPost}
                    onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
                    disabled={!canModerate}
                    className="w-5 h-5 rounded border-gray-300 disabled:opacity-50"
                  />
                </label>

                {/* Welcome Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    رسالة الترحيب
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    disabled={!canModerate}
                    maxLength={500}
                    rows={2}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                    placeholder="رسالة ترحيب للأعضاء الجدد (اختياري)"
                  />
                </div>
              </div>

              {/* Stats */}
              {settings && (
                <div className="space-y-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">إحصائيات</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">الأعضاء:</span>
                      <span className="text-white font-bold ml-2">{settings.membersCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">تاريخ الإنشاء:</span>
                      <span className="text-white font-bold ml-2">
                        {new Date(settings.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">المنشئ:</span>
                      <span className="text-white font-bold ml-2">{settings.createdByUsername}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {canModerate && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
