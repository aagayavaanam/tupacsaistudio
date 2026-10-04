import React, { useState } from 'react';
import { LoanMember } from '../types';
import { 
  formatAadhar, 
  formatMobile, 
  formatRationCard, 
  formatMDCC, 
  formatIndianCurrency 
} from '../utils/formatters';
import { 
  Users, 
  Building, 
  User, 
  CreditCard, 
  ShieldCheck, 
  Printer, 
  Edit, 
  Copy, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Table as TableIcon,
  Check,
  Fingerprint,
  Trash2
} from 'lucide-react';

interface MemberDossierViewProps {
  members: LoanMember[];
  activeMember: LoanMember | null;
  onSelectMember: (member: LoanMember) => void;
  onEditMember: (member: LoanMember) => void;
  onPrintDossier: (member: LoanMember) => void;
  onDeleteMember?: (member: LoanMember) => void;
  onSwitchToTable: () => void;
}

export const MemberDossierView: React.FC<MemberDossierViewProps> = ({
  members,
  activeMember,
  onSelectMember,
  onEditMember,
  onPrintDossier,
  onDeleteMember,
  onSwitchToTable
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Quick Member Roster Selector */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E2DC] shadow-2xs overflow-hidden flex flex-col">
        <div className="p-3.5 bg-[#FAF9F5] border-b border-[#E2E2DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#007A4D]" />
            <span className="font-bold text-xs text-stone-800">உறுப்பினர்கள் பட்டியல்</span>
          </div>
          <span className="bg-[#D1EAE0] text-[#007A4D] font-black text-xs px-2.5 py-0.5 rounded-full">
            {members.length} நபர்கள்
          </span>
        </div>

        <div className="max-h-[640px] overflow-y-auto p-2 space-y-1.5 divide-y divide-stone-100">
          {members.length > 0 ? (
            members.map((m) => {
              const isSelected = activeMember?.memberNo === m.memberNo;
              return (
                <div
                  key={m.memberNo}
                  onClick={() => onSelectMember(m)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#EAF4EF] border-2 border-[#007A4D] shadow-xs'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#007A4D] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {m.ins || (m.name ? m.name.charAt(0) : 'U')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[11px] text-[#007A4D] bg-[#D1EAE0] px-1.5 py-0.2 rounded font-mono">
                          A-{m.aClass || m.memberNo}
                        </span>
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {m.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                        <span>{m.village || 'தேவாரம்'}</span>
                        <span>•</span>
                        <span className="font-mono">{m.mobile || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-bold text-emerald-800 font-mono">
                      ₹{m.totalShare ?? m.landAcres ?? 0}
                    </div>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isSelected ? 'text-[#007A4D] translate-x-0.5' : 'text-stone-300'}`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-stone-500">
              உறுப்பினர்கள் இல்லை
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Comprehensive Digital Member Dossier Passbook */}
      <div className="lg:col-span-8 space-y-4">
        {activeMember ? (
          <div className="bg-white rounded-2xl border border-[#E2E2DC] shadow-xs overflow-hidden">
            {/* Dossier Header Banner */}
            <div className="bg-gradient-to-r from-[#005c3a] via-[#007A4D] to-[#0a8c5b] text-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#D1EAE0] text-[#007A4D] font-black text-xs px-2.5 py-0.5 rounded-md shadow-2xs">
                      A Class: {activeMember.aClass || activeMember.memberNo}
                    </span>
                    {activeMember.gender && (
                      <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded font-medium">
                        {activeMember.gender}
                      </span>
                    )}
                    <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded font-medium font-mono">
                      பங்கு மூலதனம்: ₹{activeMember.totalShare ?? activeMember.landAcres ?? 0}
                    </span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>{activeMember.name}</span>
                    {activeMember.ins && (
                      <span className="text-[#D1EAE0] font-mono text-base">({activeMember.ins})</span>
                    )}
                  </h2>
                  <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeMember.village || 'தேவாரம்'} | த/க: {activeMember.careOf || activeMember.fatherOrHusbandName || '-'}</span>
                  </p>
                </div>

                {/* Top Action Bar */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => onPrintDossier(activeMember)}
                    className="flex items-center gap-1.5 bg-white text-[#007A4D] hover:bg-[#FAF9F5] px-3 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                    title="உறுப்பினர் விபர அட்டை அச்சிடுக (Print Member Slip)"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#007A4D]" />
                    <span>சுயவிவர அச்சு</span>
                  </button>
                  <button
                    onClick={() => onEditMember(activeMember)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="விபரங்களை திருத்து (Edit)"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>திருத்து</span>
                  </button>
                  <button
                    onClick={onSwitchToTable}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="அட்டவணை பார்வைக்கு செல்க"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>அட்டவணை</span>
                  </button>
                  {onDeleteMember && (
                    <button
                      onClick={() => onDeleteMember(activeMember)}
                      className="flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-700 text-white border border-rose-300/40 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="இந்த உறுப்பினரை நிரந்தரமாக நீக்க (Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>நீக்கு</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Body: 4 official ledger cards matching 18 Google Sheet columns */}
            <div className="p-5 space-y-4 bg-[#FAF9F5]">
              {/* Copy Alert Toast */}
              {copiedField && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 text-center animate-in fade-in flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{copiedField} நகலெடுக்கப்பட்டது (Copied)!</span>
                </div>
              )}

              {/* Card 1: Account & Bank Identifiers */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-2">
                  <h4 className="font-extrabold text-xs text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#007A4D]" />
                    <span>1. வங்கி &amp; கணக்கு அடையாளங்கள்</span>
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold">A Class (உறுப்பினர் எண்):</span>
                    <span className="font-black text-sm text-[#007A4D] font-mono">
                      {activeMember.aClass || activeMember.memberNo}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold">SB (வங்கி கணக்கு):</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-bold text-stone-900">{activeMember.sb || '-'}</span>
                      {activeMember.sb && (
                        <button
                          onClick={() => handleCopy(activeMember.sb || '', 'SB கணக்கு எண்')}
                          className="text-stone-400 hover:text-[#007A4D] cursor-pointer"
                          title="நகலெடு"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold">ERP எண்:</span>
                    <span className="font-mono font-bold text-stone-800">{activeMember.erp || '-'}</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold">MDCC எண்:</span>
                    <span className="font-mono font-bold text-stone-800">{formatMDCC(activeMember.mdcc)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Personal & Complete Address */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-2">
                  <h4 className="font-extrabold text-xs text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#007A4D]" />
                    <span>2. தனிநபர் &amp; முழு முகவரி விபரங்கள்</span>
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] block">பெயர் (Name):</span>
                    <span className="font-bold text-stone-900 text-sm">{activeMember.name}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">தலைப்பெழுத்து (Ins):</span>
                    <span className="font-bold text-stone-800">{activeMember.ins || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">தந்தை / கணவர் (C/o):</span>
                    <span className="font-semibold text-stone-800">
                      {activeMember.careOf || activeMember.fatherOrHusbandName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">கிராமம் (Village):</span>
                    <span className="font-bold text-[#007A4D]">{activeMember.village || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">கதவு எண் (Door):</span>
                    <span className="text-stone-800 font-medium">{activeMember.door || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">தெரு (Street):</span>
                    <span className="text-stone-800 font-medium">{activeMember.street || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">பாலினம் (Gender):</span>
                    <span className="text-stone-800 font-medium">{activeMember.gender || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">பிரிவு (Caste):</span>
                    <span className="text-stone-800 font-medium">{activeMember.caste || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Identification & Contact Documents */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-2">
                  <h4 className="font-extrabold text-xs text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#007A4D]" />
                    <span>3. அடையாள ஆவணங்கள் &amp; தொடர்பு</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-[#007A4D]" />
                      <span>ஆதார் எண் (Aadhar):</span>
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatAadhar(activeMember.aadharNo || activeMember.adhar)}
                      </span>
                      <button
                        onClick={() => handleCopy(activeMember.aadharNo || activeMember.adhar || '', 'ஆதார் எண்')}
                        className="p-1 text-stone-400 hover:text-[#007A4D] cursor-pointer rounded hover:bg-stone-200"
                        title="ஆதார் எண் நகலெடு"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#007A4D]" />
                      <span>கைபேசி எண் (Mobile):</span>
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatMobile(activeMember.mobile)}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeMember.mobile && (
                          <a
                            href={`tel:${activeMember.mobile}`}
                            className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer rounded hover:bg-emerald-100"
                            title="அழைக்க"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleCopy(activeMember.mobile || '', 'கைபேசி எண்')}
                          className="p-1 text-stone-400 hover:text-[#007A4D] cursor-pointer rounded hover:bg-stone-200"
                          title="கைபேசி எண் நகலெடு"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block font-bold">குடும்ப அட்டை (Ration Card):</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-stone-900">
                        {formatRationCard(activeMember.rationCard)}
                      </span>
                      <button
                        onClick={() => handleCopy(activeMember.rationCard || '', 'குடும்ப அட்டை எண்')}
                        className="p-1 text-stone-400 hover:text-[#007A4D] cursor-pointer rounded hover:bg-stone-200"
                        title="குடும்ப அட்டை நகலெடு"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Nominee & Share Capital */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-2">
                  <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>4. வாரிசுதாரர் &amp; பங்கு மூலதன விபரங்கள்</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] block">வாரிசுதாரர் பெயர் (Namini):</span>
                    <span className="font-bold text-stone-900 text-sm">{activeMember.namini || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">உறவுமுறை (Relation):</span>
                    <span className="font-semibold text-stone-800">{activeMember.relation || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">பங்கு தொகை (Total Share):</span>
                    <span className="font-black text-sm text-[#007A4D] bg-[#D1EAE0] px-3 py-1 rounded-md border border-[#007A4D]/20 inline-block font-mono">
                      {formatIndianCurrency(activeMember.totalShare ?? activeMember.landAcres)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#E2E2DC] text-center text-stone-500 shadow-2xs">
            உறுப்பினரை தேர்ந்தெடுக்கவும்
          </div>
        )}
      </div>
    </div>
  );
};
