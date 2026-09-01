import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { KCCDisbursementScreen } from './components/KCCDisbursementScreen';
import { KCCBankAccountScreen } from './components/KCCBankAccountScreen';
import { AHDisbursementScreen } from './components/AHDisbursementScreen';
import { AHBankAccountScreen } from './components/AHBankAccountScreen';
import { LoanMemberMasterScreen } from './components/LoanMemberMasterScreen';
import { GoogleSheetSettingsScreen } from './components/GoogleSheetSettingsScreen';
import { PrintReportsScreen } from './components/PrintReportsScreen';
import { CropLoanInterestScreen } from './components/CropLoanInterestScreen';
import { JewelLoanInterestScreen } from './components/JewelLoanInterestScreen';
import { SHGLoanInterestScreen } from './components/SHGLoanInterestScreen';
import { 
  LoanMember, 
  KCCDisbursementRecord, 
  KCCBankAccount, 
  NavigationMenu, 
  Part1RCLDetails 
} from './types';
import { 
  INITIAL_LOAN_MEMBERS, 
  INITIAL_DISBURSEMENTS, 
  INITIAL_BANK_ACCOUNTS 
} from './data/initialData';

const LOCAL_STORAGE_KEYS = {
  MEMBERS: 'tu3_paccs_members_v2',
  DISBURSEMENTS: 'tu3_paccs_disbursements_v1',
  BANK_ACCOUNTS: 'tu3_paccs_accounts_v1'
};

