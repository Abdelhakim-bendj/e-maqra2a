import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, Send, UserRound, Plus, X, Search, MessageSquarePlus } from 'lucide-react';


type Conversation = {
  partner: { id: string; fullName: string; role: string; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string; isRead: boolean; senderId: string } | null;
  unread: number;
};

type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' سنوات';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' أشهر';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' أيام';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' ساعات';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' دقائق';
  return 'الآن';
};

export const Messages = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const location = useLocation();
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (location.state?.openChatWith) {
      setActivePartnerId(location.state.openChatWith);
      // Optional: clean up state so a refresh doesn't keep reopening the same chat
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall<{ users: any[] }>('/users'),
    enabled: isNewChatModalOpen,
  });

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiCall<{ conversations: Conversation[] }>('/messages/conversations'),
  });

  const { data: threadData } = useQuery({
    queryKey: ['thread', activePartnerId],
    queryFn: () => apiCall<{ messages: Message[]; partner: any }>(`/messages/${activePartnerId}`),
    enabled: !!activePartnerId,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiCall('/messages', { method: 'POST', body: JSON.stringify({ recipientId: activePartnerId, content }) }),
    onSuccess: () => {
      setMessageInput('');
      qc.invalidateQueries({ queryKey: ['thread', activePartnerId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const conversations = convData?.conversations ?? [];
  const messages = threadData?.messages ?? [];
  const activePartner = threadData?.partner;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartnerId) return;
    sendMutation.mutate(messageInput.trim());
  };

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[500px] flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Sidebar - Conversations List */}
      <div className={`w-full flex-col border-l border-slate-200 bg-slate-50 sm:w-80 sm:flex ${activePartnerId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900">الرسائل</h2>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
            title="محادثة جديدة"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p className="text-sm font-bold">لا توجد محادثات</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => setActivePartnerId(conv.partner.id)}
                className={`w-full p-4 flex items-center gap-3 text-right transition-colors border-b border-slate-100 hover:bg-slate-100 ${
                  activePartnerId === conv.partner.id ? 'bg-white border-r-4 border-r-emerald-500' : ''
                }`}
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black">
                    {conv.partner.fullName.charAt(0)}
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-bold text-slate-900 truncate">{conv.partner.fullName}</h4>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {timeAgo(new Date(conv.lastMessage.createdAt))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {conv.lastMessage?.senderId === user?.id && 'أنت: '}
                    {conv.lastMessage?.content || 'ابدأ المحادثة...'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area - Chat Thread */}
      <div className={`flex-1 flex-col bg-white ${!activePartnerId ? 'hidden sm:flex items-center justify-center' : 'flex'}`}>
        {!activePartnerId ? (
          <div className="text-center text-slate-400">
            <MessageSquare className="mx-auto h-16 w-16 opacity-30 mb-4" />
            <p className="text-lg font-bold">اختر محادثة للبدء</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
              <button onClick={() => setActivePartnerId(null)} className="sm:hidden text-slate-400 hover:text-slate-600">
                &rarr;
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black">
                {activePartner?.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-slate-900">{activePartner?.fullName}</h3>
                <p className="text-xs font-bold text-emerald-600">{activePartner?.role === 'TEACHER' ? 'معلم' : 'طالب'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                      isMe ? 'bg-emerald-600 text-white rounded-tl-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tr-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-left ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-slate-200 p-4 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="h-5 w-5 rtl:scale-x-[-1]" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">محادثة جديدة</h2>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {usersLoading ? (
                <div className="py-12 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mx-auto" /></div>
              ) : (
                (() => {
                  const filtered = usersData?.users?.filter(u => u.id !== user?.id && u.fullName.includes(searchQuery)) || [];
                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400">
                        <Search className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <p className="font-bold text-lg">لم يتم العثور على أحد</p>
                        <p className="text-sm">حاول كتابة اسم آخر</p>
                      </div>
                    );
                  }

                  const staff = filtered.filter(u => u.role === 'ADMIN' || u.role === 'TEACHER');
                  const students = filtered.filter(u => u.role === 'STUDENT');

                  return (
                    <>
                      {staff.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">الإدارة والمعلمون</h3>
                          <div className="space-y-2">
                            {staff.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => { setActivePartnerId(u.id); setIsNewChatModalOpen(false); }}
                                className="group w-full flex items-center justify-between rounded-2xl border border-transparent p-3 text-right hover:border-emerald-100 hover:bg-emerald-50 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black shadow-inner">
                                    {u.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">{u.fullName}</p>
                                    <p className="text-xs font-bold text-emerald-600">
                                      {u.role === 'ADMIN' ? 'مدير منصة' : 'معلم'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm transition-all group-hover:bg-emerald-600 group-hover:text-white">
                                  <MessageSquarePlus className="h-5 w-5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {students.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">الطلاب</h3>
                          <div className="space-y-2">
                            {students.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => { setActivePartnerId(u.id); setIsNewChatModalOpen(false); }}
                                className="group w-full flex items-center justify-between rounded-2xl border border-transparent p-3 text-right hover:border-emerald-100 hover:bg-emerald-50 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black shadow-inner">
                                    {u.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">{u.fullName}</p>
                                    <p className="text-xs font-bold text-slate-500">طالب</p>
                                  </div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm transition-all group-hover:bg-emerald-600 group-hover:text-white">
                                  <MessageSquarePlus className="h-5 w-5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
