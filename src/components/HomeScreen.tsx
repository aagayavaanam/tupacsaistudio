import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Landmark, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldCheck, 
  Calendar, 
  Award,
  Layers,
  Database,
  CloudCheck,
  Server,
  Wifi,
  Calculator,
  Sprout,
  Gem
} from 'lucide-react';
import { LoanMember, KCCDisbursementRecord, KCCBankAccount, NavigationMenu } from '../types';

interface HomeScreenProps {
  members: LoanMember[];
  disbursements: KCCDisbursementRecord[];
  bankAccounts: KCCBankAccount[];
  spreadsheetId: string;
  onNavigate: (menu: NavigationMenu) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  members,
  disbursements,
  bankAccounts,
  spreadsheetId,
  onNavigate
}) => {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    bankRowsCount?: number;
    membersCount?: number;
    paduvadaCount?: number;
  }>({ connected: true });

  useEffect(() => {
    fetch('/api/firebase/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.connected) {
          setDbStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  const currentDateFormatted = new Date().toLocaleDateString('ta-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner - Warm Cream & Deep Emerald */}
      <div className="relative bg-[#FAF9F5] rounded-3xl p-6 sm:p-10 text-stone-900 shadow-sm overflow-hidden border border-[#E2E2DC]">
        {/* Decorative soft glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D1EAE0]/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/20 text-xs font-extrabold tracking-wider uppercase">
              <span>PACS PORTAL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#007A4D] tracking-tight flex items-center gap-3">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#007A4D] shrink-0" />
              <span>TU3 PACCS</span>
            </h1>

            <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-medium">
              தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் (Primary Agricultural Co-operative Credit Society).
              உறுப்பினர்கள் விபரம், KCC பயிர்க்கடன் பட்டுவாடா மற்றும் வங்கி கணக்கு மேலாண்மை மையம்.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E2E2DC] font-medium shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#007A4D]" />
                {currentDateFormatted}
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg font-bold shadow-2xs">
                <CloudCheck className="w-4 h-4 text-emerald-700" />
                <span>பின்தள சேமிப்பகம் (Backend): <strong>Google Firebase Firestore Cloud DB</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate('loan-member-master')}
              className="px-6 py-3.5 bg-[#007A4D] hover:bg-[#00633E] text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" />
              <span>உறுப்பினர்கள் பார்க்க</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('kcc-disbursement')}
              className="px-6 py-3.5 bg-white hover:bg-[#EAF4EF] text-[#007A4D] border border-[#007A4D]/40 rounded-2xl font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <CreditCard className="w-4 h-4 text-[#007A4D]" />
              <span>KCC பட்டுவாடா</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Backend Cloud Storage Banner / Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-white" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-700/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                <Database className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    பின்தள சேமிப்பகம் (Backend Storage): Google Firebase Firestore
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                    <Wifi className="w-3 h-3 text-emerald-300 animate-pulse" />
                    நேரலை மேகக்கணி (Live Online Cloud)
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">
                  நீங்கள் எந்த கணினியில் அல்லது மொபைலில் உள்நுழைந்தாலும் தரவு உடனடியாகக் கிடைக்கும்.
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>இணைப்பு நிலை: <strong>செயலில் உள்ளது (Active)</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-emerald-200 font-medium block text-[11px]">முதன்மை மேகக்கணி தரவுத்தளம்:</span>
              <span className="font-black text-white text-sm block mt-0.5">Google Firebase Firestore</span>
              <span className="text-[11px] text-emerald-200/80 block mt-1">எந்த கணினியிலிருந்தும் நேரலை அணுகல்</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-emerald-200 font-medium block text-[11px]">உள்ளூர் காப்புப்பிரதி (Local Backup):</span>
              <span className="font-black text-white text-sm block mt-0.5">Server SQLite Database</span>
              <span className="text-[11px] text-emerald-200/80 block mt-1">ஆஃப்லைன் &amp; இரட்டை பாதுகாப்பு</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members Stat */}
        <div 
          onClick={() => onNavigate('loan-member-master')}
          className="bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              மொத்த உறுப்பினர்கள்
            </span>
            <div className="p-2.5 rounded-xl bg-[#EAF4EF] text-[#007A4D] group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{members.length}</span>
            <span className="text-xs font-bold text-[#007A4D] flex items-center gap-0.5 group-hover:underline">
              விவரம் <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2 font-medium">18 தகவல்கள் அடங்கிய மாஸ்டர் பதிவேடு</p>
        </div>

        {/* Active KCC Accounts */}
        <div 
          onClick={() => onNavigate('kcc-bank-account')}
          className="bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              KCC வங்கி கணக்குகள்
            </span>
            <div className="p-2.5 rounded-xl bg-[#EAF4EF] text-[#007A4D] group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{bankAccounts.length}</span>
            <span className="text-xs font-bold text-[#007A4D] flex items-center gap-0.5 group-hover:underline">
              விவரம் <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2 font-medium">பயிர்க்கடன் SB மற்றும் பயிர்க்கடன் கணக்குகள்</p>
        </div>

        {/* KCC Disbursements */}
        <div 
          onClick={() => onNavigate('kcc-disbursement')}
          className="bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              பட்டுவாடா பதிவுகள்
            </span>
            <div className="p-2.5 rounded-xl bg-[#EAF4EF] text-[#007A4D] group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{disbursements.length}</span>
            <span className="text-xs font-bold text-[#007A4D] flex items-center gap-0.5 group-hover:underline">
              விவரம் <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2 font-medium">RCL விபரம் (பாகம் 1) மற்றும் கடன் வழங்கல்கள்</p>
        </div>

        {/* Cloud Database Status */}
        <div 
          onClick={() => onNavigate('interest-crop')}
          className="bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              வட்டி கணக்கீடு
            </span>
            <div className="p-2.5 rounded-xl bg-[#D1EAE0] text-[#007A4D] group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-[#007A4D]">
              3 கால்குலேட்டர்கள்
            </span>
            <span className="text-xs font-bold text-[#007A4D] flex items-center gap-0.5 group-hover:underline">
              திறக்க <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-2 font-medium">பயிர்கடன், நகைக்கடன், SHG வட்டி</p>
        </div>
      </div>

      {/* New Section: வட்டி கணக்கீட்டு கருவிகள் (In-Memory Loan Calculators) - Light Theme */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E2DC] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-[#E2E2DC] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#D1EAE0] text-[#007A4D] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                நிகழ்நேர கருவிகள்
              </span>
              <span className="text-stone-500 text-xs font-medium">தற்காலிக மெமரி கணக்கீடு (In-Memory Only)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#007A4D]" />
              <span>வட்டி கணக்கீட்டு பகுதிகள் (Interest Calculators)</span>
            </h3>
          </div>
          <span className="text-xs text-stone-500">உடனடி நிகழ்நேர கணிப்பு</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Crop Loan */}
          <div 
            onClick={() => onNavigate('interest-crop')}
            className="bg-[#FDFBF7] border border-[#E2E2DC] hover:border-[#007A4D] p-5 rounded-2xl transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D1EAE0] flex items-center justify-center text-[#007A4D] mb-3 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-base group-hover:text-[#007A4D] transition-colors">
              1. பயிர்க்கடன் வட்டி
            </h4>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              அசல், வட்டி விகிதம், கால அளவு, அபராத வட்டி மற்றும் மொத்த தொகை கணக்கீடு.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-[#007A4D] gap-1">
              <span>கணக்கிட செல்லவும்</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Jewel Loan */}
          <div 
            onClick={() => onNavigate('interest-jewel')}
            className="bg-[#FDFBF7] border border-[#E2E2DC] hover:border-amber-600 p-5 rounded-2xl transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-105 transition-transform">
              <Gem className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors">
              2. நகைக்கடன் வட்டி
            </h4>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              நகைக்கடன் அசல், அபராத வட்டி, மதிப்பினர் கூலி, புதிய கடன் அசல் புதுப்பித்தல் மற்றும் நிகர தொகை.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 gap-1">
              <span>கணக்கிட செல்லவும்</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: SHG Loan */}
          <div 
            onClick={() => onNavigate('interest-shg')}
            className="bg-[#FDFBF7] border border-[#E2E2DC] hover:border-indigo-600 p-5 rounded-2xl transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-base group-hover:text-indigo-700 transition-colors">
              3. SHG சுயஉதவி குழு வட்டி
            </h4>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              சுயஉதவிக் குழு கடன்களுக்கான தவணை, செலுத்திய தொகை, அசல் &amp; வட்டி கழிவு மற்றும் மீதி கணக்கீடு.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-indigo-700 gap-1">
              <span>கணக்கிட செல்லவும்</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Module Cards */}
      <div>
        <h3 className="text-base font-black text-stone-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#007A4D]" />
          <span>முதன்மை சேவைகள் &amp; பகுதிகள்</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: Loanmember Master */}
          <div className="bg-white rounded-2xl border border-[#E2E2DC] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D1EAE0] text-[#007A4D] flex items-center justify-center font-bold group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-stone-900 group-hover:text-[#007A4D] transition-colors">
                1. உறுப்பினர் பட்டியல்
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                உறுப்பினர்களின் 18 முக்கிய தகவல்களான A Class, SB, ERP, Ins, பெயர், C/o, கதவு எண், தெரு, கிராமம், ஆதார், மொபைல், ரேஷன் கார்டு, வாரிசு விபரம், சாதி, பாலினம் மற்றும் பங்குத்தொகை பதிவேடு.
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>18 விபரங்களுக்கான புதிய உறுப்பினர் சேர்க்கை</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>Firebase மேகக்கணி உடனடி சேமிப்பு</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>உறுப்பினர் பெயர், எண் மற்றும் கிராமம் தேடல்</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('loan-member-master')}
              className="mt-6 w-full py-3 px-4 bg-[#007A4D] hover:bg-[#00633E] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>உறுப்பினர் பகுதிக்குச் செல்</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 2: KCC Disbursement */}
          <div className="bg-white rounded-2xl border border-[#E2E2DC] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D1EAE0] text-[#007A4D] flex items-center justify-center font-bold group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-stone-900 group-hover:text-[#007A4D] transition-colors">
                2. KCC பயிர்க்கடன் பட்டுவாடா
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                விவசாய உறுப்பினர்களுக்கு KCC பயிர்க்கடன் வழங்குவதற்கான RCL விபரங்கள் (பாகம் 1) சேமிப்பு மற்றும் கடன் பட்டுவாடா அறிக்கைகள்.
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>பாகம் 1 - RCL விபரம் பதிவு செய்தல்</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>பயிர்க்கடன் பருவம் &amp; கடன் தொகை கண்காணிப்பு</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>தானியங்கி உறுப்பினர் தேடல் இணைப்பு</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('kcc-disbursement')}
              className="mt-6 w-full py-3 px-4 bg-[#007A4D] hover:bg-[#00633E] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>பட்டுவாடா பகுதிக்குச் செல்</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 3: Bank Accounts */}
          <div className="bg-white rounded-2xl border border-[#E2E2DC] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D1EAE0] text-[#007A4D] flex items-center justify-center font-bold group-hover:bg-[#007A4D] group-hover:text-white transition-colors">
                <Landmark className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-stone-900 group-hover:text-[#007A4D] transition-colors">
                3. KCC வங்கி கணக்குகள்
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                சங்க உறுப்பினர்களின் KCC பயிர்க்கடன் வங்கி கணக்குகள், IFSC குறியீடு, அனுமதிக்கப்பட்ட கடன் அளவு மற்றும் தற்போதைய நிலுவை விபரங்கள்.
              </p>
              <ul className="text-xs text-stone-600 space-y-1.5 pt-1 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>KCC Crop Credit கணக்குகள்</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>IFSC &amp; வங்கி கிளை நிர்வாகம்</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
                  <span>புதிய வங்கி கணக்கு சேர்ப்பு</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('kcc-bank-account')}
              className="mt-6 w-full py-3 px-4 bg-[#007A4D] hover:bg-[#00633E] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>வங்கி கணக்குகள் பார்க்க</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Society Details Summary */}
      <div className="bg-white rounded-2xl border border-[#E2E2DC] p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#007A4D]" />
              <span>TU3 PACCS சங்கத்தின் தகவல் குறிப்பு</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் - தலைமை அலுவலகம்
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#D1EAE0] text-[#007A4D] font-mono text-xs font-black rounded-lg border border-[#007A4D]/20">
              சங்க எண்: TU3
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E2E2DC] space-y-1">
            <span className="text-stone-500 font-bold block">சங்கத்தின் பெயர்:</span>
            <span className="font-black text-[#007A4D] text-sm">TU3 PACCS தலைமை கிளை</span>
            <span className="text-stone-500 block pt-1 font-medium">கூட்டுறவு கடன் சங்கம்</span>
          </div>

          <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E2E2DC] space-y-1">
            <span className="text-stone-500 font-bold block">வழங்கப்படும் சேவைகள்:</span>
            <span className="font-black text-stone-900 text-sm">பயிர்க்கடன் (KCC), உரம் &amp; விதைகள்</span>
            <span className="text-stone-500 block pt-1 font-medium">உறுப்பினர் வைப்புத்தொகை கணக்குகள்</span>
          </div>

          <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E2E2DC] space-y-1">
            <span className="text-stone-500 font-bold block">தரவு மேலாண்மை:</span>
            <span className="font-black text-[#007A4D] text-sm">Firebase Cloud Database</span>
            <span className="text-stone-500 block pt-1 font-medium">பாதுகாப்பான மேகக்கணி சேமிப்பு</span>
          </div>
        </div>
      </div>
    </div>
  );
};
