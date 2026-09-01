import React, { useState, useEffect, useMemo } from 'react';
import { 
  LoanMember, 
  KCCDisbursementRecord, 
  Part1RCLDetails 
} from '../types';
import { formatMobile, formatRationCard, formatMDCC, formatAadhar, formatIndianCurrency, formatIndianInputNumber, formatDateDDMMYYYY, extractSpreadsheetId, formatAcres } from '../utils/formatters';
import { 
  Search, 
  PlusCircle, 
  FileText, 
  CheckCircle, 
  Printer, 
  Trash2, 
  Edit3, 
  Eye, 
  FileSpreadsheet,
  Calendar,
  Layers,
  Sparkles,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Link,
  RefreshCw,
  X
} from 'lucide-react';

function numberToTamilWords(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (!n || isNaN(n) || n === 0) return 'பூஜ்ஜியம்';

  const units = ['', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது'];
  const tensPrefix = ['', 'பத்து', 'இருபத்து', 'முப்பத்து', 'நாற்பத்து', 'ஐம்பத்து', 'அறுபத்து', 'எழுபத்து', 'எண்பத்து', 'தொண்ணூற்று'];
  const tensExact = ['', 'பத்து', 'இருபது', 'முப்பது', 'நாற்பது', 'ஐம்பது', 'அறுபது', 'எழுபது', 'எண்பது', 'தொண்ணூறு'];
  const teens = ['பத்து', 'பதினொன்று', 'பன்னிரண்டு', 'பதின்மூன்று', 'பதினான்கு', 'பதினைந்து', 'பதினாறு', 'பதினேழு', 'பதினெட்டு', 'பத்தொன்பது'];
  const hundredsExact = ['', 'நூறு', 'இருநூறு', 'முந்நூறு', 'நானூறு', 'ஐந்நூறு', 'அறுநூறு', 'எழுநூறு', 'எண்ணூறு', 'தொள்ளாயிரம்'];
  const hundredsPrefix = ['', 'நூற்று', 'இருநூற்று', 'முந்நூற்று', 'நானூற்று', 'ஐந்நூற்று', 'அறுநூற்று', 'எழுநூற்று', 'எண்ணூற்று', 'தொள்ளாயிரத்து'];

  function convertTwoDigits(num: number): string {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (u === 0) return tensExact[t];
    return tensPrefix[t] + ' ' + units[u];
  }

  function convertThreeDigits(num: number): string {
    let result = '';
    const h = Math.floor(num / 100);
    const rest = num % 100;
    if (h > 0) {
      if (rest === 0) {
        return hundredsExact[h];
      }
      result += hundredsPrefix[h] + ' ';
    }
    if (rest > 0) {
      result += convertTwoDigits(rest);
    }
    return result.trim();
  }

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) {
    if (crore === 1) {
      parts.push('ஒரு கோடி');
    } else {
      parts.push(convertThreeDigits(crore) + ' கோடி');
    }
  }
  if (lakh > 0) {
    if (lakh === 1) {
      parts.push('ஒரு லட்சம்');
    } else {
      parts.push(convertThreeDigits(lakh) + ' லட்சம்');
    }
  }
  if (thousand > 0) {
    if (thousand === 1) {
      parts.push('ஆயிரம்');
    } else {
      parts.push(convertThreeDigits(thousand) + ' ஆயிரம்');
    }
  }
  if (rem > 0) {
    parts.push(convertThreeDigits(rem));
  }

  return parts.join(' ').trim() || 'பூஜ்ஜியம்';
}

interface KCCDisbursementScreenProps {
  members: LoanMember[];
  disbursements: KCCDisbursementRecord[];
  onSavePart1: (disbursementId: string, memberNo: string, part1Data: Part1RCLDetails) => void;
  onAddNewMember?: () => void;
  spreadsheetId?: string;
  onSetSpreadsheetId?: (id: string) => void;
}

