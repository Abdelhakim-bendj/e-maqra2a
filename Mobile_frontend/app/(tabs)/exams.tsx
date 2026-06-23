import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import type { Exam } from '../../types';

export default function ExamsScreen() {
  const user = useAuthStore((s: any) => s.user);
  const qc = useQueryClient();
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['exams'],
    queryFn: () => apiClient.get('/exams').then((r) => r.data as { exams: Exam[] }),
  });

  const deleteExam = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });

  const exams = data?.exams ?? [];

  return (
    <ScrollView className="flex-1 bg-gray-50" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-900">الاختبارات</Text>
          <Text className="text-sm text-gray-500 mt-1">{user?.role === 'STUDENT' ? 'الاختبارات المتاحة ونتائجك' : 'إدارة اختبارات الطلاب'}</Text>
        </View>
        {user?.role !== 'STUDENT' && (
          <TouchableOpacity onPress={() => router.push('/(modals)/manage-exam')} className="bg-primary-700 px-4 py-2.5 rounded-xl">
            <Text className="text-white font-bold text-sm">+ إنشاء اختبار</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="p-8 items-center"><ActivityIndicator size="large" color="#047857" /></View>
      ) : exams.length === 0 ? (
        <View className="p-12 items-center">
          <Text className="text-4xl mb-3">📝</Text>
          <Text className="text-lg font-bold text-gray-400">لا توجد اختبارات حالياً</Text>
        </View>
      ) : (
        <View className="px-4 pb-6 gap-3">
          {exams.map((exam) => {
            const now = new Date();
            const start = new Date(exam.startTime);
            const end = new Date(exam.endTime);
            const isActive = now >= start && now <= end && exam.status === 'PUBLISHED';
            const isUpcoming = now < start && exam.status === 'PUBLISHED';

            return (
              <View key={exam.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-xs font-bold px-3 py-1 rounded-full ${exam.examType === 'WEEKLY' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {exam.examType === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </Text>
                  {isActive && <Text className="text-xs font-bold text-emerald-600">● متاح الآن</Text>}
                  {isUpcoming && <Text className="text-xs font-bold text-amber-600">قريباً</Text>}
                </View>

                <Text className="text-lg font-bold text-gray-900 mb-1">{exam.title}</Text>

                <View className="flex-row gap-4 mb-3">
                  <Text className="text-xs text-gray-500">⏱ {exam.timeLimitMinutes} دقيقة</Text>
                  <Text className="text-xs text-gray-500">📋 {exam._count.questions} أسئلة</Text>
                </View>

                {exam.submissions && exam.submissions.length > 0 && exam.submissions[0].totalScore !== null && exam.maxScore ? (
                  <Text className="text-sm font-bold text-emerald-600 mb-2">
                    النتيجة: {Math.round((exam.submissions[0].totalScore / exam.maxScore) * 100)}%
                  </Text>
                ) : null}

                {/* Student actions */}
                {user?.role === 'STUDENT' ? (
                  exam.submissions && exam.submissions.length > 0 ? (
                    <View className="gap-2 mt-2">
                      <View className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-emerald-800">✓ مكتمل</Text>
                        <Text className="text-sm text-emerald-700">{exam.submissions[0].totalScore}/{exam.maxScore || 10}</Text>
                      </View>
                      <TouchableOpacity onPress={() => router.push({ pathname: '/(modals)/exam-results', params: { examId: exam.id } })}
                        className="border border-gray-200 py-3 rounded-xl items-center">
                        <Text className="text-sm font-bold text-gray-600">عرض الإجابات</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isActive ? (
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(modals)/take-exam', params: { examId: exam.id } })}
                      className="bg-primary-700 py-3 rounded-xl items-center mt-3">
                      <Text className="text-white font-bold">بدء الاختبار ←</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="border border-gray-200 bg-gray-50 py-3 rounded-xl items-center mt-3">
                      <Text className="text-sm font-bold text-gray-400">غير متاح حالياً</Text>
                    </View>
                  )
                ) : (
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(modals)/exam-results', params: { examId: exam.id } })}
                      className="flex-1 bg-gray-100 py-3 rounded-xl items-center">
                      <Text className="text-sm font-bold text-gray-700">الإجابات ({exam._count.submissions})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { Alert.alert('حذف', 'هل أنت متأكد؟', [{ text: 'إلغاء' }, { text: 'حذف', style: 'destructive', onPress: () => deleteExam.mutate(exam.id) }]); }}
                      className="bg-red-50 px-4 py-3 rounded-xl items-center">
                      <Text className="text-red-600 text-sm font-bold">حذف</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
