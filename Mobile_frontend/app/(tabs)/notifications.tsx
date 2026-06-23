import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../lib/utils';
import type { Notification } from '../../types';

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  ANNOUNCEMENT: { icon: 'megaphone', color: '#d97706', bg: '#fef3c7' },
  PRIVATE: { icon: 'mail', color: '#2563eb', bg: '#dbeafe' },
  AUTO: { icon: 'information-circle', color: '#059669', bg: '#d1fae5' },
};

import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s: any) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', message: '', recipientRole: 'STUDENT' });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications').then((r: any) => r.data as { notifications: Notification[]; unreadCount: number }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/notifications/send', payload),
    onSuccess: () => {
      setSendModalOpen(false);
      setSendForm({ title: '', message: '', recipientRole: 'STUDENT' });
      Alert.alert('تم إرسال الإشعار بنجاح');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => Alert.alert('خطأ', err.message),
  });

  const acceptStudentMutation = useMutation({
    mutationFn: (payload: { studentId: string, status: string }) => apiClient.post('/users/accept-student', payload),
    onSuccess: () => {
      Alert.alert('نجاح', 'تم تحديث حالة الطالب بنجاح');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications ?? [];

  useEffect(() => {
    if ((data?.unreadCount ?? 0) > 0) {
      markAllReadMutation.mutate();
    }
  }, [data?.unreadCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['notifications'] });
    setRefreshing(false);
  };

  const handleSend = () => {
    if (!sendForm.title || !sendForm.message) {
      Alert.alert('يرجى ملء جميع الحقول');
      return;
    }
    sendMutation.mutate({
      title: sendForm.title,
      message: sendForm.message,
      type: user?.role === 'ADMIN' ? 'ANNOUNCEMENT' : 'PRIVATE',
      recipientRole: sendForm.recipientRole,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Actions bar */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2" style={{ gap: 8 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white rounded-full shadow-sm">
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          {user?.role !== 'STUDENT' && (
            <TouchableOpacity
              onPress={() => setSendModalOpen(true)}
              className="flex-row items-center bg-emerald-700 px-4 py-2 rounded-xl"
              style={{ gap: 6 }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text className="text-white text-sm font-bold">إرسال إشعار</Text>
            </TouchableOpacity>
          )}
        </View>
        {(data?.unreadCount ?? 0) > 0 && (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            className="flex-row items-center bg-gray-100 px-4 py-2 rounded-xl"
            style={{ gap: 6 }}
          >
            <Ionicons name="checkmark-done" size={16} color="#4b5563" />
            <Text className="text-gray-600 text-sm font-bold">تحديد الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      >
        {notifications.length === 0 ? (
          <View className="py-16 items-center">
            <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
            <Text className="mt-4 text-gray-400 font-black text-base">لا توجد إشعارات حالياً</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.AUTO;
              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={0.8}
                  onPress={() => !notif.isRead && markReadMutation.mutate(notif.id)}
                  className={`rounded-2xl border p-4 ${notif.isRead ? 'border-gray-200 bg-white' : 'border-emerald-200 bg-emerald-50'}`}
                >
                  <View className="flex-row" style={{ gap: 12 }}>
                    {!notif.isRead && (
                      <View className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: config.bg }}>
                      <Ionicons name={config.icon as any} size={20} color={config.color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between">
                        <Text className={`font-black flex-1 ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</Text>
                        <Text className="text-xs font-bold text-gray-400 ml-2">{timeAgo(new Date(notif.createdAt))}</Text>
                      </View>
                      <Text className="mt-1 text-sm text-gray-600 leading-relaxed">{notif.message}</Text>
                      {notif.sender && (
                        <Text className="mt-2 text-xs font-bold text-gray-400">بواسطة: {notif.sender.fullName}</Text>
                      )}
                      {notif.title === 'طلب انضمام جديد' && notif.sender?.id && user?.role === 'TEACHER' && (
                        <View className="mt-3 flex-row" style={{ gap: 8 }}>
                          <TouchableOpacity 
                            onPress={(e) => { e.stopPropagation(); acceptStudentMutation.mutate({ studentId: notif.sender!.id, status: 'ACCEPTED' }); }}
                            disabled={acceptStudentMutation.isPending}
                            className="bg-emerald-600 px-4 py-2 rounded-xl"
                          >
                            <Text className="text-white font-bold text-sm">قبول الطلب</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={(e) => { e.stopPropagation(); acceptStudentMutation.mutate({ studentId: notif.sender!.id, status: 'REJECTED' }); }}
                            disabled={acceptStudentMutation.isPending}
                            className="bg-red-500 px-4 py-2 rounded-xl"
                          >
                            <Text className="text-white font-bold text-sm">رفض الطلب</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Send Notification Modal */}
      <Modal visible={sendModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-xl font-black text-gray-900">إرسال إشعار</Text>
            <TouchableOpacity onPress={() => setSendModalOpen(false)}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={{ gap: 16 }}>
              <View>
                <Text className="mb-2 text-sm font-bold text-gray-700">عنوان الإشعار</Text>
                <TextInput
                  value={sendForm.title}
                  onChangeText={(t) => setSendForm({ ...sendForm, title: t })}
                  placeholder="مثال: تذكير بموعد الجلسة"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-base font-medium"
                />
              </View>
              <View>
                <Text className="mb-2 text-sm font-bold text-gray-700">رسالة الإشعار</Text>
                <TextInput
                  value={sendForm.message}
                  onChangeText={(t) => setSendForm({ ...sendForm, message: t })}
                  placeholder="اكتب ملاحظاتك..."
                  multiline
                  numberOfLines={4}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-base font-medium"
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                />
              </View>
              <View>
                <Text className="mb-2 text-sm font-bold text-gray-700">المجموعة المستهدفة</Text>
                <View className="flex-row" style={{ gap: 8 }}>
                  {['STUDENT', 'TEACHER'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setSendForm({ ...sendForm, recipientRole: role })}
                      className={`flex-1 py-3 rounded-xl border-2 items-center ${
                        sendForm.recipientRole === role ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text className={`font-bold ${sendForm.recipientRole === role ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {role === 'STUDENT' ? 'الطلاب' : 'المعلمين'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={sendMutation.isPending}
                className="bg-emerald-700 py-3 rounded-xl items-center mt-4"
              >
                <Text className="text-white font-black text-base">
                  {sendMutation.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
