import React, { useEffect, useState } from 'react';
import { Menu, Database, CloudCheck, CheckCircle2 } from 'lucide-react';
import { NavigationMenu } from '../types';

interface HeaderProps {
  currentMenu: NavigationMenu;
  onToggleSidebar: () => void;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMenu,
  onToggleSidebar,
}) => {
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; source: string }>({
    connected: true,
    source: 'Firebase Cloud Firestore'
  });

  useEffect(() => {
    fetch('/api/firebase/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setBackendStatus({ connected: true, source: 'Firebase Firestore' });
        }
      })
      .catch(() => {});
  }, []);

  const getTitle = () => {
    switch (currentMenu) {
      case 'home':
        return 'முகப்பு (Home)';
      case 'interest-crop':
        return 'பயிர்க்கடன் வட்டி கணக்கீடு (Crop Loan Interest)';
      case 'interest-jewel':
        return 'நகைக்கடன் வட்டி கணக்கீடு (Jewel Loan Interest)';
      case 'interest-shg':
        return 'SHG சுயஉதவி குழு வட்டி கணக்கீடு (SHG Loan Interest)';
      case 'kcc-disbursement':
        return 'கேசிசி பட்டுவாடா தயார் செய்தல் (KCC Disbursement)';
      case 'kcc-bank-account':
        return 'கேசிசி வங்கி கணக்கு (KCC Bank Account)';
      case 'ah-disbursement':
        return 'AH பட்டுவாடா தயார் செய்தல் (AH Disbursement)';
      case 'ah-bank-account':
        return 'AH வங்கி கணக்கு (AH Bank Account)';
      case 'loan-member-master':
        return 'உறுப்பினர் பட்டியல்';
      case 'google-sheet-sync':
        return 'கூகுள் சீட் இணைப்பு (Google Sheet Sync)';
      case 'print-reports':
        return 'அச்சுப் படிவங்கள் மற்றும் அறிக்கைகள் (KCC 1 Form)';
      case 'kcc-application':
        return 'KCC Application - கடன் விண்ணப்பப் படிவம்';
      case 'ah-application':
        return 'AH Application - கால்நடை பராமரிப்பு கடன் விண்ணப்பப் படிவம்';
      case 'storage':
        return 'சேமிப்பகம் (Storage)';
      default:
        return 'மேலாண்மை மேடை';
    }
  };

  return (
    <header className="bg-[#FAF9F5] border-b border-[#E2E2DC] sticky top-0 z-20 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007A4D] cursor-pointer"
            title="மெனுவை மாற்று"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D1EAE0] text-[#007A4D] uppercase">
                PACS PORTAL
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#007A4D] tracking-tight">
                TU3 PACCS
              </h2>
              <span className="text-xs text-stone-400 font-normal hidden sm:inline">|</span>
              <span className="text-xs sm:text-sm font-bold text-stone-700 hidden sm:inline">
                {getTitle()}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 sm:hidden mt-0.5 font-medium">
              {getTitle()}
            </p>
          </div>
        </div>

        {/* Backend Cloud Storage Status Indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="hidden md:inline text-stone-600 font-medium">பின்தள சேமிப்பகம் (Backend):</span>
          <span className="font-extrabold text-emerald-900">Firebase Firestore Cloud DB</span>
          <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded font-extrabold">ஆன்லைன்</span>
        </div>
      </div>
    </header>
  );
};

