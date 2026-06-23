import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'date' | 'time' | 'datetime';
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // Sun, Mon, Tue, Wed, Thu, Fri, Sat

export default function DateTimePickerModal({ visible, onClose, mode, value, onChange, minimumDate }: DateTimePickerModalProps) {
  const [currentDate, setCurrentDate] = useState(value || new Date());
  const [activeTab, setActiveTab] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');

  // Date State
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  // Time State
  const [timeMode, setTimeMode] = useState<'hours' | 'minutes'>('hours');
  const [hour, setHour] = useState(currentDate.getHours());
  const [minute, setMinute] = useState(currentDate.getMinutes());

  useEffect(() => {
    if (visible) {
      const init = value || new Date();
      setCurrentDate(init);
      setDisplayMonth(init.getMonth());
      setDisplayYear(init.getFullYear());
      setHour(init.getHours());
      setMinute(init.getMinutes());
      setActiveTab(mode === 'time' ? 'time' : 'date');
      setTimeMode('hours');
    }
  }, [visible, value, mode]);

  const handleConfirm = () => {
    const newDate = new Date(displayYear, displayMonth, currentDate.getDate(), hour, minute);
    onChange(newDate);
    onClose();
  };

  const generateDays = () => {
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const prevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const nextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const isDateDisabled = (day: number) => {
    if (!minimumDate) return false;
    const testDate = new Date(displayYear, displayMonth, day);
    testDate.setHours(0, 0, 0, 0);
    const minD = new Date(minimumDate);
    minD.setHours(0, 0, 0, 0);
    return testDate < minD;
  };

  const renderDial = () => {
    const isHours = timeMode === 'hours';
    const items = isHours ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i * 5);
    
    const size = 260;
    const center = size / 2;
    const innerRadius = 70;
    const outerRadius = 110;

    const currentVal = isHours ? hour : minute;
    
    const angle = isHours ? (currentVal * 30) : (currentVal * 6);
    const rad = (angle - 90) * (Math.PI / 180);
    const lineRadius = isHours && currentVal > 0 && currentVal <= 12 ? innerRadius : outerRadius;
    const x2 = center + Math.cos(rad) * lineRadius;
    const y2 = center + Math.sin(rad) * lineRadius;

    return (
      <View className="items-center justify-center relative bg-gray-50 rounded-full mx-auto" style={{ width: size, height: size, borderWidth: 1, borderColor: '#f3f4f6' }}>
        <Svg width={size} height={size} className="absolute inset-0">
          <Circle cx={center} cy={center} r={4} fill="#10b981" />
          <Line x1={center} y1={center} x2={x2} y2={y2} stroke="#10b981" strokeWidth={2} />
          <Circle cx={x2} cy={y2} r={14} fill="#10b981" fillOpacity={0.4} />
        </Svg>
        {items.map(item => {
          const isInner = isHours && item > 0 && item <= 12;
          const a = isHours ? (item % 12) * 30 - 90 : (item / 5) * 30 - 90;
          const r = isInner ? innerRadius : outerRadius;
          const radA = (a * Math.PI) / 180;
          const x = Math.cos(radA) * r;
          const y = Math.sin(radA) * r;
          
          const isSelected = isHours ? item === hour : item === minute;

          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                if (isHours) {
                  setHour(item);
                  setTimeout(() => setTimeMode('minutes'), 300);
                } else {
                  setMinute(item);
                }
              }}
              style={{
                position: 'absolute',
                left: center + x - 16,
                top: center + y - 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isSelected ? '#10b981' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: isSelected ? '#fff' : '#374151' }}>
                {item.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-center items-center px-4">
        <View className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-xl border border-gray-100">
          
          {/* Header */}
          <View className="bg-emerald-600 px-6 py-4">
            <Text className="text-emerald-100 font-bold mb-1 text-sm">
              {mode === 'date' ? 'تحديد التاريخ' : mode === 'time' ? 'تحديد الوقت' : 'تحديد التاريخ والوقت'}
            </Text>
            <View className="flex-row items-center justify-between">
              {mode !== 'time' && (
                <TouchableOpacity onPress={() => setActiveTab('date')}>
                  <Text className={`text-2xl font-black ${activeTab === 'date' ? 'text-white' : 'text-emerald-200'}`}>
                    {DAYS[currentDate.getDay()]}، {currentDate.getDate()} {MONTHS[displayMonth]}
                  </Text>
                </TouchableOpacity>
              )}
              {mode === 'datetime' && <Text className="text-white text-xl mx-2">•</Text>}
              {mode !== 'date' && (
                <TouchableOpacity onPress={() => setActiveTab('time')}>
                  <Text className={`text-2xl font-black ${activeTab === 'time' ? 'text-white' : 'text-emerald-200'}`}>
                    {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="p-4" style={{ minHeight: 320 }}>
            {activeTab === 'date' ? (
              <View>
                {/* Month/Year selector */}
                <View className="flex-row justify-between items-center mb-4 px-2">
                  <TouchableOpacity onPress={prevMonth} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="chevron-forward" size={20} color="#374151" />
                  </TouchableOpacity>
                  <Text className="text-lg font-black text-gray-900">{MONTHS[displayMonth]} {displayYear}</Text>
                  <TouchableOpacity onPress={nextMonth} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* Days header */}
                <View className="flex-row mb-2">
                  {DAYS.map(d => (
                    <Text key={d} className="flex-1 text-center text-xs font-bold text-gray-400">{d}</Text>
                  ))}
                </View>

                {/* Calendar grid */}
                <View className="flex-row flex-wrap">
                  {generateDays().map((day, idx) => {
                    const isSelected = day === currentDate.getDate() && displayMonth === currentDate.getMonth() && displayYear === currentDate.getFullYear();
                    const disabled = day ? isDateDisabled(day) : false;
                    
                    return (
                      <View key={idx} className="w-[14.28%] aspect-square p-1">
                        {day ? (
                          <TouchableOpacity
                            onPress={() => {
                              const nd = new Date(currentDate);
                              nd.setFullYear(displayYear, displayMonth, day);
                              setCurrentDate(nd);
                            }}
                            disabled={disabled}
                            className={`flex-1 items-center justify-center rounded-full ${
                              isSelected ? 'bg-emerald-600' : disabled ? 'bg-gray-50 opacity-50' : 'bg-transparent hover:bg-gray-100'
                            }`}
                          >
                            <Text className={`font-bold text-sm ${isSelected ? 'text-white' : disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View className="py-2 items-center">
                <View className="flex-row items-center gap-2 mb-6">
                  <TouchableOpacity onPress={() => setTimeMode('hours')} className={`px-4 py-2 rounded-xl ${timeMode === 'hours' ? 'bg-emerald-50' : ''}`}>
                    <Text className={`text-4xl font-black ${timeMode === 'hours' ? 'text-emerald-600' : 'text-gray-300'}`}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-4xl font-black text-gray-300">:</Text>
                  <TouchableOpacity onPress={() => setTimeMode('minutes')} className={`px-4 py-2 rounded-xl ${timeMode === 'minutes' ? 'bg-emerald-50' : ''}`}>
                    <Text className={`text-4xl font-black ${timeMode === 'minutes' ? 'text-emerald-600' : 'text-gray-300'}`}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {renderDial()}
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View className="flex-row justify-end px-6 py-4 border-t border-gray-100" style={{ gap: 16 }}>
            <TouchableOpacity onPress={onClose} className="px-4 py-2">
              <Text className="text-gray-500 font-bold">إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} className="px-4 py-2 bg-emerald-600 rounded-xl">
              <Text className="text-white font-bold">موافق</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
