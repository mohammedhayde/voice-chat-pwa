import { useRef, useEffect } from 'react';
import { ChatMessage, ConnectedUser } from '@/hooks/usePusherChat';
import OnlineUsersBadges from './OnlineUsersBadges';

interface ChatSectionProps {
  messages: ChatMessage[];
  connectedUsers: ConnectedUser[];
  isChatConnected: boolean;
  messageText: string;
  onMessageChange: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export default function ChatSection({
  messages,
  connectedUsers,
  isChatConnected,
  messageText,
  onMessageChange,
  onSendMessage
}: ChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col flex-1 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-lg">
            💬
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">الدردشة النصية</h2>
            {isChatConnected && connectedUsers.length > 0 && (
              <p className="text-white/60 text-xs">{connectedUsers.length} متصل</p>
            )}
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${
          isChatConnected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-400'
        }`}></div>
      </div>

      {/* Online Users - Horizontal Scroll */}
      <OnlineUsersBadges connectedUsers={connectedUsers} isChatConnected={isChatConnected} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <p className="text-6xl mb-4 animate-bounce-slow">💭</p>
            <p className="text-lg font-semibold">لا توجد رسائل بعد</p>
            <p className="text-sm mt-2">ابدأ المحادثة الآن!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'} animate-slide-in`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 backdrop-blur-xl border ${
                    message.isLocal
                      ? 'bg-gradient-to-br from-blue-500/40 to-purple-600/40 border-blue-400/30 text-white'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${message.isLocal ? 'text-blue-200' : 'text-purple-300'}`}>
                    {message.isLocal ? 'أنت' : message.userName}
                  </p>
                  <p className="text-sm break-words leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isLocal ? 'text-blue-200/70' : 'text-white/50'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-white/10 flex-shrink-0 bg-white/5">
        {!isChatConnected && (
          <p className="text-xs text-center text-yellow-200 mb-3 animate-pulse">
            ⏳ جاري الاتصال بخادم الدردشة...
          </p>
        )}
        <form onSubmit={onSendMessage} className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="اكتب رسالة..."
            disabled={!isChatConnected}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isChatConnected || !messageText.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="text-xl">📤</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
