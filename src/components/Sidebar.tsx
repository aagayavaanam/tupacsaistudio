import React, { useState } from 'react';
import { 
  Home,
  CreditCard, 
  Landmark, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  FileCheck2,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import { NavigationMenu } from '../types';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen
}) => {
  // Interest menu active state
  const isInterestActive = 
    currentMenu === 'interest-crop' || 
    currentMenu === 'interest-jewel' || 
    currentMenu === 'interest-shg';

  // Pattuvada menu expand/collapse state (defaults to false so only 'பட்டுவாடா' shows normally)
  const [isPattuvadaExpanded, setIsPattuvadaExpanded] = useState<boolean>(
    currentMenu === 'kcc-disbursement' || currentMenu === 'kcc-bank-account'
  );

  // AH Pattuvada menu expand/collapse state
  const [isAhExpanded, setIsAhExpanded] = useState<boolean>(
    currentMenu === 'ah-disbursement' || currentMenu === 'ah-bank-account'
  );

  const handleSelectOtherMenu = (menu: NavigationMenu) => {
    setIsPattuvadaExpanded(false);
    setIsAhExpanded(false);
    onSelectMenu(menu);
  };

  const handlePattuvadaClick = () => {
    setIsPattuvadaExpanded(prev => !prev);
  };

  const handleAhClick = () => {
    setIsAhExpanded(prev => !prev);
  };

  return (
    <aside
      className={`bg-[#FAF9F5] text-stone-800 flex flex-col transition-all duration-300 z-30 h-screen sticky top-0 shrink-0 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden md:w-16'
      } border-r border-[#E2E2DC] shadow-sm select-none`}
    >
      {/* App Branding */}
      <div 
        onClick={() => onSelectMenu('home')}
        className="p-4 border-b border-[#E2E2DC] flex items-center gap-3 bg-[#FAF9F5] hover:bg-[#EAF4EF]/50 transition-colors cursor-pointer shrink-0"
        title="முகப்புப் பக்கத்திற்குச் செல்"
      >
        <div className="w-10 h-10 rounded-xl bg-[#007A4D] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
          TU3
        </div>
        {isOpen && (
          <div className="overflow-hidden space-y-0.5">
            <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-0.2 rounded-full bg-[#D1EAE0] text-[#007A4D] uppercase">
              PACS PORTAL
            </span>
            <h1 className="font-black text-base text-[#007A4D] leading-tight tracking-tight">
              TU3 PACCS
            </h1>
            <p className="text-[11px] text-stone-500 truncate font-medium">
              கூட்டுறவு கடன் சங்கம்
            </p>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5">
        {/* 1. Home Menu Item (முகப்பு) */}
        <div>
          <button
            onClick={() => handleSelectOtherMenu('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              currentMenu === 'home'
                ? 'bg-[#007A4D] text-white shadow-sm'
                : 'text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D]'
            }`}
            title="முகப்பு பக்கம் (Home)"
          >
            <Home className={`w-5 h-5 shrink-0 ${currentMenu === 'home' ? 'text-white' : 'text-[#007A4D]'}`} />
            {isOpen && <span>முகப்பு (Home)</span>}
          </button>
        </div>

        {/* 2. Main Menu Item: வட்டி கணக்கீடு (Interest Calculations) */}
        <div>
          <button
            onClick={() => handleSelectOtherMenu(isInterestActive ? currentMenu : 'interest-crop')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              isInterestActive
                ? 'bg-[#007A4D] text-white shadow-sm'
                : 'text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D]'
            }`}
            title="வட்டி கணக்கீடு"
          >
            <Calculator className={`w-5 h-5 shrink-0 ${isInterestActive ? 'text-white' : 'text-[#007A4D]'}`} />
            {isOpen && <span>வட்டி கணக்கீடு</span>}
          </button>
        </div>

        {/* 3. Loanmember Master Data (உறுப்பினர் பட்டியல்) */}
        <div className="pt-2 border-t border-[#E2E2DC]">
          <button
            onClick={() => handleSelectOtherMenu('loan-member-master')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              currentMenu === 'loan-member-master'
                ? 'bg-[#007A4D] text-white shadow-sm'
                : 'text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D]'
            }`}
            title="உறுப்பினர் பட்டியல்"
          >
            <Users className={`w-5 h-5 shrink-0 ${currentMenu === 'loan-member-master' ? 'text-white' : 'text-emerald-700'}`} />
            {isOpen && <span>உறுப்பினர் பட்டியல்</span>}
          </button>
        </div>

        {/* Main Menu Item: கேசிசி பட்டுவாடா (Disbursement) */}
        <div className="pt-2 border-t border-[#E2E2DC]">
          <button
            onClick={handlePattuvadaClick}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              currentMenu === 'kcc-disbursement' || currentMenu === 'kcc-bank-account'
                ? 'bg-[#D1EAE0]/70 text-[#007A4D] border border-[#007A4D]/30'
                : 'text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#007A4D] shrink-0" />
              {isOpen && <span>கேசிசி பட்டுவாடா</span>}
            </div>
            {isOpen && (
              <span className="text-stone-500">
                {isPattuvadaExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            )}
          </button>

          {/* Sub-menu options under கேசிசி பட்டுவாடா */}
          {isPattuvadaExpanded && (
            <div className={`mt-1 space-y-1 ${isOpen ? 'pl-4' : 'pl-0'}`}>
              {/* Option 1: கேசிசி பட்டுவாடா தயார் செய்தல் */}
              <button
                onClick={() => onSelectMenu('kcc-disbursement')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMenu === 'kcc-disbursement'
                    ? 'bg-[#007A4D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#007A4D] hover:bg-[#EAF4EF]'
                }`}
                title="கேசிசி பட்டுவாடா தயார் செய்தல்"
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                {isOpen && <span>கேசிசி பட்டுவாடா தயார் செய்தல்</span>}
              </button>

              {/* Option 2: கேசிசி வங்கி கணக்கு */}
              <button
                onClick={() => onSelectMenu('kcc-bank-account')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMenu === 'kcc-bank-account'
                    ? 'bg-[#007A4D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#007A4D] hover:bg-[#EAF4EF]'
                }`}
                title="கேசிசி வங்கி கணக்கு"
              >
                <Landmark className="w-4 h-4 shrink-0" />
                {isOpen && <span>கேசிசி வங்கி கணக்கு</span>}
              </button>
            </div>
          )}
        </div>

        {/* Main Menu Item: AH பட்டுவாடா (Animal Husbandry / மாட்டு லோன் பட்டுவாடா) */}
        <div className="pt-2 border-t border-[#E2E2DC]">
          <button
            onClick={handleAhClick}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              currentMenu === 'ah-disbursement' || currentMenu === 'ah-bank-account'
                ? 'bg-[#D1EAE0]/70 text-[#007A4D] border border-[#007A4D]/30'
                : 'text-stone-700 hover:bg-[#EAF4EF] hover:text-[#007A4D]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#007A4D] shrink-0" />
              {isOpen && <span>AH பட்டுவாடா</span>}
            </div>
            {isOpen && (
              <span className="text-stone-500">
                {isAhExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            )}
          </button>

          {/* Sub-menu options under AH பட்டுவாடா */}
          {isAhExpanded && (
            <div className={`mt-1 space-y-1 ${isOpen ? 'pl-4' : 'pl-0'}`}>
              {/* Option 1: AH பட்டுவாடா தயார் செய்தல் */}
              <button
                onClick={() => onSelectMenu('ah-disbursement')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMenu === 'ah-disbursement'
                    ? 'bg-[#007A4D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#007A4D] hover:bg-[#EAF4EF]'
                }`}
                title="AH பட்டுவாடா தயார் செய்தல்"
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                {isOpen && <span>AH பட்டுவாடா தயார் செய்தல்</span>}
              </button>

              {/* Option 2: AH வங்கி கணக்கு */}
              <button
                onClick={() => onSelectMenu('ah-bank-account')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMenu === 'ah-bank-account'
                    ? 'bg-[#007A4D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#007A4D] hover:bg-[#EAF4EF]'
                }`}
                title="AH வங்கி கணக்கு"
              >
                <Landmark className="w-4 h-4 shrink-0" />
                {isOpen && <span>AH வங்கி கணக்கு</span>}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Footer Info */}
      {isOpen && (
        <div className="p-3 border-t border-[#E2E2DC] bg-[#FAF9F5] text-xs text-stone-500">
          <div className="flex items-center gap-2 text-[#007A4D] font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PACS Portal v1.0</span>
          </div>
          <p className="text-[11px] text-stone-500">
            கூட்டுறவு கடன் சங்கம்
          </p>
        </div>
      )}
    </aside>
  );
};
