import { ConnectedUser } from '@/hooks/usePusherChat';

interface OnlineUsersBadgesProps {
  connectedUsers: ConnectedUser[];
  isChatConnected: boolean;
}

export default function OnlineUsersBadges({ connectedUsers, isChatConnected }: OnlineUsersBadgesProps) {
  if (!isChatConnected || connectedUsers.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
      <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-2">
        {connectedUsers.map((user) => (
          <div
            key={user.id}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-500/20 text-blue-100 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-400/30"
          >
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>{user.name}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-thumb-white\\/20::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}
