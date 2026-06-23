import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { statLabels } from '../../lib/utils';
import type { DashboardPayload } from '../../types';

function StatCard({ label, value, index }: { label: string; value: number; index: number }) {
  const colors = ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-orange-100', 'bg-purple-100', 'bg-rose-100'];
  const textColors = ['text-blue-700', 'text-emerald-700', 'text-amber-700', 'text-orange-700', 'text-purple-700', 'text-rose-700'];
  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm" style={{ width: '48%' }}>
      <View className={`w-10 h-10 rounded-xl ${colors[index % colors.length]} items-center justify-center mb-3 opacity-90`}>
        <Text className="text-lg">📊</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
      <Text className={`text-xs font-semibold mt-1 ${textColors[index % textColors.length]}`}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((s: any) => s.user);
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard').then((r) => r.data as DashboardPayload),
  });

  const isStudentRestricted = user?.role === 'STUDENT' && user?.studentProfile?.teacherStatus !== 'ACCEPTED';

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiClient.get('/users').then((r: any) => r.data),
    enabled: !!user && user.role === 'STUDENT' && !user.studentProfile?.teacherId,
  });

  const selectTeacherMutation = useMutation({
    mutationFn: (teacherId: string) => apiClient.post('/users/select-teacher', { teacherId }),
    onSuccess: () => {
      Alert.alert('نجاح', 'تم إرسال طلبك للمعلم بنجاح! يرجى الانتظار حتى يتم القبول.');
      setShowTeacherModal(false);
      refetch(); // to update status
    },
    onError: (err: any) => Alert.alert('خطأ', err.message),
  });

  if (isStudentRestricted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="shield-half" size={32} color="#d97706" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">الحساب قيد المراجعة</Text>
        <Text className="text-center text-gray-500 dark:text-gray-400 mb-6">
          {user?.studentProfile?.teacherId
            ? 'طلبك قيد المراجعة من قبل المعلم. يرجى الانتظار حتى يتم قبولك لتتمكن من استخدام ميزات المنصة.'
            : 'يجب عليك اختيار معلم أولاً لتبدأ رحلتك التعليمية.'}
        </Text>
        {!user?.studentProfile?.teacherId && (
          <View className="flex-1 w-full mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-xl font-black text-gray-900 mb-4">المعلمين المتاحين</Text>
            <View className="mb-4 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Ionicons name="search" size={20} color="#9ca3af" className="mr-2" />
              <TextInput
                placeholder="ابحث عن معلم بالاسم أو النبذة..."
                value={teacherSearch}
                onChangeText={setTeacherSearch}
                className="flex-1 text-right text-gray-900 font-bold ml-2"
              />
            </View>
            {isLoadingTeachers ? (
              <ActivityIndicator size="large" color="#047857" className="mt-8" />
            ) : (
              <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                {teachersData?.users?.filter((u: any) => u.role === 'TEACHER' && (u.fullName.includes(teacherSearch) || (u.bio && u.bio.includes(teacherSearch)))).map((teacher: any) => (
                  <View key={teacher.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 shadow-sm flex-col">
                    <View className="flex-row items-center gap-3 mb-4">
                      <View className="w-14 h-14 bg-primary-100 rounded-full items-center justify-center">
                        <Text className="text-primary-700 font-bold text-xl">{teacher.fullName[0]}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-900 text-lg">{teacher.fullName}</Text>
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{teacher.bio || 'لا توجد نبذة شخصية'}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity 
                        onPress={() => selectTeacherMutation.mutate(teacher.id)}
                        disabled={selectTeacherMutation.isPending}
                        className="flex-1 bg-emerald-600 px-4 py-3 rounded-xl items-center"
                      >
                        <Text className="text-white font-bold text-sm">طلب انضمام</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => router.push({ pathname: '/(tabs)/messages', params: { openChatWith: teacher.id } })}
                        className="flex-1 bg-gray-100 border border-gray-200 px-4 py-3 rounded-xl items-center flex-row justify-center gap-2"
                      >
                        <Ionicons name="chatbubble-ellipses" size={16} color="#374151" />
                        <Text className="text-gray-700 font-bold text-sm">مراسلة</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {(!teachersData?.users || teachersData.users.filter((u: any) => u.role === 'TEACHER' && (u.fullName.includes(teacherSearch) || (u.bio && u.bio.includes(teacherSearch)))).length === 0) && (
                  <Text className="text-center text-gray-500 font-bold py-8">لم يتم العثور على معلمين بهذه المواصفات.</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  }

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950"><ActivityIndicator size="large" color="#047857" /></View>;
  }
  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <Text className="text-lg font-bold text-red-500 dark:text-red-400 mb-2">تعذر تحميل لوحة التحكم</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          {error instanceof Error ? error.message : 'حاول تحديث الصفحة'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-primary-600 px-6 py-2 rounded-xl">
          <Text className="text-white font-bold">إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dashboard = data?.dashboard || {};
  const stats = dashboard.stats || {};
  const role = dashboard.role || user?.role;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#047857" />}>
      {/* Hero */}
      <View className="bg-gray-900 dark:bg-gray-900 px-6 pt-6 pb-8 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-bold text-primary-300 mb-1">
              {role === 'STUDENT' ? '🎓 حساب طالب' : role === 'TEACHER' ? '👨‍🏫 حساب معلم' : '⚙️ لوحة الإدارة'}
            </Text>
            <Text className="text-2xl font-bold text-white">أهلاً بك، {user?.fullName} 👋</Text>
            <Text className="text-sm text-gray-400 mt-1">تابع رحلتك التعليمية من هنا</Text>
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/messages')}
              className="w-11 h-11 rounded-full bg-white/10 items-center justify-center relative shadow-sm"
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              {/* Unread Badge */}
              <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-gray-900" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/notifications')}
              className="w-11 h-11 rounded-full bg-white/10 items-center justify-center relative shadow-sm"
            >
              <Ionicons name="notifications" size={22} color="#fff" />
              {/* Unread Badge */}
              <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-gray-900" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="px-4 -mt-4">
        <View className="flex-row flex-wrap justify-between gap-3">
          {Object.entries(stats)
            .filter(([key]) => key !== 'learningStreak' && key !== 'progressPercent')
            .map(([key, value], i) => (
              <StatCard key={key} label={statLabels[key] || key} value={value} index={i} />
            ))}
        </View>
      </View>

      {/* Student-specific */}
      {role === 'STUDENT' && (
        <>
          {/* Daily Task */}
          <View className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-sm font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 px-3 py-1 rounded-full">📖 ورد اليوم</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              {dashboard.dailyTask
                ? `سورة ${dashboard.dailyTask.surahNumber}، الآيات ${dashboard.dailyTask.ayahStart}–${dashboard.dailyTask.ayahEnd}`
                : 'لا توجد مهمة مخصصة اليوم'}
            </Text>
            {dashboard.dailyTask?.teacher && (
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">المعلم: {dashboard.dailyTask.teacher.fullName}</Text>
            )}
            {/* Progress */}
            <View className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-bold text-gray-500 dark:text-gray-400">تقدمك العام</Text>
                <Text className="text-lg font-bold text-primary-700 dark:text-primary-400">{stats.progressPercent || 0}%</Text>
              </View>
              <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <View className="h-full bg-primary-600 rounded-full" style={{ width: `${stats.progressPercent || 0}%` }} />
              </View>
            </View>
          </View>

          {/* Streak */}
          <View className="mx-4 mt-4 bg-gray-900 rounded-2xl p-5">
            <Text className="text-sm font-bold text-gray-400">🔥 سلسلة التعلم</Text>
            <Text className="text-5xl font-bold text-white mt-2">{stats.learningStreak || 0}</Text>
            <Text className="text-lg text-gray-300">يوم متتالي</Text>
            <Text className="text-xs text-gray-500 mt-2">حافظ على وردك لتفتح شارات الإنجاز!</Text>
          </View>

          {/* Upcoming Exams */}
          <View className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">📝 الاختبارات القادمة</Text>
            {(dashboard.upcomingExams || []).length === 0 ? (
              <Text className="text-sm text-gray-400 text-center py-4">لا توجد اختبارات قادمة حالياً</Text>
            ) : (
              dashboard.upcomingExams?.map((exam) => (
                <View key={exam.id} className="flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-2">
                  <View>
                    <Text className="font-bold text-gray-900 dark:text-white">{exam.title}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(() => {
                        const d = new Date(exam.startTime);
                        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </Text>
                  </View>
                  <Text className="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 px-3 py-1.5 rounded-xl text-sm font-bold">{exam.timeLimitMinutes} د</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* Teacher action cards */}
      {role === 'TEACHER' && (
        <View className="mx-4 mt-4 gap-3">
          {[
            { title: 'إدارة الورد اليومي', desc: 'أنشئ مهام حفظ ومراجعة دقيقة لكل طالب.', icon: '📝' },
            { title: 'إدارة الاختبارات', desc: 'حضّر اختبارات أسبوعية وشهرية.', icon: '📋' },
            { title: 'تنبيهات الطلاب', desc: 'أرسل رسائل تحفيزية وتنبيهات متابعة.', icon: '🔔' },
          ].map((item) => (
            <View key={item.title} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <Text className="text-2xl mb-2">{item.icon}</Text>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Admin cards */}
      {role === 'ADMIN' && (
        <View className="mx-4 mt-4 gap-3">
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">📊 تحليلات المنصة</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">نشاط الأسبوع الماضي</Text>
            <View className="flex-row justify-between items-end mt-4 h-32">
              {[42, 68, 55, 82, 74, 91, 88].map((h, i) => (
                <View key={i} className="flex-1 mx-0.5 bg-primary-400 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </View>
          </View>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">👥 إدارة المحتوى</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">راجع الدروس والإعلانات المنشورة</Text>
          </View>
        </View>
      )}

      {/* Notifications */}
      {(dashboard.notifications || []).length > 0 && (
        <View className="mx-4 mt-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔔 آخر الإشعارات</Text>
          {dashboard.notifications?.slice(0, 5).map((n) => (
            <View key={n.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-2">
              <Text className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>{n.message}</Text>
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
