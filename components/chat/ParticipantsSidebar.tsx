import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

interface ParticipantsSidebarProps {
  userName: string;
  isMuted: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
}

export default function ParticipantsSidebar({ userName, isMuted, remoteUsers }: ParticipantsSidebarProps) {
  return (
    <nav className="lg:w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex flex-col">
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👥</span>
          <span>المتصلون</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-auto">{remoteUsers.length + 1}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Local User */}
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl p-3 border border-blue-400/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative">
              🎤
              {!isMuted && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/20 animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{userName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-blue-200">أنت</span>
                <span className={`text-xs ${isMuted ? 'text-red-300' : 'text-green-300'}`}>
                  {isMuted ? '🔇' : '🔊'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Users */}
        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative">
                👤
                {user.hasAudio && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/20 animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">مستخدم {String(user.uid).slice(0, 4)}</p>
                <span className={`text-xs ${user.hasAudio ? 'text-green-300' : 'text-gray-400'}`}>
                  {user.hasAudio ? '🔊 نشط' : '🔇 صامت'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
