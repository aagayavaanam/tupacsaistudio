import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  AlertTriangle, 
  RotateCcw, 
  Printer, 
  ShieldAlert,
  Coins,
  Gem,
  Sprout,
  Users
} from 'lucide-react';
import { NavigationMenu } from '../types';

interface JewelLoanInterestScreenProps {
  onNavigate?: (menu: NavigationMenu) => void;
}

export const JewelLoanInterestScreen: React.FC<JewelLoanInterestScreenProps> = ({ onNavigate }) => {
  // Input states (In-Memory Only, No DB persistence)
  const [oldPrincipalInput, setOldPrincipalInput] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2025-08-31');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [normalRateInput, setNormalRateInput] = useState<string>('12.5');
  const [penalRateInput, setPenalRateInput] = useState<string>('3.0');

  // Renewal Inputs
  const [newPrincipalInput, setNewPrincipalInput] = useState<string>('');
  const [appraiserFeeInput, setAppraiserFeeInput] = useState<string>('');
  const [currentPaymentInput, setCurrentPaymentInput] = useState<string>('');

  // Advanced Settings
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

  // Reset function to clear inputs back to clean state
  const handleReset = () => {
    setOldPrincipalInput('');
    setStartDate('2025-08-31');
    setEndDate('2026-08-31');
    setNormalRateInput('12.5');
    setPenalRateInput('3.0');
    setNewPrincipalInput('');
    setAppraiserFeeInput('');
    setCurrentPaymentInput('');
    setTenureDaysInput('365');
    setGraceDaysInput('0');
    setCalculationBasis('365');
  };

  // Load sample data for testing
  const handleLoadSample = () => {
    setOldPrincipalInput(formatIndianInput('100000'));
    setStartDate('2025-08-31');
    setEndDate('2026-08-31');
    setNormalRateInput('12.5');
    setPenalRateInput('3.0');
    setNewPrincipalInput(formatIndianInput('125000'));
    setAppraiserFeeInput(formatIndianInput('300'));
    setCurrentPaymentInput('0');
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

  // Calculation logic
  const calcResults = useMemo(() => {
    const oldPrincipal = Math.round(parseFloat(oldPrincipalInput.replace(/,/g, '')) || 0);
    const normalRate = parseFloat(normalRateInput) || 0;
    const penalRate = parseFloat(penalRateInput) || 0;
    const tenureDays = parseInt(tenureDaysInput, 10) || 365;
    const graceDays = parseInt(graceDaysInput, 10) || 0;
    const yearBasis = parseInt(calculationBasis, 10) || 365;

    const newPrincipal = Math.round(parseFloat(newPrincipalInput.replace(/,/g, '')) || 0);
    const appraiserFee = Math.round(parseFloat(appraiserFeeInput.replace(/,/g, '')) || 0);
    const currentPayment = Math.round(parseFloat(currentPaymentInput.replace(/,/g, '')) || 0);

    if (!startDate || !endDate || oldPrincipal <= 0) {
      return {
        hasData: false,
        totalDays: 0,
        penaltyDays: 0,
        oldPrincipal: 0,
        normalInterest: 0,
        penaltyInterest: 0,
        totalInterest: 0,
        oldLoanTotal: 0,
        appraiserFee: 0,
        currentPayment: 0,
        newPrincipal: 0,
        totalAmountDue: 0,
        netCash: 0,
        isRenewal: false,
        netCashDirection: 'உறுப்பினருக்கு வழங்க வேண்டியது' as 'உறுப்பினருக்கு வழங்க வேண்டியது' | 'உறுப்பினர் செலுத்த வேண்டியது',
        explanation: ''
      };
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffMs = eDate.getTime() - sDate.getTime();
    const totalDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const allowedDays = tenureDays + graceDays;
    const penaltyDays = Math.max(0, totalDays - allowedDays);

    // 1. Calculate and round off individual interest components
    const rawNormalInterest = (oldPrincipal * normalRate * totalDays) / (yearBasis * 100);
    const normalInterest = Math.round(rawNormalInterest);

    const rawPenaltyInterest = (oldPrincipal * penalRate * penaltyDays) / (yearBasis * 100);
    const penaltyInterest = Math.round(rawPenaltyInterest);

    // 2. Total interest is the exact sum of rounded interest components
    const totalInterest = normalInterest + penaltyInterest;

    // 3. Old Loan Total = oldPrincipal + totalInterest
    const oldLoanTotal = oldPrincipal + totalInterest;

    // 4. Old loan settlement cost = Old Loan Total + Appraiser fee
    const totalAmountDue = oldLoanTotal + appraiserFee;

    // 5. Net Cash calculation accounting for New Principal (புதிய கடன் அசல்)
    const isRenewal = newPrincipal > 0;
    let netCash = 0;
    let netCashDirection: 'உறுப்பினருக்கு வழங்க வேண்டியது' | 'உறுப்பினர் செலுத்த வேண்டியது' = 'உறுப்பினருக்கு வழங்க வேண்டியது';
    let explanation = '';

    if (isRenewal) {
      // With renewal: Total Inflow (New Principal + Member Paid) minus Total Settlement Cost (Old Principal + Interest + Fee)
      const netDifference = (newPrincipal + currentPayment) - totalAmountDue;
      
      if (netDifference >= 0) {
        netCash = Math.round(netDifference);
        netCashDirection = 'உறுப்பினருக்கு வழங்க வேண்டியது';
        explanation = `புதிய கடன் தொகையில் (₹${formatIndian(newPrincipal)}) பழைய கடன் அசல் + வட்டி (₹${formatIndian(oldLoanTotal)}) மற்றும் மதிப்பீட்டுக் கட்டணம் (₹${formatIndian(appraiserFee)}) போக மீதத் தொகை உறுப்பினருக்கு ரொக்கமாக வழங்கப்படும்.`;
      } else {
        netCash = Math.round(Math.abs(netDifference));
        netCashDirection = 'உறுப்பினர் செலுத்த வேண்டியது';
        explanation = `புதிய கடன் தொகையை விட பழைய கடன் அசல், வட்டி மற்றும் மதிப்பீட்டுக் கட்டணம் அதிகமாக இருப்பதால், மீதமுள்ள தொகையை உறுப்பினர் சங்கத்திற்கு செலுத்தி கடனை புதுப்பிக்க வேண்டும்.`;
      }
    } else {
      // Direct settlement / loan closure without renewal
      const netDifference = totalAmountDue - currentPayment;
      netCash = Math.max(0, Math.round(netDifference));
      netCashDirection = 'உறுப்பினர் செலுத்த வேண்டியது';
      explanation = `பழைய கடன் அசல் + வட்டி (₹${formatIndian(oldLoanTotal)}) மற்றும் மதிப்பீட்டுக் கட்டணத்தை (₹${formatIndian(appraiserFee)}) செலுத்தி நகைக்கடனை முடிக்க வேண்டும்.`;
    }

    return {
      hasData: true,
      totalDays,
      penaltyDays,
      oldPrincipal,
      normalInterest,
      penaltyInterest,
      totalInterest,
      oldLoanTotal,
      appraiserFee,
      currentPayment,
      newPrincipal,
      totalAmountDue,
      netCash,
      isRenewal,
      netCashDirection,
      explanation
    };
  }, [oldPrincipalInput, startDate, endDate, normalRateInput, penalRateInput, tenureDaysInput, graceDaysInput, calculationBasis, newPrincipalInput, appraiserFeeInput, currentPaymentInput]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card (Light Theme) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E2DC] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                PACS நகைக்கடன் பிரிவு
              </span>
              <span className="text-stone-500 text-xs">• தற்காலிக கணக்கீடு (In-Memory)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-stone-900 flex items-center gap-3">
              <Gem className="w-7 h-7 text-amber-600" />
              நகைக்கடன் வட்டி கணக்கீடு
            </h1>
            <p className="text-xs md:text-sm text-stone-600 mt-1">
              நகைக்கடன், புதிய கடன் அசல் மற்றும் புதுப்பித்தல் விவரங்களைக் கொண்டு நிகழ்நேர கணக்கீடு
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
              title="படிவத்தை மீட்டமை"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>மீட்டமை (Reset)</span>
            </button>

            {calcResults.hasData && (
              <button
                onClick={() => window.print()}
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
            onClick={() => onNavigate?.('interest-crop')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F6F2] text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D] border border-[#E2E2DC] transition-all cursor-pointer"
          >
            <Sprout className="w-4 h-4 text-[#007A4D]" />
            <span>பயிர்க்கடன் வட்டி</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs cursor-pointer"
          >
            <Gem className="w-4 h-4" />
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 bg-white border border-[#E2E2DC] rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-3">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>கடன் விவரங்கள் உள்ளீடு</span>
            </h2>
            <button
              onClick={handleLoadSample}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>மாதிரி தரவு</span>
            </button>
          </div>

          {/* 1. Old Principal Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              பழைய கடன் அசல் தொகை (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                value={oldPrincipalInput}
                onChange={(e) => setOldPrincipalInput(formatIndianInput(e.target.value))}
                placeholder="0"
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-9 pr-4 py-2.5 text-base font-mono font-bold outline-none transition-all placeholder:text-stone-400"
              />
            </div>
            {parseFloat(oldPrincipalInput.replace(/,/g, '')) > 0 && (
              <p className="text-[11px] text-amber-700 font-mono font-bold">
                தொகை: ₹ {formatIndian(parseFloat(oldPrincipalInput.replace(/,/g, '')))}
              </p>
            )}
          </div>

          {/* 2. Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                ஆரம்ப தேதி <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none transition-all"
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
                className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none transition-all"
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
                  placeholder="12.5"
                  className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
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
                  placeholder="3.0"
                  className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-red-500 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Loan Renewal Details (கடன் புதுப்பித்தல் விவரங்கள்) */}
          <div className="pt-4 border-t border-[#E2E2DC] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>கடன் புதுப்பித்தல் விவரங்கள் (விருப்பத்தேர்வு)</span>
              </h3>
              <span className="text-[11px] text-stone-500 bg-[#F7F6F2] px-2 py-0.5 rounded-md border border-[#E2E2DC]">
                Renewal Details
              </span>
            </div>

            {/* New Principal (புதிய கடன் அசல்) */}
            <div className="space-y-1.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-800">
                  புதிய கடன் அசல் (New Loan Principal) (₹)
                </label>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  புதுப்பித்தல் தொகை
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="text"
                  value={newPrincipalInput}
                  onChange={(e) => setNewPrincipalInput(formatIndianInput(e.target.value))}
                  placeholder="0 (புதுப்பித்தல் எனில் உள்ளிடவும்)"
                  className="w-full bg-white text-stone-900 border border-amber-300 focus:border-amber-600 rounded-xl pl-9 pr-4 py-2 text-sm font-mono font-bold outline-none placeholder:text-stone-400"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                புதிய கடன் தொகையிலிருந்து பழைய கடன் கழிவு அல்லது தொகை கழிவு தானாக கணக்கிடப்படும்.
              </p>
            </div>

            {/* Appraiser fee & Current payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  நகை மதிப்பினர் கூலி (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={appraiserFeeInput}
                    onChange={(e) => setAppraiserFeeInput(formatIndianInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-bold outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  உறுப்பினர் செலுத்தும் ரொக்கம் (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={currentPaymentInput}
                    onChange={(e) => setCurrentPaymentInput(formatIndianInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white text-stone-900 border border-[#D5D5CD] focus:border-amber-600 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-bold outline-none placeholder:text-stone-400"
                  />
                </div>
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
                <span className="text-amber-600">{isAdvancedOpen ? '▼' : '▶'}</span>
                மேம்பட்ட அமைப்புகள் (தவணை காலம்)
              </span>
              <span className="text-stone-500 text-xs">{isAdvancedOpen ? 'மறைக்க' : 'காட்ட'}</span>
            </button>

            {isAdvancedOpen && (
              <div className="p-4 pt-1 border-t border-[#E2E2DC] space-y-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      அனுமதிக்கப்பட்ட தவணை (நாட்கள்)
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

        {/* Right Column: Days & Detailed Calculation Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top 2 Metric Badges: Total Days & Penalty Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E2E2DC] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500">மொத்த நாட்கள்</p>
                <p className="text-xl md:text-2xl font-black font-mono text-stone-900 mt-0.5">
                  {calcResults.hasData ? `${calcResults.totalDays} நாட்கள்` : '—'}
                </p>
              </div>
            </div>

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

          {/* Breakdown List Card */}
          <div className="bg-white border border-[#E2E2DC] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-[#E2E2DC] pb-3">
              கணக்கீட்டு விவரங்கள்
            </h3>

            <div className="space-y-2.5 font-medium text-sm">
              {/* Old Principal */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">பழைய கடன் அசல்:</span>
                <span className="font-mono font-bold text-stone-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.oldPrincipal)}` : '—'}
                </span>
              </div>

              {/* Normal Interest */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">சாதாரண வட்டி:</span>
                <span className="font-mono font-bold text-stone-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.normalInterest)}` : '—'}
                </span>
              </div>

              {/* Penalty Interest */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-red-600 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  அபராத வட்டி:
                </span>
                <span className="font-mono font-bold text-red-600">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.penaltyInterest)}` : '—'}
                </span>
              </div>

              {/* Total Interest */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100 text-amber-800 font-bold">
                <span>மொத்த வட்டி கூடுதல்:</span>
                <span className="font-mono">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.totalInterest)}` : '—'}
                </span>
              </div>

              {/* Old Loan Total */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">பழைய கடன் மொத்தம் (அசல் + வட்டி):</span>
                <span className="font-mono font-bold text-stone-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.oldLoanTotal)}` : '—'}
                </span>
              </div>

              {/* Appraiser Fee */}
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">நகை மதிப்பினர் கூலி:</span>
                <span className="font-mono font-bold text-stone-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.appraiserFee)}` : '—'}
                </span>
              </div>

              {/* New Principal (if entered) */}
              {calcResults.isRenewal && (
                <div className="flex items-center justify-between py-1 border-b border-stone-100 bg-amber-50/70 px-2 rounded-lg">
                  <span className="text-amber-900 font-bold">புதிய கடன் அசல்:</span>
                  <span className="font-mono font-bold text-amber-900">
                    ₹ {formatIndian(calcResults.newPrincipal)}
                  </span>
                </div>
              )}

              {/* Currently Paid */}
              {calcResults.currentPayment > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-600">உறுப்பினர் செலுத்திய ரொக்கம்:</span>
                  <span className="font-mono font-bold text-[#007A4D]">
                    ₹ {formatIndian(calcResults.currentPayment)}
                  </span>
                </div>
              )}
            </div>

            {/* Total Old Loan Settlement Card */}
            <div className="bg-[#F7F6F2] border border-[#E2E2DC] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-700">
                  பழைய கடன் முடிக்க தேவைப்படும் தொகை:
                </p>
                <p className="text-[11px] text-stone-500">
                  (அசல் + வட்டி + மதிப்பினர் கூலி)
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-stone-900">
                  {calcResults.hasData ? `₹ ${formatIndian(calcResults.totalAmountDue)}` : '—'}
                </span>
              </div>
            </div>

            {/* Dynamic Result Card: Net Cash Settlement */}
            {calcResults.netCashDirection === 'உறுப்பினருக்கு வழங்க வேண்டியது' ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 md:p-5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                        சங்கத்திலிருந்து உறுப்பினருக்கு வழங்க வேண்டிய தொகை
                      </p>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      புதிய கடனில் பழைய கடன் கழிவு போக எஞ்சிய ரொக்கம் (பெற வேண்டியது)
                    </p>
                  </div>

                  <span className="text-2xl md:text-3xl font-black font-mono text-emerald-800">
                    {calcResults.hasData ? `₹ ${formatIndian(calcResults.netCash)}` : '—'}
                  </span>
                </div>

                {calcResults.hasData && calcResults.explanation && (
                  <p className="text-[11px] text-emerald-800/90 pt-2 border-t border-emerald-200">
                    💡 {calcResults.explanation}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 md:p-5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        உறுப்பினர் சங்கத்திற்கு செலுத்த வேண்டிய தொகை
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      {calcResults.isRenewal 
                        ? 'புதிய கடன் தொகைக்கு மேல் உள்ள நிலுவை (செலுத்த வேண்டியது)' 
                        : 'கடனை முடிக்க செலுத்த வேண்டிய தொகை (செலுத்த வேண்டியது)'}
                    </p>
                  </div>

                  <span className="text-2xl md:text-3xl font-black font-mono text-amber-900">
                    {calcResults.hasData ? `₹ ${formatIndian(calcResults.netCash)}` : '—'}
                  </span>
                </div>

                {calcResults.hasData && calcResults.explanation && (
                  <p className="text-[11px] text-amber-900/90 pt-2 border-t border-amber-200">
                    💡 {calcResults.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
