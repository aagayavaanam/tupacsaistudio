import React, { useState, useEffect, useRef } from 'react';
import { Calendar, RotateCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const getSystemTodayYMD = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDMY = (ymd: string): string => {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ymd;
};

export const toYMD = (dmy: string): string => {
  if (!dmy) return '';
  const clean = dmy.replace(/[^0-9-]/g, '').trim();
  const parts = clean.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dmy;
};

export const formatDMYInput = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

const TAMIL_MONTHS = [
  'ஜனவரி',
  'பிப்ரவரி',
  'மார்ச்',
  'ஏப்ரல்',
  'மே',
  'ஜூன்',
  'ஜூலை',
  'ஆகஸ்ட்',
  'செப்டம்பர்',
  'அக்டோபர்',
  'நவம்பர்',
  'டிசம்பர்'
];

const WEEKDAY_NAMES = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'சனி'];

interface TamilDateInputProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChange: (ymd: string) => void;
  required?: boolean;
  isEndDate?: boolean;
  accentColor?: 'green' | 'amber' | 'indigo';
}

export const TamilDateInput: React.FC<TamilDateInputProps> = ({
  label,
  value,
  onChange,
  required = true,
  isEndDate = false,
  accentColor = 'green'
}) => {
  const [dmyText, setDmyText] = useState<string>(() => toDMY(value));
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Calendar view navigation state
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value && value.includes('-')) {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y) && y > 1900) return y;
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value && value.includes('-')) {
      const m = parseInt(value.split('-')[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) return m;
    }
    return new Date().getMonth();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync dmyText when value changes externally
  useEffect(() => {
    setDmyText(toDMY(value));
    if (value && value.includes('-')) {
      const parts = value.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatDMYInput(raw);
    setDmyText(formatted);

    // If full DD-MM-YYYY (10 characters: 2 + 1 + 2 + 1 + 4)
    if (formatted.length === 10) {
      const parts = formatted.split('-');
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);

      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1970 && y <= 2100) {
        const ymd = toYMD(formatted);
        onChange(ymd);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const ymd = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(ymd);
    setDmyText(toDMY(ymd));
    setIsCalendarOpen(false);
  };

  const handleSetToday = () => {
    const todayYmd = getSystemTodayYMD();
    onChange(todayYmd);
    setDmyText(toDMY(todayYmd));
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Days calculations for grid
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Color classes mapping
  const focusBorder = 
    accentColor === 'amber' 
      ? 'focus-within:border-amber-600 focus-within:ring-amber-500/20' 
      : accentColor === 'indigo'
        ? 'focus-within:border-indigo-600 focus-within:ring-indigo-500/20'
        : 'focus-within:border-[#007A4D] focus-within:ring-[#007A4D]/20';

  const badgeColor =
    accentColor === 'amber'
      ? 'text-amber-800 bg-amber-100 hover:bg-amber-200'
      : accentColor === 'indigo'
        ? 'text-indigo-800 bg-indigo-100 hover:bg-indigo-200'
        : 'text-[#007A4D] bg-[#D1EAE0] hover:bg-[#bde0d2]';

  const selectedBg =
    accentColor === 'amber'
      ? 'bg-amber-600 text-white font-bold'
      : accentColor === 'indigo'
        ? 'bg-indigo-600 text-white font-bold'
        : 'bg-[#007A4D] text-white font-bold';

  const todayDot =
    accentColor === 'amber'
      ? 'border border-amber-600 font-bold'
      : accentColor === 'indigo'
        ? 'border border-indigo-600 font-bold'
        : 'border border-[#007A4D] font-bold';

  // Check if a day is today
  const systemTodayYMD = getSystemTodayYMD();
  const isSelectedDate = (d: number) => {
    if (!value) return false;
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    return value === `${viewYear}-${monthStr}-${dayStr}`;
  };

  const isTodayDate = (d: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    return systemTodayYMD === `${viewYear}-${monthStr}-${dayStr}`;
  };

  // Generate Year options (1980 to 2040)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 61 }, (_, i) => currentYear - 40 + i);

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700">
          {label} {required && <span className="text-red-500">*</span>}
          <span className="ml-1.5 font-mono text-[10px] text-stone-500 font-semibold">(dd-mm-yyyy)</span>
        </label>
        {isEndDate && (
          <button
            type="button"
            onClick={handleSetToday}
            className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${badgeColor}`}
            title="இன்றைய சிஸ்டம் தேதியை தேர்ந்தெடுக்க (Set to System Today)"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>இன்றைய தேதி</span>
          </button>
        )}
      </div>

      <div className={`relative flex items-center bg-white border border-[#D5D5CD] rounded-xl focus-within:ring-2 ${focusBorder} transition-all`}>
        <input
          type="text"
          value={dmyText}
          onChange={handleTextChange}
          placeholder="dd-mm-yyyy"
          maxLength={10}
          className="w-full bg-transparent text-stone-900 px-3.5 py-2 text-sm font-mono font-bold outline-none placeholder:text-stone-400"
        />

        {/* Calendar Picker Trigger Button */}
        <button
          type="button"
          onClick={() => {
            if (!isCalendarOpen) {
              if (value && value.includes('-')) {
                const parts = value.split('-');
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                if (!isNaN(y) && !isNaN(m)) {
                  setViewYear(y);
                  setViewMonth(m);
                }
              } else {
                const now = new Date();
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
              }
            }
            setIsCalendarOpen((prev) => !prev);
          }}
          className={`px-3 py-2 transition-colors cursor-pointer border-l border-stone-200 shrink-0 flex items-center gap-1 text-xs font-bold ${
            isCalendarOpen ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="காலண்டரில் தேதியைத் தேர்ந்தெடுக்க"
        >
          <Calendar className="w-4 h-4 text-[#007A4D]" />
        </button>
      </div>

      {/* Interactive Tamil In-App Calendar Dropdown */}
      {isCalendarOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-stone-300 rounded-2xl shadow-2xl p-4 w-76 sm:w-80 animate-in fade-in zoom-in-95 duration-100">
          {/* Calendar Header with Month/Year Navigation */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-2.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-stone-100 text-stone-700 rounded-lg transition-colors cursor-pointer"
              title="முந்தைய மாதம்"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-stone-100"
              >
                {TAMIL_MONTHS.map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName} ({String(idx + 1).padStart(2, '0')})
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-stone-50 border border-stone-200 text-xs font-bold font-mono text-stone-800 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-stone-100"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-stone-100 text-stone-700 rounded-lg transition-colors cursor-pointer"
              title="அடுத்த மாதம்"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-stone-500 mb-1.5">
            {WEEKDAY_NAMES.map((w, idx) => (
              <div key={idx} className={idx === 0 ? 'text-red-500' : ''}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = isSelectedDate(dayNum);
              const isToday = isTodayDate(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center font-mono text-xs transition-all cursor-pointer ${
                    isSelected
                      ? selectedBg
                      : isToday
                        ? `${todayDot} text-stone-900 bg-stone-50`
                        : 'hover:bg-stone-100 text-stone-800'
                  }`}
                  title={`${dayNum} ${TAMIL_MONTHS[viewMonth]} ${viewYear}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Actions */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-2.5 mt-2.5 text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              இன்றைய தேதி
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>மூடுக</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
