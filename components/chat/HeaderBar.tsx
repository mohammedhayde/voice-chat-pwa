interface HeaderBarProps {
  channelName: string;
  userName: string;
  isJoined: boolean;
  participantsCount: number;
}

export default function HeaderBar({ channelName, userName, isJoined, participantsCount }: HeaderBarProps) {
  const getRoomIcon = () => {
    const icons: { [key: string]: string } = {
      'room-1': '🌍', 'room-2': '👥', 'room-3': '🎮', 'room-4': '🎵', 'room-5': '📚',
      'room-6': '⚽', 'room-7': '💻', 'room-8': '🎬', 'room-9': '🍳', 'room-10': '✈️'
    };
    return icons[channelName] || '🌍';
  };

  const getRoomName = () => {
    const names: { [key: string]: string } = {
      'room-1': 'غرفة العامة', 'room-2': 'غرفة الأصدقاء', 'room-3': 'غرفة الألعاب',
      'room-4': 'غرفة الموسيقى', 'room-5': 'غرفة التعليم', 'room-6': 'غرفة الرياضة',
      'room-7': 'غرفة التقنية', 'room-8': 'غرفة الأفلام', 'room-9': 'غرفة الطبخ',
      'room-10': 'غرفة السفر'
    };
    return names[channelName] || 'غرفة الدردشة';
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Room Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
              {getRoomIcon()}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {getRoomName()}
              </h1>
              <p className="text-white/60 text-sm">مرحباً {userName} 👋</p>
            </div>
          </div>

          {/* Status & Stats */}
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border ${
              isJoined
                ? 'bg-green-500/20 border-green-500/50 text-green-100'
                : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isJoined ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
              }`}></div>
              <span className="font-semibold text-sm">{isJoined ? 'متصل' : 'جاري الاتصال...'}</span>
            </div>
            {isJoined && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                <span className="font-semibold text-sm">👥 {participantsCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