export default function App() {
  // Navigation Menu state (defaults to 'home' as requested)
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Persistence State
  const [members, setMembers] = useState<LoanMember[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any, idx: number) => ({
            memberNo: m.aClass || m.memberNo || String(1001 + idx),
            aClass: m.aClass || m.memberNo || String(1001 + idx),
            sb: m.sb || '',
            erp: m.erp || '',
            ins: m.ins || '',
            name: m.name || 'உறுப்பினர்',
            fatherOrHusbandName: m.careOf || m.fatherOrHusbandName || '',
            careOf: m.careOf || m.fatherOrHusbandName || '',
            door: m.door || '',
            street: m.street || '',
            village: m.village || '',
            aadharNo: m.adhar || m.aadharNo || '',
            adhar: m.adhar || m.aadharNo || '',
            mobile: m.mobile || '',
            rationCard: m.rationCard || '',
            namini: m.namini || '',
            relation: m.relation || '',
            mdcc: m.mdcc || '',
            caste: m.caste || '',
            gender: m.gender || 'Male',
            totalShare: m.totalShare ?? m.landAcres ?? '',
            landAcres: m.landAcres ?? 0,
            kccAccountNo: m.kccAccountNo || '',
            bankBranch: m.bankBranch || 'TU3 PACCS தலைமை கிளை'
          }));
        }
      }
      return INITIAL_LOAN_MEMBERS;
    } catch (e) {
      return INITIAL_LOAN_MEMBERS;
    }
  });

  const [disbursements, setDisbursements] = useState<KCCDisbursementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.DISBURSEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_DISBURSEMENTS;
    } catch (e) {
      return INITIAL_DISBURSEMENTS;
    }
  });

  const [bankAccounts, setBankAccounts] = useState<KCCBankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.BANK_ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
    } catch (e) {
      return INITIAL_BANK_ACCOUNTS;
    }
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('tu3_paccs_sheet_id') || '';
  });

  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem('tu3_paccs_sheet_id', spreadsheetId);
    }
  }, [spreadsheetId]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DISBURSEMENTS, JSON.stringify(disbursements));
  }, [disbursements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  // Handler to save Part 1 (RCL விபரம்)
  const handleSavePart1 = (disbursementId: string, memberNo: string, part1Data: Part1RCLDetails) => {
    const member = members.find((m) => m.memberNo === memberNo);
    const memberName = member ? member.name : 'உறுப்பினர்';

    setDisbursements((prev) => {
      const index = prev.findIndex((d) => d.id === disbursementId);
      if (index >= 0) {
        // Update existing record
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          part1: part1Data
        };
        return updated;
      } else {
        // Create new record
        const newRecord: KCCDisbursementRecord = {
          id: disbursementId,
          memberNo,
          memberName,
          season: '2026-2027 பசுவடை / சொர்ணவாரி',
          part1: part1Data,
          createdDate: new Date().toISOString().split('T')[0],
          status: 'வரைவு (Draft)'
        };
        return [newRecord, ...prev];
      }
    });
  };

  // Handler to add new Loanmember
  const handleAddMember = (newMember: LoanMember) => {
    setMembers((prev) => [newMember, ...prev]);

    // Also auto-create a default KCC Bank Account for the new member
    if (newMember.kccAccountNo) {
      const newAccount: KCCBankAccount = {
        accountNo: newMember.kccAccountNo,
        memberNo: newMember.memberNo,
        memberName: newMember.name,
        ifscCode: 'TNSC0010200',
        branchName: newMember.bankBranch || 'TU3 PACCS தலைமை கிளை',
        accountType: 'KCC Crop Credit',
        sanctionLimit: 150000,
        currentBalance: 150000,
        status: 'செயலில் உள்ளது (Active)'
      };
      setBankAccounts((prev) => [newAccount, ...prev]);
    }
  };

  // Handler to add new Bank Account
  const handleAddBankAccount = (newAcc: KCCBankAccount) => {
    setBankAccounts((prev) => [newAcc, ...prev]);
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (window.confirm('ஆரம்ப மாதிரி தரவுக்கு மீட்க விரும்புகிறீர்களா? (Reset data?)')) {
      setMembers(INITIAL_LOAN_MEMBERS);
      setDisbursements(INITIAL_DISBURSEMENTS);
      setBankAccounts(INITIAL_BANK_ACCOUNTS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.MEMBERS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DISBURSEMENTS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.BANK_ACCOUNTS);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F4F4EE] flex font-sans text-stone-900 antialiased">
      {/* Left Sidebar Menu (Always stays fixed & visible) */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => setCurrentMenu(menu)}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Container (Scrolls independently) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Header bar */}
        <Header
          currentMenu={currentMenu}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onResetData={handleResetData}
        />

        {/* View Router */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-16">
          {currentMenu === 'home' && (
            <HomeScreen
              members={members}
              disbursements={disbursements}
              bankAccounts={bankAccounts}
              spreadsheetId={spreadsheetId}
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'interest-crop' && (
            <CropLoanInterestScreen
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'interest-jewel' && (
            <JewelLoanInterestScreen
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'interest-shg' && (
            <SHGLoanInterestScreen
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'kcc-disbursement' && (
            <KCCDisbursementScreen
              members={members}
              disbursements={disbursements}
              onSavePart1={handleSavePart1}
              onAddNewMember={() => setCurrentMenu('loan-member-master')}
              spreadsheetId={spreadsheetId}
              onSetSpreadsheetId={setSpreadsheetId}
            />
          )}

          {currentMenu === 'kcc-bank-account' && (
            <KCCBankAccountScreen
              accounts={bankAccounts}
              members={members}
              onAddAccount={handleAddBankAccount}
              spreadsheetId={spreadsheetId}
              onSetSpreadsheetId={setSpreadsheetId}
            />
          )}

          {currentMenu === 'ah-disbursement' && (
            <AHDisbursementScreen
              members={members}
              disbursements={disbursements}
              onSavePart1={handleSavePart1}
              onAddNewMember={() => setCurrentMenu('loan-member-master')}
              spreadsheetId={spreadsheetId}
              onSetSpreadsheetId={setSpreadsheetId}
            />
          )}

          {currentMenu === 'ah-bank-account' && (
            <AHBankAccountScreen
              spreadsheetId={spreadsheetId}
            />
          )}

          {currentMenu === 'loan-member-master' && (
            <LoanMemberMasterScreen
              members={members}
              onAddMember={handleAddMember}
              onSetMembers={setMembers}
              spreadsheetId={spreadsheetId}
              onSetSpreadsheetId={setSpreadsheetId}
            />
          )}

          {currentMenu === 'google-sheet-sync' && (
            <GoogleSheetSettingsScreen
              spreadsheetId={spreadsheetId}
              onSetSpreadsheetId={setSpreadsheetId}
              members={members}
              disbursements={disbursements}
            />
          )}

          {currentMenu === 'print-reports' && (
            <PrintReportsScreen
              disbursements={disbursements}
              members={members}
              bankAccounts={bankAccounts}
            />
          )}
        </main>
      </div>
    </div>
  );
}
