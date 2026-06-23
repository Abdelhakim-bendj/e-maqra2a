import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';

type Answer = {
  id: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  question: {
    questionText: string;
    points: number;
    questionType: string;
  };
};

type Submission = {
  id: string;
  student: { fullName: string; id: string };
  totalScore: number | null;
  submittedAt: string;
  answers: Answer[];
};

export default function ExamResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['exam-results', id],
    queryFn: () => apiClient.get(`/exams/${id}/results`).then((r: any) => r.data.submissions as Submission[]),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const submissions = data ?? [];

  if (submissions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
        <Text className="mt-4 font-black text-gray-400 text-base">لا توجد نتائج لعرضها حالياً</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ gap: 20 }}>
        {submissions.map((sub) => {
          const totalPoints = sub.answers.reduce((acc, a) => acc + a.question.points, 0);
          const d = new Date(sub.submittedAt);
          const dateStr = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

          return (
            <View key={sub.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
              {/* Submission header */}
              <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-lg font-black text-gray-900">{sub.student.fullName}</Text>
                  <Text className="text-xs font-bold text-gray-500 mt-1">تاريخ التسليم: {dateStr}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs font-bold text-gray-500 mb-1">النتيجة</Text>
                  <Text className="text-3xl font-black text-emerald-600">{sub.totalScore ?? '?'}</Text>
                  <Text className="text-sm font-bold text-gray-400">/ {totalPoints}</Text>
                </View>
              </View>

              {/* Answers */}
              <Text className="font-black text-gray-700 mb-3">تفاصيل الإجابات:</Text>
              <View style={{ gap: 10 }}>
                {sub.answers.map((answer, index) => (
                  <View key={answer.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <View className="flex-row justify-between items-start mb-3">
                      <Text className="font-bold text-gray-900 flex-1 leading-relaxed">
                        <Text className="text-emerald-600">{index + 1}. </Text>
                        {answer.question.questionText}
                      </Text>
                      <View className="bg-white px-2 py-1 rounded-lg border border-gray-200 ml-2">
                        <Text className="text-xs font-bold text-gray-500">{answer.question.points} نقاط</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-100" style={{ gap: 10 }}>
                      {answer.isCorrect === true ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      ) : answer.isCorrect === false ? (
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      ) : (
                        <View className="h-5 w-5 rounded-full bg-amber-100 items-center justify-center">
                          <Text className="text-xs font-bold text-amber-600">?</Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm text-gray-700">
                          <Text className="font-bold text-gray-400">إجابة الطالب: </Text>
                          {answer.studentAnswer}
                        </Text>
                      </View>
                      {answer.pointsAwarded !== null && (
                        <Text className={`font-black ${answer.pointsAwarded > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          +{answer.pointsAwarded}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
