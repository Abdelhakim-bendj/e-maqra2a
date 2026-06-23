import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import DateTimePickerModal from '../components/ui/DateTimePickerModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

interface QuestionForm {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
}

let idCounter = 0;
const genId = () => `q_${++idCounter}_${Date.now()}`;

export default function ManageExamScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState('اختبار بدون عنوان');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date(Date.now() + 3600000));
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [questions, setQuestions] = useState<QuestionForm[]>([
    { id: genId(), questionText: '', questionType: 'MULTIPLE_CHOICE', options: ['الخيار 1'], correctAnswer: '', points: 1 },
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState(questions[0].id);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/exams', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('خطأ', err.message),
  });

  const addQuestion = () => {
    const id = genId();
    setQuestions([...questions, { id, questionText: '', questionType: 'MULTIPLE_CHOICE', options: ['الخيار 1'], correctAnswer: '', points: 1 }]);
    setActiveQuestionId(id);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionForm>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    const next = questions.filter(q => q.id !== id);
    setQuestions(next);
    if (activeQuestionId === id) setActiveQuestionId(next[next.length - 1].id);
  };

  const handleSave = () => {
    if (!startDateTime || !endDateTime) {
      Alert.alert('يرجى تحديد وقت البداية والنهاية');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || q.questionText.trim().length < 5) {
        Alert.alert(`السؤال ${i + 1} يجب أن يكون 5 أحرف على الأقل`);
        return;
      }
      if (!q.correctAnswer) {
        Alert.alert(`يرجى تحديد الإجابة الصحيحة للسؤال ${i + 1}`);
        return;
      }
    }
    createMutation.mutate({
      title,
      description,
      examType,
      timeLimitMinutes,
      passingScore,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      questions: questions.map((q, i) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        options: q.questionType === 'MULTIPLE_CHOICE' ? q.options : undefined,
        correctAnswer: q.correctAnswer,
        orderIndex: i,
      })),
    });
  };

  const activeQ = questions.find(q => q.id === activeQuestionId);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Exam header */}
      <View className="bg-white rounded-3xl p-5 shadow-sm border-t-4 border-t-emerald-600 mb-6">
        <TextInput
          value={title}
          onChangeText={setTitle}
          className="text-2xl font-black text-gray-900 border-b border-transparent focus:border-emerald-500 pb-2 mb-3"
          placeholder="عنوان الاختبار"
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="وصف الاختبار (اختياري)"
          multiline
          className="text-gray-600 pb-2"
        />
        <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
          <View className="flex-1" style={{ minWidth: 120 }}>
            <Text className="text-xs font-bold text-gray-500 mb-1">النوع</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['WEEKLY', 'MONTHLY'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setExamType(t)}
                  className={`flex-1 py-2 rounded-lg border ${examType === t ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                  <Text className={`text-xs font-bold text-center ${examType === t ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {t === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ minWidth: 80 }}>
            <Text className="text-xs font-bold text-gray-500 mb-1">المدة (د)</Text>
            <TextInput value={String(timeLimitMinutes)} onChangeText={(t) => setTimeLimitMinutes(parseInt(t) || 30)}
              keyboardType="numeric" className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-center" />
          </View>
          <View style={{ minWidth: 80 }}>
            <Text className="text-xs font-bold text-gray-500 mb-1">درجة النجاح</Text>
            <TextInput value={String(passingScore)} onChangeText={(t) => setPassingScore(parseInt(t) || 60)}
              keyboardType="numeric" className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-center" />
          </View>
        </View>
        {/* Start / End */}
        <View className="flex-row mt-4" style={{ gap: 12 }}>
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-500 mb-1">وقت البدء</Text>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-700">
                {startDateTime.toISOString().slice(0, 10)} {startDateTime.getHours().toString().padStart(2, '0')}:{startDateTime.getMinutes().toString().padStart(2, '0')}
              </Text>
              <Ionicons name="calendar" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-500 mb-1">وقت الانتهاء</Text>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-700">
                {endDateTime.toISOString().slice(0, 10)} {endDateTime.getHours().toString().padStart(2, '0')}:{endDateTime.getMinutes().toString().padStart(2, '0')}
              </Text>
              <Ionicons name="calendar" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        <DateTimePickerModal
          visible={showStartPicker}
          mode="datetime"
          value={startDateTime}
          onChange={(d) => setStartDateTime(d)}
          onClose={() => setShowStartPicker(false)}
        />
        <DateTimePickerModal
          visible={showEndPicker}
          mode="datetime"
          value={endDateTime}
          onChange={(d) => setEndDateTime(d)}
          onClose={() => setShowEndPicker(false)}
        />
      </View>

      {/* Questions */}
      <Text className="text-lg font-black text-gray-900 mb-3">الأسئلة ({questions.length})</Text>

      {questions.map((q, idx) => {
        const isActive = activeQuestionId === q.id;
        return (
          <TouchableOpacity
            key={q.id}
            activeOpacity={0.9}
            onPress={() => setActiveQuestionId(q.id)}
            className={`mb-3 rounded-2xl border bg-white p-4 ${isActive ? 'border-emerald-500' : 'border-gray-200'}`}
          >
            {isActive ? (
              <View style={{ gap: 12 }}>
                <TextInput
                  value={q.questionText}
                  onChangeText={(t) => updateQuestion(q.id, { questionText: t })}
                  placeholder={`السؤال ${idx + 1}`}
                  className="bg-gray-50 rounded-xl p-3 font-medium"
                />
                {/* Question type */}
                <View className="flex-row" style={{ gap: 8 }}>
                  {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] as QuestionType[]).map(t => (
                    <TouchableOpacity key={t} onPress={() => updateQuestion(q.id, { questionType: t })}
                      className={`flex-1 py-2 rounded-lg border ${q.questionType === t ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                      <Text className={`text-xs font-bold text-center ${q.questionType === t ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {t === 'MULTIPLE_CHOICE' ? 'خيارات' : t === 'TRUE_FALSE' ? 'صح/خطأ' : 'نصي'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Options for MCQ */}
                {q.questionType === 'MULTIPLE_CHOICE' && (
                  <View style={{ gap: 8 }}>
                    {q.options.map((opt, oIdx) => (
                      <View key={oIdx} className="flex-row items-center" style={{ gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => updateQuestion(q.id, { correctAnswer: opt })}
                          className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                            q.correctAnswer === opt ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}
                        >
                          {q.correctAnswer === opt && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </TouchableOpacity>
                        <TextInput
                          value={opt}
                          onChangeText={(t) => {
                            const opts = [...q.options];
                            opts[oIdx] = t;
                            updateQuestion(q.id, { options: opts });
                            if (q.correctAnswer === opt) updateQuestion(q.id, { correctAnswer: t });
                          }}
                          className="flex-1 bg-transparent py-1 font-medium border-b border-gray-200 focus:border-emerald-500"
                          placeholder={`الخيار ${oIdx + 1}`}
                        />
                        <TouchableOpacity onPress={() => {
                          updateQuestion(q.id, { options: q.options.filter((_, i) => i !== oIdx) });
                        }}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => updateQuestion(q.id, { options: [...q.options, `الخيار ${q.options.length + 1}`] })}>
                      <Text className="text-sm font-bold text-emerald-600">+ إضافة خيار</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* True/False */}
                {q.questionType === 'TRUE_FALSE' && (
                  <View style={{ gap: 8 }}>
                    {['صح', 'خطأ'].map(opt => (
                      <TouchableOpacity key={opt} onPress={() => updateQuestion(q.id, { correctAnswer: opt })}
                        className={`flex-row items-center p-3 rounded-xl border-2 ${q.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                        style={{ gap: 8 }}>
                        <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                          q.correctAnswer === opt ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {q.correctAnswer === opt && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text className="font-medium text-gray-700">{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Short answer */}
                {q.questionType === 'SHORT_ANSWER' && (
                  <TextInput
                    value={q.correctAnswer}
                    onChangeText={(t) => updateQuestion(q.id, { correctAnswer: t })}
                    placeholder="الإجابة النموذجية..."
                    className="bg-gray-50 rounded-xl p-3 font-medium border-b-2 border-gray-200 focus:border-emerald-500"
                  />
                )}

                {/* Points and delete */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text className="text-sm font-bold text-gray-600">النقاط:</Text>
                    <TextInput value={String(q.points)} onChangeText={(t) => updateQuestion(q.id, { points: parseInt(t) || 1 })}
                      keyboardType="numeric" className="w-14 bg-gray-50 border border-gray-200 rounded-lg p-1 text-center font-bold" />
                  </View>
                  {questions.length > 1 && (
                    <TouchableOpacity onPress={() => removeQuestion(q.id)}>
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View>
                <Text className="font-bold text-gray-800">{q.questionText || 'سؤال بدون عنوان'}</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  النوع: {q.questionType === 'MULTIPLE_CHOICE' ? 'خيارات' : q.questionType === 'TRUE_FALSE' ? 'صح/خطأ' : 'نصي'} | النقاط: {q.points}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Bottom actions */}
      <View className="flex-row mt-4" style={{ gap: 12 }}>
        <TouchableOpacity onPress={addQuestion} className="flex-1 flex-row items-center justify-center bg-gray-100 py-3 rounded-xl" style={{ gap: 6 }}>
          <Ionicons name="add" size={20} color="#4b5563" />
          <Text className="font-bold text-gray-700">سؤال جديد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={createMutation.isPending}
          className="flex-1 flex-row items-center justify-center bg-emerald-600 py-3 rounded-xl"
          style={{ gap: 6 }}
        >
          {createMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save" size={20} color="#fff" />}
          <Text className="font-black text-white">{createMutation.isPending ? 'جاري...' : 'حفظ الاختبار'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
