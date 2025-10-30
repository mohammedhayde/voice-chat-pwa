interface VoiceControlsProps {
  isJoined: boolean;
  isMuted: boolean;
  isLoading: boolean;
  onJoin: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
}

export default function VoiceControls({
  isJoined,
  isMuted,
  isLoading,
  onJoin,
  onToggleMute,
  onLeave
}: VoiceControlsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 flex-shrink-0 mb-3 md:mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Left: Mic Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${
            isMuted ? 'from-gray-600 to-gray-800' : 'from-blue-500 to-purple-600'
          } flex items-center justify-center text-2xl sm:text-3xl shadow-lg transform transition-all ${
            !isMuted && isJoined ? 'animate-pulse' : ''
          }`}>
            {isMuted ? '🔇' : '🎤'}
          </div>
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-1 ${
              isMuted ? 'bg-red-500/30 text-red-200' : 'bg-green-500/30 text-green-200'
            }`}>
              {isMuted ? 'مكتوم' : 'نشط'}
            </div>
            <p className="text-white/60 text-xs">المحادثة الصوتية</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          {isJoined ? (
            <>
              <button
                onClick={onToggleMute}
                disabled={isLoading}
                className={`font-bold py-2 px-4 sm:px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none ${
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
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-2 px-4 sm:px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
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
            <button
              onClick={onJoin}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <span className="text-xl sm:text-2xl">🎤</span>
              <span>الانضمام للدردشة الصوتية</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
