import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { ConnectedUser } from '@/hooks/usePusherChat';

interface ParticipantsSidebarProps {
  userName: string;
  isMuted: boolean;
  isVoiceJoined: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  connectedUsers: ConnectedUser[];
}

export default function ParticipantsSidebar({
  userName,
  isMuted,
  isVoiceJoined,
  remoteUsers,
  connectedUsers
}: ParticipantsSidebarProps) {

  // Create a Set of Agora user IDs for quick lookup
  const voiceUserIds = new Set(remoteUsers.map(u => String(u.uid)));

  // Check if a user is in voice chat by matching their name or ID
  const isUserInVoiceChat = (user: ConnectedUser) => {
    // Check if user name matches or if their ID is in voice users
    return voiceUserIds.has(user.id) || voiceUserIds.has(user.name);
  };

  return (
    <nav className="lg:w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex flex-col">
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👥</span>
          <span>المتصلون</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-auto">{connectedUsers.length}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Show all connected users from Pusher */}
        {connectedUsers.map((user) => {
          const isCurrentUser = user.name === userName;
          const isInVoice = isCurrentUser ? isVoiceJoined : isUserInVoiceChat(user);

          return (
            <div
              key={user.id}
              className={`backdrop-blur-xl rounded-xl p-3 border transition-colors ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/30'
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
                }`}>
                  {isInVoice ? '🎤' : '👤'}
                  {isInVoice && isCurrentUser && !isMuted && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/20 animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{user.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isCurrentUser && (
                      <span className="text-xs text-blue-200">أنت</span>
                    )}
                    {isInVoice && (
                      <span className={`text-xs ${
                        isCurrentUser
                          ? (isMuted ? 'text-red-300' : 'text-green-300')
                          : 'text-green-300'
                      }`}>
                        {isCurrentUser && isMuted ? '🔇' : '🔊'}
                      </span>
                    )}
                    {!isInVoice && (
                      <span className="text-xs text-gray-400">💬 نص فقط</span>
                    )}
                  </div>
                </div>
              </div>
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
