interface VoiceControlsProps {
  isJoined: boolean;
  isMuted: boolean;
  isLoading: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
}

export default function VoiceControls({
  isJoined,
  isMuted,
  isLoading,
  onToggleMute,
  onLeave
}: VoiceControlsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex-shrink-0 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mic Status */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
            isMuted ? 'from-gray-600 to-gray-800' : 'from-blue-500 to-purple-600'
          } flex items-center justify-center text-3xl shadow-lg transform transition-all ${
            !isMuted && isJoined ? 'animate-pulse' : ''
          }`}>
            {isMuted ? '🔇' : '🎤'}
          </div>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-1 ${
              isMuted ? 'bg-red-500/30 text-red-200' : 'bg-green-500/30 text-green-200'
            }`}>
              {isMuted ? 'مكتوم' : 'نشط'}
            </div>
            <p className="text-white/60 text-xs">المحادثة الصوتية</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap gap-2">
          {isJoined ? (
            <>
              <button
                onClick={onToggleMute}
                disabled={isLoading}
                className={`font-bold py-2 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 ${
                  isMuted
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
              >
                {isMuted ? '🔊 إلغاء الكتم' : '🔇 كتم'}
              </button>

              <button
                onClick={onLeave}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? '⏳ جاري...' : '🚪 مغادرة'}
              </button>
            </>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400 border-t-transparent"></div>
              <span className="text-sm">جاري الاتصال...</span>
            </div>
          ) : (
            <div className="text-blue-200 text-sm">💡 جاري الاتصال تلقائياً...</div>
          )}
        </div>
      </div>
    </div>
  );
}
