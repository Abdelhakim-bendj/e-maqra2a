import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { timeAgo } from '../../lib/utils';
import type { Submission } from '../../types';

export default function SubmissionsScreen() {
  const user = useAuthStore((s: any) => s.user);
  const qc = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [scores, setScores] = useState({ memorization: 10, tajweed: 10, fluency: 10, feedback: '' });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => apiClient.get(`/submissions${user?.role === 'TEACHER' ? '?status=PENDING' : ''}`).then((r) => r.data as { submissions: Submission[] }),
  });

  const assessMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/submissions/assess', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions'] }); setSelectedSub(null); },
  });

  const subs = data?.submissions ?? [];
  const statusLabel: Record<string, string> = { PENDING: 'قيد المراجعة', REVIEWED: 'تم التقييم', REVISION_NEEDED: 'يحتاج مراجعة' };
  const statusColor: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', REVIEWED: 'bg-emerald-100 text-emerald-700', REVISION_NEEDED: 'bg-red-100 text-red-700' };

  return (
    <ScrollView className="flex-1 bg-gray-50" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">{user?.role === 'STUDENT' ? 'سجل التسميعات' : 'تقييم التسميعات'}</Text>
        <Text className="text-sm text-gray-500 mt-1">{user?.role === 'STUDENT' ? 'متابعة تسميعاتك وتقييمات المعلم' : 'مراجعة التسجيلات وتقييم الطلاب'}</Text>
      </View>

      {isLoading ? (
        <View className="p-8 items-center"><ActivityIndicator size="large" color="#047857" /></View>
      ) : subs.length === 0 ? (
        <View className="p-12 items-center">
          <Text className="text-4xl mb-3">🎤</Text>
          <Text className="text-lg font-bold text-gray-400">{user?.role === 'STUDENT' ? 'لم تقم بتسليم أي تسميع بعد' : 'لا توجد تسميعات بانتظار التقييم'}</Text>
        </View>
      ) : (
        <View className="px-4 pb-6 gap-3">
          {subs.map((sub) => (
            <TouchableOpacity key={sub.id} onPress={() => setSelectedSub(sub)}
              className={`bg-white rounded-2xl p-4 border ${selectedSub?.id === sub.id ? 'border-primary-500' : 'border-gray-100'} shadow-sm`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-lg">🎤</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900">{sub.student.fullName}</Text>
                    <Text className="text-xs text-gray-500">سورة {sub.task.surahNumber} ({sub.task.ayahStart}-{sub.task.ayahEnd})</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-gray-400">{timeAgo(new Date(sub.submittedAt))}</Text>
                  {user?.role === 'STUDENT' && (
                    <Text className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 ${statusColor[sub.status] || ''}`}>
                      {statusLabel[sub.status] || sub.status}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Assessment panel */}
          {selectedSub && (
            <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md mt-2">
              <Text className="text-lg font-bold text-gray-900 mb-3">تقييم: {selectedSub.student.fullName}</Text>
              <Text className="text-sm text-primary-700 mb-4">سورة {selectedSub.task.surahNumber}</Text>

              {user?.role === 'TEACHER' ? (
                <View>
                  {(['memorization', 'tajweed', 'fluency'] as const).map((c) => (
                    <View key={c} className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-bold text-gray-700">{c === 'memorization' ? 'الحفظ' : c === 'tajweed' ? 'التجويد' : 'الطلاقة'}</Text>
                      <TextInput
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold bg-gray-50"
                        keyboardType="number-pad"
                        value={String(scores[c])}
                        onChangeText={(v) => setScores({ ...scores, [c]: parseInt(v) || 0 })}
                      />
                    </View>
                  ))}
                  <TextInput className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm mb-3 h-20" multiline
                    placeholder="ملاحظات توجيهية..." value={scores.feedback} onChangeText={(v) => setScores({ ...scores, feedback: v })} placeholderTextColor="#9ca3af" />
                  <TouchableOpacity onPress={() => assessMutation.mutate({ submissionId: selectedSub.id, memorizationScore: scores.memorization, tajweedScore: scores.tajweed, fluencyScore: scores.fluency, feedback: scores.feedback })}
                    disabled={assessMutation.isPending} className="bg-primary-700 py-3 rounded-xl items-center">
                    <Text className="text-white font-bold">{assessMutation.isPending ? 'جاري...' : 'اعتماد التقييم'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {selectedSub.status === 'PENDING' ? (
                    <View className="bg-amber-50 rounded-xl p-5 items-center border border-amber-200">
                      <Text className="font-bold text-amber-700">التسميع قيد المراجعة</Text>
                    </View>
                  ) : (
                    <View>
                      <View className="items-center mb-4">
                        <Text className="text-4xl font-bold text-gray-900">{selectedSub.assessment?.overallScore || '-'}</Text>
                        <Text className="text-gray-400">/10</Text>
                      </View>
                      {(['memorization', 'tajweed', 'fluency'] as const).map((c) => (
                        <View key={c} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100">
                          <Text className="text-sm font-bold text-gray-700">{c === 'memorization' ? 'الحفظ' : c === 'tajweed' ? 'التجويد' : 'الطلاقة'}</Text>
                          <Text className="font-bold text-primary-700">{(selectedSub.assessment as any)?.[`${c}Score`] || '-'} / 10</Text>
                        </View>
                      ))}
                      {selectedSub.assessment?.feedback && (
                        <View className="bg-blue-50 rounded-xl p-4 mt-3 border border-blue-100">
                          <Text className="text-sm text-blue-900">{selectedSub.assessment.feedback}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
