import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Calendar, 
  AlertTriangle, 
  RotateCcw, 
  Printer, 
  Sparkles,
  ShieldAlert,
  Sprout,
  Gem,
  Users
} from 'lucide-react';
import { NavigationMenu } from '../types';

interface CropLoanInterestScreenProps {
  onNavigate?: (menu: NavigationMenu) => void;
}

export const CropLoanInterestScreen: React.FC<CropLoanInterestScreenProps> = ({ onNavigate }) => {
  // Input states (Temporary In-Memory Only, No DB Persistence)
  const [principalInput, setPrincipalInput] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2025-08-31');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [normalRateInput, setNormalRateInput] = useState<string>('7.0');
  const [penalRateInput, setPenalRateInput] = useState<string>('1.0');
  
  // Advanced Settings (தவணை காலம்)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [tenureDaysInput, setTenureDaysInput] = useState<string>('365');
  const [graceDaysInput, setGraceDaysInput] = useState<string>('0');
  const [calculationBasis, setCalculationBasis] = useState<'365' | '366'>('365');

  // Format Indian comma input helper
  const formatIndianInput = (val: string): string => {
    const clean = val.replace(/[^0-9.]/g, '');
    if (!clean) return '';
    const parts = clean.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('') : '';
    if (!integerPart) return decimalPart ? `0${decimalPart}` : '';
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedInteger = otherNumbers !== '' 
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;
    return formattedInteger + decimalPart;
  };

  // Reset to default empty / initial clean state
  const handleReset = () => {
    setPrincipalInput('');
    setStartDate('2025-08-31');
    setEndDate('2026-08-31');
    setNormalRateInput('7.0');
    setPenalRateInput('1.0');
    setTenureDaysInput('365');
    setGraceDaysInput('0');
    setCalculationBasis('365');
  };

  // Preset demo calculation
  const handleLoadSample = () => {
    setPrincipalInput(formatIndianInput('150000'));
    setStartDate('2025-08-31');
    setEndDate('2026-08-31');
    setNormalRateInput('7.0');
    setPenalRateInput('1.0');
    setTenureDaysInput('365');
  };

  // Indian currency formatting helper (Rounded integer display)
  const formatIndian = (num: number): string => {
    if (isNaN(num)) return '0';
    return Math.round(num).toLocaleString('en-IN');
  };

  // Formatted date string for today banner in Tamil
  const todayTamilDate = useMemo(() => {
    const now = new Date();
    const daysTamil = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const monthsTamil = [
      'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
      'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
    ];
    const dayName = daysTamil[now.getDay()];
    const dateNum = now.getDate();
    const monthName = monthsTamil[now.getMonth()];
    const yearNum = now.getFullYear();
    return `${dayName}, ${dateNum} ${monthName}, ${yearNum}`;
  }, []);

  // Calculations
  const calcResults = useMemo(() => {
    const principal = Math.round(parseFloat(principalInput.replace(/,/g, '')) || 0);
    const normalRate = parseFloat(normalRateInput) || 0;
    const penalRate = parseFloat(penalRateInput) || 0;
    const tenureDays = parseInt(tenureDaysInput, 10) || 365;
    const graceDays = parseInt(graceDaysInput, 10) || 0;
    const yearBasis = parseInt(calculationBasis, 10) || 365;

    if (!startDate || !endDate || principal <= 0) {
      return {
        hasData: false,
        totalDays: 0,
        penaltyDays: 0,
        normalInterest: 0,
        penaltyInterest: 0,
        totalInterest: 0,
        totalAmount: 0
      };
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffMs = eDate.getTime() - sDate.getTime();
    const totalDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    // Penalty calculation: If total days exceed tenure + grace
    const allowedDays = tenureDays + graceDays;
    const penaltyDays = Math.max(0, totalDays - allowedDays);

    // Normal interest for all days (standard PACS crop loan) - rounded off
    const rawNormalInterest = (principal * normalRate * totalDays) / (yearBasis * 100);
    const normalInterest = Math.round(rawNormalInterest);

    // Penalty interest for overdue days - rounded off
    const rawPenaltyInterest = (principal * penalRate * penaltyDays) / (yearBasis * 100);
    const penaltyInterest = Math.round(rawPenaltyInterest);

    // Total interest is exact sum of rounded components
    const totalInterest = normalInterest + penaltyInterest;
    // Total amount is exact sum of principal and rounded total interest
    const totalAmount = principal + totalInterest;

    return {
      hasData: true,
      totalDays,
      penaltyDays,
      normalInterest,
      penaltyInterest,
      totalInterest,
      totalAmount
    };
  }, [principalInput, startDate, endDate, normalRateInput, penalRateInput, tenureDaysInput, graceDaysInput, calculationBasis]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card (Light Theme) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E2DC] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-[#D1EAE0] text-[#007A4D] text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                PACS வட்டி மேலாண்மை
              </span>
              <span className="text-stone-500 text-xs">• தற்காலிக கணக்கீடு (In-Memory)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-stone-900 flex items-center gap-3">
              <Calculator className="w-7 h-7 text-[#007A4D]" />
              பயிர்க்கடன் வட்டி கணக்கீடு
            </h1>
            <p className="text-xs md:text-sm text-stone-600 mt-1">
              பயிர்க்கடனுக்கான சாதாரண வட்டி மற்றும் அபராத வட்டி நிகழ்நேர தானியங்கு கணக்கீடு
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-[#F7F6F2] border border-[#E2E2DC] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700">
              <Calendar className="w-3.5 h-3.5 text-[#007A4D]" />
              <span>{todayTamilDate}</span>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F6F2] hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all border border-[#E2E2DC] cursor-pointer"
              title="படிவத்தை இயல்பு நிலைக்கு மீட்டமை"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>மீட்டமை (Reset)</span>
            </button>

            {calcResults.hasData && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007A4D] hover:bg-[#005A36] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>அச்சு (Print)</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Navigation Tabs between Calculators */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#E2E2DC] overflow-x-auto">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#007A4D] text-white shadow-xs cursor-pointer"
          >
            <Sprout className="w-4 h-4" />
            <span>பயிர்க்கடன் வட்டி</span>
          </button>
          <button
            onClick={() => onNavigate?.('interest-jewel')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F6F2] text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D] border border-[#E2E2DC] transition-all cursor-pointer"
          >
            <Gem className="w-4 h-4 text-amber-600" />
            <span>நகைக்கடன் வட்டி</span>
          </button>
          <button
            onClick={() => onNavigate?.('interest-shg')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F6F2] text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D] border border-[#E2E2DC] transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>SHG சுயஉதவி குழு வட்டி</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Real-Time Calculations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Loan Details Input Card */}
        <div className="lg:col-span-6 bg-white border border-[#E2E2DC] rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-3">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>கடன் விவரங்கள் உள்ளீடு</span>
            </h2>
            <button
              onClick={handleLoadSample}
              className="text-xs text-[#007A4D] hover:text-[#005A36] font-bold flex items-center gap-1 cursor-pointer bg-[#D1EAE0]/50 px-2.5 py-1 rounded-lg hover:bg-[#D1EAE0]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>மாதிரி தரவு</span>
            </button>
          </div>

          {/* 1. Principal Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              அசல் தொகை (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                value={principalInput}
                onChange={(e) => setPrincipalInput(formatIndianInput(e.target.value))}
                placeholder="0"
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-[#007A4D] focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl pl-9 pr-4 py-2.5 text-base font-mono font-bold outline-none transition-all placeholder:text-stone-400"
              />
            </div>
            {parseFloat(principalInput.replace(/,/g, '')) > 0 && (
              <p className="text-[11px] text-[#007A4D] font-mono font-bold">
                தொகை: ₹ {formatIndian(parseFloat(principalInput.replace(/,/g, '')))}
              </p>
            )}
          </div>

          {/* 2. Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                ஆரம்ப தேதி <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-[#007A4D] focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                முடிவு தேதி <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-[#007A4D] focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none transition-all"
              />
            </div>
          </div>

          {/* 3. Interest Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                வட்டி விகிதம் (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={normalRateInput}
                  onChange={(e) => setNormalRateInput(e.target.value)}
                  placeholder="7.0"
                  className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-[#007A4D] rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                அபராத வட்டி விகிதம் (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={penalRateInput}
                  onChange={(e) => setPenalRateInput(e.target.value)}
                  placeholder="1.0"
                  className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-red-500 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Settings */}
          <div className="border border-[#E2E2DC] bg-[#F7F6F2] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-[#007A4D]">{isAdvancedOpen ? '▼' : '▶'}</span>
                மேம்பட்ட அமைப்புகள் (தவணை காலம்)
              </span>
              <span className="text-stone-500 text-xs">{isAdvancedOpen ? 'மறைக்க' : 'காட்ட'}</span>
            </button>

            {isAdvancedOpen && (
              <div className="p-4 pt-1 border-t border-[#E2E2DC] space-y-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      அனுமதிக்கப்பட்ட தவணை
                    </label>
                    <input
                      type="number"
                      value={tenureDaysInput}
                      onChange={(e) => setTenureDaysInput(e.target.value)}
                      className="w-full bg-white text-stone-900 border border-[#D5D5CD] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      தளர்வு நாட்கள் (Grace)
                    </label>
                    <input
                      type="number"
                      value={graceDaysInput}
                      onChange={(e) => setGraceDaysInput(e.target.value)}
                      className="w-full bg-white text-stone-900 border border-[#D5D5CD] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      ஆண்டு அடிப்படை
                    </label>
                    <select
                      value={calculationBasis}
                      onChange={(e) => setCalculationBasis(e.target.value as any)}
                      className="w-full bg-white text-stone-900 border border-[#D5D5CD] rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      <option value="365">365 நாட்கள்</option>
                      <option value="366">366 நாட்கள் (Leap)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Days & Real-time Calculation Details */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top 2 Metric Badges: Total Days & Penalty Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Total Days */}
            <div className="bg-white border border-[#E2E2DC] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#D1EAE0] flex items-center justify-center text-[#007A4D] shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500">மொத்த நாட்கள்</p>
                <p className="text-xl md:text-2xl font-black font-mono text-stone-900 mt-0.5">
                  {calcResults.hasData ? `${calcResults.totalDays} நாட்கள்` : '—'}
                </p>
              </div>
            </div>

            {/* 2. Penalty Days */}
            <div className="bg-white border border-[#E2E2DC] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${calcResults.penaltyDays > 0 ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500">அபராத நாட்கள்</p>
                <p className={`text-xl md:text-2xl font-black font-mono mt-0.5 ${calcResults.penaltyDays > 0 ? 'text-red-600' : 'text-stone-700'}`}>
                  {calcResults.hasData ? `${calcResults.penaltyDays} நாட்கள்` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Calculation Details Card */}
          <div className="bg-white border border-[#E2E2DC] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-[#E2E2DC] pb-3">
              கணக்கீட்டு விவரங்கள்
            </h3>

            <div className="space-y-3 font-medium text-sm">
              {/* Normal Interest */}
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">சாதாரண வட்டி:</span>
                <span className="font-mono font-bold text-stone-900 text-base">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.normalInterest)}` : '—'}
                </span>
              </div>

              {/* Penalty Interest */}
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-red-600 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  அபராத வட்டி:
                </span>
                <span className="font-mono font-bold text-red-600 text-base">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.penaltyInterest)}` : '—'}
                </span>
              </div>
            </div>

            {/* Green Highlight Card: Total Interest Amount */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  மொத்த வட்டி தொகை:
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                  (சாதாரண வட்டி + அபராத வட்டி)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl md:text-2xl font-black font-mono text-emerald-800">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.totalInterest)}` : '—'}
                </span>
              </div>
            </div>

            {/* Blue Highlight Card: Total Amount (Principal + Interest) */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  மொத்த தொகை (அசல் + வட்டி):
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5 font-medium">
                  உறுப்பினர் செலுத்த வேண்டிய முழு தொகை
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl md:text-3xl font-black font-mono text-blue-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.totalAmount)}` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
