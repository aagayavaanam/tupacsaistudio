import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Lock, Calendar, Hash, IndianRupee, Clock, FileEdit, AlertCircle } from 'lucide-react';
import { Part1RCLDetails } from '../types';
import { formatDateDDMMYYYY } from '../utils/formatters';

interface Part1RCLFormProps {
  memberNo: string;
  memberName: string;
  initialData: Part1RCLDetails;
  onSave: (data: Part1RCLDetails) => void;
}

export const Part1RCLForm: React.FC<Part1RCLFormProps> = ({
  memberNo,
  memberName,
  initialData,
  onSave
}) => {
  const [rclNumber, setRclNumber] = useState<string>(initialData.rclNumber || '');
  const [rclDate, setRclDate] = useState<string>(initialData.rclDate || '');
  const [sanctionedAmount, setSanctionedAmount] = useState<number | ''>(
    initialData.sanctionedAmount !== undefined ? initialData.sanctionedAmount : ''
  );
  const [notes, setNotes] = useState<string>(initialData.notes || '');

  const [isSaved, setIsSaved] = useState<boolean>(initialData.isSaved || false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(initialData.updatedAt || '');
  const [showSaveMessage, setShowSaveMessage] = useState<boolean>(false);

  // Sync state when initialData changes (e.g. member switch)
  useEffect(() => {
    setRclNumber(initialData.rclNumber || '');
    setRclDate(initialData.rclDate || '');
    setSanctionedAmount(
      initialData.sanctionedAmount !== undefined ? initialData.sanctionedAmount : ''
    );
    setNotes(initialData.notes || '');
    setIsSaved(initialData.isSaved || false);
    setLastSavedTime(initialData.updatedAt || '');
  }, [initialData, memberNo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('ta-IN')} ${now.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const updated: Part1RCLDetails = {
      rclNumber,
      rclDate,
      sanctionedAmount,
      notes,
      isSaved: true,
      updatedAt: formattedTime
    };

    setIsSaved(true);
    setLastSavedTime(formattedTime);
    onSave(updated);

    setShowSaveMessage(true);
    setTimeout(() => {
      setShowSaveMessage(false);
    }, 4000);
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  // Format currency display in Indian Rupees (INR)
  const formatINR = (val: number | '') => {
    if (val === '' || isNaN(Number(val))) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Card Top Banner */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wide">
              பகுதி 1
            </span>
            <h3 className="text-lg font-bold text-white">
              RCL விபரம் (RCL Details)
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            உறுப்பினர்: <strong className="text-emerald-400">{memberName}</strong> ({memberNo})
          </p>
        </div>

        {/* Persistence status badge */}
        <div className="flex items-center gap-2">
          {isSaved ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs px-3 py-1.5 rounded-full font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>தகவல் பாதுகாப்பாக சேமிக்கப்பட்டது</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 text-xs px-3 py-1.5 rounded-full font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>உள்ளீடு செய்ய தயார்</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
        {/* Save confirmation banner */}
        {showSaveMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">
                பகுதி 1 RCL விபரங்கள் வெற்றியுடன் சேமிக்கப்பட்டன!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                மறுமுறை நீங்கள் மாற்றும் வரை இந்தத் தரவுகள் மாறாமல் அப்படியே இருக்கும்.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Question 1: RCL எண் */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>1. RCL எண் (RCL Number)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isSaved}
                value={rclNumber}
                onChange={(e) => setRclNumber(e.target.value)}
                placeholder="எ.கா: RCL/2026/042"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium ${
                  isSaved
                    ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              கூட்டுறவு வங்கி வழங்கிய RCL பதிவேட்டு எண்
            </p>
          </div>

          {/* Question 2: RCL தேதி */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>2. RCL தேதி (RCL Date)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isSaved}
                value={rclDate}
                onChange={(e) => setRclDate(formatDateDDMMYYYY(e.target.value))}
                placeholder="ddmmyyyy"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  isSaved
                    ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              வடிவம்: ddmmyyyy (தேதி / மாதம் / வருடம்)
            </p>
          </div>

          {/* Question 3: அனுமதிக்கப்பட்ட கடன் அளவு */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>3. அனுமதிக்கப்பட்ட கடன் அளவு</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-semibold text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                min="0"
                step="500"
                disabled={isSaved}
                value={sanctionedAmount}
                onChange={(e) => setSanctionedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="எ.கா: 150000"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold ${
                  isSaved
                    ? 'bg-slate-100 text-emerald-800 border-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
                }`}
              />
            </div>
            {sanctionedAmount !== '' && (
              <p className="text-xs font-semibold text-emerald-700">
                தொகை: {formatINR(sanctionedAmount)}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              கேசிசி கடனுக்கு स्वीकृत ஒப்புதல் தொகை (ரூபாயில்)
            </p>
          </div>
        </div>

        {/* Optional Notes */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            கூடுதல் குறிப்புகள் (Optional Notes)
          </label>
          <input
            type="text"
            disabled={isSaved}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="தேவைப்படின் கூடுதல் விபரம் உள்ளிடலாம்..."
            className={`w-full px-3 py-2 rounded-md border text-xs ${
              isSaved
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-white border-slate-300'
            }`}
          />
        </div>

        {/* Footer actions and timestamp */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {lastSavedTime && (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>கடைசியாக சேமிக்கப்பட்டது: <strong className="text-slate-700">{lastSavedTime}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isSaved ? (
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-lg border border-slate-300 transition-colors shadow-xs"
              >
                <FileEdit className="w-4 h-4 text-slate-600" />
                <span>தகவலை மாற்றியமைக்க (Edit)</span>
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-lg transition-colors shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>பகுதி 1 விபரம் சேமிக்க (Save)</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
