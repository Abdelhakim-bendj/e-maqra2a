import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { timeAgo } from '../../lib/utils';
import type { Conversation, Message } from '../../types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const qc = useQueryClient();
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.openChatWith && typeof params.openChatWith === 'string') {
      setActivePartnerId(params.openChatWith);
    }
  }, [params.openChatWith]);

  const { data: convData, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get('/messages/conversations').then((r) => r.data as { conversations: Conversation[] }),
  });

  const { data: threadData } = useQuery({
    queryKey: ['thread', activePartnerId],
    queryFn: () => apiClient.get(`/messages/${activePartnerId}`).then((r) => r.data as { messages: Message[]; partner: any }),
    enabled: !!activePartnerId,
    refetchInterval: 5000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then((r) => r.data as { users: any[] }),
    enabled: showNewChat,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiClient.post('/messages', { recipientId: activePartnerId, content }),
    onSuccess: () => { setMessageInput(''); qc.invalidateQueries({ queryKey: ['thread', activePartnerId] }); qc.invalidateQueries({ queryKey: ['conversations'] }); },
  });

  const conversations = convData?.conversations ?? [];
  const messages = threadData?.messages ?? [];
  const activePartner = threadData?.partner;

  // If viewing a chat thread
  if (activePartnerId && activePartner) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => setActivePartnerId(null)}>
            <Text className="text-primary-700 text-lg">→</Text>
          </TouchableOpacity>
          <View className="w-9 h-9 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary-700 font-bold">{activePartner.fullName?.charAt(0)}</Text>
          </View>
          <View>
            <Text className="font-bold text-gray-900 dark:text-white">{activePartner.fullName}</Text>
            <Text className="text-xs text-primary-600">{activePartner.role === 'TEACHER' ? 'معلم' : 'طالب'}</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          className="flex-1 px-4 py-3"
          renderItem={({ item: msg }) => {
            const isMe = msg.senderId === user?.id;
            return (
              <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                <View className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{msg.content}</Text>
                  <Text className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
        />

        {/* Input */}
        <View className="flex-row items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <TextInput className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm" placeholder="اكتب رسالة..." value={messageInput} onChangeText={setMessageInput} placeholderTextColor="#9ca3af" />
          <TouchableOpacity onPress={() => { if (messageInput.trim()) { sendMutation.mutate(messageInput.trim()); } }}
            disabled={!messageInput.trim() || sendMutation.isPending}
            className="w-11 h-11 rounded-full bg-primary-700 items-center justify-center">
            <Text className="text-white text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // New chat modal overlay
  if (showNewChat) {
    const filtered = usersData?.users?.filter((u: any) => u.id !== user?.id && u.fullName.includes(searchQuery)) || [];
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">محادثة جديدة</Text>
          <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchQuery(''); }}>
            <Text className="text-gray-400 text-xl">✕</Text>
          </TouchableOpacity>
        </View>
        <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <TextInput className="bg-gray-100 rounded-full px-5 py-3 text-sm" placeholder="ابحث عن اسم..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />
        </View>
        {usersLoading ? (
          <View className="p-8 items-center"><ActivityIndicator color="#047857" /></View>
        ) : filtered.length === 0 ? (
          <View className="p-12 items-center"><Text className="text-gray-400 font-bold">لم يتم العثور على أحد</Text></View>
        ) : (
          <FlatList data={filtered} renderItem={({ item: u }) => (
            <TouchableOpacity key={u.id} onPress={() => { setActivePartnerId(u.id); setShowNewChat(false); }}
              className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <View className="w-11 h-11 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-primary-700 font-bold">{u.fullName.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white">{u.fullName}</Text>
                <Text className="text-xs text-gray-500">{u.role === 'ADMIN' ? 'مدير' : u.role === 'TEACHER' ? 'معلم' : 'طالب'}</Text>
              </View>
            </TouchableOpacity>
          )} keyExtractor={(item) => item.id} />
        )}
      </View>
    );
  }

  // Conversations list
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white dark:bg-gray-900 rounded-full shadow-sm">
            <Ionicons name="arrow-back" size={20} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNewChat(true)} className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
          <Text className="text-primary-700 text-lg font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View className="p-12 items-center">
          <Text className="text-4xl mb-3">💬</Text>
          <Text className="text-lg font-bold text-gray-400">لا توجد محادثات</Text>
        </View>
      ) : (
        <View className="px-4 pb-6">
          {conversations.map((conv) => (
            <TouchableOpacity key={conv.partner.id} onPress={() => setActivePartnerId(conv.partner.id)}
              className="flex-row items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mb-2 shadow-sm">
              <View className="relative">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="text-primary-700 font-bold text-lg">{conv.partner.fullName.charAt(0)}</Text>
                </View>
                {conv.unread > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">{conv.unread}</Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-gray-900 dark:text-white">{conv.partner.fullName}</Text>
                  {conv.lastMessage && (
                    <Text className="text-[10px] text-gray-400">{timeAgo(new Date(conv.lastMessage.createdAt))}</Text>
                  )}
                </View>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {conv.lastMessage?.senderId === user?.id && 'أنت: '}{conv.lastMessage?.content || 'ابدأ المحادثة...'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
