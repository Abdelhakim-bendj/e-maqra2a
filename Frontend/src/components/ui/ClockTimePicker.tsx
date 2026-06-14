import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface ClockTimePickerProps {
  value: string; // HH:mm format
  onChange: (value: string) => void;
}

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  
  // Parse initial time
  const [hour, setHour] = useState(value ? parseInt(value.split(':')[0]) : 12);
  const [minute, setMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);
  
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      setHour(parseInt(value.split(':')[0]));
      setMinute(parseInt(value.split(':')[1]));
    }
  }, [value]);

  const handleTimeChange = (h: number, m: number) => {
    const formattedHour = h.toString().padStart(2, '0');
    const formattedMinute = m.toString().padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const selectHour = (h: number) => {
    setHour(h);
    setMode('minutes');
    handleTimeChange(h, minute);
  };

  const selectMinute = (m: number) => {
    setMinute(m);
    handleTimeChange(hour, m);
    setTimeout(() => setIsOpen(false), 300); // close after a brief delay
  };

  const renderDial = () => {
    const isHours = mode === 'hours';
    const items = isHours ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i * 5);
    
    return (
      <div className="relative w-64 h-64 mx-auto bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center shadow-inner">
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-emerald-600 rounded-full z-10" />
        
        {/* Pointer line */}
        <div 
          className="absolute w-1 bg-emerald-500 origin-bottom rounded-full transition-transform duration-300"
          style={{
            height: isHours ? (hour < 12 ? '30%' : '40%') : '40%',
            bottom: '50%',
            left: 'calc(50% - 2px)',
            transform: `rotate(${isHours ? (hour * 30) : (minute * 6)}deg)`,
            transformOrigin: 'bottom center'
          }}
        >
          <div className="absolute -top-3 -left-3 w-7 h-7 bg-emerald-500 rounded-full opacity-50" />
        </div>

        {items.map((item) => {
          const isSelected = isHours ? item === hour : item === minute;
          const isInner = isHours && item < 12; // PM hours inner ring (0-11 usually inner or outer, let's do 12-23 outer, 0-11 inner)
          
          // Let's actually put 0-11 inner, 12-23 outer
          const angle = isHours 
            ? (item % 12) * 30 - 90 
            : (item / 5) * 30 - 90;
            
          const radius = isHours && item < 12 ? 65 : 105;
          
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <button
              key={item}
              onClick={() => isHours ? selectHour(item) : selectMinute(item)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm font-bold transition-all z-20 ${
                isSelected 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
              style={{
                transform: `translate(${x}px, ${y}px)`
              }}
            >
              {item.toString().padStart(2, '0')}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={popupRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer flex items-center justify-between"
      >
        <span className="font-bold text-slate-800">
          {value || '--:--'}
        </span>
        <Clock className="h-4 w-4 text-emerald-600" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-72 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setMode('hours')}
              className={`text-3xl font-black rounded-lg px-2 py-1 transition ${mode === 'hours' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {hour.toString().padStart(2, '0')}
            </button>
            <span className="text-3xl font-black text-slate-400">:</span>
            <button
              onClick={() => setMode('minutes')}
              className={`text-3xl font-black rounded-lg px-2 py-1 transition ${mode === 'minutes' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {minute.toString().padStart(2, '0')}
            </button>
          </div>

          {/* Dial */}
          {renderDial()}

          <div className="mt-4 flex justify-between px-2">
            <button onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700">
              إلغاء
            </button>
            <button onClick={() => setIsOpen(false)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
              موافق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
