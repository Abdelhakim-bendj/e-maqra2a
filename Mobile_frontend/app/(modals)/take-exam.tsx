import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';

type Question = {
  id: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  questionText: string;
  options?: string[];
  points: number;
};

export default function TakeExamScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => apiClient.get(`/exams/${id}`).then((r: any) => r.data.exam),
    enabled: !!id,
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => apiClient.post(`/exams/${id}/start`).then((r: any) => r.data),
    onSuccess: (data: any) => {
      if (examData?.timeLimitMinutes && timeLeft === null) {
        setTimeLeft(examData.timeLimitMinutes * 60);
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { answers: { questionId: string; studentAnswer: string }[] }) =>
      apiClient.post(`/exams/${id}/submit`, payload),
    onSuccess: () => {
      submittedRef.current = true;
      qc.invalidateQueries({ queryKey: ['exams'] });
      Alert.alert('تم تسليم الاختبار بنجاح');
      router.back();
    },
    onError: (err: any) => Alert.alert('خطأ', err.message),
  });

  // Auto-start exam
  useEffect(() => {
    if (examData && !startMutation.data && !startMutation.isPending && !startMutation.isError) {
      startMutation.mutate();
    }
  }, [examData]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!submittedRef.current) handleSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : 0;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  const handleSubmit = () => {
    if (submittedRef.current) return;
    const formatted = Object.keys(answers).map(qId => ({
      questionId: qId,
      studentAnswer: answers[qId],
    }));
    submitMutation.mutate({ answers: formatted });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (examLoading || startMutation.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (startMutation.isError) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-8 items-center justify-center">
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text className="mt-4 text-lg font-black text-red-700 text-center">لا يمكن بدء الاختبار</Text>
        <Text className="mt-2 text-sm text-red-600 font-bold text-center">
          {(startMutation.error as any)?.message || 'تأكد من أن الاختبار متاح في هذا الوقت'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-red-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions: Question[] = startMutation.data?.questions || [];
  const exam = examData;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Sticky header */}
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-black text-gray-900 dark:text-white" numberOfLines={1}>{exam?.title}</Text>
          <Text className="text-xs font-bold text-gray-500 mt-0.5">
            إجابة على {Object.keys(answers).length} من {questions.length} سؤال
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {timeLeft !== null && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-100' : 'bg-gray-100'}`} style={{ gap: 4 }}>
              <Ionicons name="time" size={16} color={timeLeft < 60 ? '#dc2626' : '#4b5563'} />
              <Text className={`font-black font-mono text-base ${timeLeft < 60 ? 'text-red-700' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-emerald-600 px-4 py-2 rounded-xl flex-row items-center"
            style={{ gap: 6 }}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text className="text-white font-bold text-sm">إنهاء</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ gap: 16 }}>
          {questions.map((q, idx) => (
            <View key={q.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <Text className="text-base font-bold text-gray-900 dark:text-white flex-1 leading-relaxed">
                  <Text className="text-emerald-600">{idx + 1}. </Text>
                  {q.questionText}
                </Text>
                <View className="bg-gray-100 px-2 py-1 rounded-lg ml-2">
                  <Text className="text-xs font-bold text-gray-500">{q.points} نقاط</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {/* MCQ */}
                {q.questionType === 'MULTIPLE_CHOICE' && q.options?.map((opt, oIdx) => (
                  <TouchableOpacity
                    key={oIdx}
                    onPress={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`flex-row items-center p-3 rounded-xl border-2 ${
                      answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 dark:border-gray-800'
                    }`}
                    style={{ gap: 10 }}
                  >
                    <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                      answers[q.id] === opt ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}>
                      {answers[q.id] === opt && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text className="font-medium text-gray-700 dark:text-gray-300 flex-1">{opt}</Text>
                  </TouchableOpacity>
                ))}

                {/* True/False */}
                {q.questionType === 'TRUE_FALSE' && ['صح', 'خطأ'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`flex-row items-center p-3 rounded-xl border-2 ${
                      answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 dark:border-gray-800'
                    }`}
                    style={{ gap: 10 }}
                  >
                    <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                      answers[q.id] === opt ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}>
                      {answers[q.id] === opt && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text className="font-medium text-gray-700 dark:text-gray-300">{opt}</Text>
                  </TouchableOpacity>
                ))}

                {/* Short answer */}
                {q.questionType === 'SHORT_ANSWER' && (
                  <TextInput
                    value={answers[q.id] || ''}
                    onChangeText={(t) => setAnswers({ ...answers, [q.id]: t })}
                    placeholder="اكتب إجابتك هنا..."
                    multiline
                    numberOfLines={3}
                    className="bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-xl p-4 font-medium"
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
