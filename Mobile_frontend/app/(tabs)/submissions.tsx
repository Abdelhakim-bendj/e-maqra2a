import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { timeAgo } from '../../lib/utils';
import type { Submission } from '../../types';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

export default function SubmissionsScreen() {
  const user = useAuthStore((s: any) => s.user);
  const qc = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [scores, setScores] = useState({ memorization: 10, tajweed: 10, fluency: 10, feedback: '' });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('يرجى منح صلاحية الميكروفون');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking file', err);
    }
  };

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => apiClient.get(`/submissions${user?.role === 'TEACHER' ? '?status=PENDING' : ''}`).then((r) => r.data as { submissions: Submission[] }),
  });

  const assessMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/submissions/assess', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions'] }); setSelectedSub(null); },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { audioUrl: string; notes?: string }) =>
      apiClient.post('/submissions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      setIsNewModalOpen(false);
      setAudioUri(null);
      setStudentNotes('');
    },
  });

  const submitAudio = async () => {
    if (!audioUri) return;
    
    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const audioUrl = reader.result as string;
        submitMutation.mutate({ audioUrl, notes: studentNotes });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert('حدث خطأ أثناء إرسال التسميع');
    }
  };

  const subs = data?.submissions ?? [];
  const statusLabel: Record<string, string> = { PENDING: 'قيد المراجعة', REVIEWED: 'تم التقييم', REVISION_NEEDED: 'يحتاج مراجعة' };
  const statusColor: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', REVIEWED: 'bg-emerald-100 text-emerald-700', REVISION_NEEDED: 'bg-red-100 text-red-700' };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950 dark:bg-gray-950" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#047857" />}>
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">{user?.role === 'STUDENT' ? 'سجل التسميعات' : 'تقييم التسميعات'}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.role === 'STUDENT' ? 'متابعة تسميعاتك وتقييمات المعلم' : 'مراجعة التسجيلات وتقييم الطلاب'}</Text>
        </View>
        {user?.role === 'STUDENT' && (
          <TouchableOpacity onPress={() => setIsNewModalOpen(true)} className="bg-primary-600 px-4 py-2 rounded-xl">
            <Text className="text-white font-bold text-sm">+ تسميع جديد</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="p-8 items-center"><ActivityIndicator size="large" color="#047857" /></View>
      ) : subs.length === 0 ? (
        <View className="p-12 items-center">
          <Text className="text-4xl mb-3">🎤</Text>
          <Text className="text-lg font-bold text-gray-400 dark:text-gray-500">{user?.role === 'STUDENT' ? 'لم تقم بتسليم أي تسميع بعد' : 'لا توجد تسميعات بانتظار التقييم'}</Text>
        </View>
      ) : (
        <View className="px-4 pb-6 gap-3 mt-4">
          {subs.map((sub) => (
            <TouchableOpacity key={sub.id} onPress={() => setSelectedSub(sub)}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border ${selectedSub?.id === sub.id ? 'border-primary-500' : 'border-gray-100 dark:border-gray-800'} shadow-sm`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center">
                    <Text className="text-lg">🎤</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900 dark:text-white">{sub.student.fullName}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">سورة {sub.task.surahNumber} ({sub.task.ayahStart}-{sub.task.ayahEnd})</Text>
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
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mt-2">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">تقييم: {selectedSub.student.fullName}</Text>
              <Text className="text-sm text-primary-700 dark:text-primary-400 mb-4">سورة {selectedSub.task.surahNumber}</Text>

              {user?.role === 'TEACHER' ? (
                <View>
                  {(['memorization', 'tajweed', 'fluency'] as const).map((c) => (
                    <View key={c} className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{c === 'memorization' ? 'الحفظ' : c === 'tajweed' ? 'التجويد' : 'الطلاقة'}</Text>
                      <TextInput
                        className="w-16 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-center font-bold bg-gray-50 dark:bg-gray-950 dark:bg-gray-800 dark:text-white"
                        keyboardType="number-pad"
                        value={String(scores[c])}
                        onChangeText={(v) => setScores({ ...scores, [c]: parseInt(v) || 0 })}
                      />
                    </View>
                  ))}
                  <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-950 dark:bg-gray-800 text-sm mb-3 h-20 dark:text-white" multiline
                    placeholder="ملاحظات توجيهية..." value={scores.feedback} onChangeText={(v) => setScores({ ...scores, feedback: v })} placeholderTextColor="#9ca3af" />
                  <TouchableOpacity onPress={() => assessMutation.mutate({ submissionId: selectedSub.id, memorizationScore: scores.memorization, tajweedScore: scores.tajweed, fluencyScore: scores.fluency, feedback: scores.feedback })}
                    disabled={assessMutation.isPending} className="bg-primary-700 py-3 rounded-xl items-center">
                    <Text className="text-white font-bold">{assessMutation.isPending ? 'جاري...' : 'اعتماد التقييم'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {selectedSub.status === 'PENDING' ? (
                    <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 items-center border border-amber-200 dark:border-amber-800/30">
                      <Text className="font-bold text-amber-700 dark:text-amber-500">التسميع قيد المراجعة</Text>
                    </View>
                  ) : (
                    <View>
                      <View className="items-center mb-4">
                        <Text className="text-4xl font-bold text-gray-900 dark:text-white">{selectedSub.assessment?.overallScore || '-'}</Text>
                        <Text className="text-gray-400">/10</Text>
                      </View>
                      {(['memorization', 'tajweed', 'fluency'] as const).map((c) => (
                        <View key={c} className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-950 dark:bg-gray-800 p-3 rounded-xl mb-2 border border-gray-100 dark:border-gray-800">
                          <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{c === 'memorization' ? 'الحفظ' : c === 'tajweed' ? 'التجويد' : 'الطلاقة'}</Text>
                          <Text className="font-bold text-primary-700 dark:text-primary-400">{(selectedSub.assessment as any)?.[`${c}Score`] || '-'} / 10</Text>
                        </View>
                      ))}
                      {selectedSub.assessment?.feedback && (
                        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-3 border border-blue-100 dark:border-blue-800/30">
                          <Text className="text-sm text-blue-900 dark:text-blue-300">{selectedSub.assessment.feedback}</Text>
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
      <Modal visible={isNewModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">إرسال تسميع جديد</Text>
              <TouchableOpacity onPress={() => setIsNewModalOpen(false)}>
                <Text className="text-xl text-gray-400">✕</Text>
              </TouchableOpacity>
            </View>
            
            <View className="mb-6">
              <Text className="font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">ملاحظات (اختياري)</Text>
              <TextInput
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-950 dark:bg-gray-800 text-right h-24 dark:text-white"
                multiline
                placeholder="أضف أي ملاحظات لمعلمك..."
                placeholderTextColor="#9ca3af"
                value={studentNotes}
                onChangeText={setStudentNotes}
              />
            </View>
            
            <View className="items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl mb-6 bg-gray-50 dark:bg-gray-950 dark:bg-gray-800/50 flex-1">
              {recording ? (
                <View className="items-center">
                  <Text className="text-4xl font-bold text-red-500 mb-6">
                    {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={stopRecording} className="bg-red-500 px-8 py-4 rounded-full flex-row items-center">
                    <Text className="text-white font-bold text-lg">إيقاف التسجيل ⏹</Text>
                  </TouchableOpacity>
                </View>
              ) : audioUri ? (
                <View className="items-center">
                  <Text className="text-primary-600 font-bold mb-4 text-lg">✅ تم تسجيل الصوت بنجاح</Text>
                  <TouchableOpacity onPress={() => setAudioUri(null)} className="mb-2 bg-red-50 px-4 py-2 rounded-lg">
                    <Text className="text-red-500 font-bold">إعادة التسجيل</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center w-full">
                  <TouchableOpacity onPress={startRecording} className="bg-primary-600 p-6 rounded-full items-center justify-center w-24 h-24 shadow-lg shadow-primary-200 dark:shadow-none mb-4">
                    <Text className="text-4xl">🎤</Text>
                  </TouchableOpacity>
                  <Text className="text-primary-700 dark:text-primary-400 font-bold text-lg mb-2">ابدأ التسجيل الصوتي</Text>
                  
                  <View className="flex-row items-center w-full my-4 px-4">
                    <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                    <Text className="mx-4 text-gray-400 font-bold">أو</Text>
                    <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                  </View>

                  <TouchableOpacity 
                    onPress={pickAudioFile} 
                    className="w-full border-2 border-dashed border-primary-200 dark:border-primary-900 bg-primary-50 dark:bg-primary-900/20 rounded-xl py-4 flex-row items-center justify-center gap-2"
                  >
                    <Text className="text-xl">📁</Text>
                    <Text className="text-primary-700 dark:text-primary-400 font-bold">رفع ملف صوتي (MP3, WAV)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              onPress={submitAudio} 
              disabled={!audioUri || submitMutation.isPending}
              className={`py-4 rounded-2xl items-center mt-auto ${!audioUri || submitMutation.isPending ? 'bg-gray-300' : 'bg-gray-900'}`}
            >
              <Text className="text-white font-bold text-lg">{submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التسميع'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