export const KCCDisbursementScreen: React.FC<KCCDisbursementScreenProps> = ({
  members,
  disbursements,
  onSavePart1,
  onAddNewMember,
  spreadsheetId = '',
  onSetSpreadsheetId
}) => {
  // Google Sheets connection state
  const [sheetInput, setSheetInput] = useState<string>(spreadsheetId || '');
  const [isSubmittingToSheet, setIsSubmittingToSheet] = useState<boolean>(false);
  const [sheetStatusMsg, setSheetStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (spreadsheetId) {
      setSheetInput(spreadsheetId);
    }
  }, [spreadsheetId]);
  // Section 1: Batch Details
  const [financialYear, setFinancialYear] = useState<string>('2026-2027');
  const [rclNumber, setRclNumber] = useState<string>('107/25-26/P1');
  const [rclDate, setRclDate] = useState<string>('15 - 04 - 2026');
  const [sanctionedAmount, setSanctionedAmount] = useState<string>('3,00,00,000');
  const [officerDesignation, setOfficerDesignation] = useState<string>('செயலாட்சியர்');
  const [officerName, setOfficerName] = useState<string>('திரு.அ.சீனிவாசப்பெருமாள், கூட்டுறவு சார்பதிவாளர் / செயலாட்சியர்');

  // Section 2: Disbursement Details
  const [currentDisbNo, setCurrentDisbNo] = useState<string>('2');

  // Section 3: Resolution Details
  const [resolutionNo, setResolutionNo] = useState<string>('1');
  const [resolutionDate, setResolutionDate] = useState<string>('20 - 05 - 2026');

  // Section 4: Basic Details / Member Search
  const [searchAClassInput, setSearchAClassInput] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<LoanMember | null>(null);

  // Section 5: Land Details
  const [surveyNo, setSurveyNo] = useState<string>('');
  const [acres, setAcres] = useState<string>('0.00');
  const [crop, setCrop] = useState<string>('தென்னை');
  const [customCrop, setCustomCrop] = useState<string>('');

  // Section 6: Current Loan Details
  const [seed, setSeed] = useState<string>('0');
  const [chemicalFertilizer, setChemicalFertilizer] = useState<string>('0');
  const [compost, setCompost] = useState<string>('0');
  const [pesticide, setPesticide] = useState<string>('0');
  const [cash, setCash] = useState<string>('0');

  // Section 7: Document Details
  const [memberStatus, setMemberStatus] = useState<string>('பழைய உறுப்பினர்');
  const [category, setCategory] = useState<string>('-');
  const [farmerClass, setFarmerClass] = useState<string>('MF');
  const [disability, setDisability] = useState<string>('0');
  const [mortgageType, setMortgageType] = useState<string>('வெந்நிலை ஜாமீன் மூலம் முன்கடன் செலுத்தியவர்');
  const [guaranteeType, setGuaranteeType] = useState<string>('நபர் ஜாமீன்');

  // Section 8: Deduction Section
  const [passbookFee, setPassbookFee] = useState<string>('0');
  const [insurance, setInsurance] = useState<string>('0');
  const [shareCapital, setShareCapital] = useState<string>('0');

  // Section 9: Previous Loan Repayment Details
  const [prevLoanNo, setPrevLoanNo] = useState<string>('KCC -');
  const [prevLoanDate, setPrevLoanDate] = useState<string>('');
  const [prevLoanAmount, setPrevLoanAmount] = useState<string>('0');

  // Added Items List State
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeletingSheet, setIsDeletingSheet] = useState<boolean>(false);
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);

  // KCC Bank Sheet state for Form 7
  const [bankRows, setBankRows] = useState<any[]>([]);
  const [obF, setObF] = useState<string>(() => localStorage.getItem('kcc_ob_f') || '');
  const [obG, setObG] = useState<string>(() => localStorage.getItem('kcc_ob_g') || '');

  useEffect(() => {
    const fetchBankRowsData = async () => {
      try {
        const res = await fetch('/api/sheets/get-bank-rows');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setBankRows(data.data);
          if (data.obF !== undefined && data.obF !== '') {
            setObF(String(data.obF));
            localStorage.setItem('kcc_ob_f', String(data.obF));
          }
          if (data.obG !== undefined && data.obG !== '') {
            setObG(String(data.obG));
            localStorage.setItem('kcc_ob_g', String(data.obG));
          }
        }
      } catch (err) {
        console.log('Error fetching bank rows for Form 7:', err);
      }
    };
    fetchBankRowsData();
  }, []);

  // Reset form fields to initial default state
  const resetFormFields = () => {
    setEditingItem(null);
    setSelectedMember(null);
    setSearchAClassInput('');

    setSurveyNo('');
    setAcres('0.00');
    setCrop('தென்னை');
    setCustomCrop('');

    setSeed('0');
    setChemicalFertilizer('0');
    setCompost('0');
    setPesticide('0');
    setCash('0');

    setMemberStatus('பழைய உறுப்பினர்');
    setCategory('-');
    setFarmerClass('MF');
    setDisability('0');
    setMortgageType('வெந்நிலை ஜாமீன் மூலம் முன்கடன் செலுத்தியவர்');
    setGuaranteeType('நபர் ஜாமீன்');

    setPassbookFee('0');
    setInsurance('0');
    setShareCapital('0');

    setPrevLoanNo('KCC -');
    setPrevLoanDate('');
    setPrevLoanAmount('0');
  };

  // Search & Filter State for Current Batch Members
  const [filterDisbNo, setFilterDisbNo] = useState<string>('');
  const [searchedDisbNo, setSearchedDisbNo] = useState<string>('');
  const [lastDisbNo, setLastDisbNo] = useState<string>('0');

  // Fetch members from Google Sheet 'KCC All Paduvada Members' by Disbursement Number
  const handleSearchByDisbNo = async (overrideDisbNo?: string) => {
    const activeDisbNo = (overrideDisbNo !== undefined ? overrideDisbNo : filterDisbNo).trim();
    if (overrideDisbNo !== undefined) {
      setFilterDisbNo(activeDisbNo);
    }

    if (!activeDisbNo) {
      setSheetStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து தேட வேண்டிய பட்டுவாடா எண்ணை உள்ளிட்டு தேடவும்.'
      });
      return;
    }

    setSearchedDisbNo(activeDisbNo);

    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';

    if (!targetSheetId && !targetScriptUrl) {
      setSheetStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து கூகுள் சீட் ஐடி அல்லது Web App URL ஐ "கூகுள் சீட் இணைப்பு" அமைப்புகளில் அமைக்கவும்.'
      });
      return;
    }

    setIsFetchingSheet(true);
    setSheetStatusMsg({
      type: 'info',
      text: `பட்டுவாடா எண் '${activeDisbNo}' அடிப்படையில் கூகுள் சீட்டிலிருந்து தகவல்கள் பெறப்படுகின்றன...`
    });

    try {
      const url = `/api/sheets/get-paduvada?spreadsheetId=${encodeURIComponent(targetSheetId)}&disbNo=${encodeURIComponent(activeDisbNo)}&webAppUrl=${encodeURIComponent(targetScriptUrl)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        if (data.maxDisbNo) {
          setLastDisbNo(data.maxDisbNo);
        }
        if (Array.isArray(data.data)) {
          setAddedItems(data.data);
          if (data.data.length > 0) {
            const first = data.data[0];
            const rclNo = data.data.find((i: any) => i.rclNumber && String(i.rclNumber).trim() !== '')?.rclNumber || first.rclNumber;
            if (rclNo) setRclNumber(rclNo);

            const rclDt = data.data.find((i: any) => i.rclDate && String(i.rclDate).trim() !== '')?.rclDate || first.rclDate;
            if (rclDt) setRclDate(rclDt);

            const sancAmt = data.data.find((i: any) => i.sanctionedAmount && String(i.sanctionedAmount).trim() !== '')?.sanctionedAmount || first.sanctionedAmount;
            if (sancAmt) setSanctionedAmount(sancAmt);

            const curDisb = data.data.find((i: any) => i.currentDisbNo && String(i.currentDisbNo).trim() !== '')?.currentDisbNo || first.currentDisbNo || activeDisbNo;
            if (curDisb) setCurrentDisbNo(curDisb);

            const resNo = data.data.find((i: any) => i.resolutionNo && String(i.resolutionNo).trim() !== '')?.resolutionNo || first.resolutionNo;
            if (resNo) setResolutionNo(resNo);

            const resDate = data.data.find((i: any) => i.resolutionDate && String(i.resolutionDate).trim() !== '')?.resolutionDate || first.resolutionDate;
            if (resDate) setResolutionDate(resDate);

            setSheetStatusMsg({
              type: 'success',
              text: `கூகுள் சீட்டின் 'KCC All Paduvada Members' பகுதியிலிருந்து பட்டுவாடா எண் '${activeDisbNo}' க்கு உரிய ${data.data.length} உறுப்பினர்களின் தகவல்கள் பெறப்பட்டன!`
            });
          } else {
            setSheetStatusMsg({
              type: 'error',
              text: `கூகுள் சீட்டில் பட்டுவாடா எண் '${activeDisbNo}' கொண்ட உறுப்பினர்கள் யாரும் கிடைக்கவில்லை.`
            });
          }
        }
      } else if (data.error) {
        setSheetStatusMsg({
          type: 'error',
          text: data.error
        });
      }
    } catch (err: any) {
      console.error('Sheet fetch error:', err);
      setSheetStatusMsg({
        type: 'error',
        text: 'கூகுள் சீட்டிலிருந்து தகவல்களைப் பெறுவதில் பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsFetchingSheet(false);
      setTimeout(() => setSheetStatusMsg(null), 7000);
    }
  };

  // Manual Bulk Sync / Backup All Disbursement Items to Google Sheets
  const handleSyncAllToGoogleSheet = async () => {
    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';

    if (!targetSheetId && !targetScriptUrl) {
      setSheetStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து முதலில் கூகுள் சீட் ஐடி அல்லது Web App URL ஐ உள்ளீடு செய்து சேமிக்கவும்.'
      });
      return;
    }

    const itemsToSync = displayItems.length > 0 ? displayItems : addedItems;

    if (itemsToSync.length === 0) {
      setSheetStatusMsg({
        type: 'error',
        text: 'பட்டுவாடா பட்டியலில் சேமிக்க உறுப்பினர்கள் யாரும் இல்லை.'
      });
      return;
    }

    setIsSubmittingToSheet(true);
    setSheetStatusMsg({
      type: 'info',
      text: 'கூகுள் சீட்டிற்கு ஒத்திசைக்கப்படுகிறது (Syncing to Google Sheet)...'
    });

    try {
      const response = await fetch('/api/sheets/sync-paduvada-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: targetSheetId,
          webAppUrl: targetScriptUrl,
          items: itemsToSync
        })
      });

      const result = await response.json();
      if (result.success) {
        setSheetStatusMsg({
          type: 'success',
          text: `பட்டுவாடா பட்டியலில் உள்ள ${itemsToSync.length} உறுப்பினர்களின் தகவல்கள் கூகுள் சீட்டில் ('KCC All Paduvada Members') வெற்றியுடன் நகல் (Backup) எடுக்கப்பட்டன!`
        });
        setSuccessMsg(`கூகுள் சீட் நகல் சேமிப்பு வெற்றியுடன் முடிந்தது! (${itemsToSync.length} நபர்கள்)`);
        fetchLastDisbNo();
      } else {
        setSheetStatusMsg({
          type: 'error',
          text: result.error || 'கூகுள் சீட்டில் தகவல்களை நகல் எடுப்பதில் பிழை.'
        });
      }
    } catch (err: any) {
      console.error('Batch sync error:', err);
      setSheetStatusMsg({
        type: 'error',
        text: 'கூகுள் சீட் இணைப்பு பிழை. இணைய இணைப்பை சரிபார்க்கவும்.'
      });
    } finally {
      setIsSubmittingToSheet(false);
      setTimeout(() => setSheetStatusMsg(null), 7000);
      setTimeout(() => setSuccessMsg(''), 7000);
    }
  };

  // Fetch highest disbursement number from Google Sheet
  const fetchLastDisbNo = async () => {
    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';
    if (!targetSheetId && !targetScriptUrl) return;

    try {
      const url = `/api/sheets/get-paduvada?spreadsheetId=${encodeURIComponent(targetSheetId)}&webAppUrl=${encodeURIComponent(targetScriptUrl)}&disbNo=`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (data.maxDisbNo) {
          setLastDisbNo(data.maxDisbNo);
        }
        if (Array.isArray(data.data) && data.data.length > 0) {
          setAddedItems(data.data);
        }
      }
    } catch (err) {
      console.error('Fetch max disb no error:', err);
    }
  };

  // Initial load from Google Sheet
  useEffect(() => {
    fetchLastDisbNo();
    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';
    if ((targetSheetId || targetScriptUrl) && filterDisbNo.trim() !== '') {
      handleSearchByDisbNo(filterDisbNo);
    }
  }, []);

  const PRINT_FORMS = [
    { id: '1', title: '1. KCC-1 படிவம்' },
    { id: '2', title: '2. KCC-2 படிவம்' },
    { id: '3', title: '3. Cropwise (பயிர் வாரியாக)' },
    { id: '4', title: '4. காப்பீடு (Insurance)' },
    { id: '5', title: '5. ஜாபிதா (Jabitha)' },
    { id: '6', title: '6. ஒப்பந்தம் (Signature Page)' },
    { id: '7', title: '7. KCC Bank Sheet (வங்கி அறிக்கை)' },
    { id: '8', title: '8. குறிப்பு ஆணை (Note Order)' },
    { id: '9', title: '9. 7% வட்டி ஒப்புதல் (7% Agreement)' },
    { id: '10', title: '10. தீர்மானம் (Resolution)' },
  ];

  const handlePrintForm = (formTitle: string) => {
    // Strictly validate that current batch table has items
    const printItems = displayItems;

    if (!printItems || printItems.length === 0) {
      alert(`நடப்பு பட்டுவாடா பட்டியல் பகுதியில் பட்டுவாடா தரவுகள் எதுவும் இல்லை. '${formTitle}' அச்சிட தரவுகள் இருக்க வேண்டும்.`);
      return;
    }

    const activeDisbNo = (searchedDisbNo || filterDisbNo || currentDisbNo || '').trim();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const parseInitialAndName = (item: any) => {
      let ins = (item.ins || (item as any).initial || '').toString().trim();
      let nameStr = (item.name || (item as any).memberName || '').toString().trim();

      if (ins && ins !== '-') {
        const escaped = ins.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escaped}[.\\s]+`, 'i');
        nameStr = nameStr.replace(regex, '').trim();
        return { initial: ins, name: nameStr };
      }

      const match = nameStr.match(/^([A-Za-z\u0B80-\u0BFF]{1,3})[.\s]+(.+)$/);
      if (match) {
        return { initial: match[1], name: match[2].trim() };
      }

      return { initial: (ins && ins !== '-') ? ins : '-', name: nameStr };
    };

    // SPECIAL HANDLING FOR 7. KCC BANK SHEET (வங்கி அறிக்கை)
    if (formTitle.includes('Bank Sheet') || formTitle.includes('வங்கி அறிக்கை') || formTitle.includes('KCC Bank')) {
      const totalDisbAmount = printItems.reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const rawSanctioned = (sanctionedAmount || printItems[0]?.creditLimit || '3,00,00,000').toString();
      const numSanctioned = parseFloat(rawSanctioned.replace(/[^0-9.]/g, '')) || 30000000;
      const formattedSanctioned = formatIndianCurrency(numSanctioned);

      // Helper to parse date
      const parseRowDateVal = (dStr?: string) => {
        if (!dStr) return null;
        const clean = dStr.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return new Date(`${clean}T23:59:59`);
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
          const [y, m, d] = clean.split('/');
          return new Date(`${y}-${m}-${d}T23:59:59`);
        }
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
          const [d, m, y] = clean.split('/');
          const dd = d.padStart(2, '0');
          const mm = m.padStart(2, '0');
          return new Date(`${y}-${mm}-${dd}T23:59:59`);
        }
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
          const [d, m, y] = clean.split('-');
          const dd = d.padStart(2, '0');
          const mm = m.padStart(2, '0');
          return new Date(`${y}-${mm}-${dd}T23:59:59`);
        }
        const parsed = new Date(clean);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      // Sort bank rows chronologically to compute running Column F and Column I
      const sortedBankRows = [...bankRows].sort((a, b) => {
        const timeA = parseRowDateVal(a.date)?.getTime() || 0;
        const timeB = parseRowDateVal(b.date)?.getTime() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.rowIndex || 0) - (b.rowIndex || 0);
      });

      let runningF = parseFloat(obF) || 0;
      let runningG = parseFloat(obG) || 0;
      let runningH = 0;
      let runningI = 0;

      const targetTime = parseRowDateVal(resolutionDate);

      const annotatedRows = sortedBankRows.map((row, idx) => {
        const rowDate = parseRowDateVal(row.date);
        const memPay = typeof row.memberPayment === 'number' ? row.memberPayment : parseFloat(String(row.memberPayment || 0).replace(/[^0-9.-]/g, '')) || 0;
        const memCount = typeof row.disbursementMemberCount === 'number' ? row.disbursementMemberCount : parseInt(String(row.disbursementMemberCount || 0).replace(/[^0-9.-]/g, ''), 10) || 0;
        const disbAmt = typeof row.disbursementAmount === 'number' ? row.disbursementAmount : parseFloat(String(row.disbursementAmount || 0).replace(/[^0-9.-]/g, '')) || 0;
        const bankPay = typeof row.bankPayment === 'number' ? row.bankPayment : parseFloat(String(row.bankPayment || 0).replace(/[^0-9.-]/g, '')) || 0;

        runningF = runningF + disbAmt - bankPay;
        runningG = runningG + disbAmt - memPay;
        runningH = runningH + memCount;
        runningI = runningI + disbAmt;

        return {
          ...row,
          idx,
          rowDate,
          memPay,
          memCount,
          disbAmt,
          bankPay,
          calcF: runningF,
          calcG: runningG,
          calcH: runningH,
          calcI: runningI
        };
      });

      let eligibleRows = annotatedRows.filter(r => targetTime && r.rowDate ? r.rowDate <= targetTime : true);
      if (eligibleRows.length === 0 && annotatedRows.length > 0) {
        eligibleRows = annotatedRows;
      }

      let currentDisbRow: typeof annotatedRows[0] | undefined;
      if (eligibleRows.length > 0) {
        // Look for the last row with disbursementAmount > 0 or last eligible row
        const lastWithDisb = [...eligibleRows].reverse().find(r => r.disbAmt > 0);
        currentDisbRow = lastWithDisb || eligibleRows[eligibleRows.length - 1];
      }

      const matchedColI = currentDisbRow ? currentDisbRow.calcI : runningI;
      const matchedColF = currentDisbRow ? currentDisbRow.calcF : runningF;
      const matchedColG = currentDisbRow ? currentDisbRow.calcG : runningG;

      // Find previous disbursement row index before currentDisbRow
      let prevDisbIdx = -1;
      let prevDisbAmt = 0;
      if (currentDisbRow && currentDisbRow.idx > 0) {
        for (let i = currentDisbRow.idx - 1; i >= 0; i--) {
          if (annotatedRows[i].disbAmt > 0) {
            prevDisbIdx = i;
            prevDisbAmt = annotatedRows[i].disbAmt || 0;
            break;
          }
        }
      }

      // Sum member payments (collections) and bank payments (remittances) strictly between previous disbursement and current disbursement
      let collectionsSincePrev = 0;
      let remittanceSincePrev = 0;

      const startIndex = prevDisbIdx >= 0 ? prevDisbIdx + 1 : 0;
      const endIndex = currentDisbRow ? currentDisbRow.idx : (annotatedRows.length > 0 ? annotatedRows.length - 1 : -1);

      if (endIndex >= startIndex && startIndex >= 0) {
        for (let i = startIndex; i <= endIndex; i++) {
          collectionsSincePrev += annotatedRows[i].memPay;
          remittanceSincePrev += annotatedRows[i].bankPay;
        }
      }

      // Format values
      const formattedObtainedSoFar = formatIndianCurrency(matchedColI || 0);
      const formattedCentralBankOutstanding = formatIndianCurrency(matchedColF || 0);
      const formattedDisbTotal = formatIndianCurrency(totalDisbAmount);
      const formattedPrevDisbAmt = prevDisbAmt > 0 ? formatIndianCurrency(prevDisbAmt) : '0';
      const formattedCollectionsSincePrev = collectionsSincePrev > 0 ? formatIndianCurrency(collectionsSincePrev) : (collectionsSincePrev === 0 ? '0' : '-');
      const formattedRemittanceSincePrev = remittanceSincePrev > 0 ? formatIndianCurrency(remittanceSincePrev) : (remittanceSincePrev === 0 ? '0' : '-');
      const formattedMemberOutstanding = formatIndianCurrency(matchedColG || 0);

      const totalKcc6Val = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.kcc6 !== undefined && r.kcc6 !== '' ? r.kcc6 : (r.kcc6Num !== undefined && r.kcc6Num !== '' ? r.kcc6Num : (r['உரம் 6'] || r['CC6'] || r.chemicalFertilizer || r.fertilizer || '0'))).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      const totalInsVal = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.insurance !== undefined && r.insurance !== '' ? r.insurance : (r.insuranceNum || '0')).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      const seenBankBookMembers = new Set<string>();
      const totalBookCharge = printItems.reduce((acc, r) => {
        const aKey = String(r.aClass || r.aNo || r.memberNo || r.name || '').trim().toLowerCase();
        let val = 0;
        if (r.passbookFee !== undefined && r.passbookFee !== null && String(r.passbookFee).trim() !== '') {
          val = parseFloat(String(r.passbookFee).replace(/[^0-9.]/g, '')) || 0;
        } else if (r.bookCharge !== undefined && r.bookCharge !== null && String(r.bookCharge).trim() !== '') {
          val = parseFloat(String(r.bookCharge).replace(/[^0-9.]/g, '')) || 0;
        } else if (r.shareFee !== undefined && r.shareFee !== null && String(r.shareFee).trim() !== '') {
          val = parseFloat(String(r.shareFee).replace(/[^0-9.]/g, '')) || 0;
        } else {
          if (aKey && !seenBankBookMembers.has(aKey)) {
            val = 300;
          } else {
            val = 0;
          }
        }
        if (aKey) seenBankBookMembers.add(aKey);
        return acc + val;
      }, 0);

      const totalShareCapital = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.shareCapital !== undefined && r.shareCapital !== '' ? r.shareCapital : (r.shareCapitalNum || 0)).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      const totalCurrentAccount = totalBookCharge + totalShareCapital;

      const seenBankNetMembers = new Set<string>();
      const totalNetVal = printItems.reduce((acc, r) => {
        const netVal = parseFloat(String(r.netDisbursement !== undefined && r.netDisbursement !== '' ? r.netDisbursement : (r.netDisbursementNum !== undefined ? r.netDisbursementNum : '')).replace(/[^0-9.]/g, '')) || 0;
        if (netVal > 0) return acc + netVal;
        const loanAmt = getItemLoanAmount(r);
        const kcc6 = parseFloat(String(r.kcc6 !== undefined && r.kcc6 !== '' ? r.kcc6 : (r.kcc6Num !== undefined && r.kcc6Num !== '' ? r.kcc6Num : (r['உரம் 6'] || r['CC6'] || r.chemicalFertilizer || r.fertilizer || '0'))).replace(/[^0-9.]/g, '')) || 0;
        
        const aKey = String(r.aClass || r.aNo || r.memberNo || r.name || '').trim().toLowerCase();
        let book = 0;
        if (r.passbookFee !== undefined && r.passbookFee !== null && String(r.passbookFee).trim() !== '') {
          book = parseFloat(String(r.passbookFee).replace(/[^0-9.]/g, '')) || 0;
        } else if (r.bookCharge !== undefined && r.bookCharge !== null && String(r.bookCharge).trim() !== '') {
          book = parseFloat(String(r.bookCharge).replace(/[^0-9.]/g, '')) || 0;
        } else if (r.shareFee !== undefined && r.shareFee !== null && String(r.shareFee).trim() !== '') {
          book = parseFloat(String(r.shareFee).replace(/[^0-9.]/g, '')) || 0;
        } else {
          if (aKey && !seenBankNetMembers.has(aKey)) {
            book = 300;
          } else {
            book = 0;
          }
        }
        if (aKey) seenBankNetMembers.add(aKey);

        const ins = parseFloat(String(r.insurance !== undefined && r.insurance !== '' ? r.insurance : (r.insuranceNum || '0')).replace(/[^0-9.]/g, '')) || 0;
        const share = parseFloat(String(r.shareCapital !== undefined && r.shareCapital !== '' ? r.shareCapital : (r.shareCapitalNum || 0)).replace(/[^0-9.]/g, '')) || 0;
        return acc + Math.max(0, loanAmt - (kcc6 + book + ins + share));
      }, 0);

      const formattedCurrentAccountTotal = formatIndianCurrency(totalCurrentAccount);
      const formattedKcc6Total = formatIndianCurrency(totalKcc6Val);
      const formattedInsTotal = formatIndianCurrency(totalInsVal);
      const formattedNetTotal = formatIndianCurrency(totalNetVal);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>7. KCC Bank Sheet (வங்கி அறிக்கை)</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: legal portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              body {
                font-family: Arial, "Helvetica Neue", "Latha", "Vijaya", sans-serif;
                margin: 0;
                padding: 10px 20px;
                color: #000000;
                font-size: 13.5px;
                line-height: 1.55;
              }
              .header-box {
                border: 2px solid #000000;
                padding: 8px 12px;
                text-align: center;
                font-size: 16.5px;
                font-weight: 900;
                letter-spacing: 0.5px;
                margin-bottom: 22px;
              }
              .to-block {
                margin-bottom: 14px;
                font-size: 13.5px;
              }
              .to-title {
                font-weight: bold;
              }
              .to-address {
                margin-left: 90px;
                font-weight: 600;
                line-height: 1.5;
              }
              .salutation {
                margin-top: 10px;
                font-weight: bold;
              }
              .subject-row {
                display: flex;
                margin-top: 6px;
                font-weight: bold;
              }
              .subject-label {
                width: 90px;
                flex-shrink: 0;
              }
              .rcl-row {
                margin-top: 14px;
                margin-bottom: 10px;
                font-weight: 900;
                font-size: 13.5px;
              }
              .statement-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 16px;
              }
              .statement-table td {
                border: 1.5px solid #000000;
                padding: 4px 8px;
                font-size: 13px;
              }
              .cert-heading {
                text-align: center;
                font-weight: 900;
                font-size: 14.5px;
                margin-top: 14px;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
              }
              .cert-item {
                margin-bottom: 12px;
                text-align: justify;
                font-size: 12.5px;
                line-height: 1.55;
              }
              .amount-pill {
                display: inline-block;
                border: 1.5px solid #000000;
                padding: 1px 10px;
                font-weight: 900;
                font-family: monospace;
                font-size: 13px;
                margin: 0 3px;
              }
              .page-break {
                page-break-before: always;
                padding-top: 15px;
              }
              .sign-grid {
                display: flex;
                justify-content: space-between;
                margin-top: 35px;
                margin-bottom: 30px;
                padding: 0 20px;
                font-weight: 900;
                font-size: 13.5px;
              }
              .supervisor-sign {
                text-align: right;
                margin-top: 45px;
                padding-right: 40px;
                font-weight: 900;
                font-size: 13.5px;
              }
            </style>
          </head>
          <body>
            <!-- Header Box -->
            <div class="header-box">
              TU 3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் தேவாரம்
            </div>

            <!-- Address Block -->
            <div class="to-block">
              <div class="to-title">பெறுநர்</div>
              <div class="to-address">
                உயர்திரு கிளை மேலாளர் அவர்கள்<br/>
                மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கி லிட்<br/>
                தேவாரம் கிளை
              </div>
              <div class="salutation">ஐயா</div>
              <div class="subject-row">
                <div class="subject-label">பொருள் :</div>
                <div>
                  TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் KCC1<br/>
                  காசுக்கடனில் ₹ ${formattedDisbTotal} பட்டுவாடா கோருதல் தொடர்பாக
                </div>
              </div>
            </div>

            <!-- Central Bank RCL Details -->
            <div class="rcl-row">
              மத்திய வங்கி &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RCL எண் &nbsp; ${rclNumber || '107/25-26/P1'} &nbsp;&nbsp; Dt:${formatDateDDMMYYYY(rclDate) || '15.04.2026'}
            </div>

            <!-- Statement Table (1 - 8) -->
            <table class="statement-table">
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">1</td>
                <td style="font-weight: 600;">அனுமதிக்கப்பட்ட காசுக்கடன் அளவு</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedSanctioned}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">2</td>
                <td style="font-weight: 600;">அனுமதிக்கப்பட்டதில் இதுநாள் வரை பெறப்பட்டுள்ளது</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedObtainedSoFar}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">3</td>
                <td style="font-weight: 600;">மத்திய வங்கியில் நாளது தேதியுடன் கடன் நிலுவை</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedCentralBankOutstanding}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">4</td>
                <td style="font-weight: 600;">தற்போது கோரும் தொகை</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedDisbTotal}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">5</td>
                <td style="font-weight: 600;">சென்ற பட்டுவாடாவிற்குபின் வசூல் தொகை</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedCollectionsSincePrev}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">6</td>
                <td style="font-weight: 600;">சென்ற பட்டுவாடாவிற்குபின் இருசால்</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedRemittanceSincePrev}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">7</td>
                <td style="font-weight: 600;">சங்கத்தில் உறுப்பினர் அளவில் கடன் நிலுவை</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ ${formattedMemberOutstanding}</td>
              </tr>
              <tr>
                <td style="width: 35px; text-align: center; font-weight: bold;">8</td>
                <td style="font-weight: 600;">சங்கத்தில் &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; தேதியில் கையிருப்பு</td>
                <td style="width: 20px; text-align: center; font-weight: bold;">:</td>
                <td style="width: 170px; text-align: right; font-weight: 900; font-family: monospace; font-size: 13.5px;">₹ </td>
              </tr>
            </table>

            <!-- Certificates Heading -->
            <div class="cert-heading">சான்றுகள்</div>

            <!-- Certificate 1 -->
            <div class="cert-item">
              1. பட்டுவாடா கோரும் உறுப்பினர்களுக்கு போதுமான பங்குத்தொகை பிடித்தம் செய்யப்படும் என்றும் கடன் கோரும் உறுப்பினர்களுக்கு நாளது தேதிவரை வழங்கப்பட்ட பயிர்கள் உறுதிசெய்து பயிர் பராமரிப்பு பேரேட்டில் (Crop Verification Register ) பதியப்பட்டுள்ளது என்றும் இக்கடன் கோரும் உறுப்பினர்களுக்கு மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கி சுற்றறிக்கையின்படி பயிர்காப்பீடு மற்றும் தனி நபர் விபத்துக் காப்பீட்டு கட்டணம் செலுத்தப்படும் என்றும் இப்பட்டுவாடா கோரியுள்ள.......உறுப்பினர்களில்.....உறுப்பினர்களுக்கு மட்டும் ஏற்கனவே 3 வருட தனி நபர் விபத்துக் காப்பீடு செலுத்தப்பட்டுள்ளது என்றும் சான்று செய்கின்றேன்.
            </div>

            <!-- Certificate 2 -->
            <div class="cert-item">
              2. கடன் கோரும் உறுப்பினர்களின் சங்கத்திற்கு பதிந்து கொடுத்த நிலங்களின்சர்வே நிலப்பரப்பிற்கு தான்தாஸ்தி பொறுப்பு சிட்டா அடங்கல் பெறப்பட்டு தற்பொழுது விவசாயம் செய்து வரும் பயிருக்கு கிராம நிர்வாக அதிகாரியிடம் ஆஸ்தி பொறுப்பு மற்றும் அடங்கல் பெற்று சமர்ப்பித்துள்ளனர் என்றும், கடன் பட்டுவாடாகோரும் சர்வே எண் மற்றும் அதன் பரப்பளவிற்கு சங்கத்தில் முன் கடன் பாக்கியில்லை என்றும்
            </div>

            <!-- Certificate 3 -->
            <div class="cert-item">
              3. ஜாமீன் நிற்பவர்கள் ஜாமீன் நிற்க தகுதியானவர்கள் என்றும், உறுப்பினர்கள் பாஸ்போர்ட் புகைப்படம் பிரவேசப்புத்தகத்தில் ஒட்டப்பட்டுள்ளதென்றும் உறுப்பினர் கையொப்பம் அனைத்தும் பிரவேசபுத்தகத்துடன்ஒப்பிட்டு சரியாக உள்ளதென்றும்,
            </div>

            <!-- Certificate 4 -->
            <div class="cert-item">
              4. கடன் பட்டுவாடாவில் கடன்கோரும் உறுப்பினர்களுக்கு கடன் நிலுவையிலும் வேறுஎந்த கடனிலும் அவருக்கும் அவரது கூட்டுக்குடும்பத்திலுள்ள வேறுஎவருக்கும் தவணை தவறிய கடன்பாக்கி ஏதுமில்லை என்றும் தற்பொழுது கோரும் கடன் பட்டுவாடாவிற்கு முந்திய கடன் பட்டுவாடா ஜாபிதா ரூ.${formattedPrevDisbAmt}/- விற்கு உறுப்பினர்களிடம் கையொப்பம் பெற்று கிளையில் சமர்ப்பிக்கப்பட்டுள்ளது என்றும்
            </div>

            <!-- Certificate 5 -->
            <div class="cert-item">
              5. பயிர்கடனில் கணக்கில் வசூலாகும் தொகையை அதே கணக்கில் மத்திய வங்கியில் இருசால் செய்து வருகின்றோம். போதிய ஆதாரம் உள்ளதென்றும் சுற்றறிக்கையில் அறிவுறுத்தியபடி தொடக்க வேளாண்மை கூட்டுறவு சங்கத்தில் பராமரிக்க வேண்டிய பதிவேடுகள் அனைத்தும் பதியப்பட்டு பதிவு செய்து வருகின்றோம். பட்டுவாடா ஜாபிதா மற்றும் வெந்நிலை ஜாமீன் கடன் பத்திரம், தொடர்ச்சி அடமானம் பத்திரம் பெறப்பட்டு சங்கத்தில் உள்ளதென்றும்,
            </div>

            <!-- Page 2 Starts Here -->
            <div class="page-break">
              <!-- Certificate 6 -->
              <div class="cert-item" style="margin-top: 15px;">
                6. கடன்பட்டுவாடா கோரும் உறுப்பினர்களுக்கு மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கியின் சுற்றறிக்கையின்படி தனி நபர் பயிர்க்கடன் K.C.C.1 உச்சபட்சம் ரூ. 3,00,000/-க்கு மேல் பட்டுவாடா செய்யப்படவில்லை என்றும்
              </div>

              <!-- Secretary & President Approval Block -->
              <div class="cert-item" style="margin-top: 25px; line-height: 1.8;">
                மேற்கண்ட சான்றுகள் சங்க செயலாளர், தலைவர் மற்றும் நிர்வாகஸ்தர்களால் சரிபார்க்கப்பட்டு சரியாக உள்ளது என்று சான்று செய்கின்றோம். எனவே கடன் பட்டுவாடா கோரும் தொகை <span class="amount-pill">₹ ${formattedDisbTotal}</span> ஐ சங்க நடப்பு கணக்கில் <span class="amount-pill">₹ ${formattedCurrentAccountTotal}</span> மற்றும் சங்க CC6 கணக்கில் <span class="amount-pill">₹ ${formattedKcc6Total}</span> ம் மூன்று வருட தனிநபர் விபத்துக்காப்பீடு <span class="amount-pill">₹ ${formattedInsTotal}</span> ம் சங்க உறுப்பினர் சேமிப்பு கணக்கில் <span class="amount-pill">₹ ${formattedNetTotal}</span> ஈடு செய்வதன் மூலம் பட்டுவாடா வழங்குமாறு அன்புடன் கேட்டுக் கொள்கிறோம்.
              </div>

              <!-- Signatures Row -->
              <div class="sign-grid">
                <div>செயலாளர்</div>
                <div>தலைவர் / செயலாட்சியர்</div>
              </div>

              <!-- Supervisor Recommendation Block -->
              <div class="cert-item" style="margin-top: 35px; line-height: 1.8;">
                எனவே மேற்படி சங்க செயலாளர், தலைவர் அவர்களின் கடன் கோரிக்கையை ஏற்று <span class="amount-pill">₹ ${formattedDisbTotal}</span> பரிந்துரை செய்கிறேன். சங்க நடப்பு கணக்கில் <span class="amount-pill">₹ ${formattedCurrentAccountTotal}</span> மற்றும் சங்க CC6 கணக்கில் <span class="amount-pill">₹ ${formattedKcc6Total}</span> ம் மூன்று வருட தனிநபர் விபத்துக் காப்பீடு <span class="amount-pill">₹ ${formattedInsTotal}</span> ம் சங்க உறுப்பினர் சேமிப்பு கணக்கில் <span class="amount-pill">₹ ${formattedNetTotal}</span> ஈடு செய்வதன் மூலம் பட்டுவாடா வழங்குமாறும், மேற்படி கடன் கோரும் உறுப்பினர்களின் சிட்டா அடங்கல் மற்றும் ஆவணங்களை சரிபார்த்து சங்க உறுப்பினர்களுக்கு KCC காசுக்கடன் கணக்கில் <span class="amount-pill">₹ ${formattedDisbTotal}</span> மட்டும் பட்டுவாடா வழங்குமாறு சிபாரிசு செய்கிறேன்.
              </div>

              <!-- Supervisor Signature -->
              <div class="supervisor-sign">
                சரக மேற்பார்வையாளர்
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // SPECIAL HANDLING FOR 8. குறிப்பு ஆணை (NOTE ORDER)
    if (formTitle.includes('Note Order') || formTitle.includes('குறிப்பு ஆணை') || formTitle.includes('Note')) {
      const totalDisbAmount = printItems.reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const rawSanctioned = (sanctionedAmount || printItems[0]?.creditLimit || '3,00,00,000').toString();
      const numSanctioned = parseFloat(rawSanctioned.replace(/[^0-9.]/g, '')) || 30000000;
      const sanctionLakhs = (numSanctioned / 100000).toFixed(2);
      const formattedDisbTotal = formatIndianCurrency(totalDisbAmount);

      const totSeed = printItems.reduce((acc, i) => acc + (parseFloat(String((i as any).seed || (i as any).seedAmount || (i as any)['விதை'] || (i as any)['விதை பகுதி'] || '0').replace(/[^0-9.]/g, '')) || 0), 0);
      const totChem = printItems.reduce((acc, i) => acc + (parseFloat(String(i.chemicalFertilizer || i.fertilizer || (i as any)['இரசாயன உரம்'] || (i as any)['ரசாயன உரம்'] || '0').replace(/[^0-9.]/g, '')) || 0), 0);
      const totComp = printItems.reduce((acc, i) => acc + (parseFloat(String(i.fertilizerKind || i.compost || (i as any)['தொழு உரம்'] || '0').replace(/[^0-9.]/g, '')) || 0), 0);
      const totPest = printItems.reduce((acc, i) => acc + (parseFloat(String(i.pesticide || (i as any)['பூச்சி மருந்து'] || '0').replace(/[^0-9.]/g, '')) || 0), 0);
      const totCash = printItems.reduce((acc, i) => acc + (parseFloat(String(i.organicFertilizer || i.cash || (i as any)['ரொக்கம்'] || '0').replace(/[^0-9.]/g, '')) || 0), 0);

      // Left total calculation
      const leftTotal = totSeed + totChem + totComp + totPest + totCash;
      const finalLeftTotal = leftTotal > 0 ? leftTotal : totalDisbAmount;

      // Right Side Breakdown:
      // 1. Passbook fee + Share capital = Current Account
      const totalBookCharge = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.bookCharge !== undefined && r.bookCharge !== '' ? r.bookCharge : (r.bookChargeNum !== undefined && r.bookChargeNum !== '' ? r.bookChargeNum : (r.passbookFee !== undefined ? r.passbookFee : 300))).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      const totalShareCapital = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.shareCapital !== undefined && r.shareCapital !== '' ? r.shareCapital : (r.shareCapitalNum || 0)).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      const totalCurrentAccount = totalBookCharge + totalShareCapital;

      // 2. KCC6 = Chemical fertilizer sum
      const totalKcc6Val = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.chemicalFertilizer !== undefined && r.chemicalFertilizer !== '' ? r.chemicalFertilizer : (r.fertilizer !== undefined && r.fertilizer !== '' ? r.fertilizer : (r.kcc6 || r.kcc6Num || r['உரம் 6'] || r['CC6'] || '0'))).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      // 3. Insurance
      const totalInsVal = printItems.reduce((acc, r) => {
        const val = parseFloat(String(r.insurance !== undefined && r.insurance !== '' ? r.insurance : (r.insuranceNum || '0')).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }, 0);

      // 4. Crop insurance (0)
      const totalCropInsurance = 0;

      // 5. Net disbursement sum
      const totalNetVal = printItems.reduce((acc, r) => {
        const netVal = parseFloat(String(r.netDisbursement !== undefined && r.netDisbursement !== '' ? r.netDisbursement : (r.netDisbursementNum !== undefined ? r.netDisbursementNum : '')).replace(/[^0-9.]/g, '')) || 0;
        if (netVal > 0) return acc + netVal;
        const loanAmt = getItemLoanAmount(r);
        const kcc6 = parseFloat(String(r.chemicalFertilizer || r.fertilizer || r.kcc6 || r.kcc6Num || r['உரம் 6'] || r['CC6'] || '0').replace(/[^0-9.]/g, '')) || 0;
        const book = parseFloat(String(r.bookCharge !== undefined && r.bookCharge !== '' ? r.bookCharge : (r.bookChargeNum !== undefined && r.bookChargeNum !== '' ? r.bookChargeNum : (r.passbookFee !== undefined ? r.passbookFee : 300))).replace(/[^0-9.]/g, '')) || 0;
        const ins = parseFloat(String(r.insurance !== undefined && r.insurance !== '' ? r.insurance : (r.insuranceNum || '0')).replace(/[^0-9.]/g, '')) || 0;
        const share = parseFloat(String(r.shareCapital !== undefined && r.shareCapital !== '' ? r.shareCapital : (r.shareCapitalNum || 0)).replace(/[^0-9.]/g, '')) || 0;
        return acc + Math.max(0, loanAmt - (kcc6 + book + ins + share));
      }, 0);

      // 6. Thrift / Other (0)
      const totalThriftOther = 0;

      // Right side total calculation
      const rightTotal = totalCurrentAccount + totalKcc6Val + totalInsVal + totalCropInsurance + totalNetVal + totalThriftOther;
      const finalRightTotal = rightTotal > 0 ? rightTotal : totalDisbAmount;

      const formattedResDate = formatDateDDMMYYYY(resolutionDate) || '20.05.2026';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ta">
          <head>
            <meta charset="utf-8" />
            <title>8. குறிப்பு ஆணை (Note Order) - KCC ${activeDisbNo || filterDisbNo || currentDisbNo || '1'}</title>
            <style>
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 15mm 15mm 15mm 15mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
              }
              body {
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 24px 30px;
                font-size: 13px;
                line-height: 1.6;
              }
              .amount-box {
                display: inline-block;
                border: 1px solid black;
                padding: 1px 12px;
                font-weight: bold;
                text-align: center;
              }
              table.breakdown-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 12.5px;
              }
              table.breakdown-table th, table.breakdown-table td {
                border: 1px solid #000000 !important;
                padding: 4px 6px;
                color: #000000 !important;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f5f5f4; padding: 10px 16px; border-radius: 8px; border: 1px solid #d6d3d1;">
              <span style="font-size: 13px; font-weight: bold;">📄 8. குறிப்பு ஆணை (Note Order) - அச்சு சாளரம் (A4 Portrait)</span>
              <button onclick="window.print()" style="background: #007A4D; color: white; font-weight: bold; font-size: 12px; padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer;">
                🖨️ அச்சிடு (Print A4 Portrait)
              </button>
            </div>

            <!-- Top Header Boxes (Loan No & Date) -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; font-weight: normal; font-size: 13px;">
              <div style="border: 1px solid black; padding: 4px 10px; width: 170px; height: 26px; display: flex; align-items: center;">Loan No</div>
              <div style="border: 1px solid black; padding: 4px 10px; width: 140px; height: 26px; display: flex; align-items: center;">Date</div>
            </div>

            <!-- Central Bank Name (THE MADURAI DISTRICT CENTRAL CO-OPERATIVE BANK LTD., THEVARAM BRANCH) -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="border-top: 1.5px solid black; border-bottom: 1.5px solid black; padding: 6px 0;">
                <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif;">
                  THE MADURAI DISTRICT CENTRAL CO-OPERATIVE BANK LTD.,
                </div>
                <div style="font-size: 13px; font-weight: 900; margin-top: 2px; font-family: 'Times New Roman', Times, serif;">
                  THEVARAM BRANCH
                </div>
              </div>
            </div>

            <!-- Subject & Reference -->
            <div style="margin-bottom: 22px; font-size: 13px; line-height: 1.6; font-family: 'Times New Roman', Times, serif;">
              <div style="font-weight: bold;">Subject &nbsp;&nbsp; KCC ${activeDisbNo || filterDisbNo || currentDisbNo || '1'}</div>
              <div style="font-weight: bold;">Reference No. RCL No:${rclNumber || '107/25-26/P1'} Dt:${formatDateDDMMYYYY(rclDate) || '15.04.2026'}</div>
            </div>

            <!-- Draft for approval / Note அலுவலககுறிப்பு -->
            <div style="text-align: center; margin-bottom: 22px;">
              <div style="display: inline-block; font-size: 14px; font-weight: 900; text-decoration: underline;">
                Draft for approval / Note அலுவலககுறிப்பு
              </div>
            </div>

            <!-- Paragraph 1 -->
            <div style="text-align: justify; line-height: 1.85; font-size: 12.5px; margin-bottom: 20px;">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;T.U.3 தேவாரம் தொடக்கவேளாண்மை கூட்டுறவுகடன் சங்கத்திற்கு மத்திய வங்கியிலிருந்து சாங்ஷனாகி வரவான RCL-${rclNumber || '107/25-26/P1'} Dt:${formatDateDDMMYYYY(rclDate) || '15.04.2026'} படி KCC பயிர் கடனுக்குரூ.${sanctionLakhs}.லட்சம்/-சாங்ஷன் பெறப்பட்டதில் சங்கநிர்வாகக்குழு தீர்மானஎண்: ${resolutionNo || '1'} நாள்:${formattedResDate} ன் படி &nbsp;<span class="amount-box" style="min-width: 32px;">${printItems.length}</span>&nbsp; நபருக்கு KCC காரியத்திற்கு &nbsp;<span class="amount-box">₹ ${formattedDisbTotal}</span>&nbsp; காசோலை எண் ........................ மூலம் கடன் கோரி தீர்மானம் இயற்றியுள்ளது.
            </div>

            <!-- Paragraph 2 -->
            <div style="text-align: justify; line-height: 1.85; font-size: 12.5px; margin-bottom: 24px;">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;மேற்படிசங்கத்திற்கு சரகமேற்பார்வையாளர் ........................ ந் தேதியில் கடன் அனுமதி உத்தரவில் கண்டுள்ள நிபந்தனைகளை நிவர்த்தி செய்துள்ளதென்றும் கடன் வாங்கிய நபர்கள் முறையாக திருப்பிச் செலுத்திவிட்டார்கள் என்றும் கடனுக்குரிய சிட்டா ஆவணங்களை சரிபார்க்கப்பட்டு சரியாக உள்ளதென்றும் போதியளவு பங்குத்தொகை உள்ளதென்றும் ஆண்டுக் கடனளவு பயிர் அட்டவணைக்கு உட்பட்டுள்ளது என சான்று செய்துள்ளார். இதற்கு முன்பெற்ற பட்டுவாடா ஜாபிதாவும் சான்று செய்து இத்துடன் இணைக்கப்பட்டுள்ளது. சங்க கே.சி.சி கடன் கணக்கில் பற்று எழுதி சங்க உறுப்பினர்கள் கே.சி.சி நடப்புகணக்கில் ஈடுசெய்து பட்டுவாடா வழங்க கீழ்கண்டவாறு பரிந்துரை செய்துள்ளார். சரக மேற்பார்வையாளர் பரிந்துரையை ஏற்று பட்டுவாடா வழங்க கிளை மேலாளர் அனுமதிக்கு
            </div>

            <!-- 6-row side-by-side Table + Totals row -->
            <table class="breakdown-table">
              <tbody>
                <!-- Row 1 -->
                <tr>
                  <td style="width: 25px; text-align: center; font-weight: bold;">1</td>
                  <td style="width: 145px;">விதை பகுதி</td>
                  <td style="width: 85px; text-align: right; font-weight: bold;">${Math.round(totSeed)}</td>
                  <td style="width: 25px; text-align: center; font-weight: bold;">1</td>
                  <td style="width: 175px;">சங்க நடப்பு கணக்கு</td>
                  <td style="width: 85px; text-align: right; font-weight: bold;">${Math.round(totalCurrentAccount)}</td>
                </tr>

                <!-- Row 2 -->
                <tr>
                  <td style="text-align: center; font-weight: bold;">2</td>
                  <td>இரசாயன உரம்</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totChem)}</td>
                  <td style="text-align: center; font-weight: bold;">2</td>
                  <td>காசுக்கடன் - 6</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totalKcc6Val)}</td>
                </tr>

                <!-- Row 3 -->
                <tr>
                  <td style="text-align: center; font-weight: bold;">3</td>
                  <td>தொழு உரம்</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totComp)}</td>
                  <td style="text-align: center; font-weight: bold;">3</td>
                  <td>தனிநபர் விபத்துக் காப்பீடு</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totalInsVal)}</td>
                </tr>

                <!-- Row 4 -->
                <tr>
                  <td style="text-align: center; font-weight: bold;">4</td>
                  <td>பூச்சி மருந்து</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totPest)}</td>
                  <td style="text-align: center; font-weight: bold;">4</td>
                  <td>பயிர் காப்பீடு</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totalCropInsurance)}</td>
                </tr>

                <!-- Row 5 -->
                <tr>
                  <td style="text-align: center; font-weight: bold;">5</td>
                  <td>ரொக்கம்</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totCash)}</td>
                  <td style="text-align: center; font-weight: bold;">5</td>
                  <td>உறுப்பினர் சேமிப்பு கணக்கு</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totalNetVal)}</td>
                </tr>

                <!-- Row 6 -->
                <tr>
                  <td style="text-align: center; font-weight: bold;">6</td>
                  <td></td>
                  <td style="text-align: right; font-weight: bold;">0</td>
                  <td style="text-align: center; font-weight: bold;">6</td>
                  <td>சிக்கனம் - இதரம்</td>
                  <td style="text-align: right; font-weight: bold;">${Math.round(totalThriftOther)}</td>
                </tr>

                <!-- Total Row -->
                <tr style="font-weight: 900; background: #ffffff;">
                  <td colspan="2" style="text-align: center; font-weight: 900;">மொத்தம்</td>
                  <td style="text-align: right; font-weight: 900;">${Math.round(finalLeftTotal)}</td>
                  <td colspan="2" style="text-align: center; font-weight: 900;">மொத்தம்</td>
                  <td style="text-align: right; font-weight: 900;">${Math.round(finalRightTotal)}</td>
                </tr>
              </tbody>
            </table>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // SPECIAL HANDLING FOR 3. CROPWISE (பயிர் வாரியாக)
    if (formTitle.includes('Cropwise') || formTitle.includes('பயிர் வாரியாக')) {
      const calcNew = printItems.filter(i => (i as any).isNew || (i as any).memberType === 'new').reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const calcScst = printItems.filter(i => {
        const caste = ((i as any).caste || '').toUpperCase();
        return caste.includes('SC') || caste.includes('ST');
      }).reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const totalLoanOverall = printItems.reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const calcOthers = (totalLoanOverall > 0 && calcScst > 0) ? (totalLoanOverall - calcScst) : (totalLoanOverall > 0 ? totalLoanOverall : 0);
      const calcSfmf = printItems.filter(i => {
        const acres = parseFloat(String(i.acres || 0)) || 0;
        return acres > 0 && acres <= 5.0;
      }).reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const calcOf = printItems.filter(i => {
        const acres = parseFloat(String(i.acres || 0)) || 0;
        return acres > 5.0;
      }).reduce((sum, i) => sum + getItemLoanAmount(i), 0);
      const calcFemale = printItems.filter(i => {
        const gender = ((i as any).gender || '').toLowerCase();
        return gender.includes('f') || gender.includes('பெண்') || gender.includes('female');
      }).reduce((sum, i) => sum + getItemLoanAmount(i), 0);

      // Crop aggregation - ONLY distinct crops recorded in current disbursement
      const cropMap = new Map<string, {
        count: number;
        acres: number;
        seed: number;
        chem: number;
        comp: number;
        pest: number;
        cash: number;
        totalLoan: number;
      }>();

      printItems.forEach(item => {
        const cropName = (item.crop || '').trim();
        if (!cropName || cropName === '-') return;

        const chemAmt = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
        const compAmt = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
        const pestAmt = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
        const cashAmt = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;
        const seedAmt = parseFloat(String((item as any).seed || '0').replace(/[^0-9.]/g, '')) || 0;
        const loanAmt = getItemLoanAmount(item);
        const acresVal = parseFloat(item.acres || '0') || 0;

        const existing = cropMap.get(cropName) || {
          count: 0,
          acres: 0,
          seed: 0,
          chem: 0,
          comp: 0,
          pest: 0,
          cash: 0,
          totalLoan: 0
        };

        existing.count += 1;
        existing.acres += acresVal;
        existing.seed += seedAmt;
        existing.chem += chemAmt;
        existing.comp += compAmt;
        existing.pest += pestAmt;
        existing.cash += cashAmt;
        existing.totalLoan += loanAmt;
        cropMap.set(cropName, existing);
      });

      const cropRows: Array<{
        crop: string;
        count: number;
        acres: number;
        seed: number;
        chem: number;
        comp: number;
        pest: number;
        cash: number;
        totalLoan: number;
      }> = [];

      cropMap.forEach((data, cropName) => {
        cropRows.push({
          crop: cropName,
          ...data
        });
      });

      const totCount = cropRows.reduce((sum, r) => sum + r.count, 0);
      const totAcres = cropRows.reduce((sum, r) => sum + r.acres, 0);
      const totSeed = cropRows.reduce((sum, r) => sum + r.seed, 0);
      const totChem = cropRows.reduce((sum, r) => sum + r.chem, 0);
      const totComp = cropRows.reduce((sum, r) => sum + r.comp, 0);
      const totPest = cropRows.reduce((sum, r) => sum + r.pest, 0);
      const totCash = cropRows.reduce((sum, r) => sum + r.cash, 0);
      const totLoan = cropRows.reduce((sum, r) => sum + r.totalLoan, 0);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ta">
          <head>
            <meta charset="utf-8" />
            <title>KCC 1 - பயிர் வாரியான பயிர்க்கடன் விபரம்</title>
            <style>
              @media print {
                @page {
                  size: legal landscape;
                  margin: 5mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 12px;
                font-size: 12px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1px solid #000000 !important;
                padding: 3px 5px;
                color: #000000 !important;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #f5f5f4; padding: 10px 14px; border-radius: 8px; border: 1px solid #d6d3d1;">
              <span style="font-size: 13px; font-weight: bold;">📄 3. Cropwise (பயிர் வாரியான KCC1 பயிர்க்கடன் விபரம்) - அச்சு சாளரம் (Legal Landscape)</span>
              <button onclick="window.print()" style="background: #007A4D; color: white; font-weight: bold; font-size: 12px; padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer;">
                🖨️ அச்சிடு (Print Legal Landscape)
              </button>
            </div>

            <!-- 1. Header Box Table -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; text-align: center; font-weight: bold; margin-bottom: 6px;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #000000; padding: 6px; font-size: 15px; font-weight: 900; text-transform: uppercase;">
                    T.U.3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் லிட்., தேவாரம்
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px; font-size: 12.5px; font-weight: bold;">
                    உத்தமபாளையம் தாலுகா, தேனி மாவட்டம் - 625530
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px; font-size: 13px; font-weight: 900;">
                    KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px; font-size: 12.5px; font-weight: bold;">
                    மத்திய வங்கி RCL No: ${rclNumber || '107/25-26/P1'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; நாள்:${formatDateDDMMYYYY(rclDate) || '15.04.2026'}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 2. Members Category & Bank Remittance Table (4 Columns, 6 Rows) -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 12px; margin-bottom: 6px;">
              <thead>
                <tr style="text-align: center; font-weight: 900;">
                  <th style="border: 1px solid #000000; padding: 4px; width: 28%;">உறுப்பினர்கள் வகை</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 22%;">தொகை</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 25%;">வங்கி கிளையில்<br/>இருசால் தேதி</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 25%;">வங்கி கிளையில்<br/>இருசால் தொகை</th>
                </tr>
              </thead>
              <tbody style="font-weight: 600;">
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">புதிய உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcNew > 0 ? calcNew.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">SC/ST உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcScst > 0 ? calcScst.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">இதர உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcOthers > 0 ? calcOthers.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">SF/MF உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcSfmf > 0 ? calcSfmf.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">OF உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcOf > 0 ? calcOf.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 3px 6px;">பெண் உறுப்பினர்கள்</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${calcFemale > 0 ? calcFemale.toLocaleString('en-IN') : ''}</td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;"></td>
                  <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;"></td>
                </tr>
              </tbody>
            </table>

            <!-- 3. Section Title Banner -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 6px;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #000000; padding: 4px; text-align: center; font-size: 13px; font-weight: 900; text-transform: uppercase;">
                    பயிர் வாரியான KCC1 பயிர்க்கடன் விபரம்
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 4. Cropwise Statement Table (10 Columns) -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 12px; margin-bottom: 20px;">
              <thead>
                <tr style="text-align: center; font-weight: 900;">
                  <th style="border: 1px solid #000000; padding: 4px; width: 6%;">வ.எண்</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 16%;">பயிர்</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 9%;">எண்ணிக்கை</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 9%;">நிலபரப்பு<br/>ஏ.செ</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 9%;">விதை பகுதி</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 10%;">இரசாயன<br/>உரம் 50%</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 8%;">தொழு<br/>உரம்</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 9%;">பூச்சி மருந்து</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 11%;">ரொக்கம்</th>
                  <th style="border: 1px solid #000000; padding: 4px; width: 13%;">மொத்தம்</th>
                </tr>
              </thead>
              <tbody style="font-weight: 600;">
                ${cropRows.map((r, idx) => `
                  <tr>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center; font-weight: bold;">${r.crop || ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${r.count || ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${r.acres > 0 ? r.acres.toFixed(2) : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.seed > 0 ? r.seed.toLocaleString('en-IN') : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.chem > 0 ? r.chem.toLocaleString('en-IN') : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.comp > 0 ? r.comp.toLocaleString('en-IN') : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.pest > 0 ? r.pest.toLocaleString('en-IN') : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.cash > 0 ? r.cash.toLocaleString('en-IN') : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${r.totalLoan > 0 ? r.totalLoan.toLocaleString('en-IN') : ''}</td>
                  </tr>
                `).join('')}
                <tr style="font-weight: 900; border-top: 2px solid #000000;">
                  <td colspan="2" style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">மொத்தம்</td>
                  <td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">${totCount > 0 ? totCount : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">${totAcres > 0 ? totAcres.toFixed(2) : '0.00'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totSeed > 0 ? totSeed.toLocaleString('en-IN') : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totChem > 0 ? totChem.toLocaleString('en-IN') : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totComp > 0 ? totComp.toLocaleString('en-IN') : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totPest > 0 ? totPest.toLocaleString('en-IN') : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totCash > 0 ? totCash.toLocaleString('en-IN') : '0'}</td>
                  <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${totLoan > 0 ? totLoan.toLocaleString('en-IN') : '0'}</td>
                </tr>
              </tbody>
            </table>

            <!-- 5. Signatures Section - Pure text without any boxes or borders -->
            <div style="margin-top: 80px; margin-bottom: 20px; width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 900; text-align: center;">
              <div style="width: 30%; text-align: center;">செயலாளர்</div>
              <div style="width: 40%; text-align: center;">தலைவர் / செயலாட்சியர்</div>
              <div style="width: 30%; text-align: center;">சரக மேற்பார்வையாளர்</div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // SPECIAL HANDLING FOR 4. INSURANCE (காப்பீடு விபத்துக் காப்பீடு)
    if (formTitle.includes('காப்பீடு') || formTitle.includes('Insurance')) {
      // 1. Group & deduplicate strictly by "அ எண்" (aClass / aNo / memberNo)
      // 2. Filter ONLY members who have insurance > 0
      const memberMap = new Map<string, {
        item: typeof printItems[0];
        totalIns: number;
      }>();

      printItems.forEach(i => {
        const insVal = parseFloat(String(i.insurance || '0').replace(/[^0-9.]/g, '')) || 0;
        if (insVal <= 0) return; // ONLY members who have insurance subscription

        const aKey = (i.aClass || i.aNo || i.memberNo || '').toString().trim();
        const dedupeKey = aKey && aKey !== '-' ? aKey : ((i.name || '').toString().trim() || String(i.id || Math.random()));

        if (memberMap.has(dedupeKey)) {
          const existing = memberMap.get(dedupeKey)!;
          existing.totalIns += insVal;
          if (!existing.item.careOf && i.careOf) existing.item.careOf = i.careOf;
          if (!existing.item.rationCard && i.rationCard) existing.item.rationCard = i.rationCard;
          if (!existing.item.namini && i.namini) existing.item.namini = i.namini;
          if (!existing.item.relation && i.relation) existing.item.relation = i.relation;
          if (!existing.item.sb && i.sb) existing.item.sb = i.sb;
          if (!existing.item.erp && i.erp) existing.item.erp = i.erp;
        } else {
          memberMap.set(dedupeKey, {
            item: { ...i },
            totalIns: insVal
          });
        }
      });

      const insPrintItems = Array.from(memberMap.values()).filter(m => m.totalIns > 0);

      if (insPrintItems.length === 0) {
        alert('பகுதி 8ல் காப்பீடு பிடித்தம் உள்ள (Insurance > 0) உறுப்பினர்கள் யாரும் பட்டியலில் இல்லை.');
        return;
      }

      const totalInsSubscription = insPrintItems.reduce((sum, m) => sum + m.totalIns, 0);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ta">
          <head>
            <meta charset="utf-8" />
            <title>காசுகடன் KCC - உறுப்பினர்கள் விபத்துக் காப்பீடு விவரம்</title>
            <style>
              @media print {
                @page {
                  size: legal landscape;
                  margin: 5mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 12px;
                font-size: 11px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1.5px solid #000000 !important;
                padding: 4px 4px;
                color: #000000 !important;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #f5f5f4; padding: 10px 14px; border-radius: 8px; border: 1px solid #d6d3d1;">
              <span style="font-size: 13px; font-weight: bold;">📄 4. காப்பீடு (Insurance விபத்துக் காப்பீடு) - அச்சு சாளரம் (Legal Landscape)</span>
              <button onclick="window.print()" style="background: #007A4D; color: white; font-weight: bold; font-size: 12px; padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer;">
                🖨️ அச்சிடு (Print Legal Landscape)
              </button>
            </div>

            <!-- 1. Two-Column Sender & Receiver Header (அனுப்புநர் & பெறுநர்) matching PDF -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: -1px; font-size: 13px;">
              <tbody>
                <tr>
                  <td style="width: 50%; border: 1.5px solid #000000; padding: 8px 12px; vertical-align: top;">
                    <div style="display: inline-block; border: 1.5px solid #000000; padding: 2px 8px; font-weight: 900; margin-bottom: 8px; font-size: 13px; color: #000000;">
                      அனுப்புநர்
                    </div>
                    <div style="font-weight: bold; line-height: 1.45; color: #000000; font-size: 13px;">
                      <div>செயலாளர்</div>
                      <div>TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்</div>
                      <div>தேவாரம்</div>
                    </div>
                  </td>
                  <td style="width: 50%; border: 1.5px solid #000000; padding: 8px 12px; vertical-align: top;">
                    <div style="display: inline-block; border: 1.5px solid #000000; padding: 2px 8px; font-weight: 900; margin-bottom: 8px; font-size: 13px; color: #000000;">
                      பெறுநர்
                    </div>
                    <div style="font-weight: bold; line-height: 1.45; color: #000000; font-size: 13px;">
                      <div>கிளை மேலாளர் அவர்கள்</div>
                      <div>மதுரை மாவட்ட மத்திய</div>
                      <div>கூட்டுறவு வங்கி,</div>
                      <div>தேவாரம் கிளை</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 2. RCL No, Date & Title Banner matching PDF -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: -1px; font-size: 13.5px;">
              <tbody>
                <tr style="border-bottom: 1.5px solid #000000;">
                  <td style="padding: 5px 12px; font-weight: 900; text-align: center;">
                    <span>மத்திய வங்கி RCL No: ${rclNumber || '107/25-26/P1'}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span>நாள்:${formatDateDDMMYYYY(rclDate) || '15.04.2026'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-weight: 900; text-align: center; font-size: 14.5px; letter-spacing: 0.3px;">
                    காசுகடன் KCC -  உறுப்பினர்கள் விபத்துக் காப்பீடு விவரம்
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 3. Insurance Details 13-Column Table matching PDF exactly -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 11.5px; margin-bottom: 0;">
              <thead>
                <tr style="text-align: center; font-weight: 900; background-color: #ffffff;">
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 2px; width: 4.5%;">வ எண்</th>
                  <th colspan="5" style="border: 1.5px solid #000000; padding: 6px 2px;">உறுப்பினர் விபரம்</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 14%;">தகப்பனார் /<br/>கணவர் பெயர்</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 8.5%;">கிராமம்</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 11%;">குடும்ப<br/>அட்டை<br/>எண்</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 8.5%;">உடலில்<br/>உள்ள<br/>குறைபாடு</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 11%;">நாமினியின்<br/>பெயர்</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 2px; width: 6%;">உறவு</th>
                  <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; width: 7.5%;">சந்தாத்<br/>தொகை</th>
                </tr>
                <tr style="text-align: center; font-weight: 900; background-color: #ffffff;">
                  <th style="border: 1.5px solid #000000; padding: 4px 2px; width: 5.5%;">அ எண்</th>
                  <th style="border: 1.5px solid #000000; padding: 4px 2px; width: 6.5%;">SB எண்</th>
                  <th style="border: 1.5px solid #000000; padding: 4px 2px; width: 6%;">ERP</th>
                  <th style="border: 1.5px solid #000000; padding: 4px 2px; width: 5%;">Initial</th>
                  <th style="border: 1.5px solid #000000; padding: 4px 4px; width: 11%;">பெயர்</th>
                </tr>
              </thead>
              <tbody style="font-weight: 600; font-size: 11.5px;">
                ${insPrintItems.map(({ item: r, totalIns: insAmt }, idx) => {
                  const memberAClass = r.aClass || r.aNo || r.memberNo || '';
                  const fatherOrHusband = r.careOf || r.fatherOrHusbandName || '';
                  const memberVillage = r.village || 'தேவாரம்';
                  const rationCardNo = r.rationCard || (r as any).ration || '';
                  const disabilityInfo = r.disability || 'இல்லை';
                  const nomineeName = r.namini || (r as any).nominee || '';
                  const relationship = r.relation || (r as any).relationship || '';
                  const { initial: initials, name: cleanMemberName } = parseInitialAndName(r);

                  return `
                    <tr>
                      <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${idx + 1}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${memberAClass}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center;">${r.sb || ''}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${r.erp || ''}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${initials}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left; font-weight: bold;">${cleanMemberName}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left;">${fatherOrHusband}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${memberVillage}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center; font-family: monospace; font-size: 11px;">${rationCardNo}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${disabilityInfo}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left;">${nomineeName}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${relationship}</td>
                      <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; font-weight: bold;">${insAmt.toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
                <!-- Bottom Grand Total Row matching PDF -->
                <tr style="font-weight: 900; border-top: 2px solid #000000;">
                  <td colspan="12" style="border: 1.5px solid #000000; padding: 6px 10px; text-align: right;"></td>
                  <td style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; font-weight: 900; font-size: 13px;">
                    ${totalInsSubscription > 0 ? totalInsSubscription.toLocaleString('en-IN') : '0'}
                  </td>
                </tr>
              </tbody>
            </table>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // SPECIAL HANDLING FOR 9. 7% வட்டி ஒப்புதல் (7% Agreement)
    if (formTitle.includes('7%') || formTitle.includes('வட்டி ஒப்புதல்') || formTitle.includes('7% Agreement')) {
      const distinctMembersMap = new Map<string, typeof printItems[0]>();
      printItems.forEach(item => {
        const aKey = (item.aClass || (item as any).aNo || (item as any).memberNo || item.name || '').toString().trim();
        if (aKey && !distinctMembersMap.has(aKey)) {
          distinctMembersMap.set(aKey, item);
        }
      });
      const distinctMembersCount = distinctMembersMap.size || printItems.length;
      const totalLoanSum = printItems.reduce((acc, item) => acc + getItemLoanAmount(item), 0);

      const effectiveResNo = resolutionNo || printItems.find(i => i.resolutionNo)?.resolutionNo || '1';
      const rawResDate = resolutionDate || printItems.find(i => i.resolutionDate)?.resolutionDate || '27.05.2026';
      const formattedResDate = formatDateDDMMYYYY(rawResDate) || rawResDate;

      const rawRclNo = rclNumber || printItems.find(i => i.rclNumber)?.rclNumber || '107/25-26/P1';
      const effectiveRclFormatted = rawRclNo.toUpperCase().startsWith('RCL') ? rawRclNo : `RCL-${rawRclNo}`;
      const rawRclDate = rclDate || printItems.find(i => i.rclDate)?.rclDate || '15.04.2026';
      const formattedRclDate = formatDateDDMMYYYY(rawRclDate) || rawRclDate;
      const disbNumber = activeDisbNo || currentDisbNo || '1';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ta">
          <head>
            <meta charset="utf-8" />
            <title>7% வட்டி ஒப்புதல் - சுய உறுதிமொழி சான்று - KCC ${disbNumber}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm 16mm 12mm 16mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
                .page-container {
                  page-break-inside: avoid;
                  break-inside: avoid;
                  height: 100%;
                }
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 24px 30px;
                font-size: 13.5px;
                line-height: 1.5;
              }
              .header-box {
                border: 1.5px solid #1c1917;
                border-radius: 10px;
                padding: 8px 14px;
                text-align: center;
                margin: 0 auto 20px auto;
                max-width: 620px;
              }
              .header-title {
                font-size: 15px;
                font-weight: bold;
                color: #1c1917;
                margin-bottom: 3px;
              }
              .header-sub {
                font-size: 13px;
                font-weight: bold;
                color: #1c1917;
                margin-bottom: 2px;
              }
              .red-text {
                color: #dc2626;
                font-weight: bold;
              }
              .bold-text {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #f5f5f4; padding: 10px 16px; border-radius: 8px; border: 1px solid #d6d3d1;">
              <span style="font-size: 13px; font-weight: bold; color: #1c1917;">📄 சுய உறுதிமொழி சான்று (7% Interest Agreement) - A4 அச்சு சாளரம் (Single Page)</span>
              <button onclick="window.print()" style="background: #007A4D; color: white; font-weight: bold; font-size: 12px; padding: 7px 20px; border-radius: 6px; border: none; cursor: pointer;">
                🖨️ அச்சிடு (Print)
              </button>
            </div>

            <div class="page-container">
              <!-- Header Box with Rounded Corners -->
              <div class="header-box">
                <div class="header-title">TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்</div>
                <div class="header-sub">தேவாரம் - 625530</div>
                <div class="header-sub">உத்தமபாளையம் தாலுகா தேனி மாவட்டம்.</div>
              </div>

              <!-- Recipient Section -->
              <div style="margin-bottom: 16px; font-size: 13.5px; line-height: 1.45;">
                <div style="font-weight: bold; margin-bottom: 4px;">பெறுநர்</div>
                <div style="margin-left: 48px; font-weight: bold;">
                  <div>உயர்திரு கிளை மேலாளர் அவர்கள்</div>
                  <div>மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கி லிட்</div>
                  <div>தேவாரம் கிளை.</div>
                </div>
              </div>

              <!-- Salutation and Subject -->
              <div style="margin-bottom: 18px; font-size: 13.5px;">
                <div style="font-weight: bold; margin-bottom: 6px;">ஐயா</div>
                <div style="display: flex; align-items: flex-start;">
                  <div style="font-weight: bold; min-width: 55px;">பொருள்:</div>
                  <div style="font-weight: bold; line-height: 1.5; margin-left: 16px;">
                    <div>TU3 தேவாரம் PACCS மத்திய கூட்டுறவு வங்கியில்</div>
                    <div>KCC-I, KCC-II மற்றும் KCC-AH ஆகிய</div>
                    <div>காசுக்கடன் பெறுவதற்கு சுய உறுதிமொழி சான்று</div>
                    <div>வழங்குதல் - தொடர்பாக.</div>
                  </div>
                </div>
              </div>

              <!-- Centered Underlined Title -->
              <div style="text-align: center; margin: 18px 0 16px 0;">
                <span style="font-size: 14.5px; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; letter-spacing: 0.5px;">
                  சுய உறுதிமொழி சான்று
                </span>
              </div>

              <!-- Main Body Paragraph -->
              <div style="text-align: justify; line-height: 1.85; font-size: 13.5px; margin-bottom: 36px;">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கியிலிருந்து எங்களது TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கத்திற்கு <span class="bold-text">${effectiveRclFormatted}</span> <span class="bold-text">Dt:${formattedRclDate}</span>ன்படி அனுமதிக்கப்பட்டுள்ள <span class="bold-text">KCC-I / KCC-II மற்றும் KCC-AH</span> காசுக்கடன் நிதியுதவி / கடனுதவியிலிருந்து ………………..ம் நிதியாண்டிற்கு பெற்று எங்களது சங்க தீர்மானம் எண் : <span class="red-text">${effectiveResNo}</span> நாள் : <span class="red-text">${formattedResDate}</span> ந் தேதி இயற்றப்பட்டுள்ள தீர்மானத்தின்படி <span class="bold-text">KCC-${disbNumber}</span> காசுக்கடன் பட்டுவாடாவிற்கு <span class="red-text">${distinctMembersCount}</span> விவசாய உறுப்பினர்களுக்கு கடன் தொகையாக <span class="red-text">ரூ:${totalLoanSum}/-</span> மட்டும் வழங்கப்படுவதற்கு அதே உறுப்பினர்கள் பிற வங்கிகளில் விவசாயக்கடன் பெற்றுள்ளதாக பின்னேடு அறியவரும் நிலையில் அதனால் 7% வட்டிமானியம் கிடைப்பதில் ஏதேனும் இடர்பாடு ஏற்பட்டு அரசிடமிருந்து மானியமாக வரவேண்டிய வட்டித் தொகை மீளப்பெறாத சூழ்நிலையில் அந்நிதியிழப்பினை மத்திய வங்கிக்கு திரும்பச் செலுத்தி நேர் செய்யும் பொருட்டு எங்களது சங்கத்தின் சேமிப்பு கணக்கு / நடப்பு கணக்கிலிருந்து பற்றெழுதி நேர்செய்து கொள்ள சம்மதம் தெரிவித்துக் கொள்கிறோம்.
              </div>

              <!-- Footer / Signatures Section -->
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; font-size: 13.5px; font-weight: bold; page-break-inside: avoid;">
                <div style="line-height: 2.1;">
                  <div>இடம் : தேவாரம்</div>
                  <div>நாள் : </div>
                </div>
                <div style="text-align: right; padding-right: 15px;">
                  <div>செயலாளர்</div>
                </div>
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // SPECIAL HANDLING FOR 10. தீர்மானம் (Resolution)
    if (formTitle.includes('தீர்மானம்') || formTitle.includes('Resolution')) {
      const distinctMembersMap = new Map<string, typeof printItems[0]>();
      printItems.forEach(item => {
        const aKey = (item.aClass || (item as any).aNo || (item as any).memberNo || item.name || '').toString().trim();
        if (aKey && !distinctMembersMap.has(aKey)) {
          distinctMembersMap.set(aKey, item);
        }
      });
      const distinctMembersCount = distinctMembersMap.size || printItems.length;
      const totalLoanSum = printItems.reduce((acc, item) => acc + getItemLoanAmount(item), 0);
      const totalAcresSum = printItems.reduce((acc, item) => acc + (parseFloat(item.acres) || 0), 0);
      const totalLoanWords = numberToTamilWords(totalLoanSum);

      const effectiveResNo = resolutionNo || printItems.find(i => i.resolutionNo)?.resolutionNo || '1';
      const rawResDate = resolutionDate || printItems.find(i => i.resolutionDate)?.resolutionDate || '27.05.2026';
      
      let resDay = '27';
      let resMonth = 'மே';
      let resYear = '2026';
      const tamilMonths = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
      if (rawResDate) {
        const parts = rawResDate.split(/[-./]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            resYear = parts[0];
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) resMonth = tamilMonths[mIdx];
            resDay = parseInt(parts[2], 10).toString();
          } else {
            resDay = parseInt(parts[0], 10).toString();
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) resMonth = tamilMonths[mIdx];
            resYear = parts[2];
          }
        }
      }
      const meetingDateTamilLine = `${resYear} ம் ஆண்டு ${resMonth} மாதம் ${resDay}ந் தேதி TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கத்தின் நிர்வாகக்குழு கூட்ட நடவடிக்கைகள்.`;
      
      const finYearNum = parseInt(resYear, 10) || 2026;
      const effectiveFinancialYear = financialYear || printItems.find(i => i.financialYear)?.financialYear || `${finYearNum}-${finYearNum + 1}`;

      const effectiveOfficerDesignation = officerDesignation || printItems.find(i => i.officerDesignation)?.officerDesignation || 'செயலாட்சியர்';
      const effectiveOfficerName = officerName || printItems.find(i => i.officerName)?.officerName || 'திரு.அ.சீனிவாசப்பெருமாள், கூட்டுறவு சார்பதிவாளர் / செயலாட்சியர்';

      const rawRclNo = rclNumber || printItems.find(i => i.rclNumber)?.rclNumber || '107/25-26/P3';
      const effectiveRclFormatted = rawRclNo.replace(/^RCL[\s-]*/i, '');
      const rawRclDate = rclDate || printItems.find(i => i.rclDate)?.rclDate || '15-04-2026';
      const formattedRclDate = formatDateDDMMYYYY(rawRclDate) ? formatDateDDMMYYYY(rawRclDate).replace(/\./g, '-') : rawRclDate;
      const sanctionedLimitFormatted = (sanctionedAmount || printItems[0]?.creditLimit || '30000000').toString().replace(/[^0-9]/g, '') || '30000000';

      const parseInitialAndName = (item: any) => {
        let ins = (item.ins || (item as any).initial || '').toString().trim();
        let nameStr = (item.name || '').toString().trim();

        if (ins && ins !== '-') {
          const regex = new RegExp(`^${ins}[.\\s]+`, 'i');
          nameStr = nameStr.replace(regex, '').trim();
          return { initial: ins, name: nameStr };
        }

        const match = nameStr.match(/^([A-Za-z\u0B80-\u0BFF]{1,3})[.\s]+(.+)$/);
        if (match) {
          return { initial: match[1], name: match[2].trim() };
        }

        return { initial: '', name: nameStr };
      };

      const tableRowsHtml = printItems.map((item, idx) => {
        const loanAmt = getItemLoanAmount(item);
        const { initial, name } = parseInitialAndName(item);
        const acresVal = parseFloat(item.acres || '0') || 0;
        const acresDisplay = acresVal > 0 ? (Number.isInteger(acresVal) ? acresVal.toString() : acresVal.toString()) : (item.acres || '-');
        const loanDetailText = item.loanDetail || item.natureOfLoan || 'நபர் விபரம்';

        return `
          <tr style="text-align: center; height: 32px; font-size: 11.5px;">
            <td style="border: 1.5px solid black; padding: 4px 2px; font-weight: bold;">${idx + 1}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; font-weight: bold; font-family: monospace;">${item.aClass || item.memberNo}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; font-family: monospace;">${item.sb || '-'}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; font-weight: bold; font-family: monospace;">${item.erp || '-'}</td>
            <td style="border: 1.5px solid black; padding: 4px 3px; font-weight: bold; width: 26px;">${initial}</td>
            <td style="border: 1.5px solid black; padding: 4px 6px; text-align: left; font-weight: bold; white-space: nowrap;">${name}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; font-family: monospace;">${item.surveyNo || '-'}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; text-align: center;">${acresDisplay}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px;">${item.crop || '-'}</td>
            <td style="border: 1.5px solid black; padding: 4px 6px; text-align: center; font-weight: bold;">${loanAmt}</td>
            <td style="border: 1.5px solid black; padding: 4px 4px; font-size: 11px;">${loanDetailText}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ta">
          <head>
            <meta charset="utf-8" />
            <title>10. தீர்மானம் (Resolution) - KCC ${activeDisbNo || '1'}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              @media print {
                @page {
                  size: legal portrait;
                  margin: 14mm 16mm 14mm 16mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
                .page-container {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 24px 30px;
                font-size: 12.5px;
                line-height: 1.55;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1.5px solid #000000 !important;
                padding: 5px 6px;
                color: #000000 !important;
              }
              .header-box {
                border: 1.5px solid #000000;
                border-radius: 8px;
                padding: 6px 24px;
                text-align: center;
                display: inline-block;
                font-size: 15.5px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #f5f5f4; padding: 10px 16px; border-radius: 8px; border: 1px solid #d6d3d1;">
              <span style="font-size: 13px; font-weight: bold; color: #1c1917;">📄 10. தீர்மானம் (Resolution) - அச்சு சாளரம் (Legal Portrait)</span>
              <button onclick="window.print()" style="background: #007A4D; color: white; font-weight: bold; font-size: 12px; padding: 7px 20px; border-radius: 6px; border: none; cursor: pointer;">
                🖨️ அச்சிடு (Print)
              </button>
            </div>

            <div class="page-container">
              <!-- Top Handshake Logo -->
              <div style="display: flex; justify-content: center; margin-bottom: 4px;">
                <svg width="52" height="24" viewBox="0 0 64 28" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 14l6-6a4 4 0 0 1 5.66 0l2.34 2.34a4 4 0 0 0 5.66 0L40 8"/>
                  <path d="M10 10l8 8a3 3 0 0 0 4.24 0l3.76-3.76"/>
                  <path d="M26 20l4 4a3 3 0 0 0 4.24 0l18-18"/>
                  <path d="M4 12l8-8a4 4 0 0 1 5.66 0L22 8"/>
                  <path d="M44 18l6-6a3 3 0 0 0 0-4.24L46 4"/>
                </svg>
              </div>

              <!-- Rounded Society Header Box -->
              <div style="text-align: center; margin-bottom: 8px;">
                <div class="header-box">
                  T.U.3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்
                </div>
              </div>

              <!-- Meeting Date Line -->
              <div style="text-align: center; font-size: 13.5px; font-weight: bold; color: #000000; line-height: 1.45; margin-bottom: 4px;">
                ${meetingDateTamilLine}
              </div>

              <!-- Issuing Authority Line -->
              <div style="text-align: center; font-size: 13px; font-weight: bold; color: #000000; margin-bottom: 12px;">
                பிறப்பிப்பவர்: ${effectiveOfficerName} அவர்கள்
              </div>

              <!-- Two-Column Resolution Box (விசயம் & தீர்மானம்) -->
              <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 12px; font-size: 11px; line-height: 1.52;">
                <thead>
                  <tr>
                    <th style="width: 50%; border: 1.5px solid #000000; padding: 4px 6px; text-align: center; font-size: 12px; font-weight: 900; background-color: #ffffff;">
                      விசயம் - ${effectiveResNo}
                    </th>
                    <th style="width: 50%; border: 1.5px solid #000000; padding: 4px 6px; text-align: center; font-size: 12px; font-weight: 900; background-color: #ffffff;">
                      தீர்மானம் - ${effectiveResNo}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1.5px solid #000000; padding: 6px 8px; text-align: justify; vertical-align: top;">
                      &nbsp;&nbsp;&nbsp;&nbsp;நமது சங்கத்தின் ${effectiveFinancialYear}ம் ஆண்டிற்கு கடன் கோரும் கீழ்கண்ட உறுப்பினர்களுக்கு KCC1 விவசாய வெண்ணிலை ஜாமீன் கடன் பத்திரம் மூலம் முன் கடன் திருப்பி செலுத்திய……<strong>${distinctMembersCount}</strong>…….நபருக்கும் வெண்ணிலை ஜாமீன் கடன் பத்திரம் மூலம் புதிய நபர் ……..……….. தொடர்ச்சி அடமான கடன் பத்திரம் மூலம் முன் கடன் திருப்பி செலுத்திய…………நபர்களுக்கும் தொடர்ச்சி அடமான கடன் பத்திரம் மூலம் புதிய உறுப்பினர்-------ஆகமொத்தம்……<strong>${distinctMembersCount}</strong>….. உறுப்பினர்களுக்கும் மதுரை மாவட்டமத்திய கூட்டுறவு வங்கியின் தலைமையகம் மூலம் அனுமதி உத்தரவு RCL <strong>${effectiveRclFormatted}</strong> Dt.<strong>${formattedRclDate}</strong> இருந்து விவசாய பயிர்களுக்கு நடப்பு ஆண்டிற்கு அனுமதித்த தொகை ரூ.<strong>${sanctionedLimitFormatted}</strong>/- கீழ்க்கண்ட விபரப்படி ரூ.<strong>${totalLoanSum}</strong>/-க்கு (ரூபாய் <strong>${totalLoanWords}</strong> மட்டும்) பட்டுவாடா வழங்குமாறு மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கி தேவாரம் கிளை மேலாளரை கேட்டுக் கொள்ளும் விசயம்.
                    </td>
                    <td style="border: 1.5px solid #000000; padding: 6px 8px; text-align: justify; vertical-align: top;">
                      &nbsp;&nbsp;&nbsp;&nbsp;அவ்வாறே நமது சங்கத்தின் ${effectiveFinancialYear}ம் ஆண்டிற்கு கடன் கோரும் கீழ்கண்ட உறுப்பினர்களுக்கு KCC1 விவசாய வெண்ணிலை ஜாமீன் கடன் பத்திரம் மூலம் முன் கடன் திருப்பி செலுத்திய……<strong>${distinctMembersCount}</strong>…….நபருக்கும் வெண்ணிலை ஜாமீன் கடன் பத்திரம் மூலம் புதிய நபர் ……..……….. தொடர்ச்சி அடமான கடன் பத்திரம் மூலம் முன் கடன் திருப்பி செலுத்திய…………நபர்களுக்கும் தொடர்ச்சி அடமான கடன் பத்திரம் மூலம் புதிய உறுப்பினர்-------ஆகமொத்தம்……<strong>${distinctMembersCount}</strong>….. உறுப்பினர்களுக்கும் மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கியின் தலைமையகம் மூலம் அனுமதி உத்தரவு RCL <strong>${effectiveRclFormatted}</strong> Dt.<strong>${formattedRclDate}</strong> இருந்து விவசாய பயிர்களுக்கு நடப்பு ஆண்டிற்கு அனுமதித்த தொகை ரூ.<strong>${sanctionedLimitFormatted}</strong>/- கீழ்க்கண்ட விபரப்படி ரூ.<strong>${totalLoanSum}</strong>/-க்கு (ரூபாய் <strong>${totalLoanWords}</strong> மட்டும்) பட்டுவாடா வழங்குமாறு மதுரை மாவட்ட மத்திய கூட்டுறவு வங்கி தேவாரம் கிளை மேலாளரை கேட்டுக் கொள்ள தீர்மானிக்கலாயிற்று.
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Beneficiaries Table (கீழ்கண்ட விபரப்படி அட்டவணை) -->
              <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 11px; margin-bottom: 12px;">
                <thead>
                  <tr style="background-color: #ffffff; text-align: center; font-weight: 900;">
                    <th style="width: 32px; border: 1.5px solid #000000; padding: 4px 2px;">வ.எண்</th>
                    <th style="width: 48px; border: 1.5px solid #000000; padding: 4px 2px;">அ.எண்</th>
                    <th style="width: 42px; border: 1.5px solid #000000; padding: 4px 2px;">S.B</th>
                    <th style="width: 55px; border: 1.5px solid #000000; padding: 4px 2px;">ERP</th>
                    <th style="width: 32px; border: 1.5px solid #000000; padding: 4px 2px;">Initial</th>
                    <th style="border: 1.5px solid #000000; padding: 4px 6px;">பெயர்</th>
                    <th style="width: 75px; border: 1.5px solid #000000; padding: 4px 2px;">சர்வே எண்</th>
                    <th style="width: 48px; border: 1.5px solid #000000; padding: 4px 2px;">பரப்பு</th>
                    <th style="width: 58px; border: 1.5px solid #000000; padding: 4px 2px;">பயிர்</th>
                    <th style="width: 75px; border: 1.5px solid #000000; padding: 4px 4px;">கடன் தொகை</th>
                    <th style="width: 75px; border: 1.5px solid #000000; padding: 4px 4px;">கடன் விபரம்</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                  <!-- Totals Row matching PDF -->
                  <tr style="font-weight: 900; text-align: center; height: 32px;">
                    <td colspan="7" style="border: 1.5px solid #000000; border-right: none;"></td>
                    <td style="border: 1.5px solid #000000; border-left: none; padding: 4px 2px; font-weight: 900; font-size: 11.5px;">
                      ${totalAcresSum.toFixed(2)}
                    </td>
                    <td style="border: 1.5px solid #000000;"></td>
                    <td style="border: 1.5px solid #000000; padding: 4px 4px; font-weight: 900; font-size: 11.5px;">
                      ${totalLoanSum}
                    </td>
                    <td style="border: 1.5px solid #000000;"></td>
                  </tr>
                </tbody>
              </table>

              <!-- Bottom Official Signature (Only President / Executive Officer) -->
              <div style="margin-top: 45px; display: flex; justify-content: flex-end; align-items: flex-end; padding: 0 40px; font-size: 13px; font-weight: bold; page-break-inside: avoid;">
                <div style="text-align: center; min-width: 200px;">
                  <div style="height: 40px;"></div>
                  <div style="border-top: 2px solid black; padding-top: 4px;">தலைவர் / செயலாட்சியர்</div>
                </div>
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
    const isJabitha = formTitle.includes('ஜாபிதா') || formTitle.includes('Jabitha');
    const isAgreement = formTitle.includes('ஒப்பந்தம்') || formTitle.includes('Signature Page');
    const isKcc2 = (formTitle.includes('KCC-2') || formTitle.includes('KCC 2')) && !isAgreement;

    const totalPrevLoan = printItems.reduce((acc, item) => {
      const prevAmt = parseFloat(String(item.prevLoanAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      return acc + prevAmt;
    }, 0);
    const totalSeed = printItems.reduce((acc, item) => acc + (parseFloat(String((item as any).seed || (item as any).seedAmount || '0').replace(/[^0-9.]/g, '')) || 0), 0);
    const totalChem = printItems.reduce((acc, item) => acc + (parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0), 0);
    const totalComp = printItems.reduce((acc, item) => acc + (parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0), 0);
    const totalPest = printItems.reduce((acc, item) => acc + (parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0), 0);
    const totalCash = printItems.reduce((acc, item) => acc + (parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0), 0);
    const totalAcres = printItems.reduce((acc, item) => acc + (parseFloat(item.acres) || 0), 0);
    const totalLoan = printItems.reduce((acc, item) => acc + getItemLoanAmount(item), 0);

    let totalKcc6 = 0;
    let totalBook = 0;
    let totalIns = 0;
    let totalShare = 0;
    let totalDed = 0;
    let totalNet = 0;

    const seenPrintBookMembers = new Set<string>();
    const itemsRowsHtml = printItems.map((item, idx) => {
      const loanAmt = getItemLoanAmount(item);
      const prevAmt = parseFloat(String(item.prevLoanAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      const seedAmt = parseFloat(String((item as any).seed || (item as any).seedAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      const chemAmt = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
      const compAmt = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
      const pestAmt = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
      const cashAmt = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;
      const { initial, name: cleanName } = parseInitialAndName(item);

      if (isKcc2 || isAgreement) {
        const kcc6Num = item.kcc6 !== undefined && item.kcc6 !== ''
          ? (parseFloat(String(item.kcc6).replace(/[^0-9.]/g, '')) || 0)
          : chemAmt;
        
        const aClassKey = String(item.aClass || item.aNo || item.memberNo || item.name || '').trim().toLowerCase();
        let bookChargeNum = 0;
        if (item.passbookFee !== undefined && item.passbookFee !== null && String(item.passbookFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.passbookFee).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.bookCharge !== undefined && item.bookCharge !== null && String(item.bookCharge).trim() !== '') {
          bookChargeNum = parseFloat(String(item.bookCharge).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.shareFee !== undefined && item.shareFee !== null && String(item.shareFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.shareFee).replace(/[^0-9.]/g, '')) || 0;
        } else {
          if (aClassKey && !seenPrintBookMembers.has(aClassKey)) {
            bookChargeNum = 300;
          } else {
            bookChargeNum = 0;
          }
        }
        if (aClassKey) {
          seenPrintBookMembers.add(aClassKey);
        }

        const insuranceNum = parseFloat(String(item.insurance !== undefined ? item.insurance : (item.insuranceFee || 0)).replace(/[^0-9.]/g, '')) || 0;
        const shareCapitalNum = parseFloat(String(item.shareCapital !== undefined ? item.shareCapital : 0).replace(/[^0-9.]/g, '')) || 0;
        const totalDeductionNum = kcc6Num + bookChargeNum + insuranceNum + shareCapitalNum;
        const netDisbursementNum = loanAmt - totalDeductionNum;
        const mdccAccountNo = item.mdcc || item.mdccAccount || item.mdccAccountNo || item.kccAccountNo || item.sb || '-';

        totalKcc6 += kcc6Num;
        totalBook += bookChargeNum;
        totalIns += insuranceNum;
        totalShare += shareCapitalNum;
        totalDed += totalDeductionNum;
        totalNet += netDisbursementNum;

        if (isAgreement) {
          return `
            <tr style="text-align: center; border-bottom: 1px solid black; font-size: 10px; height: 44px;">
              <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${idx + 1}</td>
              <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${item.aClass || item.memberNo}</td>
              <td style="border: 1px solid black; padding: 3px;">${item.sb || '-'}</td>
              <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${item.erp || '-'}</td>
              <td style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: center;">${initial}</td>
              <td style="border: 1px solid black; padding: 3px 6px; font-weight: bold; white-space: nowrap; text-align: left;">${cleanName}</td>
              <td style="border: 1px solid black; padding: 3px;">${item.surveyNo || '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${formatAcres(item.acres)}</td>
              <td style="border: 1px solid black; padding: 3px;">${item.crop || '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${seedAmt ? seedAmt.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${chemAmt ? chemAmt.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${compAmt ? compAmt.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${pestAmt ? pestAmt.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${cashAmt ? cashAmt.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${loanAmt.toLocaleString('en-IN')}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${kcc6Num ? kcc6Num.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${bookChargeNum ? bookChargeNum.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: center;">${insuranceNum ? insuranceNum.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right;">${shareCapitalNum ? shareCapitalNum.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${totalDeductionNum ? totalDeductionNum.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: 900;">${netDisbursementNum ? netDisbursementNum.toLocaleString('en-IN') : '-'}</td>
              <td style="border: 1px solid black; padding: 3px 8px; min-width: 170px; width: 200px;"></td>
            </tr>
          `;
        }

        return `
          <tr style="text-align: center; border-bottom: 1px solid black; font-size: 10px;">
            <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${idx + 1}</td>
            <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${item.aClass || item.memberNo}</td>
            <td style="border: 1px solid black; padding: 3px;">${item.sb || '-'}</td>
            <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${item.erp || '-'}</td>
            <td style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: center;">${initial}</td>
            <td style="border: 1px solid black; padding: 3px; font-weight: bold; white-space: nowrap;">${cleanName}</td>
            <td style="border: 1px solid black; padding: 3px;">${item.surveyNo || '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${formatAcres(item.acres)}</td>
            <td style="border: 1px solid black; padding: 3px;">${item.crop || '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${seedAmt ? seedAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${chemAmt ? chemAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${compAmt ? compAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${pestAmt ? pestAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${cashAmt ? cashAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${loanAmt.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${kcc6Num ? kcc6Num.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${bookChargeNum ? bookChargeNum.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: center;">${insuranceNum ? insuranceNum.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right;">${shareCapitalNum ? shareCapitalNum.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">${totalDeductionNum ? totalDeductionNum.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: 900;">${netDisbursementNum ? netDisbursementNum.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 3px; font-weight: bold;">${mdccAccountNo}</td>
          </tr>
        `;
      }

      if (isJabitha) {
        return `
          <tr style="text-align: center; border-bottom: 1px solid black; font-size: 11px; height: 42px;">
            <td style="border: 1px solid black; padding: 4px 2px; font-weight: bold;">${idx + 1}</td>
            <td style="border: 1px solid black; padding: 4px 2px; font-weight: bold;">${item.aClass || item.memberNo}</td>
            <td style="border: 1px solid black; padding: 4px 2px;">${item.sb || '-'}</td>
            <td style="border: 1px solid black; padding: 4px 2px; font-weight: bold;">${item.erp || '-'}</td>
            <td style="border: 1px solid black; padding: 4px 2px; font-weight: bold; text-align: center;">${initial}</td>
            <td style="border: 1px solid black; padding: 4px 12px; font-weight: bold; text-align: left; white-space: nowrap; font-size: 11.5px;">${cleanName}</td>
            <td style="border: 1px solid black; padding: 4px 2px;">${item.surveyNo || '-'}</td>
            <td style="border: 1px solid black; padding: 4px 2px; text-align: right; font-weight: bold;">${formatAcres(item.acres)}</td>
            <td style="border: 1px solid black; padding: 4px 2px;">${item.crop || '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right;">${seedAmt ? seedAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right;">${chemAmt ? chemAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right;">${compAmt ? compAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right;">${pestAmt ? pestAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right;">${cashAmt ? cashAmt.toLocaleString('en-IN') : '-'}</td>
            <td style="border: 1px solid black; padding: 4px 3px; text-align: right; font-weight: bold;">${loanAmt.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid black; padding: 4px 12px; min-width: 240px; width: 280px;"></td>
          </tr>
        `;
      }

      return `
        <tr style="text-align: center; border-bottom: 1px solid black; font-size: 11px;">
          <td style="border: 1px solid black; padding: 4px; font-weight: bold;">${idx + 1}</td>
          <td style="border: 1px solid black; padding: 4px; font-weight: bold;">${item.aClass || item.memberNo}</td>
          <td style="border: 1px solid black; padding: 4px;">${item.sb || '-'}</td>
          <td style="border: 1px solid black; padding: 4px; font-weight: bold;">${item.erp || '-'}</td>
          <td style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: center;">${initial}</td>
          <td style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: center;">${cleanName}</td>
          <td style="border: 1px solid black; padding: 4px;">${item.prevLoanNo || '-'}</td>
          <td style="border: 1px solid black; padding: 4px;">${formatDateDDMMYYYY(item.prevLoanDate)}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${prevAmt ? prevAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px;">${item.surveyNo || '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">${formatAcres(item.acres)}</td>
          <td style="border: 1px solid black; padding: 4px;">${item.crop || '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${seedAmt ? seedAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${chemAmt ? chemAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${compAmt ? compAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${pestAmt ? pestAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right;">${cashAmt ? cashAmt.toLocaleString('en-IN') : '-'}</td>
          <td style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">${loanAmt.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    const pageHeading = isJabitha ? 'KCC 1 ல் பயிர்க்கடன் ஜாபிதா விபரம்' : 'KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்';

    const bannerLabel = 'KCC 1ல் தற்போது பட்டுவாடா கோரும் தொகை';

    let tableHeaderHtml = '';
    if (isAgreement) {
      tableHeaderHtml = `
      <thead>
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold; font-size: 10px; height: 36px;">
          <th style="width: 25px; border: 1px solid black;">வ.எண்</th>
          <th style="width: 40px; border: 1px solid black;">அ.எண்</th>
          <th style="width: 35px; border: 1px solid black;">SB</th>
          <th style="width: 50px; border: 1px solid black;">ERP</th>
          <th style="width: 32px; border: 1px solid black;">Initial</th>
          <th style="min-width: 90px; border: 1px solid black;">பெயர்</th>
          <th style="width: 50px; border: 1px solid black;">சர்வே எண்</th>
          <th style="width: 40px; border: 1px solid black;">பரப்பு</th>
          <th style="width: 45px; border: 1px solid black;">பயிர்</th>
          <th style="width: 40px; border: 1px solid black;">விதை பகுதி</th>
          <th style="width: 50px; border: 1px solid black;">ரசாயன உரம்</th>
          <th style="width: 50px; border: 1px solid black;">தொழு உரம்</th>
          <th style="width: 50px; border: 1px solid black;">பூச்சி மருந்து</th>
          <th style="width: 55px; border: 1px solid black;">ரொக்கம்</th>
          <th style="width: 55px; border: 1px solid black;">மொத்தம்</th>
          <th style="width: 50px; border: 1px solid black;">CC6</th>
          <th style="width: 45px; border: 1px solid black;">புத்தக பாரம்</th>
          <th style="width: 35px; border: 1px solid black;">காப்பீடு</th>
          <th style="width: 45px; border: 1px solid black;">பங்கு தொகை</th>
          <th style="width: 55px; border: 1px solid black;">மொத்த பிடித்தம்</th>
          <th style="width: 60px; border: 1px solid black;">நிகர பட்டுவாடா</th>
          <th style="min-width: 170px; width: 200px; border: 1px solid black;">கையொப்பம்</th>
        </tr>
      </thead>
    `;
    } else if (isKcc2) {
      tableHeaderHtml = `
      <thead>
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold; font-size: 10px;">
          <th style="width: 25px;">வ.எண்</th>
          <th style="width: 40px;">அ.எண்</th>
          <th style="width: 35px;">SB</th>
          <th style="width: 50px;">ERP</th>
          <th style="width: 32px;">Initial</th>
          <th style="min-width: 80px;">பெயர்</th>
          <th style="width: 50px;">சர்வே எண்</th>
          <th style="width: 40px;">பரப்பு</th>
          <th style="width: 45px;">பயிர்</th>
          <th style="width: 40px;">விதை பகுதி</th>
          <th style="width: 50px;">ரசாயன உரம்</th>
          <th style="width: 50px;">தொழு உரம்</th>
          <th style="width: 50px;">பூச்சி மருந்து</th>
          <th style="width: 55px;">ரொக்கம்</th>
          <th style="width: 55px;">மொத்தம்</th>
          <th style="width: 50px;">CC6</th>
          <th style="width: 45px;">புத்தக பாரம்</th>
          <th style="width: 35px;">காப்பீடு</th>
          <th style="width: 45px;">பங்கு தொகை</th>
          <th style="width: 55px;">மொத்த பிடித்தம்</th>
          <th style="width: 60px;">நிகர பட்டுவாடா</th>
          <th style="min-width: 80px;">MDCC கணக்கு எண்</th>
        </tr>
      </thead>
    `;
    } else if (isJabitha) {
      tableHeaderHtml = `
      <thead>
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold; font-size: 11px; height: 36px;">
          <th style="width: 28px; border: 1px solid black; padding: 4px 2px;">வ.எண்</th>
          <th style="width: 44px; border: 1px solid black; padding: 4px 2px;">அ.எண்</th>
          <th style="width: 38px; border: 1px solid black; padding: 4px 2px;">SB</th>
          <th style="width: 48px; border: 1px solid black; padding: 4px 2px;">ERP</th>
          <th style="width: 32px; border: 1px solid black; padding: 4px 2px;">Initial</th>
          <th style="min-width: 140px; border: 1px solid black; padding: 4px 12px; text-align: left;">பெயர்</th>
          <th style="width: 52px; border: 1px solid black; padding: 4px 2px;">சர்வே எண்</th>
          <th style="width: 48px; border: 1px solid black; padding: 4px 2px;">பரப்பு ஏ.செ</th>
          <th style="width: 48px; border: 1px solid black; padding: 4px 2px;">பயிர்</th>
          <th style="width: 38px; border: 1px solid black; padding: 4px 2px;">விதை பகுதி</th>
          <th style="width: 60px; border: 1px solid black; padding: 4px 2px;">இரசாயன உரம் 50%</th>
          <th style="width: 60px; border: 1px solid black; padding: 4px 2px;">தொழு உரம் 50%</th>
          <th style="width: 58px; border: 1px solid black; padding: 4px 2px;">பூச்சி மருந்து</th>
          <th style="width: 64px; border: 1px solid black; padding: 4px 2px;">ரொக்கம்</th>
          <th style="width: 70px; border: 1px solid black; padding: 4px 2px;">மொத்தம்</th>
          <th style="min-width: 240px; width: 280px; border: 1px solid black; padding: 4px 12px;">கையொப்பம்</th>
        </tr>
      </thead>
    `;
    } else {
      tableHeaderHtml = `
      <thead>
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold; font-size: 11px;">
          <th rowspan="2" style="width: 32px;">வ.எண்</th>
          <th rowspan="2" style="width: 48px;">அ.எண்</th>
          <th rowspan="2" style="width: 40px;">SB</th>
          <th rowspan="2" style="width: 55px;">ERP</th>
          <th rowspan="2" style="width: 35px;">Initial</th>
          <th rowspan="2">பெயர்</th>
          <th colspan="3">முன்கடன் திருப்பி செலுத்திய விபரம்</th>
          <th rowspan="2" style="width: 60px;">சர்வே எண்</th>
          <th rowspan="2" style="width: 50px;">பரப்பு ஏ.செ</th>
          <th rowspan="2" style="width: 50px;">பயிர்</th>
          <th rowspan="2" style="width: 45px;">விதை பகுதி</th>
          <th rowspan="2" style="width: 65px;">இரசாயன உரம் 50%</th>
          <th rowspan="2" style="width: 65px;">தொழு உரம் 50%</th>
          <th rowspan="2" style="width: 65px;">பூச்சி மருந்து</th>
          <th rowspan="2" style="width: 70px;">ரொக்கம்</th>
          <th rowspan="2" style="width: 75px;">மொத்தம்</th>
        </tr>
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold; font-size: 11px;">
          <th>முன்கடன் எண்</th>
          <th>முன்கடன் தேதி</th>
          <th>முன்கடன் தொகை</th>
        </tr>
      </thead>
    `;
    }

    let totalsRowHtml = '';
    if (isAgreement) {
      totalsRowHtml = `
      <tr style="font-weight: 900; background: #f5f5f5; text-align: center; font-size: 10px; height: 32px;">
        <td colspan="7" style="text-align: right; padding: 4px; border: 1px solid black;">மொத்தம் (${printItems.length} நபர்கள்)</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalAcres.toFixed(2)}</td>
        <td style="border: 1px solid black;"></td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalSeed ? totalSeed.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalChem ? totalChem.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalComp ? totalComp.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalPest ? totalPest.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalCash ? totalCash.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalLoan.toLocaleString('en-IN')}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalKcc6 ? totalKcc6.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalBook ? totalBook.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: center; padding: 4px; border: 1px solid black;">${totalIns ? totalIns.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalShare ? totalShare.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; border: 1px solid black;">${totalDed ? totalDed.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; font-weight: 900; border: 1px solid black;">${totalNet ? totalNet.toLocaleString('en-IN') : '0'}</td>
        <td style="border: 1px solid black; min-width: 170px; width: 200px;"></td>
      </tr>
    `;
    } else if (isKcc2) {
      totalsRowHtml = `
      <tr style="font-weight: 900; background: #f5f5f5; text-align: center; font-size: 10px;">
        <td colspan="7" style="text-align: right; padding: 4px;">மொத்தம் (${printItems.length} நபர்கள்)</td>
        <td style="text-align: right; padding: 4px;">${totalAcres.toFixed(2)}</td>
        <td></td>
        <td style="text-align: right; padding: 4px;">${totalSeed ? totalSeed.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 4px;">${totalChem ? totalChem.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalComp ? totalComp.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalPest ? totalPest.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalCash ? totalCash.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalLoan.toLocaleString('en-IN')}</td>
        <td style="text-align: right; padding: 4px;">${totalKcc6 ? totalKcc6.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalBook ? totalBook.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: center; padding: 4px;">${totalIns ? totalIns.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 4px;">${totalShare ? totalShare.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px;">${totalDed ? totalDed.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 4px; font-weight: 900;">${totalNet ? totalNet.toLocaleString('en-IN') : '0'}</td>
        <td></td>
      </tr>
    `;
    } else if (isJabitha) {
      totalsRowHtml = `
      <tr style="font-weight: 900; background: #f5f5f5; text-align: center; font-size: 11px; height: 36px;">
        <td colspan="7" style="text-align: right; padding: 6px 12px; border: 1px solid black;">மொத்தம்</td>
        <td style="text-align: right; padding: 6px 2px; border: 1px solid black;">${totalAcres.toFixed(2)}</td>
        <td style="border: 1px solid black;"></td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalSeed ? totalSeed.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalChem ? totalChem.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalComp ? totalComp.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalPest ? totalPest.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalCash ? totalCash.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px 3px; border: 1px solid black;">${totalLoan.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid black; min-width: 240px; width: 280px;"></td>
      </tr>
    `;
    } else {
      totalsRowHtml = `
      <tr style="font-weight: 900; background: #f5f5f5; text-align: center; font-size: 11px;">
        <td colspan="8" style="text-align: right; padding: 6px;">மொத்தம்</td>
        <td style="text-align: right; padding: 6px;">${totalPrevLoan ? totalPrevLoan.toLocaleString('en-IN') : '0'}</td>
        <td></td>
        <td style="text-align: right; padding: 6px;">${totalAcres.toFixed(2)}</td>
        <td></td>
        <td style="text-align: right; padding: 6px;">${totalSeed ? totalSeed.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align: right; padding: 6px;">${totalChem ? totalChem.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px;">${totalComp ? totalComp.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px;">${totalPest ? totalPest.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px;">${totalCash ? totalCash.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align: right; padding: 6px;">${totalLoan.toLocaleString('en-IN')}</td>
      </tr>
    `;
    }

    const bannerBoxHtml = (isJabitha || isAgreement) ? '' : `
          <!-- Loan Total Banner -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
            <table style="border-collapse: collapse; border: 1px solid black; font-weight: bold; font-size: 11px; margin-left: auto;">
              <tr>
                <td style="text-align: right; background: #f5f5f5; padding: 5px 12px; border: 1px solid black;">
                  ${bannerLabel}
                </td>
                <td style="text-align: right; font-size: 13px; font-weight: 900; padding: 5px 12px; border: 1px solid black; white-space: nowrap;">
                  ₹ ${totalLoan.toLocaleString('en-IN')}.00
                </td>
              </tr>
            </table>
          </div>
    `;

    const signaturesHtml = isJabitha ? `
          <!-- Signatures: Secretary, President / Executive Officer, and Circle Supervisor evenly justified across the page -->
          <div style="margin-top: 40px; color: black; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: center; font-size: 11.5px; font-weight: bold; padding: 0 40px;">
              <div>
                <div style="height: 40px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px; min-width: 160px;">செயலாளர்</div>
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px; min-width: 180px;">தலைவர் / செயலாட்சியர்</div>
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px; min-width: 170px;">சரக மேற்பார்வையாளர்</div>
              </div>
            </div>
          </div>
    ` : `
          <!-- Signatures: Secretary and President / Executive Officer with proper balanced spacing -->
          <div style="margin-top: 28px; color: black; page-break-inside: avoid;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 160px; text-align: center; font-size: 11px; font-weight: bold; margin-top: 24px;">
              <div>
                <div style="height: 36px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px; min-width: 140px;">செயலாளர்</div>
              </div>
              <div>
                <div style="height: 36px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px; min-width: 180px;">தலைவர் / செயலாட்சியர்</div>
              </div>
            </div>
          </div>
    `;

    const pageSizeCss = 'size: legal landscape; margin: 5mm;';
    const printButtonLabel = '🖨️ அச்சிடு (Print Legal Landscape)';
    const bannerWindowLabel = `📄 ${formTitle} - அச்சு சாளரம் (Legal Sheet Landscape)`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ta">
        <head>
          <meta charset="utf-8" />
          <title>${formTitle} - பயிர்க்கடன் பட்டுவாடா அறிக்கை</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page {
                ${pageSizeCss}
              }
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none !important; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 12px; color: black; background: white; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th, td { border: 1px solid black; padding: 3px 4px; }
          </style>
        </head>
        <body>
          <div class="no-print mb-4 flex items-center justify-between bg-stone-100 p-3.5 rounded-xl border border-stone-300">
            <span class="text-xs font-bold text-stone-800">${bannerWindowLabel}</span>
            <button onclick="window.print()" class="bg-[#007A4D] text-white font-black text-xs px-5 py-2 rounded-lg cursor-pointer">
              ${printButtonLabel}
            </button>
          </div>

          <!-- Exact Document Header matching Reference Form -->
          <div style="text-align: center; margin-bottom: 12px; color: black;">
            <h1 style="font-size: 17px; font-weight: 900; margin: 0; text-transform: uppercase;">
              T.U.3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் லிட், தேவாரம்
            </h1>
            <h2 style="font-size: 13px; font-weight: bold; margin: 3px 0;">
              உத்தமபாளையம் தாலுகா, தேனி மாவட்டம் - 625530
            </h2>
            <div style="margin-top: 6px;">
              <span style="border: 2px solid black; padding: 3px 18px; font-size: 14px; font-weight: 900; display: inline-block;">
                ${pageHeading}
              </span>
            </div>
            <div style="font-size: 12px; font-weight: bold; margin-top: 6px;">
              மத்திய வங்கி RCL No: ${rclNumber || '107/25-26/P1'} &nbsp;&nbsp;&nbsp;&nbsp; நாள்:${formatDateDDMMYYYY(rclDate) || '15.04.2026'}
            </div>
          </div>

          <!-- Metadata Table -->
          <table style="width: 100%; margin-bottom: 8px; text-align: center; font-weight: bold; font-size: 11px;">
            <tr>
              <td style="background: #f5f5f5; width: 12%;">தீர்மான எண்</td>
              <td style="width: 8%; font-family: monospace;">1</td>
              <td style="background: #f5f5f5; width: 12%;">தீர்மான தேதி</td>
              <td style="width: 18%; font-family: monospace;">20-05-2026</td>
              <td style="background: #f5f5f5; width: 12%;">பட்டுவாடா எண்</td>
              <td style="width: 8%; font-family: monospace;">${filterDisbNo || currentDisbNo || '1'}</td>
              <td style="background: #f5f5f5; width: 12%;">பட்டுவாடா தேதி</td>
              <td style="width: 18%; font-family: monospace;"></td>
            </tr>
          </table>

          ${bannerBoxHtml}

          <!-- Main Table with Multi-level Headers matching reference -->
          <table>
            ${tableHeaderHtml}
            <tbody>
              ${itemsRowsHtml}
              ${totalsRowHtml}
            </tbody>
          </table>

          ${signaturesHtml}

          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleExportExcel = (formTitle: string) => {
    const exportItems = displayItems;
    if (!exportItems || exportItems.length === 0) {
      alert(`நடப்பு பட்டுவாடா பட்டியல் பகுதியில் பட்டுவாடா தரவுகள் எதுவும் இல்லை. '${formTitle}' பதிவிறக்கம் செய்ய தரவுகள் இருக்க வேண்டும்.`);
      return;
    }

    if (formTitle.includes('Cropwise') || formTitle.includes('பயிர் வாரியாக')) {
      const cropMap = new Map<string, { count: number; acres: number; seed: number; chem: number; comp: number; pest: number; cash: number; totalLoan: number }>();
      exportItems.forEach(item => {
        const cropName = (item.crop || '').trim();
        if (!cropName || cropName === '-') return;
        const chemAmt = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
        const compAmt = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
        const pestAmt = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
        const cashAmt = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;
        const seedAmt = parseFloat(String((item as any).seed || '0').replace(/[^0-9.]/g, '')) || 0;
        const loanAmt = getItemLoanAmount(item);
        const acresVal = parseFloat(item.acres || '0') || 0;

        const existing = cropMap.get(cropName) || { count: 0, acres: 0, seed: 0, chem: 0, comp: 0, pest: 0, cash: 0, totalLoan: 0 };
        existing.count += 1;
        existing.acres += acresVal;
        existing.seed += seedAmt;
        existing.chem += chemAmt;
        existing.comp += compAmt;
        existing.pest += pestAmt;
        existing.cash += cashAmt;
        existing.totalLoan += loanAmt;
        cropMap.set(cropName, existing);
      });

      const headers = ['வ.எண்', 'பயிர்', 'எண்ணிக்கை', 'நிலபரப்பு ஏ.செ', 'விதை பகுதி', 'இரசாயன உரம் 50%', 'தொழு உரம்', 'பூச்சி மருந்து', 'ரொக்கம்', 'மொத்தம்'];
      let idx = 1;
      const rows: any[] = [];
      cropMap.forEach((v, k) => {
        rows.push([idx++, `"${k}"`, v.count, v.acres.toFixed(2), v.seed, v.chem, v.comp, v.pest, v.cash, v.totalLoan]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `KCC1_Cropwise_Statement.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (formTitle.includes('காப்பீடு') || formTitle.includes('Insurance')) {
      const memberMap = new Map<string, {
        item: typeof exportItems[0];
        totalIns: number;
      }>();

      exportItems.forEach(item => {
        const insVal = parseFloat(String(item.insurance || '0').replace(/[^0-9.]/g, '')) || 0;
        if (insVal <= 0) return; // ONLY members who have insurance subscription

        const aKey = (item.aClass || item.aNo || item.memberNo || '').toString().trim();
        const dedupeKey = aKey && aKey !== '-' ? aKey : ((item.name || '').toString().trim() || String(item.id || Math.random()));

        if (memberMap.has(dedupeKey)) {
          const existing = memberMap.get(dedupeKey)!;
          existing.totalIns += insVal;
          if (!existing.item.careOf && item.careOf) existing.item.careOf = item.careOf;
          if (!existing.item.rationCard && item.rationCard) existing.item.rationCard = item.rationCard;
          if (!existing.item.namini && item.namini) existing.item.namini = item.namini;
          if (!existing.item.relation && item.relation) existing.item.relation = item.relation;
          if (!existing.item.sb && item.sb) existing.item.sb = item.sb;
          if (!existing.item.erp && item.erp) existing.item.erp = item.erp;
        } else {
          memberMap.set(dedupeKey, {
            item: { ...item },
            totalIns: insVal
          });
        }
      });

      const targetItems = Array.from(memberMap.values()).filter(m => m.totalIns > 0);

      if (targetItems.length === 0) {
        alert('பகுதி 8ல் காப்பீடு பிடித்தம் உள்ள (Insurance > 0) உறுப்பினர்கள் யாரும் பட்டியலில் இல்லை.');
        return;
      }

      const headers = [
        'வ எண்', 'அ எண்', 'SB எண்', 'ERP', 'Ins', 'பெயர்',
        'தகப்பனார் / கணவர் பெயர்', 'கிராமம்', 'குடும்ப அட்டை எண்',
        'உடலில் உள்ள குறைபாடு', 'நாமினியின் பெயர்', 'உறவு', 'சந்தாத் தொகை'
      ];
      let tot = 0;
      const rows = targetItems.map(({ item, totalIns }, index) => {
        tot += totalIns;
        return [
          index + 1,
          `"${item.aClass || item.aNo || item.memberNo || ''}"`,
          `"${item.sb || ''}"`,
          `"${item.erp || ''}"`,
          `"${item.ins || '-'}"`,
          `"${item.name || ''}"`,
          `"${item.careOf || item.fatherOrHusbandName || ''}"`,
          `"${item.village || 'தேவாரம்'}"`,
          `"${item.rationCard || (item as any).ration || ''}"`,
          `"${item.disability || 'இல்லை'}"`,
          `"${item.namini || (item as any).nominee || ''}"`,
          `"${item.relation || (item as any).relationship || ''}"`,
          totalIns
        ];
      });
      rows.push(['மொத்தம்', '', '', '', '', '', '', '', '', '', '', '', tot]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `KCC_Insurance_Report_${filterDisbNo || currentDisbNo || '1'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (formTitle.includes('KCC-2') || formTitle.includes('KCC 2') || formTitle.includes('ஒப்பந்தம்') || formTitle.includes('Signature Page')) {
      const isAgreement = formTitle.includes('ஒப்பந்தம்') || formTitle.includes('Signature Page');
      const headers = [
        'வ.எண்', 'அ.எண்', 'SB', 'ERP', 'பெயர்', 'சர்வே எண்', 'பரப்பு', 'பயிர்',
        'விதை பகுதி', 'ரசாயன உரம்', 'தொழு உரம்', 'பூச்சி மருந்து', 'ரொக்கம்', 'மொத்தம்',
        'CC6', 'புத்தக பாரம்', 'காப்பீடு', 'பங்கு தொகை', 'மொத்த பிடித்தம்', 'நிகர பட்டுவாடா',
        isAgreement ? 'கையொப்பம்' : 'MDCC கணக்கு எண்'
      ];
      const seenExportBookMembers = new Set<string>();
      const rows = exportItems.map((item, index) => {
        const loanAmt = getItemLoanAmount(item);
        const seedAmt = parseFloat(String((item as any).seed || (item as any).seedAmount || '0').replace(/[^0-9.]/g, '')) || 0;
        const chemAmt = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
        const compAmt = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
        const pestAmt = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
        const cashAmt = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;
        const kcc6Num = item.kcc6 !== undefined && item.kcc6 !== ''
          ? (parseFloat(String(item.kcc6).replace(/[^0-9.]/g, '')) || 0)
          : chemAmt;
        
        const aClassKey = String(item.aClass || item.memberNo || item.name || '').trim().toLowerCase();
        let bookChargeNum = 0;
        if (item.passbookFee !== undefined && item.passbookFee !== null && String(item.passbookFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.passbookFee).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.bookCharge !== undefined && item.bookCharge !== null && String(item.bookCharge).trim() !== '') {
          bookChargeNum = parseFloat(String(item.bookCharge).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.shareFee !== undefined && item.shareFee !== null && String(item.shareFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.shareFee).replace(/[^0-9.]/g, '')) || 0;
        } else {
          if (aClassKey && !seenExportBookMembers.has(aClassKey)) {
            bookChargeNum = 300;
          } else {
            bookChargeNum = 0;
          }
        }
        if (aClassKey) {
          seenExportBookMembers.add(aClassKey);
        }

        const insuranceNum = parseFloat(String(item.insurance !== undefined ? item.insurance : (item.insuranceFee || 0)).replace(/[^0-9.]/g, '')) || 0;
        const shareCapitalNum = parseFloat(String(item.shareCapital !== undefined ? item.shareCapital : 0).replace(/[^0-9.]/g, '')) || 0;
        const totalDeductionNum = kcc6Num + bookChargeNum + insuranceNum + shareCapitalNum;
        const netDisbursementNum = loanAmt - totalDeductionNum;
        const mdccAccountNo = item.mdcc || item.mdccAccount || item.mdccAccountNo || item.kccAccountNo || item.sb || '-';

        return [
          index + 1,
          `"${item.aClass || item.memberNo}"`,
          `"${item.sb || '-'}"`,
          `"${item.erp || '-'}"`,
          `"${item.name}"`,
          item.surveyNo || '-',
          formatAcres(item.acres),
          `"${item.crop}"`,
          seedAmt,
          chemAmt,
          compAmt,
          pestAmt,
          cashAmt,
          loanAmt,
          kcc6Num,
          bookChargeNum,
          insuranceNum,
          shareCapitalNum,
          totalDeductionNum,
          netDisbursementNum,
          isAgreement ? '""' : `"${mdccAccountNo}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${formTitle.replace(/[^a-zA-Z0-9-]/g, '_')}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (formTitle.includes('ஜாபிதா') || formTitle.includes('Jabitha')) {
      const headers = [
        'வ.எண்', 'அ.எண்', 'SB', 'ERP', 'பெயர்', 'சர்வே எண்', 'பரப்பு ஏ.செ', 'பயிர்',
        'விதை பகுதி', 'இரசாயன உரம் 50%', 'தொழு உரம் 50%', 'பூச்சி மருந்து', 'ரொக்கம்', 'மொத்தம்', 'கையொப்பம்'
      ];
      const rows = exportItems.map((item, index) => {
        const loanAmt = getItemLoanAmount(item);
        const seedAmt = parseFloat(String((item as any).seed || (item as any).seedAmount || '0').replace(/[^0-9.]/g, '')) || 0;
        const chemAmt = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
        const compAmt = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
        const pestAmt = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
        const cashAmt = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;

        return [
          index + 1,
          `"${item.aClass || item.memberNo || ''}"`,
          `"${item.sb || '-'}"`,
          `"${item.erp || '-'}"`,
          `"${item.name || ''}"`,
          `"${item.surveyNo || '-'}"`,
          formatAcres(item.acres),
          `"${item.crop || '-'}"`,
          seedAmt,
          chemAmt,
          compAmt,
          pestAmt,
          cashAmt,
          loanAmt,
          '""'
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `5_Jabitha_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['வ.எண்', 'A Class', 'SB கணக்கு', 'ERP கணக்கு', 'பெயர்', 'கிராமம்', 'பயிர்', 'பரப்பு', 'கடன் தொகை'];
    const rows = exportItems.map((item, index) => [
      index + 1,
      item.aClass,
      item.sb || '-',
      item.erp || '-',
      `"${item.name}"`,
      `"${item.village}"`,
      `"${item.crop}"`,
      formatAcres(item.acres),
      item.totalLoanAmount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${formTitle.replace(/[^a-zA-Z0-9-]/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto calculate Farmer Class based on Extent (acres): 0 - 2.50 => MF, 2.50 - 5.00 => SF, > 5.00 => OF
  useEffect(() => {
    const val = parseFloat(acres);
    if (!isNaN(val)) {
      if (val >= 0 && val <= 2.50) {
        setFarmerClass('MF');
      } else if (val > 2.50 && val <= 5.00) {
        setFarmerClass('SF');
      } else if (val > 5.00) {
        setFarmerClass('OF');
      }
    }
  }, [acres]);

  // Auto fill Caste and Land Acres when a member is selected
  useEffect(() => {
    if (selectedMember) {
      if (selectedMember.caste && selectedMember.caste.trim() !== '') {
        setCategory(selectedMember.caste);
      } else {
        setCategory('-');
      }

      if (selectedMember.landAcres !== undefined && selectedMember.landAcres !== null && !editingItem) {
        setAcres(Number(selectedMember.landAcres).toFixed(2));
      }
    } else {
      setCategory('-');
    }
  }, [selectedMember]);

  // Calculate Section 6 Total
  const totalLoanAmount = 
    (Number(String(seed || '0').replace(/,/g, '')) || 0) +
    (Number(String(chemicalFertilizer || '0').replace(/,/g, '')) || 0) +
    (Number(String(compost || '0').replace(/,/g, '')) || 0) +
    (Number(String(pesticide || '0').replace(/,/g, '')) || 0) +
    (Number(String(cash || '0').replace(/,/g, '')) || 0);

  // Handler for extent / acres (allows decimals up to 2 places)
  const handleAcresChange = (val: string) => {
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAcres(val);
    }
  };

  const handleAcresBlur = () => {
    if (acres && !isNaN(Number(acres)) && acres !== '') {
      setAcres(parseFloat(acres).toFixed(2));
    }
  };

  // Search Member Handler
  const handleShowMemberDetails = () => {
    if (!searchAClassInput.trim()) {
      alert('தயவுசெய்து A Class எண் அல்லது உறுப்பினர் எண்ணை உள்ளிடவும்!');
      return;
    }
    const q = searchAClassInput.trim().toLowerCase();
    const found = members.find((m) => 
      (m.aClass || '').toLowerCase() === q ||
      (m.memberNo || '').toLowerCase() === q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.sb || '').toLowerCase() === q ||
      (m.erp || '').toLowerCase() === q
    );
    if (found) {
      setSelectedMember(found);
    } else {
      alert('குறிப்பிட்ட A Class / உறுப்பினர் எண் காணப்படவில்லை!');
    }
  };

  // Handle Member Status Change (பழைய உறுப்பினர் / புதிய உறுப்பினர்)
  const handleMemberStatusChange = (status: string) => {
    setMemberStatus(status);
    if (status === 'புதிய உறுப்பினர்') {
      setPrevLoanNo('புதிய உறுப்பினர்');
      setPrevLoanDate('-');
      setPrevLoanAmount('0');
    } else {
      if (prevLoanNo === 'புதிய உறுப்பினர்') {
        setPrevLoanNo('KCC -');
      }
      if (prevLoanDate === '-') {
        setPrevLoanDate('');
      }
    }
  };

  // Handle Edit Member - populates form and smoothly scrolls to form
  const handleEditItem = (item: any) => {
    setEditingItem(item);

    const isNewMember = item.memberStatus === 'புதிய உறுப்பினர்' || item.prevLoanNo === 'புதிய உறுப்பினர்';
    setMemberStatus(isNewMember ? 'புதிய உறுப்பினர்' : 'பழைய உறுப்பினர்');

    const foundMember = members.find(m => 
      (m.aClass || '').toString().toLowerCase() === (item.aClass || '').toString().toLowerCase() ||
      (m.memberNo || '').toString().toLowerCase() === (item.aClass || '').toString().toLowerCase()
    );

    const targetMember: LoanMember = foundMember || {
      memberNo: String(item.aClass || '1024'),
      aClass: String(item.aClass || '1024'),
      name: String(item.name || ''),
      careOf: String(item.careOf || '-'),
      sb: String(item.sb || '-'),
      erp: String(item.erp || '-'),
      ins: String(item.ins || '-'),
      door: String(item.door || ''),
      street: String(item.street || ''),
      village: String(item.village || '-'),
      adhar: String(item.aadharNo || ''),
      mobile: String(item.mobile || ''),
      rationCard: String(item.rationCard || ''),
      namini: String(item.namini || ''),
      relation: String(item.relation || ''),
      mdcc: String(item.mdcc || ''),
      caste: String(item.caste || '-'),
      gender: 'ஆண் உறுப்பினர்',
      totalShare: 0
    };

    setSelectedMember(targetMember);
    setSearchAClassInput(String(item.aClass || ''));

    setFinancialYear(String(item.financialYear || '2026-2027'));
    setRclNumber(String(item.rclNumber || '107/25-26/P1'));
    setRclDate(String(item.rclDate || '15-04-2026'));
    setSanctionedAmount(String(item.sanctionedAmount || '3,00,000'));
    setOfficerDesignation(String(item.officerDesignation || 'செயலாட்சியர்'));
    setOfficerName(String(item.officerName || 'திரு.அ.சீனிவாசப்பெருமாள், கூட்டுறவு சார்பதிவாளர் / செயலாட்சியர்'));
    setCurrentDisbNo(String(item.currentDisbNo || '2'));
    setResolutionNo(String(item.resolutionNo || '1'));
    setResolutionDate(String(item.resolutionDate || '04-08-2026'));

    setSurveyNo(String(item.surveyNo || '0'));
    setAcres(String(item.acres || '0'));

    const itemCrop = String(item.crop || '');
    if (['தென்னை', 'வாழை', 'மரவள்ளி', 'மல்பெரி', 'மா', 'கொய்யா', 'ஏலம்', 'கரும்பு', 'நெல்'].includes(itemCrop)) {
      setCrop(itemCrop);
      setCustomCrop('');
    } else {
      setCrop('Others');
      setCustomCrop(itemCrop);
    }

    setSeed(String(item.seed ?? '0'));
    setChemicalFertilizer(String(item.chemicalFertilizer ?? item.fertilizer ?? '0'));
    setCompost(String(item.fertilizerKind ?? item.compost ?? '0'));
    setPesticide(String(item.pesticide ?? '0'));
    setCash(String(item.organicFertilizer ?? item.cash ?? '0'));

    setCategory(String(item.caste || item.category || '-'));
    setFarmerClass(String(item.farmerClass || 'MF'));
    setDisability(String(item.disability || '0'));
    setMortgageType(String(item.mortgageType || 'வெற்றிநிலை ஜாமீன் மூலம்'));
    setGuaranteeType(String(item.guaranteeType || 'நபர் ஜாமீன்'));

    setPassbookFee(String(item.passbookFee ?? '0'));
    setInsurance(String(item.insurance ?? '0'));
    setShareCapital(String(item.shareCapital ?? '0'));

    setPrevLoanNo(String(item.prevLoanNo || 'KCC -'));
    setPrevLoanDate(String(item.prevLoanDate || ''));
    setPrevLoanAmount(String(item.prevLoanAmount ?? '0'));

    setSuccessMsg(`திருத்துவதற்காக ${item.name} (${item.aClass}) விபரங்கள் படிவத்தில் ஏற்றப்பட்டுள்ளன. தேவையான மாற்றங்களைச் செய்து "மாற்றங்களைச் சேமி" அழுத்தவும்.`);

    // Smooth scroll directly to the form container
    setTimeout(() => {
      const formEl = document.getElementById('kcc-disbursement-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    resetFormFields();
  };

  // Add or Update Handler (Saves to React state & Google Sheets tab 'KCC All Paduvada Members')
  const handleAddToList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert('தயவுசெய்து A Class எண்ணை உள்ளிட்டு விபரங்களைக் காட்டிய பின் சேர்க்கவும்!');
      return;
    }

    const effectiveCrop = crop === 'Others' ? (customCrop.trim() || 'Others') : crop;

    const newItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      rowIndex: editingItem?.rowIndex,
      aClass: selectedMember.aClass || selectedMember.memberNo,
      name: selectedMember.name,
      sb: selectedMember.sb || '-',
      erp: selectedMember.erp || '-',
      careOf: selectedMember.careOf || selectedMember.fatherOrHusbandName || '-',
      village: selectedMember.village || '-',
      financialYear,
      rclNumber,
      rclDate,
      sanctionedAmount,
      officerDesignation,
      officerName,
      currentDisbNo,
      resolutionNo,
      resolutionDate,
      surveyNo,
      acres,
      crop: effectiveCrop,
      seed,
      chemicalFertilizer,
      fertilizer: chemicalFertilizer,
      fertilizerKind: compost,
      compost,
      pesticide,
      organicFertilizer: cash,
      cash,
      totalLoanAmount,
      passbookFee,
      insurance,
      shareCapital,
      farmerClass,
      disability,
      mortgageType,
      guaranteeType,
      prevLoanNo,
      prevLoanDate,
      prevLoanAmount,
      addedAt: new Date().toLocaleTimeString('ta-IN')
    };

    if (editingItem) {
      setAddedItems((prev) =>
        prev.map((item) => {
          const isMatch =
            (item.id && editingItem.id && item.id === editingItem.id) ||
            (item.rowIndex && editingItem.rowIndex && item.rowIndex === editingItem.rowIndex) ||
            (String(item.aClass || '').trim().toLowerCase() === String(editingItem.aClass || '').trim().toLowerCase() &&
             String(item.crop || '').trim().toLowerCase() === String(editingItem.crop || '').trim().toLowerCase());
          return isMatch ? { ...item, ...newItem } : item;
        })
      );
    } else {
      setAddedItems((prev) => [newItem, ...prev]);
    }

    // Construct full Paduvada data object covering Section 1 to Section 9
    const paduvadaData = {
      // Section 1: Batch Details
      financialYear,
      rclNumber,
      rclDate,
      sanctionedAmount,
      officerDesignation,
      officerName,

      // Section 2: Disbursement Details
      currentDisbNo,

      // Section 3: Resolution Details
      resolutionNo,
      resolutionDate,

      // Section 4: Basic Details / Member Master Data
      aClass: selectedMember.aClass || selectedMember.memberNo || '',
      name: selectedMember.name || '',
      careOf: selectedMember.careOf || selectedMember.fatherOrHusbandName || '',
      sb: selectedMember.sb || '',
      erp: selectedMember.erp || '',
      ins: selectedMember.ins || '',
      door: selectedMember.door || '',
      street: selectedMember.street || '',
      village: selectedMember.village || '',
      aadharNo: selectedMember.adhar || selectedMember.aadharNo || '',
      mobile: selectedMember.mobile || '',
      rationCard: selectedMember.rationCard || '',
      namini: selectedMember.namini || '',
      relation: selectedMember.relation || '',
      mdcc: selectedMember.mdcc || '',
      caste: category || selectedMember.caste || '-',
      totalShare: selectedMember.totalShare ?? selectedMember.landAcres ?? '',

      // Section 5: Land & Crop Details
      surveyNo,
      acres,
      crop: effectiveCrop,

      // Section 6: Current Loan Details
      seed,
      chemicalFertilizer,
      pesticide,
      plowing: '0',
      harvesting: '0',
      fertilizerKind: compost,
      organicFertilizer: cash,
      totalLoanAmount: formatIndianCurrency(totalLoanAmount),

      // Section 7: Document Details
      farmerClass,
      disability,
      mortgageType,
      guaranteeType,

      // Section 8: Deduction Section
      passbookFee,
      insurance,
      shareCapital,

      // Section 9: Previous Loan Details
      prevLoanNo,
      prevLoanDate,
      prevLoanAmount,

      addedAt: new Date().toLocaleString('ta-IN')
    };

    // Save/Append or Update in Google Sheets tab 'KCC All Paduvada Members'
    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';

    if (targetSheetId || targetScriptUrl) {
      setIsSubmittingToSheet(true);
      try {
        const endpoint = editingItem ? '/api/sheets/update-paduvada' : '/api/sheets/add-paduvada';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: targetSheetId,
            webAppUrl: targetScriptUrl,
            paduvadaData,
            rowIndex: editingItem?.rowIndex,
            aClass: selectedMember.aClass || selectedMember.memberNo,
            currentDisbNo,
            crop: effectiveCrop,
            id: editingItem?.id
          })
        });
        const result = await response.json();
        if (result.success) {
          const actionWord = editingItem ? 'திருத்தப்பட்டது' : 'பதிவானது';
          setSuccessMsg(`${selectedMember.name} (A Class: ${newItem.aClass}) தகவல்கள் பட்டியலிலும், கூகுள் சீட்டின் 'KCC All Paduvada Members' பகுதியிலும் வெற்றியுடன் ${actionWord}!`);
          setSheetStatusMsg({
            type: 'success',
            text: `'KCC All Paduvada Members' கூகுள் சீட்டில் தகவல் ${actionWord}!`
          });
        } else {
          setSuccessMsg(`${selectedMember.name} உள்ளூர் பட்டியலில் புதுப்பிக்கப்பட்டது (கூகுள் சீட்: ${result.error || ''})`);
          setSheetStatusMsg({
            type: 'error',
            text: result.details || result.error || 'கூகுள் சீட்டில் தகவலைப் பதிவிடுவதில் பிழை.'
          });
        }
      } catch (err: any) {
        console.error('Sheet submission error:', err);
        setSuccessMsg(`${selectedMember.name} உள்ளூர் பட்டியலில் புதுப்பிக்கப்பட்டது.`);
        setSheetStatusMsg({
          type: 'error',
          text: 'கூகுள் சீட் சேவையக இணைப்பு பிழை.'
        });
      } finally {
        setIsSubmittingToSheet(false);
      }
    } else {
      setSuccessMsg(`${selectedMember.name} (A Class: ${newItem.aClass}) பட்டியலில் சேர்க்கப்பட்டது! (கூகுள் சீட் தானியங்கி சேமிப்பிற்கு இடது மெனுவில் 'கூகுள் சீட் இணைப்பு' பகுதியில் ஐடி அமைக்கலாம்)`);
    }

    setTimeout(() => setSuccessMsg(''), 5000);

    // Also trigger onSavePart1
    onSavePart1(
      `DISB-${newItem.aClass}-${effectiveCrop}`,
      newItem.aClass,
      {
        rclNumber,
        rclDate,
        sanctionedAmount: sanctionedAmount.replace(/,/g, ''),
        notes: `பயிர்: ${effectiveCrop}, சர்வே: ${surveyNo}, பரப்பு: ${acres} ஏக்கர்`,
        isSaved: true
      }
    );

    // Reset form fields after adding/editing
    if (currentDisbNo) {
      setFilterDisbNo(currentDisbNo);
      setSearchedDisbNo(currentDisbNo);
    }
    resetFormFields();
  };

  // Delete Member Trigger (Opens custom confirm modal)
  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
  };

  // Confirmed Delete Member Handler (Removes locally and from Google Sheet)
  const confirmDeleteProcess = async () => {
    if (!itemToDelete) return;
    const item = itemToDelete;
    setItemToDelete(null);

    setAddedItems((prev) => prev.filter((i) => i.id !== item.id));

    const targetSheetId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
    const targetScriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';

    if (targetSheetId || targetScriptUrl) {
      setIsDeletingSheet(true);
      try {
        const response = await fetch('/api/sheets/delete-paduvada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: targetSheetId,
            webAppUrl: targetScriptUrl,
            aClass: item.aClass,
            currentDisbNo: item.currentDisbNo || searchedDisbNo || filterDisbNo,
            rowIndex: item.rowIndex,
            crop: item.crop,
            id: item.id
          })
        });
        const result = await response.json();
        if (result.success) {
          setSuccessMsg(`${item.name} பட்டியலிலிருந்தும் 'KCC All Paduvada Members' கூகுள் சீட்டிலிருந்தும் வெற்றியுடன் நீக்கப்பட்டார்.`);
          setSheetStatusMsg({
            type: 'success',
            text: `'KCC All Paduvada Members' கூகுள் சீட்டிலிருந்தும் நபர் வெற்றியுடன் நீக்கப்பட்டார்!`
          });
          fetchLastDisbNo();
        } else {
          setSuccessMsg(`${item.name} உள்ளூர் பட்டியலிலிருந்து நீக்கப்பட்டார் (கூகுள் சீட்: ${result.error || ''})`);
        }
      } catch (err) {
        console.error('Delete sheet error:', err);
        setSuccessMsg(`${item.name} உள்ளூர் பட்டியலிலிருந்து நீக்கப்பட்டார்.`);
      } finally {
        setIsDeletingSheet(false);
      }
    } else {
      setSuccessMsg(`${item.name} பட்டியலிலிருந்து நீக்கப்பட்டார்.`);
    }

    setTimeout(() => setSuccessMsg(''), 4000);
    setTimeout(() => setSheetStatusMsg(null), 5000);
  };

  const getItemLoanAmount = (item: any): number => {
    if (item.totalLoanAmount !== undefined && item.totalLoanAmount !== null && item.totalLoanAmount !== '') {
      const cleanStr = String(item.totalLoanAmount).replace(/[^0-9.]/g, '');
      const num = parseFloat(cleanStr);
      if (!isNaN(num) && num > 0) return num;
    }
    
    // Fallback sum of loan component fields
    const seedNum = parseFloat(String(item.seed || '0').replace(/[^0-9.]/g, '')) || 0;
    const chemNum = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
    const compNum = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
    const pestNum = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
    const cashNum = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;

    const componentsSum = seedNum + chemNum + compNum + pestNum + cashNum;
    if (componentsSum > 0) return componentsSum;

    return parseFloat(String(item.sanctionedAmount || '0').replace(/[^0-9.]/g, '')) || 0;
  };

  const displayItems = useMemo(() => {
    const trimmed = (searchedDisbNo || '').trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.toLowerCase() === 'all') {
      return addedItems;
    }
    const filterNum = parseInt(trimmed, 10);
    return addedItems.filter((item) => {
      const itemDisbStr = String(item.currentDisbNo || (item as any).disbNo || (item as any).disbursementNo || (item as any)['பட்டுவாடா எண்'] || '').trim();
      const itemDisbNum = parseInt(itemDisbStr, 10);
      return itemDisbStr === trimmed || (!isNaN(filterNum) && !isNaN(itemDisbNum) && itemDisbNum === filterNum);
    });
  }, [addedItems, searchedDisbNo]);

  const totalAcresSum = displayItems.reduce((acc, item) => {
    const cleanStr = String(item.acres || '0').replace(/[^0-9.]/g, '');
    return acc + (parseFloat(cleanStr) || 0);
  }, 0);

  const totalLoanSum = displayItems.reduce((acc, item) => acc + getItemLoanAmount(item), 0);

  return (
    <div className="space-y-6 pb-16 text-stone-900 font-sans">
      {/* Top Main Heading */}
      <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-1">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 bg-[#D1EAE0] text-[#007A4D] rounded-xl border border-[#007A4D]/20 shadow-2xs">
            <Layers className="w-5 h-5 text-[#007A4D]" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide text-[#007A4D]">
            கேசிசி பட்டுவாடா தயார் செய்தல் <span className="text-[#007A4D] text-lg sm:text-xl font-extrabold">(KCC Disbursement)</span>
          </h1>
        </div>
        <p className="text-xs text-stone-600 font-medium pl-11">
          கடன்தாரர்களைத் தேர்ந்தெடுத்து பட்டுவாடா விபரங்களை உள்ளீடு செய்து 10 வகையான படிவங்களை அச்சிடுதல்
        </p>
      </div>

      {/* Main Container with PACS Theme */}
      <div className="bg-[#FAF9F5] border border-[#E2E2DC] rounded-2xl p-4 sm:p-7 space-y-6 shadow-2xs">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E2DC]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📋</span>
            <h2 className="text-base sm:text-lg font-black text-[#007A4D] tracking-wide">
              கேசிசி பட்டுவாடா படிவம் (9 பகுதிகள்)
            </h2>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-[#D1EAE0] border border-[#007A4D]/40 text-[#007A4D] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-[#007A4D]" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-[#007A4D] hover:text-black font-bold text-sm">✕</button>
          </div>
        )}

        <form id="kcc-disbursement-form" onSubmit={handleAddToList} className="space-y-5 text-xs">
          {/* Active Edit Mode Banner */}
          {editingItem && (
            <div className="bg-amber-50 border-2 border-amber-500 text-amber-900 px-4 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-200 text-amber-900 rounded-lg">
                  <Edit3 className="w-5 h-5 text-amber-800" />
                </span>
                <div>
                  <span className="font-black text-sm block text-amber-900">
                    ✏️ உறுப்பினர் விபரங்கள் திருத்தும் பயன்முறை (Editing Mode): {editingItem.name} (A Class: {editingItem.aClass})
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    தேவையான விபரங்களை மாற்றியமைத்து கீழே உள்ள <strong className="text-amber-950 font-bold">"மாற்றங்களைச் சேமி (Save Changes)"</strong> பொத்தானை அழுத்தவும்.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-2 bg-white border border-amber-400 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                திருத்துவதை ரத்து செய் (Cancel)
              </button>
            </div>
          )}
          {/* ========================================================
              பகுதி 1: தொகுதி விபரம் (Batch Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 1
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                தொகுதி விபரம் (Batch Details)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  நிதியாண்டு (Financial Year) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="2026-2027 (yyyy-yyyy)"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">வடிவம்: yyyy-yyyy (எ.கா: 2026-2027)</span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  RCL எண் <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rclNumber}
                  onChange={(e) => setRclNumber(e.target.value)}
                  placeholder="107/25-26/P1"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  RCL தேதி <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rclDate}
                  onChange={(e) => setRclDate(formatDateDDMMYYYY(e.target.value))}
                  placeholder="15 - 04 - 2026 (ddmmyyyy)"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">வடிவம்: ddmmyyyy</span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  அனுமதிக்கப்பட்ட கடன் அளவு <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sanctionedAmount}
                  onChange={(e) => setSanctionedAmount(formatIndianInputNumber(e.target.value))}
                  placeholder="3,00,00,000"
                  className="w-full bg-white text-[#007A4D] border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  பதவி தேர்வு (Designation) <span className="text-[#007A4D]">*</span>
                </label>
                <select
                  value={officerDesignation}
                  onChange={(e) => {
                    const des = e.target.value;
                    setOfficerDesignation(des);
                    if (des === 'தலைவர்' && officerName.includes('செயலாட்சியர்')) {
                      setOfficerName('திரு.மு.கருப்பையா, தலைவர்');
                    } else if (des === 'செயலாட்சியர்' && officerName.includes('தலைவர்')) {
                      setOfficerName('திரு.அ.சீனிவாசப்பெருமாள், கூட்டுறவு சார்பதிவாளர் / செயலாட்சியர்');
                    }
                  }}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="செயலாட்சியர்">செயலாட்சியர் (Executive Officer)</option>
                  <option value="தலைவர்">தலைவர் (President)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  செயலாட்சியர் / தலைவர் பெயர் <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="பெயர் மற்றும் பதவி உள்ளிடவும்"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">அச்சு மற்றும் தீர்மானத்தில் வரும் பெயர்</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 2: பட்டுவாடா விபரங்கள் (Disbursement Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 2
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                பட்டுவாடா விபரங்கள் (Disbursement Details)
              </h3>
            </div>
            <div className="max-w-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  தற்போதைய பட்டுவாடா எண் <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentDisbNo}
                  onChange={(e) => setCurrentDisbNo(e.target.value)}
                  placeholder="2"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 3: தீர்மான விபரம் (Resolution Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 3
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                தீர்மான விபரம் (Resolution Details)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  தீர்மான எண் <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resolutionNo}
                  onChange={(e) => setResolutionNo(e.target.value)}
                  placeholder="1"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  தீர்மான தேதி <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(formatDateDDMMYYYY(e.target.value))}
                  placeholder="20 - 05 - 2026 (ddmmyyyy)"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">வடிவம்: ddmmyyyy</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 4: அடிப்படை தகவல்கள் (Basic Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 4
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                அடிப்படை தகவல்கள் (Basic Details)
              </h3>
            </div>

            {/* A Class Search Input Row */}
            <div className="space-y-1">
              <label className="block text-stone-700 font-bold">
                A Class எண் உள்ளிடவும் <span className="text-[#007A4D]">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="text"
                  value={searchAClassInput}
                  onChange={(e) => setSearchAClassInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleShowMemberDetails())}
                  placeholder="உதாரணம்: 1024 அல்லது PACS-1024"
                  className="flex-1 bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2.5 font-mono font-semibold placeholder:text-stone-400 focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleShowMemberDetails}
                  className="bg-[#007A4D] hover:bg-[#00633E] text-white font-black px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>விபரங்களைக் காட்டு</span>
                </button>
              </div>
            </div>

            {/* Member Details Readout Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-[#007A4D] uppercase font-extrabold block">A CLASS எண்:</span>
                <span className="font-mono font-extrabold text-[#007A4D] text-sm">
                  {selectedMember ? (selectedMember.aClass || selectedMember.memberNo) : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">எஸ்பி எண் (SB NO):</span>
                <span className="font-mono font-semibold text-stone-900">
                  {selectedMember ? (selectedMember.sb || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">இஆர்பி எண் (ERP NO):</span>
                <span className="font-mono text-stone-800">
                  {selectedMember ? (selectedMember.erp || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">இனிசியல் (INITIALS):</span>
                <span className="font-semibold text-stone-900">
                  {selectedMember ? (selectedMember.ins || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-[#007A4D] uppercase font-extrabold block">உறுப்பினர் பெயர்:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {selectedMember ? selectedMember.name : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">தகப்பனார் பெயர்:</span>
                <span className="font-semibold text-stone-800">
                  {selectedMember ? (selectedMember.careOf || selectedMember.fatherOrHusbandName || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">கிராமம் (VILLAGE):</span>
                <span className="font-bold text-[#007A4D]">
                  {selectedMember ? (selectedMember.village || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">குடும்ப அட்டை எண் (RATION):</span>
                <span className="font-mono text-stone-800">
                  {selectedMember ? formatRationCard(selectedMember.rationCard) : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">எம்டிசிசி எண் (MDCC NO):</span>
                <span className="font-mono text-stone-800">
                  {selectedMember ? formatMDCC(selectedMember.mdcc) : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">நாமினியின் பெயர்:</span>
                <span className="font-semibold text-stone-800">
                  {selectedMember ? (selectedMember.namini || '-') : '-'}
                </span>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC] transition-colors shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">உறவு முறை (RELATIONSHIP):</span>
                <span className="text-stone-800 font-semibold">
                  {selectedMember ? (selectedMember.relation || '-') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 5: நில விபரம் (Land Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 5
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                நில விபரம் (Land Details)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  சர்வே எண் (Survey No) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value.toUpperCase())}
                  placeholder="உதாரணம்: 123/1A"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold uppercase focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">தானியங்கி பெரிய எழுத்துக்கள் (CAPS)</span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  பரப்பு (ஏக்கர்) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={acres}
                  onChange={(e) => handleAcresChange(e.target.value)}
                  onBlur={handleAcresBlur}
                  placeholder="1.00"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">தசம எண் 2 இலக்கம் (எ.கா: 1.25)</span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  பயிர் (Crop) <span className="text-[#007A4D]">*</span>
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="தென்னை">தென்னை</option>
                  <option value="வாழை">வாழை</option>
                  <option value="மரவள்ளி">மரவள்ளி</option>
                  <option value="மல்பெரி">மல்பெரி</option>
                  <option value="மா">மா</option>
                  <option value="கொய்யா">கொய்யா</option>
                  <option value="ஏலம்">ஏலம்</option>
                  <option value="Others">Others (டைப் செய்ய)</option>
                </select>

                {crop === 'Others' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customCrop}
                      onChange={(e) => setCustomCrop(e.target.value)}
                      placeholder="பயிரின் பெயரை டைப் செய்யவும்..."
                      className="w-full bg-white text-[#007A4D] border border-[#007A4D]/80 rounded-lg px-3.5 py-2 font-bold focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                    />
                  </div>
                )}
                <span className="text-[10px] text-stone-500 mt-1 block font-medium">
                  {crop === 'Others' ? 'தேவையான பயிரின் பெயரை மேலே டைப் செய்யவும்' : 'பயிரைத் தேர்ந்தெடுக்கவும் (தேவைப்பட்டால் Others தேர்வு செய்து டைப் செய்யலாம்)'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 6: தற்போதைய கடன் விபரம் (Current Loan Details)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 6
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                தற்போதைய கடன் விபரம் (Current Loan Details)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  விதை (Seed) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(formatIndianInputNumber(e.target.value) || '0')}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  இரசாயன உரம் <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  value={chemicalFertilizer}
                  onChange={(e) => setChemicalFertilizer(formatIndianInputNumber(e.target.value) || '0')}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  தொழுஉரம் (Compost) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  value={compost}
                  onChange={(e) => setCompost(formatIndianInputNumber(e.target.value) || '0')}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  பூச்சிமருந்து <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  value={pesticide}
                  onChange={(e) => setPesticide(formatIndianInputNumber(e.target.value) || '0')}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ரொக்கம் (Cash) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  value={cash}
                  onChange={(e) => setCash(formatIndianInputNumber(e.target.value) || '0')}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[#007A4D] font-bold mb-1">
                  மொத்த தொகை (Total) <span className="text-[#007A4D]">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatIndianCurrency(totalLoanAmount, false)}
                  className="w-full bg-[#D1EAE0]/50 text-[#007A4D] border-2 border-[#007A4D]/60 rounded-lg px-3.5 py-2 font-mono font-black text-right outline-none text-sm shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 7: ஆவண விபரம்
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 7
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                ஆவண விபரம் (Document Details)
              </h3>
            </div>
            
            {/* Top row controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#007A4D] font-bold mb-1">
                  உறுப்பினர் நிலை (Member Status) <span className="text-[#007A4D]">*</span>
                </label>
                <select
                  value={memberStatus}
                  onChange={(e) => handleMemberStatusChange(e.target.value)}
                  className="w-full bg-white text-[#007A4D] border border-[#007A4D]/80 rounded-lg px-3.5 py-2 font-bold focus:ring-2 focus:ring-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="பழைய உறுப்பினர்">பழைய உறுப்பினர்</option>
                  <option value="புதிய உறுப்பினர்">புதிய உறுப்பினர்</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">சாதி (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 font-semibold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="-">-</option>
                  <option value="SC/ST">SC/ST</option>
                  <option value="BC">BC</option>
                  <option value="MBC">MBC</option>
                  <option value="General">General</option>
                  <option value="OC">OC</option>
                  {category && !['-', 'SC/ST', 'BC', 'MBC', 'General', 'OC'].includes(category) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Farmer Class</label>
                <select
                  value={farmerClass}
                  onChange={(e) => setFarmerClass(e.target.value)}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 font-semibold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="MF">MF (0 - 2.50)</option>
                  <option value="SF">SF (2.50 - 5.00)</option>
                  <option value="OF">OF (&gt; 5.00)</option>
                  <option value="AL">AL (Agr Labourer)</option>
                </select>
              </div>
            </div>

            {/* Bottom row controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-stone-700 font-bold mb-1">உடலில் உள்ள குறைபாடு</label>
                <input
                  type="text"
                  value={disability}
                  onChange={(e) => setDisability(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">வெண்ணிலை / தொடர்ச்சி அடமானம்</label>
                <select
                  value={mortgageType}
                  onChange={(e) => setMortgageType(e.target.value)}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-semibold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="வெந்நிலை ஜாமீன் மூலம் முன்கடன் செலுத்தியவர்">வெந்நிலை ஜாமீன் மூலம் முன்கடன் செலுத்தியவர்</option>
                  <option value="வெந்நிலை ஜாமீன் மூலம் புதிய உறுப்பினர்">வெந்நிலை ஜாமீன் மூலம் புதிய உறுப்பினர்</option>
                  <option value="தொடர்ச்சி அடமானம் மூலம் முன்கடன் செலுத்தியவர்">தொடர்ச்சி அடமானம் மூலம் முன்கடன் செலுத்தியவர்</option>
                  <option value="தொடர்ச்சி அடமானம் மூலம் புதிய உறுப்பினர்">தொடர்ச்சி அடமானம் மூலம் புதிய உறுப்பினர்</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">ஆதார விபரம்</label>
                <select
                  value={guaranteeType}
                  onChange={(e) => setGuaranteeType(e.target.value)}
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-semibold focus:ring-2 focus:ring-[#007A4D] focus:border-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="நபர் ஜாமீன்">நபர் ஜாமீன்</option>
                  <option value="நில அடமானம்">நில அடமானம்</option>
                  <option value="நகை அடமானம்">நகை அடமானம்</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 8: பிடிக்கும் பகுதி (Deduction Section)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 8
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                பிடிக்கும் பகுதி (Deduction Section)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  புத்தக பாரம் (Passbook Fee)
                </label>
                <input
                  type="text"
                  value={passbookFee}
                  onChange={(e) => setPassbookFee(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  காப்பீடு (Insurance)
                </label>
                <input
                  type="text"
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  பங்குத்தொகை (Share Capital)
                </label>
                <input
                  type="text"
                  value={shareCapital}
                  onChange={(e) => setShareCapital(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              பகுதி 9: முன்கடன் செலுத்திய விவரம் (Previous Loan Repayment)
             ======================================================== */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E2DC]">
              <span className="px-2.5 py-0.5 bg-[#D1EAE0] text-[#007A4D] font-mono font-black text-[11px] rounded-lg border border-[#007A4D]/20">
                பகுதி 9
              </span>
              <h3 className="text-[#007A4D] font-extrabold text-xs sm:text-sm tracking-wide">
                முன்கடன் செலுத்திய விவரம் (Previous Loan Details) - ({memberStatus})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  முன்கடன் எண் (Previous Loan No)
                </label>
                {memberStatus === 'புதிய உறுப்பினர்' ? (
                  <input
                    type="text"
                    value="புதிய உறுப்பினர்"
                    readOnly
                    disabled
                    className="w-full bg-stone-100 text-stone-600 border border-stone-300 rounded-lg px-3.5 py-2 font-bold cursor-not-allowed shadow-2xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={prevLoanNo}
                    onChange={(e) => setPrevLoanNo(e.target.value)}
                    placeholder="KCC -"
                    className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  முன்கடன் தேதி (Previous Loan Date)
                </label>
                {memberStatus === 'புதிய உறுப்பினர்' ? (
                  <input
                    type="text"
                    value="-"
                    readOnly
                    disabled
                    className="w-full bg-stone-100 text-stone-600 border border-stone-300 rounded-lg px-3.5 py-2 font-bold text-center cursor-not-allowed shadow-2xs"
                  />
                ) : (
                  <input
                    type="date"
                    value={prevLoanDate}
                    onChange={(e) => setPrevLoanDate(e.target.value)}
                    className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none cursor-pointer transition-all shadow-2xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  முன்கடன் தொகை (Previous Loan Amount ₹)
                </label>
                {memberStatus === 'புதிய உறுப்பினர்' ? (
                  <input
                    type="text"
                    value="0"
                    readOnly
                    disabled
                    className="w-full bg-stone-100 text-stone-600 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right cursor-not-allowed shadow-2xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={prevLoanAmount}
                    onChange={(e) => setPrevLoanAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3.5 py-2 font-mono font-bold text-right text-[#007A4D] focus:ring-2 focus:ring-[#007A4D] outline-none transition-all shadow-2xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Prominent Button */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="submit"
              disabled={isSubmittingToSheet}
              className={`${
                editingItem 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-[#007A4D] hover:bg-[#00633E] text-white'
              } text-xs sm:text-sm font-black px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center gap-2.5 cursor-pointer transform active:scale-95 disabled:opacity-50`}
            >
              {isSubmittingToSheet ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : editingItem ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <PlusCircle className="w-5 h-5 text-white" />
              )}
              <span>{editingItem ? 'மாற்றங்களைச் சேமி (Save Changes)' : 'பட்டியலில் சேர் (Add to List)'}</span>
            </button>

            {editingItem && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs sm:text-sm font-bold px-5 py-3.5 rounded-xl border border-stone-300 transition-all cursor-pointer"
              >
                ரத்து செய் (Cancel)
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ========================================================
          1. நடப்பு பட்டுவாடா பட்டியல் (Current Batch Members)
         ======================================================== */}
      <div className="bg-white border border-[#E2E2DC] rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs">
        {/* Header Title with Member Count & Google Sheet Sync Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E2DC] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-base sm:text-lg font-black text-[#007A4D]">
              நடப்பு பட்டுவாடா பட்டியல் (Current Batch Members)
            </h3>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="text-xs font-bold text-[#007A4D] bg-[#D1EAE0] px-3 py-1.5 rounded-xl border border-[#007A4D]/20">
              {searchedDisbNo.trim() 
                ? `${displayItems.length} உறுப்பினர்கள் (பட்டுவாடா எண்: ${searchedDisbNo})` 
                : 'பட்டுவாடா எண் உள்ளிட்டு தேடவும்'}
            </div>
          </div>
        </div>

        {/* Control Bar: பட்டுவாடா எண், தேடு, கடைசி பட்டுவாடா எண் */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-[#E2E2DC]">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-700">பட்டுவாடா எண்:</label>
            <input
              type="text"
              value={filterDisbNo}
              onChange={(e) => setFilterDisbNo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchByDisbNo(); } }}
              placeholder="எ.கா. 1"
              className="w-24 bg-white border border-stone-300 text-stone-900 font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-[#007A4D] outline-none text-center shadow-2xs"
            />
            <button
              type="button"
              disabled={isFetchingSheet}
              onClick={() => handleSearchByDisbNo()}
              className="bg-[#007A4D] hover:bg-[#00633E] disabled:opacity-50 text-white font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {isFetchingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Search className="w-3.5 h-3.5 text-white" />}
              <span>தேடு</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-700">
            <span className="font-semibold">கடைசி பட்டுவாடா எண்:</span>
            <span className="font-mono font-extrabold text-[#007A4D] bg-white px-3 py-1 rounded-lg border border-[#E2E2DC] shadow-2xs">
              {lastDisbNo}
            </span>
          </div>
        </div>

        {/* Sheet Sync Status Banner */}
        {sheetStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            sheetStatusMsg.type === 'success' ? 'bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30' :
            sheetStatusMsg.type === 'error' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {sheetStatusMsg.type === 'info' && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" />}
            {sheetStatusMsg.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-[#007A4D]" />}
            {sheetStatusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{sheetStatusMsg.text}</span>
          </div>
        )}

        {/* Member Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E2DC] bg-white">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#FAF9F5] text-[#007A4D] uppercase font-extrabold text-[11px] border-b border-[#E2E2DC]">
              <tr>
                <th className="p-3 text-center">வ.எண்</th>
                <th className="p-3">அ.எண்</th>
                <th className="p-3">SB கணக்கு</th>
                <th className="p-3">ERP கணக்கு</th>
                <th className="p-3">பெயர்</th>
                <th className="p-3">பயிர்</th>
                <th className="p-3 text-right">பரப்பு</th>
                <th className="p-3 text-right">கடன் தொகை</th>
                <th className="p-3 text-center">செயல்</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E2DC] font-medium">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-500 font-semibold">
                    {!searchedDisbNo.trim() ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <span className="text-stone-700 font-bold text-sm">பட்டுவாடா எண்ணை உள்ளிட்டு 'தேடு' பொத்தானை அழுத்தவும்</span>
                        <span className="text-xs text-stone-500">பட்டுவாடா எண் உள்ளிட்டு 'தேடு' பொத்தானை அழுத்தினால் மட்டுமே அந்த பட்டுவாடாவிற்குரிய நபர்களின் பட்டியல் காட்டப்படும்.</span>
                      </div>
                    ) : (
                      <div className="py-4">
                        <span className="text-stone-700 font-bold text-sm">பட்டுவாடா எண் '{searchedDisbNo}' க்கு உறுப்பினர்கள் யாரும் பட்டியலில் இல்லை</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                displayItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="p-3 text-center font-bold text-stone-500">{index + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#007A4D]">{item.aClass}</td>
                    <td className="p-3 font-mono text-stone-700">{item.sb || '-'}</td>
                    <td className="p-3 font-mono text-stone-700">{item.erp || '-'}</td>
                    <td className="p-3 font-bold text-stone-900">
                      {item.name}
                    </td>
                    <td className="p-3 font-semibold text-stone-800">{item.crop}</td>
                    <td className="p-3 text-right font-mono text-stone-700">{formatAcres(item.acres)}</td>
                    <td className="p-3 text-right font-mono font-black text-[#007A4D] text-sm">
                      {formatIndianCurrency(getItemLoanAmount(item))}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          title="தகவல்களைக் காண்க"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          <span>காண்</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          title="திருத்துக"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>திருத்து</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          title="நீக்குக"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>நீக்கு</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Row */}
        <div className="flex flex-wrap items-center justify-between bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] text-xs font-black">
          <div className="flex items-center gap-2">
            <span className="text-stone-700 uppercase tracking-wide font-extrabold">மொத்தம்:</span>
            <span className="bg-[#D1EAE0] text-[#007A4D] px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
              {displayItems.length} நபர்கள்
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-1.5 text-stone-700">
              <span className="font-semibold text-stone-600">மொத்த பரப்பு:</span>
              <span className="font-mono text-[#007A4D] text-sm font-black">{totalAcresSum.toFixed(2)} ஏக்.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-600">மொத்த கடன் தொகை:</span>
              <span className="font-mono text-base font-black text-[#007A4D]">{formatIndianCurrency(totalLoanSum)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. அச்சுப் படிவங்கள் மற்றும் அறிக்கைகள் (Print Forms & Reports)
         ======================================================== */}
      <div className="bg-white border border-[#E2E2DC] rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#E2E2DC] pb-3">
          <span className="text-xl">🖨️</span>
          <h3 className="text-base sm:text-lg font-black text-[#007A4D]">
            அச்சுப் படிவங்கள் மற்றும் அறிக்கைகள் (Print Forms & Reports)
          </h3>
        </div>

        {/* 10 Forms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRINT_FORMS.map((form) => (
            <div
              key={form.id}
              className="bg-[#FAF9F5] border border-[#E2E2DC] hover:border-[#007A4D]/50 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between shadow-2xs"
            >
              <h4 className="font-bold text-xs sm:text-sm text-stone-800 leading-snug">
                {form.title}
              </h4>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePrintForm(form.title)}
                  className="flex-1 bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-[11px] py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>அச்சிடு</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportExcel(form.title)}
                  className="flex-1 bg-stone-700 hover:bg-stone-800 text-white font-black text-[11px] py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail View Modal for "காண்" (View Details) */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E2DC] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-stone-800 animate-in fade-in zoom-in duration-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D1EAE0] border border-[#007A4D]/30 flex items-center justify-center text-[#007A4D] font-bold">
                  <Eye className="w-5 h-5 text-[#007A4D]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    {viewingItem.name} ({viewingItem.aClass}) - பட்டுவாடா விபரங்கள்
                  </h3>
                  <p className="text-xs text-[#007A4D] font-medium">
                    பட்டுவாடா எண்: <span className="font-mono font-bold text-stone-900">{viewingItem.currentDisbNo || filterDisbNo}</span> | A Class: <span className="font-mono font-bold text-stone-900">{viewingItem.aClass}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-2 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
                title="மூடுக"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid covering 9 Sections */}
            <div className="space-y-4 text-xs">
              {/* Sections 1, 2, 3: Batch, Disb, Resolution */}
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                  <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 1, 2 & 3</span>
                  <span>பொது விபரங்கள் & தீர்மானம்</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                  <div><span className="text-stone-500 block text-[10px]">RCL எண்:</span> <strong className="text-stone-900 block font-mono">{viewingItem.rclNumber || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">RCL தேதி:</span> <strong className="text-stone-900 block font-mono">{viewingItem.rclDate || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">அனுமதிக்கப்பட்ட தொகை:</span> <strong className="text-[#007A4D] block font-mono font-bold">{viewingItem.sanctionedAmount ? `₹${viewingItem.sanctionedAmount}` : '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">பட்டுவாடா எண்:</span> <strong className="text-stone-900 block font-mono font-bold">{viewingItem.currentDisbNo || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">தீர்மான எண்:</span> <strong className="text-stone-900 block font-mono">{viewingItem.resolutionNo || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">தீர்மான தேதி:</span> <strong className="text-stone-900 block font-mono">{viewingItem.resolutionDate || '-'}</strong></div>
                </div>
              </div>

              {/* Section 4: Member Details */}
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                  <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 4</span>
                  <span>அங்கத்தினர் விபரங்கள்</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                  <div><span className="text-stone-500 block text-[10px]">A Class எண்:</span> <strong className="text-[#007A4D] block font-mono font-bold text-sm">{viewingItem.aClass}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">பெயர்:</span> <strong className="text-stone-900 block font-bold text-sm">{viewingItem.name}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">த/பெ / கணவர் பெயர்:</span> <strong className="text-stone-800 block">{viewingItem.careOf || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">SB கணக்கு எண்:</span> <strong className="text-stone-900 block font-mono">{viewingItem.sb || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">ERP கணக்கு எண்:</span> <strong className="text-stone-900 block font-mono">{viewingItem.erp || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">காப்பீடு எண்:</span> <strong className="text-stone-800 block font-mono">{viewingItem.ins || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">ஊர்:</span> <strong className="text-stone-800 block">{viewingItem.village || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">ஆதார் எண்:</span> <strong className="text-stone-800 block font-mono">{viewingItem.aadharNo || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">கைபேசி:</span> <strong className="text-stone-800 block font-mono">{viewingItem.mobile || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">ரேஷன் கார்டு:</span> <strong className="text-stone-800 block font-mono">{viewingItem.rationCard || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">வாரிசுதாரர்:</span> <strong className="text-stone-800 block">{viewingItem.namini || '-'}</strong></div>
                  <div><span className="text-stone-500 block text-[10px]">MDCC வங்கி:</span> <strong className="text-stone-800 block font-mono">{viewingItem.mdcc || '-'}</strong></div>
                </div>
              </div>

              {/* Sections 5 & 6: Land & Loan Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                  <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                    <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 5</span>
                    <span>நில விவரம்</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div><span className="text-stone-500 block text-[10px]">சர்வே எண்:</span> <strong className="text-stone-900 block font-mono">{viewingItem.surveyNo || '-'}</strong></div>
                    <div><span className="text-stone-500 block text-[10px]">பரப்பு (ஏக்கர்):</span> <strong className="text-stone-900 block font-mono">{formatAcres(viewingItem.acres)}</strong></div>
                    <div className="col-span-2"><span className="text-stone-500 block text-[10px]">பயிர்:</span> <strong className="text-[#007A4D] block font-bold text-sm">{viewingItem.crop}</strong></div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                  <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                    <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 6</span>
                    <span>கடன் தொகைப் பங்கீடு</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div><span className="text-stone-500 font-sans block text-[10px]">விதை:</span> <strong className="text-stone-900 block">₹{viewingItem.seed || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans block text-[10px]">இரசாயன உரம்:</span> <strong className="text-stone-900 block">₹{viewingItem.chemicalFertilizer || viewingItem.fertilizer || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans block text-[10px]">உரம் வகை:</span> <strong className="text-stone-900 block">₹{viewingItem.fertilizerKind || viewingItem.compost || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans block text-[10px]">பூச்சிக்கொல்லி:</span> <strong className="text-stone-900 block">₹{viewingItem.pesticide || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans block text-[10px]">ரொக்கம் / ஆள் கூலி:</span> <strong className="text-stone-900 block">₹{viewingItem.organicFertilizer || viewingItem.cash || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans block text-[10px]">மொத்த கடன் தொகை:</span> <strong className="text-[#007A4D] font-black block text-sm">₹{viewingItem.totalLoanAmount || '0'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Sections 7, 8, 9 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                  <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                    <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 7</span>
                    <span>ஆவண விவரங்கள்</span>
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <div><span className="text-stone-500 text-[10px] block">உறுப்பினர் நிலை:</span> <strong className="text-amber-700 font-bold">{viewingItem.memberStatus || (viewingItem.prevLoanNo === 'புதிய உறுப்பினர்' ? 'புதிய உறுப்பினர்' : 'பழைய உறுப்பினர்')}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">சாதி:</span> <strong className="text-stone-900">{viewingItem.caste || viewingItem.category || '-'}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">விவசாயி வகை:</span> <strong className="text-stone-900">{viewingItem.farmerClass || 'MF'}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">அடமானம்:</span> <strong className="text-stone-800 block text-[11px] leading-snug">{viewingItem.mortgageType || '-'}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">ஜாமீன்:</span> <strong className="text-stone-800 block text-[11px] leading-snug">{viewingItem.guaranteeType || '-'}</strong></div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                  <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                    <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 8</span>
                    <span>பிடித்தங்கள்</span>
                  </h4>
                  <div className="space-y-1.5 pt-1 font-mono">
                    <div><span className="text-stone-500 font-sans text-[10px] block">பாஸ்புக் கட்டணம்:</span> <strong className="text-stone-900">₹{viewingItem.passbookFee || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans text-[10px] block">காப்பீடு பிடித்தம்:</span> <strong className="text-stone-900">₹{viewingItem.insurance || '0'}</strong></div>
                    <div><span className="text-stone-500 font-sans text-[10px] block">பங்குத்தொகை:</span> <strong className="text-stone-900">₹{viewingItem.shareCapital || '0'}</strong></div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-2">
                  <h4 className="text-[#007A4D] font-extrabold border-b border-[#E2E2DC] pb-1.5 flex items-center gap-2">
                    <span className="bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 px-2 py-0.5 rounded text-[10px]">பகுதி 9</span>
                    <span>முன்கடன் செலுத்திய விவரம்</span>
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <div><span className="text-stone-500 text-[10px] block">முன்கடன் எண்:</span> <strong className="text-amber-700 font-mono font-bold">{viewingItem.prevLoanNo || '-'}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">முன்கடன் தேதி:</span> <strong className="text-stone-900 font-mono">{formatDateDDMMYYYY(viewingItem.prevLoanDate)}</strong></div>
                    <div><span className="text-stone-500 text-[10px] block">முன்கடன் தொகை:</span> <strong className="text-stone-900 font-mono">₹{viewingItem.prevLoanAmount || '0'}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-[#E2E2DC] pt-4">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs px-6 py-2.5 rounded-xl border border-stone-300 transition-all cursor-pointer"
              >
                மூடு (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-300 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">
                  உறுப்பினரை நீக்குதல்
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  A Class: <span className="font-mono font-bold text-stone-800">{itemToDelete.aClass}</span> | பட்டுவாடா எண்: <span className="font-mono font-bold text-stone-800">{itemToDelete.currentDisbNo || filterDisbNo}</span>
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1">
              <p className="font-bold text-sm text-rose-800">
                {itemToDelete.name}
              </p>
              <p className="leading-relaxed">
                இந்த உறுப்பினரை பட்டியலிலிருந்தும், கூகுள் சீட்டிலிருந்தும் ('KCC All Paduvada Members') உறுதியாக நீக்க விரும்புகிறீர்களா?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                ரத்து செய் (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteProcess}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>ஆம், நீக்குக (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

