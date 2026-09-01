import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Filter, 
  Search, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Info,
  Plus,
  Trash2,
  RotateCcw,
  Zap,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { KCCDisbursementRecord, LoanMember, KCCBankAccount } from '../types';
import { formatIndianCurrency, formatDateDDMMYYYY, formatAcres } from '../utils/formatters';

export interface CropRowData {
  id: string;
  crop: string;
  count: string;
  acres: string;
  seed: string;
  chem: string;
  comp: string;
  pest: string;
  cash: string;
  totalLoan: string;
}

export interface InsuranceRowData {
  id: string;
  sNo: number;
  aNo: string;
  sb: string;
  erp: string;
  ins: string;
  name: string;
  fatherOrHusbandName: string;
  village: string;
  rationCard: string;
  disability: string;
  namini: string;
  relation: string;
  subscription: string | number;
}

const DEFAULT_CROPS_LIST: CropRowData[] = [
  { id: '1', crop: 'தென்னை', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
  { id: '2', crop: 'மரவள்ளி', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
  { id: '3', crop: 'வாழை', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
  { id: '4', crop: 'கொய்யா', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
  { id: '5', crop: 'ஏலம்', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
  { id: '6', crop: 'மா', count: '', acres: '', seed: '', chem: '', comp: '', pest: '', cash: '', totalLoan: '' },
];

const DEFAULT_INSURANCE_ROWS: InsuranceRowData[] = [];

interface PrintReportsScreenProps {
  disbursements: KCCDisbursementRecord[];
  members: LoanMember[];
  bankAccounts: KCCBankAccount[];
}

export const PrintReportsScreen: React.FC<PrintReportsScreenProps> = ({
  disbursements,
  members,
  bankAccounts
}) => {
  const [activeTab, setActiveTab] = useState<'kcc1' | 'kcc2' | 'cropwise' | 'insurance' | 'custom-excel'>('kcc1');

  // Filter & PACS customization state for KCC 1 & KCC 2
  const [paccsName, setPaccsName] = useState('T.U.3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் லிட்,  தேவாரம்');
  const [paccsAddress, setPaccsAddress] = useState('உத்தமபாளையம் தாலுகா, தேனி மாவட்டம் - 625530');
  const [rclNo, setRclNo] = useState('107/25-26/P1');
  const [rclDate, setRclDate] = useState('15.04.2026');
  const [resolutionNo, setResolutionNo] = useState('1');
  const [resolutionDate, setResolutionDate] = useState('20-05-2026');
  const [disbursementNo, setDisbursementNo] = useState('1');
  const [disbursementDate, setDisbursementDate] = useState('20-05-2026');
  const [filterDisbNo, setFilterDisbNo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Cropwise Category amounts state (allows user direct typing or auto-fill)
  const [catAmounts, setCatAmounts] = useState<{
    newMemberAmt: string;
    scstAmt: string;
    otherAmt: string;
    sfmfAmt: string;
    ofAmt: string;
    femaleAmt: string;
  }>({
    newMemberAmt: '',
    scstAmt: '',
    otherAmt: '',
    sfmfAmt: '',
    ofAmt: '',
    femaleAmt: ''
  });

  // Cropwise Bank Remittance rows (6 rows)
  const [remittances, setRemittances] = useState<Array<{ date: string; amount: string }>>([
    { date: '', amount: '' },
    { date: '', amount: '' },
    { date: '', amount: '' },
    { date: '', amount: '' },
    { date: '', amount: '' },
    { date: '', amount: '' },
  ]);

  // Cropwise Editable Rows (6 standard crops + user custom rows)
  const [editableCropRows, setEditableCropRows] = useState<CropRowData[]>(DEFAULT_CROPS_LIST);

  // 4. Insurance (காப்பீடு) Customization and Rows State
  const [insSenderRole, setInsSenderRole] = useState('செயலாளர்');
  const [insSenderSociety, setInsSenderSociety] = useState('TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்');
  const [insSenderPlace, setInsSenderPlace] = useState('தேவாரம்');
  const [insReceiverRole, setInsReceiverRole] = useState('கிளை மேலாளர் அவர்கள்');
  const [insReceiverBank, setInsReceiverBank] = useState('மதுரை மாவட்ட மத்திய');
  const [insReceiverSub, setInsReceiverSub] = useState('கூட்டுறவு வங்கி,');
  const [insReceiverPlace, setInsReceiverPlace] = useState('தேவாரம் கிளை');
  const [insRclNo, setInsRclNo] = useState('107/25-26/P1');
  const [insRclDate, setInsRclDate] = useState('15.04.2026');
  const [insBannerTitle, setInsBannerTitle] = useState('காசுகடன் KCC - உறுப்பினர்கள் விபத்துக் காப்பீடு விவரம்');
  const [editableInsuranceRows, setEditableInsuranceRows] = useState<InsuranceRowData[]>(DEFAULT_INSURANCE_ROWS);

  // Excel Upload state
  const [uploadedExcelData, setUploadedExcelData] = useState<any[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract all added items from disbursements (Parts 2+)
  const allDisbursementItems = disbursements.flatMap((d) => {
    const items = d.part2Data?.addedItems || [];
    return items.map((item: any) => {
      // match member details if missing
      const memberInfo = members.find(m => m.memberNo === item.memberNo) || {};
      const bankInfo = bankAccounts.find(b => b.memberNo === item.memberNo) || {};

      const seedNum = parseFloat(String(item.seed || '0').replace(/[^0-9.]/g, '')) || 0;
      const chemNum = parseFloat(String(item.chemicalFertilizer || item.fertilizer || '0').replace(/[^0-9.]/g, '')) || 0;
      const compNum = parseFloat(String(item.fertilizerKind || item.compost || '0').replace(/[^0-9.]/g, '')) || 0;
      const pestNum = parseFloat(String(item.pesticide || '0').replace(/[^0-9.]/g, '')) || 0;
      const cashNum = parseFloat(String(item.organicFertilizer || item.cash || '0').replace(/[^0-9.]/g, '')) || 0;

      let calcTotalLoan = parseFloat(String(item.totalLoanAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      if (!calcTotalLoan) {
        calcTotalLoan = seedNum + chemNum + compNum + pestNum + cashNum;
      }

      const prevLoanAmountNum = parseFloat(String(item.prevLoanAmount || item.previousLoanAmount || '0').replace(/[^0-9.]/g, '')) || 0;

      return {
        ...item,
        season: item.season || d.season,
        createdDate: item.disbDate || d.createdDate,
        disbNo: item.currentDisbNo || item.disbNo || 'Disb-1',
        fatherOrHusbandName: item.fatherOrHusbandName || memberInfo.fatherOrHusbandName || (memberInfo as any).careOf || '-',
        village: item.village || memberInfo.village || '-',
        kccAccountNo: item.kccAccountNo || memberInfo.kccAccountNo || bankInfo.accountNo || '-',
        mdccAccountNo: item.mdcc || item.mdccAccount || item.mdccAccountNo || memberInfo.mdcc || memberInfo.kccAccountNo || bankInfo.accountNo || item.kccAccountNo || '-',
        sb: item.sb || memberInfo.sb || '-',
        erp: item.erp || memberInfo.erp || '-',
        aClass: item.aClass || item.aNo || item.memberNo || (memberInfo as any).aClass || memberInfo.memberNo || '-',
        ins: item.ins || (memberInfo as any).ins || '-',
        rationCard: item.rationCard || (memberInfo as any).rationCard || (memberInfo as any).smartCard || '-',
        disability: item.disability || (memberInfo as any).disability || 'இல்லை',
        namini: item.namini || (memberInfo as any).namini || item.nominee || '-',
        relation: item.relation || (memberInfo as any).relation || item.relationship || '-',
        insurance: item.insurance !== undefined ? item.insurance : ((item as any).insuranceFee || '0'),
        surveyNo: item.surveyNo || '-',
        prevLoanNo: item.prevLoanNo || item.previousLoanNo || '-',
        prevLoanDate: item.prevLoanDate || item.previousLoanDate || '-',
        prevLoanAmountNum,
        seedNum,
        chemNum,
        compNum,
        pestNum,
        cashNum,
        calcTotalLoan
      };
    });
  });

  // Extract distinct disbursement batch numbers
  const disbNumbers = Array.from(
    new Set(
      allDisbursementItems
        .map(i => (i.disbNo || '').toString().trim())
        .filter(Boolean)
    )
  );

  // Filter items
  const filteredItems = allDisbursementItems.filter(item => {
    const matchesDisb = filterDisbNo === 'all' || item.disbNo === filterDisbNo;
    const matchesSearch = !searchTerm || 
      item.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.memberNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.village?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDisb && matchesSearch;
  });

  // Totals
  const totalMembers = filteredItems.length;
  const totalAcresSum = filteredItems.reduce((acc, item) => acc + (parseFloat(item.acres) || 0), 0);
  const totalPrevLoanSum = filteredItems.reduce((acc, item) => acc + item.prevLoanAmountNum, 0);
  const totalCashSum = filteredItems.reduce((acc, item) => acc + item.cashNum, 0);
  const totalSeedSum = filteredItems.reduce((acc, item) => acc + item.seedNum, 0);
  const totalChemSum = filteredItems.reduce((acc, item) => acc + item.chemNum, 0);
  const totalCompSum = filteredItems.reduce((acc, item) => acc + item.compNum, 0);
  const totalPestSum = filteredItems.reduce((acc, item) => acc + item.pestNum, 0);
  const totalLoanSum = filteredItems.reduce((acc, item) => acc + item.calcTotalLoan, 0);

  // Cropwise totals calculation
  const cropTotCount = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.count) || 0), 0);
  const cropTotAcres = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.acres) || 0), 0);
  const cropTotSeed = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.seed) || 0), 0);
  const cropTotChem = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.chem) || 0), 0);
  const cropTotComp = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.comp) || 0), 0);
  const cropTotPest = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.pest) || 0), 0);
  const cropTotCash = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.cash) || 0), 0);
  const cropTotLoan = editableCropRows.reduce((sum, r) => sum + (parseFloat(r.totalLoan) || 0), 0);

  // Auto-fill Cropwise dynamically from Active Batch Data (only distinct crops recorded in current disbursement)
  const autoFillCropwiseFromActiveData = useCallback(() => {
    const sourceData = filteredItems;

    if (sourceData.length === 0) {
      setCatAmounts({
        newMemberAmt: '',
        scstAmt: '',
        otherAmt: '',
        sfmfAmt: '',
        ofAmt: '',
        femaleAmt: ''
      });
      setEditableCropRows([]);
      return;
    }

    const calcNew = sourceData.filter(i => i.isNew || i.memberType === 'new').reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);
    const calcScst = sourceData.filter(i => {
      const m = members.find(mem => mem.memberNo === i.memberNo);
      const caste = (i.caste || m?.caste || '').toUpperCase();
      return caste.includes('SC') || caste.includes('ST');
    }).reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);
    
    const calcTotalLoanOverall = sourceData.reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);
    const calcOthers = (calcTotalLoanOverall > 0 && calcScst > 0) ? (calcTotalLoanOverall - calcScst) : (calcTotalLoanOverall > 0 ? calcTotalLoanOverall : 0);
    
    const calcSfmf = sourceData.filter(i => {
      const acres = parseFloat(String(i.acres || 0)) || 0;
      return acres > 0 && acres <= 5.0;
    }).reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);
    
    const calcOf = sourceData.filter(i => {
      const acres = parseFloat(String(i.acres || 0)) || 0;
      return acres > 5.0;
    }).reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);
    
    const calcFemale = sourceData.filter(i => {
      const m = members.find(mem => mem.memberNo === i.memberNo);
      const gender = (i.gender || m?.gender || '').toLowerCase();
      return gender.includes('f') || gender.includes('பெண்') || gender.includes('female');
    }).reduce((sum, i) => sum + (i.calcTotalLoan || 0), 0);

    setCatAmounts({
      newMemberAmt: calcNew > 0 ? String(calcNew) : '',
      scstAmt: calcScst > 0 ? String(calcScst) : '',
      otherAmt: calcOthers > 0 ? String(calcOthers) : '',
      sfmfAmt: calcSfmf > 0 ? String(calcSfmf) : '',
      ofAmt: calcOf > 0 ? String(calcOf) : '',
      femaleAmt: calcFemale > 0 ? String(calcFemale) : ''
    });

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

    sourceData.forEach(item => {
      const cropName = (item.crop || '').trim();
      if (!cropName || cropName === '-') return;

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
      existing.acres += parseFloat(String(item.acres || 0)) || 0;
      existing.seed += item.seedNum || 0;
      existing.chem += item.chemNum || 0;
      existing.comp += item.compNum || 0;
      existing.pest += item.pestNum || 0;
      existing.cash += item.cashNum || 0;
      existing.totalLoan += item.calcTotalLoan || (item.seedNum || 0) + (item.chemNum || 0) + (item.compNum || 0) + (item.pestNum || 0) + (item.cashNum || 0);
      cropMap.set(cropName, existing);
    });

    // ONLY the crops that are present in the current disbursement data are included!
    const newRows: CropRowData[] = [];
    let idx = 1;
    cropMap.forEach((data, cropName) => {
      newRows.push({
        id: String(idx++),
        crop: cropName,
        count: data.count > 0 ? String(data.count) : '',
        acres: data.acres > 0 ? data.acres.toFixed(2) : '',
        seed: data.seed > 0 ? String(data.seed) : '',
        chem: data.chem > 0 ? String(data.chem) : '',
        comp: data.comp > 0 ? String(data.comp) : '',
        pest: data.pest > 0 ? String(data.pest) : '',
        cash: data.cash > 0 ? String(data.cash) : '',
        totalLoan: data.totalLoan > 0 ? String(data.totalLoan) : ''
      });
    });

    setEditableCropRows(newRows);
  }, [filteredItems, members]);

  // Auto synchronize cropwise data when active batch filter or activeTab changes
  useEffect(() => {
    autoFillCropwiseFromActiveData();
  }, [filterDisbNo, allDisbursementItems.length, autoFillCropwiseFromActiveData]);

  // Crop row change handler
  const handleCropRowChange = (index: number, field: keyof CropRowData, value: string) => {
    setEditableCropRows(prev => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (['seed', 'chem', 'comp', 'pest', 'cash'].includes(field)) {
        const s = parseFloat(field === 'seed' ? value : current.seed) || 0;
        const ch = parseFloat(field === 'chem' ? value : current.chem) || 0;
        const co = parseFloat(field === 'comp' ? value : current.comp) || 0;
        const p = parseFloat(field === 'pest' ? value : current.pest) || 0;
        const ca = parseFloat(field === 'cash' ? value : current.cash) || 0;
        const rowSum = s + ch + co + p + ca;
        if (rowSum > 0) {
          current.totalLoan = String(rowSum);
        }
      }

      updated[index] = current;
      return updated;
    });
  };

  const handleAddCropRow = () => {
    setEditableCropRows(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        crop: '',
        count: '',
        acres: '',
        seed: '',
        chem: '',
        comp: '',
        pest: '',
        cash: '',
        totalLoan: ''
      }
    ]);
  };

  const handleRemoveCropRow = (index: number) => {
    if (editableCropRows.length <= 1) return;
    setEditableCropRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleResetCropwise = () => {
    setEditableCropRows(DEFAULT_CROPS_LIST.map(c => ({ ...c })));
    setCatAmounts({
      newMemberAmt: '',
      scstAmt: '',
      otherAmt: '',
      sfmfAmt: '',
      ofAmt: '',
      femaleAmt: ''
    });
    setRemittances([
      { date: '', amount: '' },
      { date: '', amount: '' },
      { date: '', amount: '' },
      { date: '', amount: '' },
      { date: '', amount: '' },
      { date: '', amount: '' },
    ]);
  };

  // 4. Insurance (காப்பீடு) helper functions
  const handleInsuranceFieldChange = (index: number, field: keyof InsuranceRowData, value: any) => {
    setEditableInsuranceRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddInsuranceRow = () => {
    const newSNo = editableInsuranceRows.length + 1;
    setEditableInsuranceRows(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sNo: newSNo,
        aNo: '',
        sb: '',
        erp: '',
        ins: '-',
        name: '',
        fatherOrHusbandName: '',
        village: 'தேவாரம்',
        rationCard: '',
        disability: 'இல்லை',
        namini: '',
        relation: '',
        subscription: '0'
      }
    ]);
  };

  const handleRemoveInsuranceRow = (index: number) => {
    setEditableInsuranceRows(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((row, idx) => ({ ...row, sNo: idx + 1 }));
    });
  };

  const handleResetInsurance = () => {
    setEditableInsuranceRows(DEFAULT_INSURANCE_ROWS.map(r => ({ ...r })));
  };

  const handleLoadInsuranceFromBatch = (selectedBatchNo?: string, silent = false) => {
    const targetDisbNo = selectedBatchNo !== undefined ? selectedBatchNo : filterDisbNo;
    const sourceItems = allDisbursementItems.filter(item => {
      const matchesDisb = targetDisbNo === 'all' || item.disbNo === targetDisbNo;
      const matchesSearch = !searchTerm || 
        item.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.memberNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.village?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDisb && matchesSearch;
    });

    if (sourceItems.length === 0) {
      if (!silent) {
        alert('பட்டுவாடா பட்டியலில் உறுப்பினர்கள் யாரும் கிடைக்கவில்லை.');
      }
      return;
    }

    // 1. Group and deduplicate strictly by "அ எண்" (aClass / aNo / memberNo)
    // 2. Filter ONLY members who have an insurance subscription amount entered (> 0) in Section 8
    const memberMap = new Map<string, {
      item: typeof sourceItems[0];
      totalInsurance: number;
    }>();

    sourceItems.forEach(item => {
      const raw = item.insurance !== undefined ? item.insurance : ((item as any).insuranceFee || '0');
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0;
      if (num <= 0) return; // Exclude anyone with 0 or missing insurance

      const aKey = (item.aClass || item.aNo || item.memberNo || '').toString().trim();
      const dedupeKey = aKey && aKey !== '-' ? aKey : ((item.memberName || item.name || '').toString().trim() || String(item.id || Math.random()));

      if (memberMap.has(dedupeKey)) {
        const existing = memberMap.get(dedupeKey)!;
        existing.totalInsurance += num;
        // Merge any non-empty details
        if ((!existing.item.fatherOrHusbandName || existing.item.fatherOrHusbandName === '-') && item.fatherOrHusbandName) {
          existing.item.fatherOrHusbandName = item.fatherOrHusbandName;
        }
        if ((!existing.item.rationCard || existing.item.rationCard === '-') && item.rationCard) {
          existing.item.rationCard = item.rationCard;
        }
        if ((!existing.item.namini || existing.item.namini === '-') && item.namini) {
          existing.item.namini = item.namini;
        }
        if ((!existing.item.relation || existing.item.relation === '-') && item.relation) {
          existing.item.relation = item.relation;
        }
        if ((!existing.item.sb || existing.item.sb === '-') && item.sb) {
          existing.item.sb = item.sb;
        }
        if ((!existing.item.erp || existing.item.erp === '-') && item.erp) {
          existing.item.erp = item.erp;
        }
      } else {
        memberMap.set(dedupeKey, {
          item: { ...item },
          totalInsurance: num
        });
      }
    });

    const insuredMembers = Array.from(memberMap.values()).filter(m => m.totalInsurance > 0);

    if (insuredMembers.length === 0) {
      if (!silent) {
        alert(`தேர்ந்தெடுக்கப்பட்ட பட்டுவாடாவில் (${targetDisbNo === 'all' ? 'அனைத்து பட்டுவாடா' : targetDisbNo}) பகுதி 8ல் காப்பீடு தொகை உள்ளீடு செய்யப்பட்ட உறுப்பினர்கள் எவரும் இல்லை.`);
      }
      return;
    }

    // Automatically sync RCL Number and RCL Date from the batch if present
    const firstItem = insuredMembers[0]?.item || sourceItems[0];
    if (firstItem) {
      if (firstItem.rclNumber || firstItem.rclNo) {
        setInsRclNo(firstItem.rclNumber || firstItem.rclNo);
      }
      if (firstItem.rclDate) {
        setInsRclDate(firstItem.rclDate);
      }
    }

    const loadedRows: InsuranceRowData[] = insuredMembers.map(({ item, totalInsurance }, idx) => {
      const memberInfo = members.find(m => m.memberNo === item.memberNo) || {};
      const bankInfo = bankAccounts.find(b => b.memberNo === item.memberNo) || {};

      return {
        id: String(idx + 1),
        sNo: idx + 1,
        aNo: item.aClass || item.aNo || item.memberNo || (memberInfo as any).aClass || memberInfo.memberNo || '',
        sb: item.sb || memberInfo.sb || bankInfo.accountNo || '',
        erp: item.erp || memberInfo.erp || '',
        ins: item.ins || (memberInfo as any).ins || '-',
        name: item.memberName || item.name || memberInfo.name || '',
        fatherOrHusbandName: item.fatherOrHusbandName || memberInfo.fatherOrHusbandName || (memberInfo as any).careOf || '',
        village: item.village || memberInfo.village || 'தேவாரம்',
        rationCard: item.rationCard || (memberInfo as any).rationCard || (memberInfo as any).smartCard || '',
        disability: item.disability || (memberInfo as any).disability || 'இல்லை',
        namini: item.namini || (memberInfo as any).namini || item.nominee || '',
        relation: item.relation || (memberInfo as any).relation || item.relationship || '',
        subscription: String(totalInsurance)
      };
    });

    setEditableInsuranceRows(loadedRows);
  };

  // Auto-sync insurance rows when batch or disbursements change
  useEffect(() => {
    if (allDisbursementItems.length > 0) {
      const hasInsured = allDisbursementItems.some(i => {
        const raw = i.insurance !== undefined ? i.insurance : ((i as any).insuranceFee || '0');
        return (parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0) > 0;
      });
      if (hasInsured) {
        handleLoadInsuranceFromBatch(filterDisbNo, true);
      }
    }
  }, [filterDisbNo, disbursements.length]);

  const insuranceTotalSubscription = editableInsuranceRows.reduce((acc, row) => {
    const val = parseFloat(String(row.subscription || '0').replace(/[^0-9.]/g, '')) || 0;
    return acc + val;
  }, 0);

  // Generate HTML for 4. Insurance (காப்பீடு) Print matching user uploaded document exactly
  const generateInsurancePrintHtml = () => {
    return `
      <div style="width: 100%; max-width: 100%; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 0;">
        <!-- 1. Two-Column Sender & Receiver Header (அனுப்புநர் & பெறுநர்) matching PDF -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: -1px; font-size: 13px;">
          <tbody>
            <tr>
              <td style="width: 50%; border: 1.5px solid #000000; padding: 8px 12px; vertical-align: top;">
                <div style="display: inline-block; border: 1.5px solid #000000; padding: 2px 8px; font-weight: 900; margin-bottom: 8px; font-size: 13px; color: #000000;">
                  அனுப்புநர்
                </div>
                <div style="font-weight: bold; line-height: 1.45; color: #000000; font-size: 13px;">
                  <div>${insSenderRole}</div>
                  <div>${insSenderSociety}</div>
                  <div>${insSenderPlace}</div>
                </div>
              </td>
              <td style="width: 50%; border: 1.5px solid #000000; padding: 8px 12px; vertical-align: top;">
                <div style="display: inline-block; border: 1.5px solid #000000; padding: 2px 8px; font-weight: 900; margin-bottom: 8px; font-size: 13px; color: #000000;">
                  பெறுநர்
                </div>
                <div style="font-weight: bold; line-height: 1.45; color: #000000; font-size: 13px;">
                  <div>${insReceiverRole}</div>
                  <div>${insReceiverBank}</div>
                  <div>${insReceiverSub}</div>
                  <div>${insReceiverPlace}</div>
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
                <span>மத்திய வங்கி RCL No: ${insRclNo}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span>நாள்:${insRclDate}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: 900; text-align: center; font-size: 14.5px; letter-spacing: 0.3px;">
                ${insBannerTitle}
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
            ${editableInsuranceRows.map((r, idx) => `
              <tr>
                <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${r.aNo || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center;">${r.sb || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center; font-weight: bold;">${r.erp || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 2px; text-align: center;">${r.ins || '-'}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left; font-weight: bold;">${r.name || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left;">${r.fatherOrHusbandName || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${r.village || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center; font-family: monospace; font-size: 11px;">${r.rationCard || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${r.disability || 'இல்லை'}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left;">${r.namini || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center;">${r.relation || ''}</td>
                <td style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; font-weight: bold;">${r.subscription !== undefined && r.subscription !== '' ? r.subscription : '0'}</td>
              </tr>
            `).join('')}
            <!-- Bottom Grand Total Row matching PDF -->
            <tr style="font-weight: 900; border-top: 2px solid #000000;">
              <td colspan="12" style="border: 1.5px solid #000000; padding: 6px 10px; text-align: right;"></td>
              <td style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; font-weight: 900; font-size: 13px;">
                ${insuranceTotalSubscription > 0 ? insuranceTotalSubscription.toLocaleString('en-IN') : '0'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  // Generate crisp HTML matching user PDF screenshot
  const generateCropwisePrintHtml = () => {
    return `
      <div style="width: 100%; max-width: 100%; color: #000000; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; padding: 4px;">
        <!-- 1. Header Box Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; text-align: center; font-weight: bold; margin-bottom: 6px;">
          <tbody>
            <tr>
              <td style="border: 1px solid #000000; padding: 6px; font-size: 15px; font-weight: 900; text-transform: uppercase;">
                ${paccsName}
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px; font-size: 12.5px; font-weight: bold;">
                ${paccsAddress}
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px; font-size: 13px; font-weight: 900;">
                KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px; font-size: 12.5px; font-weight: bold;">
                மத்திய வங்கி RCL No: ${rclNo} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; நாள்:${rclDate}
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
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.newMemberAmt ? (parseFloat(catAmounts.newMemberAmt) ? parseFloat(catAmounts.newMemberAmt).toLocaleString('en-IN') : catAmounts.newMemberAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[0]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[0]?.amount ? (parseFloat(remittances[0]?.amount) ? parseFloat(remittances[0]?.amount).toLocaleString('en-IN') : remittances[0]?.amount) : ''}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px 6px;">SC/ST உறுப்பினர்கள்</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.scstAmt ? (parseFloat(catAmounts.scstAmt) ? parseFloat(catAmounts.scstAmt).toLocaleString('en-IN') : catAmounts.scstAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[1]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[1]?.amount ? (parseFloat(remittances[1]?.amount) ? parseFloat(remittances[1]?.amount).toLocaleString('en-IN') : remittances[1]?.amount) : ''}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px 6px;">இதர உறுப்பினர்கள்</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.otherAmt ? (parseFloat(catAmounts.otherAmt) ? parseFloat(catAmounts.otherAmt).toLocaleString('en-IN') : catAmounts.otherAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[2]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[2]?.amount ? (parseFloat(remittances[2]?.amount) ? parseFloat(remittances[2]?.amount).toLocaleString('en-IN') : remittances[2]?.amount) : ''}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px 6px;">SF/MF உறுப்பினர்கள்</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.sfmfAmt ? (parseFloat(catAmounts.sfmfAmt) ? parseFloat(catAmounts.sfmfAmt).toLocaleString('en-IN') : catAmounts.sfmfAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[3]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[3]?.amount ? (parseFloat(remittances[3]?.amount) ? parseFloat(remittances[3]?.amount).toLocaleString('en-IN') : remittances[3]?.amount) : ''}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px 6px;">OF உறுப்பினர்கள்</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.ofAmt ? (parseFloat(catAmounts.ofAmt) ? parseFloat(catAmounts.ofAmt).toLocaleString('en-IN') : catAmounts.ofAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[4]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[4]?.amount ? (parseFloat(remittances[4]?.amount) ? parseFloat(remittances[4]?.amount).toLocaleString('en-IN') : remittances[4]?.amount) : ''}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 3px 6px;">பெண் உறுப்பினர்கள்</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${catAmounts.femaleAmt ? (parseFloat(catAmounts.femaleAmt) ? parseFloat(catAmounts.femaleAmt).toLocaleString('en-IN') : catAmounts.femaleAmt) : ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${remittances[5]?.date || ''}</td>
              <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${remittances[5]?.amount ? (parseFloat(remittances[5]?.amount) ? parseFloat(remittances[5]?.amount).toLocaleString('en-IN') : remittances[5]?.amount) : ''}</td>
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
            ${editableCropRows.map((r, idx) => `
              <tr>
                <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center; font-weight: bold;">${r.crop || ''}</td>
                <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${r.count || ''}</td>
                <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${formatAcres(r.acres)}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.seed ? (parseFloat(r.seed) ? parseFloat(r.seed).toLocaleString('en-IN') : r.seed) : ''}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.chem ? (parseFloat(r.chem) ? parseFloat(r.chem).toLocaleString('en-IN') : r.chem) : ''}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.comp ? (parseFloat(r.comp) ? parseFloat(r.comp).toLocaleString('en-IN') : r.comp) : ''}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.pest ? (parseFloat(r.pest) ? parseFloat(r.pest).toLocaleString('en-IN') : r.pest) : ''}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right;">${r.cash ? (parseFloat(r.cash) ? parseFloat(r.cash).toLocaleString('en-IN') : r.cash) : ''}</td>
                <td style="border: 1px solid #000000; padding: 3px 6px; text-align: right; font-weight: bold;">${r.totalLoan ? (parseFloat(r.totalLoan) ? parseFloat(r.totalLoan).toLocaleString('en-IN') : r.totalLoan) : ''}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: 900; border-top: 2px solid #000000;">
              <td colspan="2" style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">மொத்தம்</td>
              <td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">${cropTotCount > 0 ? cropTotCount : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: 900;">${cropTotAcres > 0 ? cropTotAcres.toFixed(2) : '0.00'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotSeed > 0 ? cropTotSeed.toLocaleString('en-IN') : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotChem > 0 ? cropTotChem.toLocaleString('en-IN') : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotComp > 0 ? cropTotComp.toLocaleString('en-IN') : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotPest > 0 ? cropTotPest.toLocaleString('en-IN') : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotCash > 0 ? cropTotCash.toLocaleString('en-IN') : '0'}</td>
              <td style="border: 1px solid #000000; padding: 4px 6px; text-align: right; font-weight: 900;">${cropTotLoan > 0 ? cropTotLoan.toLocaleString('en-IN') : '0'}</td>
            </tr>
          </tbody>
        </table>

        <!-- 5. Signatures Section - Pure text without any boxes or borders -->
        <div style="margin-top: 80px; margin-bottom: 20px; width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 900; text-align: center;">
          <div style="width: 30%; text-align: center;">செயலாளர்</div>
          <div style="width: 40%; text-align: center;">தலைவர் / செயலாட்சியர்</div>
          <div style="width: 30%; text-align: center;">சரக மேற்பார்வையாளர்</div>
        </div>
      </div>
    `;
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Direct PDF Download using jsPDF and html2canvas for pixel-perfect Legal Landscape export
  const handleDownloadDirectPDF = async () => {
    if (activeTab === 'kcc1' || activeTab === 'kcc2') {
      if (filteredItems.length === 0) {
        alert('நடப்பு பட்டுவாடா பகுதியில் தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே PDF பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'cropwise') {
      const hasCropData = editableCropRows.some(r => r.crop && (parseFloat(r.count) > 0 || parseFloat(r.acres) > 0 || parseFloat(r.totalLoan) > 0));
      if (!hasCropData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் பயிர் வாரியான தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே PDF பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'insurance') {
      const hasInsData = editableInsuranceRows.some(r => parseFloat(String(r.subscription || 0)) > 0 && r.name);
      if (!hasInsData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் காப்பீடு தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே PDF பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'custom-excel') {
      if (uploadedExcelData.length === 0) {
        alert('எக்செல் கோப்பு பதிவேற்றப்படவில்லை அல்லது தரவுகள் இல்லை.');
        return;
      }
    }

    setIsGeneratingPdf(true);
    try {
      if (activeTab === 'cropwise') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1200px';
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '24px';
        container.innerHTML = generateCropwisePrintHtml();
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'pt', 'legal');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pdfHeight - 40));
        pdf.save(`KCC1_Cropwise_Statement_${rclDate || formDate}.pdf`);
      } else if (activeTab === 'insurance') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1200px';
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '24px';
        container.innerHTML = generateInsurancePrintHtml();
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'pt', 'legal');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pdfHeight - 40));
        pdf.save(`KCC_Insurance_Statement_${insRclDate || formDate}.pdf`);
      } else {
        const targetAreaId = activeTab === 'kcc2' 
          ? 'printable-kcc2-area' 
          : (activeTab === 'custom-excel' ? 'printable-excel-area' : 'printable-kcc1-area');
        const element = document.getElementById(targetAreaId);
        if (!element) {
          handlePrint();
          return;
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'pt', 'legal');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pdfHeight - 40));
        const filename = activeTab === 'kcc2' 
          ? `KCC2_Disbursement_Report_${formDate}.pdf`
          : `KCC1_Disbursement_Report_${formDate}.pdf`;
        pdf.save(filename);
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      // Fallback to standard print dialog
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Print - Opens Legal Landscape Report in a dedicated separate popup window/tab
  const handlePrint = () => {
    if (activeTab === 'kcc1' || activeTab === 'kcc2') {
      if (filteredItems.length === 0) {
        alert('நடப்பு பட்டுவாடா பகுதியில் தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே அச்சிட முடியும்.');
        return;
      }
    } else if (activeTab === 'cropwise') {
      const hasCropData = editableCropRows.some(r => r.crop && (parseFloat(r.count) > 0 || parseFloat(r.acres) > 0 || parseFloat(r.totalLoan) > 0));
      if (!hasCropData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் பயிர் வாரியான தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே அச்சிட முடியும்.');
        return;
      }
    } else if (activeTab === 'insurance') {
      const hasInsData = editableInsuranceRows.some(r => parseFloat(String(r.subscription || 0)) > 0 && r.name);
      if (!hasInsData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் காப்பீடு தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே அச்சிட முடியும்.');
        return;
      }
    } else if (activeTab === 'custom-excel') {
      if (uploadedExcelData.length === 0) {
        alert('எக்செல் கோப்பு பதிவேற்றப்படவில்லை அல்லது தரவுகள் இல்லை.');
        return;
      }
    }

    const targetAreaId = activeTab === 'kcc2' 
      ? 'printable-kcc2-area' 
      : (activeTab === 'cropwise' 
        ? 'printable-cropwise-area' 
        : (activeTab === 'insurance'
          ? 'printable-insurance-area'
          : (activeTab === 'custom-excel' ? 'printable-excel-area' : 'printable-kcc1-area')));
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const formTitleText = activeTab === 'kcc2' 
      ? 'KCC 2 - பயிர்க்கடன் பட்டுவாடா அறிக்கை' 
      : (activeTab === 'cropwise' 
        ? 'KCC 1 - பயிர் வாரியான பயிர்க்கடன் விபரம் (Cropwise Statement)' 
        : (activeTab === 'insurance'
          ? 'காசுகடன் KCC - உறுப்பினர்கள் விபத்துக் காப்பீடு விவரம்'
          : 'KCC 1 - பயிர்க்கடன் பட்டுவாடா அறிக்கை'));

    const printContent = activeTab === 'cropwise'
      ? generateCropwisePrintHtml()
      : (activeTab === 'insurance'
        ? generateInsurancePrintHtml()
        : (document.getElementById(targetAreaId)?.innerHTML || ''));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ta">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${formTitleText} (Legal Landscape Print)</title>
          <script src="https://cdn.tailwindcss.com"></script>
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
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background-color: #ffffff;
              color: #000000;
              padding: 16px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #000000 !important;
              padding: 4px 5px;
              color: #000000 !important;
            }
          </style>
        </head>
        <body class="bg-white text-black p-4">
          <div class="no-print mb-4 flex items-center justify-between bg-stone-100 p-3.5 rounded-xl border border-stone-300 shadow-2xs">
            <div class="flex items-center gap-2">
              <span class="text-xl">📄</span>
              <div>
                <h3 class="text-xs font-black text-stone-900 uppercase tracking-wide">
                  ${formTitleText} - தனி அச்சு சாளரம் (Legal Sheet Landscape)
                </h3>
                <p class="text-[11px] text-stone-600">
                  இந்த சாளரம் லீகல் சீட் (Legal Landscape) அளவிலான அச்சு வடிவமைப்புடன் திறக்கப்பட்டுள்ளது.
                </p>
              </div>
            </div>
            <button 
              onclick="window.print()" 
              class="bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-xs px-6 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🖨️ அச்சிடு (Print Legal Landscape)</span>
            </button>
          </div>
          <div>
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Handle Export to Excel using XLSX
  const handleExportToExcel = () => {
    if (activeTab === 'kcc1' || activeTab === 'kcc2') {
      if (filteredItems.length === 0) {
        alert('நடப்பு பட்டுவாடா பகுதியில் தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே எக்ஸெல் கோப்பாக பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'cropwise') {
      const hasCropData = editableCropRows.some(r => r.crop && (parseFloat(r.count) > 0 || parseFloat(r.acres) > 0 || parseFloat(r.totalLoan) > 0));
      if (!hasCropData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் பயிர் வாரியான தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே எக்ஸெல் கோப்பாக பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'insurance') {
      const hasInsData = editableInsuranceRows.some(r => parseFloat(String(r.subscription || 0)) > 0 && r.name);
      if (!hasInsData) {
        alert('நடப்பு பட்டுவாடா பகுதியில் காப்பீடு தரவுகள் இல்லை. தரவுகள் இருந்தால் மட்டுமே எக்ஸெல் கோப்பாக பதிவிறக்க முடியும்.');
        return;
      }
    } else if (activeTab === 'custom-excel') {
      if (uploadedExcelData.length === 0) {
        alert('எக்செல் கோப்பு பதிவேற்றப்படவில்லை அல்லது தரவுகள் இல்லை.');
        return;
      }
    }
    if (activeTab === 'cropwise') {
      const excelCropRows = editableCropRows.map((r, idx) => ({
        'வ.எண்': idx + 1,
        'பயிர்': r.crop,
        'எண்ணிக்கை': r.count ? (parseFloat(r.count) || r.count) : '',
        'நிலபரப்பு ஏ.செ': formatAcres(r.acres),
        'விதை பகுதி': r.seed ? (parseFloat(r.seed) || r.seed) : '',
        'இரசாயன உரம் 50%': r.chem ? (parseFloat(r.chem) || r.chem) : '',
        'தொழு உரம்': r.comp ? (parseFloat(r.comp) || r.comp) : '',
        'பூச்சி மருந்து': r.pest ? (parseFloat(r.pest) || r.pest) : '',
        'ரொக்கம்': r.cash ? (parseFloat(r.cash) || r.cash) : '',
        'மொத்தம்': r.totalLoan ? (parseFloat(r.totalLoan) || r.totalLoan) : ''
      }));

      excelCropRows.push({
        'வ.எண்': 'மொத்தம்' as any,
        'பயிர்': '',
        'எண்ணிக்கை': cropTotCount,
        'நிலபரப்பு ஏ.செ': cropTotAcres.toFixed(2),
        'விதை பகுதி': cropTotSeed,
        'இரசாயன உரம் 50%': cropTotChem,
        'தொழு உரம்': cropTotComp,
        'பூச்சி மருந்து': cropTotPest,
        'ரொக்கம்': cropTotCash,
        'மொத்தம்': cropTotLoan
      });

      const worksheet = XLSX.utils.json_to_sheet(excelCropRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cropwise_KCC1');
      XLSX.writeFile(workbook, `KCC1_Cropwise_Statement_${formDate}.xlsx`);
      return;
    }

    if (activeTab === 'kcc2') {
      const seenBookChargeMembers = new Set<string>();
      const activeKcc2List = filteredItems.map((item, index) => {
        const seedNum = item.seedNum || 0;
        const chemNum = item.chemNum || 0;
        const compNum = item.compNum || 0;
        const pestNum = item.pestNum || 0;
        const cashNum = item.cashNum || 0;
        const calcTotalLoan = item.calcTotalLoan || (seedNum + chemNum + compNum + pestNum + cashNum);
        const kcc6Num = item.kcc6 !== undefined && item.kcc6 !== ''
          ? (parseFloat(String(item.kcc6).replace(/[^0-9.]/g, '')) || 0)
          : (parseFloat(String(item.fertilizerDeduction || chemNum).replace(/[^0-9.]/g, '')) || chemNum);

        // Book charge (புத்தக பாரம்): Check explicit passbookFee / bookCharge; if omitted/not set, charge 300 only for first row of member
        const aClassKey = String(item.aClass || item.aNo || item.memberNo || item.memberName || '').trim().toLowerCase();
        let bookChargeNum = 0;
        if (item.passbookFee !== undefined && item.passbookFee !== null && String(item.passbookFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.passbookFee).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.bookCharge !== undefined && item.bookCharge !== null && String(item.bookCharge).trim() !== '') {
          bookChargeNum = parseFloat(String(item.bookCharge).replace(/[^0-9.]/g, '')) || 0;
        } else if (item.shareFee !== undefined && item.shareFee !== null && String(item.shareFee).trim() !== '') {
          bookChargeNum = parseFloat(String(item.shareFee).replace(/[^0-9.]/g, '')) || 0;
        } else {
          if (aClassKey && !seenBookChargeMembers.has(aClassKey)) {
            bookChargeNum = 300;
          } else {
            bookChargeNum = 0;
          }
        }
        if (aClassKey) {
          seenBookChargeMembers.add(aClassKey);
        }

        const insuranceNum = parseFloat(String(item.insurance !== undefined ? item.insurance : (item.premium || 0)).replace(/[^0-9.]/g, '')) || 0;
        const shareCapitalNum = parseFloat(String(item.shareCapital !== undefined ? item.shareCapital : (item.shareAmount || item.share || 0)).replace(/[^0-9.]/g, '')) || 0;
        const totalDeductionNum = kcc6Num + bookChargeNum + insuranceNum + shareCapitalNum;
        const netDisbursementNum = calcTotalLoan - totalDeductionNum;
        const mdccAccountNo = item.mdccAccountNo || item.mdcc || item.kccAccountNo || item.sb || '-';

        return {
          'வ.எண்': index + 1,
          'அ.எண்': item.aNo || item.memberNo,
          'SB': item.sb || '-',
          'ERP': item.erp || '-',
          'பெயர்': item.memberName,
          'சர்வே எண்': item.surveyNo || '-',
          'பரப்பு': formatAcres(item.acres),
          'பயிர்': item.crop || '-',
          'விதை பகுதி': seedNum,
          'ரசாயன உரம்': chemNum,
          'தொழு உரம்': compNum,
          'பூச்சி மருந்து': pestNum,
          'ரொக்கம்': cashNum,
          'மொத்தம்': calcTotalLoan,
          'CC6': kcc6Num,
          'புத்தக பாரம்': bookChargeNum,
          'காப்பீடு': insuranceNum,
          'பங்கு தொகை': shareCapitalNum,
          'மொத்த பிடித்தம்': totalDeductionNum,
          'நிகர பட்டுவாடா': netDisbursementNum,
          'MDCC கணக்கு எண்': mdccAccountNo
        };
      });

      const totAcres = activeKcc2List.reduce((acc, r) => acc + (parseFloat(r['பரப்பு'] as any) || 0), 0);
      const totSeed = activeKcc2List.reduce((acc, r) => acc + (Number(r['விதை பகுதி']) || 0), 0);
      const totChem = activeKcc2List.reduce((acc, r) => acc + (Number(r['ரசாயன உரம்']) || 0), 0);
      const totComp = activeKcc2List.reduce((acc, r) => acc + (Number(r['தொழு உரம்']) || 0), 0);
      const totPest = activeKcc2List.reduce((acc, r) => acc + (Number(r['பூச்சி மருந்து']) || 0), 0);
      const totCash = activeKcc2List.reduce((acc, r) => acc + (Number(r['ரொக்கம்']) || 0), 0);
      const totLoan = activeKcc2List.reduce((acc, r) => acc + (Number(r['மொத்தம்']) || 0), 0);
      const totKcc6 = activeKcc2List.reduce((acc, r) => acc + (Number(r['CC6']) || 0), 0);
      const totBook = activeKcc2List.reduce((acc, r) => acc + (Number(r['புத்தக பாரம்']) || 0), 0);
      const totIns = activeKcc2List.reduce((acc, r) => acc + (Number(r['காப்பீடு']) || 0), 0);
      const totShare = activeKcc2List.reduce((acc, r) => acc + (Number(r['பங்கு தொகை']) || 0), 0);
      const totDed = activeKcc2List.reduce((acc, r) => acc + (Number(r['மொத்த பிடித்தம்']) || 0), 0);
      const totNet = activeKcc2List.reduce((acc, r) => acc + (Number(r['நிகர பட்டுவாடா']) || 0), 0);

      activeKcc2List.push({
        'வ.எண்': 'மொத்தம்' as any,
        'அ.எண்': `${activeKcc2List.length} நபர்கள்` as any,
        'SB': '',
        'ERP': '',
        'பெயர்': '',
        'சர்வே எண்': '',
        'பரப்பு': totAcres.toFixed(2) as any,
        'பயிர்': '',
        'விதை பகுதி': totSeed,
        'ரசாயன உரம்': totChem,
        'தொழு உரம்': totComp,
        'பூச்சி மருந்து': totPest,
        'ரொக்கம்': totCash,
        'மொத்தம்': totLoan,
        'CC6': totKcc6,
        'புத்தக பாரம்': totBook,
        'காப்பீடு': totIns,
        'பங்கு தொகை': totShare,
        'மொத்த பிடித்தம்': totDed,
        'நிகர பட்டுவாடா': totNet,
        'MDCC கணக்கு எண்': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(activeKcc2List);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'KCC2_Disbursement');
      XLSX.writeFile(workbook, `KCC2_Disbursement_Statement_${formDate}.xlsx`);
      return;
    }

    if (activeTab === 'insurance') {
      const insExcelRows = editableInsuranceRows.map((r, idx) => ({
        'வ.எண்': idx + 1,
        'அ எண்': r.aNo,
        'SB எண்': r.sb,
        'ERP': r.erp,
        'Ins': r.ins,
        'பெயர்': r.name,
        'தகப்பனார் / கணவர் பெயர்': r.fatherOrHusbandName,
        'கிராமம்': r.village,
        'குடும்ப அட்டை எண்': r.rationCard,
        'உடலில் உள்ள குறைபாடு': r.disability,
        'நாமினியின் பெயர்': r.namini,
        'உறவு': r.relation,
        'சந்தாத் தொகை': r.subscription
      }));

      insExcelRows.push({
        'வ.எண்': 'மொத்தம்' as any,
        'அ எண்': '',
        'SB எண்': '',
        'ERP': '',
        'Ins': '',
        'பெயர்': '',
        'தகப்பனார் / கணவர் பெயர்': '',
        'கிராமம்': '',
        'குடும்ப அட்டை எண்': '',
        'உடலில் உள்ள குறைபாடு': '',
        'நாமினியின் பெயர்': '',
        'உறவு': '',
        'சந்தாத் தொகை': insuranceTotalSubscription as any
      });

      const worksheet = XLSX.utils.json_to_sheet(insExcelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'KCC_Insurance');
      XLSX.writeFile(workbook, `KCC_Insurance_Statement_${insRclDate || formDate}.xlsx`);
      return;
    }

    const excelRows = filteredItems.map((item, index) => ({
      'வ.எண்': index + 1,
      'உறுப்பினர் எண்': item.memberNo,
      'உறுப்பினர் பெயர்': item.memberName,
      'தந்தை / கணவர் பெயர்': item.fatherOrHusbandName,
      'கிராமம்': item.village,
      'பயிர்': item.crop,
      'பரப்பு (ஏக்கர்)': formatAcres(item.acres),
      'ரொக்கம் (₹)': item.cashNum,
      'விதை (₹)': item.seedNum,
      'ரசாயன உரம் (₹)': item.chemNum,
      'காம்ப்ளக்ஸ்/உரம் (₹)': item.compNum,
      'பூச்சிக்கொல்லி (₹)': item.pestNum,
      'மொத்த கடன் தொகை (₹)': item.calcTotalLoan,
      'KCC வங்கி கணக்கு எண்': item.kccAccountNo,
      'பட்டுவாடா எண்': item.disbNo
    }));

    // Add totals row
    excelRows.push({
      'வ.எண்': 'மொத்தம்' as any,
      'உறுப்பினர் எண்': `${totalMembers} நபர்கள்`,
      'உறுப்பினர் பெயர்': '',
      'தந்தை / கணவர் பெயர்': '',
      'கிராமம்': '',
      'பயிர்': '',
      'பரப்பு (ஏக்கர்)': totalAcresSum.toFixed(2) as any,
      'ரொக்கம் (₹)': totalCashSum as any,
      'விதை (₹)': totalSeedSum as any,
      'ரசாயன உரம் (₹)': totalChemSum as any,
      'காம்ப்ளக்ஸ்/உரம் (₹)': totalCompSum as any,
      'பூச்சிக்கொல்லி (₹)': totalPestSum as any,
      'மொத்த கடன் தொகை (₹)': totalLoanSum as any,
      'KCC வங்கி கணக்கு எண்': '',
      'பட்டுவாடா எண்': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KCC1_Disbursement');
    XLSX.writeFile(workbook, `KCC1_Disbursement_Statement_${formDate}.xlsx`);
  };

  // Handle Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length > 0) {
          const headers = (data[0] as string[]).map(h => String(h || '').trim());
          const rows = data.slice(1).filter((r: any) => r && r.length > 0);
          setExcelHeaders(headers);
          setUploadedExcelData(rows);
        }
      } catch (err) {
        alert('எக்ஸெல் கோப்பை படிப்பதில் பிழை ஏற்பட்டது. தயவுசெய்து சரியான .xlsx அல்லது .csv கோப்பை தேர்ந்தெடுக்கவும்.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 pb-16 text-stone-900 font-sans">
      {/* Print Specific CSS Styles for Legal Sheet Landscape */}
      <style>{`
        @media print {
          @page {
            size: legal landscape;
            margin: 5mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-kcc1-area, #printable-kcc1-area *,
          #printable-kcc2-area, #printable-kcc2-area *,
          #printable-cropwise-area, #printable-cropwise-area *,
          #printable-insurance-area, #printable-insurance-area *,
          #printable-excel-area, #printable-excel-area * {
            visibility: visible;
          }
          #printable-kcc1-area, #printable-kcc2-area, #printable-cropwise-area, #printable-insurance-area, #printable-excel-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            font-size: 10pt !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 3px 5px !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Screen Header (Hides during print) */}
      <div className="no-print bg-gradient-to-r from-[#007A4D] to-[#005c3a] text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#D1EAE0] text-[#007A4D] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#007A4D]/20 uppercase">
                REPORTS & PRINT FORMS
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">
              அச்சுப் படிவங்கள் மற்றும் அறிக்கைகள் (Print Forms & Reports)
            </h1>
            <p className="text-xs text-[#D1EAE0] max-w-2xl mt-1 leading-relaxed">
              நடப்பு பட்டுவாடா விபரங்களிலிருந்து அதிகாரப்பூர்வ அச்சு படிவங்களான <strong>கேசிசி 1 (KCC 1)</strong>, <strong>கேசிசி 2 (KCC 2)</strong>, <strong>பயிர் வாரியான KCC 1 அறிக்கை (Cropwise)</strong> மற்றும் <strong>4.காப்பீடு (Insurance விபத்துக் காப்பீடு)</strong> தயாரித்து Legal Sheet Landscape வடிவில் அச்சிடலாம் அல்லது எக்ஸெல் (.xlsx) கோப்பாக பதிவிறக்கம் செய்யலாம்.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleDownloadDirectPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="நேரடியாக PDF கோப்பாக பதிவிறக்கம் செய்க"
            >
              <FileDown className="w-4 h-4 text-stone-950" />
              <span>{isGeneratingPdf ? 'PDF தயாராகிறது...' : 'PDF பதிவிறக்கம்'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-[#007A4D] hover:bg-[#FAF9F5] font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#007A4D]" />
              <span>அச்சிடு / PDF (Print)</span>
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 bg-[#D1EAE0] hover:bg-white text-[#007A4D] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-[#007A4D]/20"
            >
              <Download className="w-4 h-4 text-[#007A4D]" />
              <span>Excel பதிவிறக்கு</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={() => setActiveTab('kcc1')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'kcc1'
                ? 'bg-white text-[#007A4D] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. கேசிசி 1 படிவம் (KCC 1)</span>
          </button>

          <button
            onClick={() => setActiveTab('kcc2')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'kcc2'
                ? 'bg-white text-[#007A4D] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. கேசிசி 2 படிவம் (KCC 2)</span>
          </button>

          <button
            onClick={() => setActiveTab('cropwise')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'cropwise'
                ? 'bg-white text-[#007A4D] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Cropwise (பயிர் வாரியாக)</span>
          </button>

          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'insurance'
                ? 'bg-white text-[#007A4D] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. காப்பீடு (Insurance)</span>
          </button>

          <button
            onClick={() => setActiveTab('custom-excel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'custom-excel'
                ? 'bg-white text-[#007A4D] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>5. எக்ஸெல் கோப்பை பதிவேற்றி அச்சிட</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KCC 1 PRINT FORM */}
      {activeTab === 'kcc1' && (
        <div className="space-y-6">
          {/* Controls & Filter Panel (No Print) */}
          <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-3">
              <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
                <Filter className="w-4 h-4 text-[#007A4D]" />
                <span>KCC 1 படிவத் தலைப்பு & அச்சு அமைப்புகள் (Form & Header Settings)</span>
              </div>
              <span className="text-xs text-stone-500">
                மொத்த விபரங்கள்: <strong className="text-[#007A4D] font-mono font-bold">{filteredItems.length > 0 ? filteredItems.length : 3} நபர்கள்</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
              <div className="sm:col-span-2">
                <label className="block text-stone-600 font-bold mb-1">சங்கத்தின் பெயர் (PACS Title):</label>
                <input
                  type="text"
                  value={paccsName}
                  onChange={(e) => setPaccsName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-600 font-bold mb-1">முகவரி / வட்டம் / மாவட்டம் (Address):</label>
                <input
                  type="text"
                  value={paccsAddress}
                  onChange={(e) => setPaccsAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">மத்திய வங்கி RCL எண்:</label>
                <input
                  type="text"
                  value={rclNo}
                  onChange={(e) => setRclNo(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">RCL நாள்:</label>
                <input
                  type="text"
                  value={rclDate}
                  onChange={(e) => setRclDate(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">தீர்மான எண்:</label>
                <input
                  type="text"
                  value={resolutionNo}
                  onChange={(e) => setResolutionNo(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">தீர்மான தேதி:</label>
                <input
                  type="text"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">பட்டுவாடா எண்:</label>
                <input
                  type="text"
                  value={disbursementNo}
                  onChange={(e) => setDisbursementNo(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">பட்டுவாடா தேதி:</label>
                <input
                  type="text"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">பட்டுவாடா தொகுதி வடிகட்டி:</label>
                <select
                  value={filterDisbNo}
                  onChange={(e) => setFilterDisbNo(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-stone-300 rounded-xl font-bold text-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none cursor-pointer"
                >
                  <option value="all">அனைத்து பட்டுவாடா தொகுதிகள் (All)</option>
                  {disbNumbers.map(dNo => (
                    <option key={dNo} value={dNo}>{dNo}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handlePrint}
                  className="w-full bg-[#007A4D] hover:bg-[#00633e] text-white font-black text-xs p-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>அச்சிடு (Legal Landscape Print)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="உறுப்பினர் பெயர், எண் அல்லது கிராமம் தேடுக..."
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-stone-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#007A4D] outline-none"
                />
              </div>
            </div>
          </div>

          {/* PRINTABLE AREA: OFFICIAL KCC 1 FORM STATEMENT */}
          {(() => {
            const activeItems = filteredItems;

            const dispTotalMembers = activeItems.length;
            const dispTotalAcres = activeItems.reduce((acc, item: any) => acc + (parseFloat(item.acres) || 0), 0);
            const dispTotalPrevLoan = activeItems.reduce((acc, item: any) => acc + (item.prevLoanAmountNum || 0), 0);
            const dispTotalSeed = activeItems.reduce((acc, item: any) => acc + (item.seedNum || 0), 0);
            const dispTotalCash = activeItems.reduce((acc, item: any) => acc + (item.cashNum || 0), 0);
            const dispTotalChem = activeItems.reduce((acc, item: any) => acc + (item.chemNum || 0), 0);
            const dispTotalComp = activeItems.reduce((acc, item: any) => acc + (item.compNum || 0), 0);
            const dispTotalPest = activeItems.reduce((acc, item: any) => acc + (item.pestNum || 0), 0);
            const dispTotalLoan = activeItems.reduce((acc, item: any) => acc + (item.calcTotalLoan || 0), 0);

            return (
              <div 
                id="printable-kcc1-area"
                className="bg-white p-6 rounded-2xl border border-[#E2E2DC] shadow-sm text-black font-sans space-y-3"
              >
                {/* Header Title Section matching prompt image */}
                <div className="text-center space-y-1">
                  <h1 className="text-lg sm:text-xl font-black text-black tracking-wide uppercase">
                    {paccsName}
                  </h1>
                  <h2 className="text-xs font-bold text-black">
                    {paccsAddress}
                  </h2>
                  <div className="pt-1">
                    <div className="inline-block border-2 border-black px-6 py-1 text-sm sm:text-base font-black text-black uppercase tracking-wider">
                      KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்
                    </div>
                  </div>
                  <div className="text-xs font-bold text-black pt-1">
                    மத்திய வங்கி RCL No: <span className="font-semibold">{rclNo}</span> &nbsp;&nbsp;&nbsp;&nbsp; நாள்:<span className="font-semibold">{rclDate}</span>
                  </div>
                </div>

                {/* Metadata Grid Bar */}
                <table className="w-full border-collapse border border-black text-center font-bold text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">தீர்மான எண்</td>
                      <td className="border border-black p-1 w-[8%] font-mono">{resolutionNo}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">தீர்மான தேதி</td>
                      <td className="border border-black p-1 w-[18%] font-mono">{resolutionDate}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">பட்டுவாடா எண்</td>
                      <td className="border border-black p-1 w-[8%] font-mono">{disbursementNo}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">பட்டுவாடா தேதி</td>
                      <td className="border border-black p-1 w-[18%] font-mono"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub Header Loan Summary Banner */}
                <div className="flex justify-end mb-2">
                  <table className="border-collapse border border-black font-bold text-xs ml-auto">
                    <tbody>
                      <tr>
                        <td className="border border-black text-right px-3 py-1.5 bg-stone-50">
                          KCC1ல் தற்போது பட்டுவாடா கோரும் தொகை
                        </td>
                        <td className="border border-black text-right px-3 py-1.5 font-mono text-sm font-black whitespace-nowrap">
                          ₹ {dispTotalLoan.toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Main KCC 1 Multi-level Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs text-black">
                    <thead>
                      <tr className="bg-stone-50 text-black font-black text-[11px] text-center border-b border-black">
                        <th className="border border-black p-1 w-8" rowSpan={2}>வ.எண்</th>
                        <th className="border border-black p-1 w-12" rowSpan={2}>அ.எண்</th>
                        <th className="border border-black p-1 w-10" rowSpan={2}>SB</th>
                        <th className="border border-black p-1 w-16" rowSpan={2}>ERP</th>
                        <th className="border border-black p-1 text-center min-w-[100px]" rowSpan={2}>பெயர்</th>
                        <th className="border border-black p-1 text-center" colSpan={3}>முன்கடன் திருப்பி செலுத்திய விபரம்</th>
                        <th className="border border-black p-1 w-16" rowSpan={2}>சர்வே எண்</th>
                        <th className="border border-black p-1 w-14" rowSpan={2}>பரப்பு ஏ.செ</th>
                        <th className="border border-black p-1 w-14" rowSpan={2}>பயிர்</th>
                        <th className="border border-black p-1 w-12" rowSpan={2}>விதை பகுதி</th>
                        <th className="border border-black p-1 w-16" rowSpan={2}>இரசாயன உரம் 50%</th>
                        <th className="border border-black p-1 w-16" rowSpan={2}>தொழு உரம் 50%</th>
                        <th className="border border-black p-1 w-16" rowSpan={2}>பூச்சி மருந்து</th>
                        <th className="border border-black p-1 w-18" rowSpan={2}>ரொக்கம்</th>
                        <th className="border border-black p-1 w-20" rowSpan={2}>மொத்தம்</th>
                      </tr>
                      <tr className="bg-stone-50 text-black font-black text-[11px] text-center border-b border-black">
                        <th className="border border-black p-1 min-w-[80px]">முன்கடன் எண்</th>
                        <th className="border border-black p-1 min-w-[80px]">முன்கடன் தேதி</th>
                        <th className="border border-black p-1 min-w-[80px]">முன்கடன் தொகை</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeItems.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="border border-black p-8 text-center text-sm font-bold text-stone-500 bg-stone-50">
                            நடப்பு பட்டுவாடா பகுதியில் உறுப்பினர்கள் / தரவுகள் எதுவும் சேர்க்கப்படவில்லை.
                          </td>
                        </tr>
                      ) : (
                        activeItems.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-black text-center font-medium text-[11px]">
                          <td className="border border-black p-1 font-mono font-bold">{idx + 1}</td>
                          <td className="border border-black p-1 font-mono font-bold">{item.aNo || item.memberNo}</td>
                          <td className="border border-black p-1 font-mono">{item.sb || '-'}</td>
                          <td className="border border-black p-1 font-mono font-bold">{item.erp || '-'}</td>
                          <td className="border border-black p-1 text-center font-bold text-black">{item.memberName}</td>
                          <td className="border border-black p-1 font-mono text-center">{item.prevLoanNo || '-'}</td>
                          <td className="border border-black p-1 font-mono text-center">{formatDateDDMMYYYY(item.prevLoanDate)}</td>
                          <td className="border border-black p-1 text-right font-mono font-semibold">
                            {item.prevLoanAmountNum ? item.prevLoanAmountNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 font-mono text-center">{item.surveyNo || '-'}</td>
                          <td className="border border-black p-1 text-right font-mono font-bold">{formatAcres(item.acres)}</td>
                          <td className="border border-black p-1 text-center font-semibold">{item.crop || '-'}</td>
                          <td className="border border-black p-1 text-center font-mono">
                            {item.seedNum ? item.seedNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.chemNum ? item.chemNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.compNum ? item.compNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.pestNum ? item.pestNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-semibold">
                            {item.cashNum ? item.cashNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-bold">
                            {item.calcTotalLoan ? item.calcTotalLoan.toLocaleString('en-IN') : '-'}
                          </td>
                        </tr>
                      )))}

                      {/* Totals Summary Row matching exact image layout */}
                      <tr className="bg-stone-50 font-black text-black text-[11px] border-t-2 border-black text-center">
                        <td colSpan={7} className="border border-black p-1.5 text-right uppercase font-black">
                          மொத்தம்
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalPrevLoan.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalAcres.toFixed(2)}
                        </td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalSeed ? dispTotalSeed.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalChem.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalComp.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalPest.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalCash.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-black">
                          {dispTotalLoan.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures Section - Secretary & President / Executive Officer with balanced moderate spacing */}
                <div className="pt-8 pb-4">
                  <div className="flex justify-center items-center gap-24 sm:gap-40 text-center text-xs font-black text-black">
                    <div className="space-y-1 text-center">
                      <div className="h-10"></div>
                      <div className="border-t-2 border-black pt-1.5 min-w-[140px] font-black text-xs">செயலாளர்</div>
                    </div>
                    <div className="space-y-1 text-center">
                      <div className="h-10"></div>
                      <div className="border-t-2 border-black pt-1.5 min-w-[180px] font-black text-xs">தலைவர் / செயலாட்சியர்</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: KCC 2 PRINT FORM */}
      {activeTab === 'kcc2' && (
        <div className="space-y-6">
          {/* Controls & Filter Panel (No Print) */}
          <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-3">
              <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
                <Filter className="w-4 h-4 text-[#007A4D]" />
                <span>KCC 2 படிவத் தலைப்பு & அச்சு அமைப்புகள் (KCC 2 Form & Header Settings)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>KCC 2 படிவத்தை அச்சிடு (Print Legal Sheet)</span>
                </button>
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-stone-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>Excel (.xlsx) பதிவிறக்கு</span>
                </button>
              </div>
            </div>

            {/* Config Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்கத்தின் பெயர் (PACCS Name)
                </label>
                <input
                  type="text"
                  value={paccsName}
                  onChange={(e) => setPaccsName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்கத்தின் முகவரி & மாவட்டம்
                </label>
                <input
                  type="text"
                  value={paccsAddress}
                  onChange={(e) => setPaccsAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL எண்
                </label>
                <input
                  type="text"
                  value={rclNo}
                  onChange={(e) => setRclNo(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL நாள்
                </label>
                <input
                  type="text"
                  value={rclDate}
                  onChange={(e) => setRclDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்க தீர்மான எண்
                </label>
                <input
                  type="text"
                  value={resolutionNo}
                  onChange={(e) => setResolutionNo(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்க தீர்மான தேதி
                </label>
                <input
                  type="text"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பட்டுவாடா எண் (Disbursement No)
                </label>
                <input
                  type="text"
                  value={disbursementNo}
                  onChange={(e) => setDisbursementNo(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பட்டுவாடா தேதி (Disbursement Date)
                </label>
                <input
                  type="text"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>
            </div>

            {/* Filter by Disbursement and Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-600">பட்டுவாடா எண் வாரியாக:</span>
                  <select
                    value={filterDisbNo}
                    onChange={(e) => setFilterDisbNo(e.target.value)}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 outline-none"
                  >
                    <option value="all">அனைத்து பட்டுவாடாக்களும் (All)</option>
                    {disbNumbers.map(no => (
                      <option key={no} value={no}>பட்டுவாடா எண்: {no}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="உறுப்பினர் / கணக்கு எண் தேடு..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 outline-none w-56"
                  />
                </div>
              </div>

              <div className="text-xs font-bold text-stone-600">
                மொத்த பதிவுகள்: <span className="text-[#007A4D] font-mono font-black">{filteredItems.length} நபர்கள்</span>
              </div>
            </div>
          </div>

          {/* PRINTABLE AREA: OFFICIAL KCC 2 FORM STATEMENT */}
          {(() => {
            const seenBookChargeMembers = new Set<string>();
            const activeKcc2List = filteredItems.map((item, idx) => {
              const seedNum = item.seedNum || 0;
              const chemNum = item.chemNum || 0;
              const compNum = item.compNum || 0;
              const pestNum = item.pestNum || 0;
              const cashNum = item.cashNum || 0;
              const calcTotalLoan = item.calcTotalLoan || (seedNum + chemNum + compNum + pestNum + cashNum);
              const kcc6Num = item.kcc6 !== undefined && item.kcc6 !== ''
                ? (parseFloat(String(item.kcc6).replace(/[^0-9.]/g, '')) || 0)
                : (parseFloat(String(item.fertilizerDeduction || chemNum).replace(/[^0-9.]/g, '')) || chemNum);

              const aClassKey = String(item.aClass || item.aNo || item.memberNo || item.memberName || '').trim().toLowerCase();
              let bookChargeNum = 0;
              if (item.passbookFee !== undefined && item.passbookFee !== null && String(item.passbookFee).trim() !== '') {
                bookChargeNum = parseFloat(String(item.passbookFee).replace(/[^0-9.]/g, '')) || 0;
              } else if (item.bookCharge !== undefined && item.bookCharge !== null && String(item.bookCharge).trim() !== '') {
                bookChargeNum = parseFloat(String(item.bookCharge).replace(/[^0-9.]/g, '')) || 0;
              } else if (item.shareFee !== undefined && item.shareFee !== null && String(item.shareFee).trim() !== '') {
                bookChargeNum = parseFloat(String(item.shareFee).replace(/[^0-9.]/g, '')) || 0;
              } else {
                if (aClassKey && !seenBookChargeMembers.has(aClassKey)) {
                  bookChargeNum = 300;
                } else {
                  bookChargeNum = 0;
                }
              }
              if (aClassKey) {
                seenBookChargeMembers.add(aClassKey);
              }

              const insuranceNum = parseFloat(String(item.insurance !== undefined ? item.insurance : (item.premium || 0)).replace(/[^0-9.]/g, '')) || 0;
              const shareCapitalNum = parseFloat(String(item.shareCapital !== undefined ? item.shareCapital : (item.shareAmount || item.share || 0)).replace(/[^0-9.]/g, '')) || 0;
              const totalDeductionNum = kcc6Num + bookChargeNum + insuranceNum + shareCapitalNum;
              const netDisbursementNum = calcTotalLoan - totalDeductionNum;
              const mdccAccountNo = item.mdccAccountNo || item.mdcc || item.kccAccountNo || item.sb || '-';

              return {
                sNo: idx + 1,
                aNo: item.aNo || item.memberNo,
                sb: item.sb || '-',
                erp: item.erp || '-',
                memberName: item.memberName,
                surveyNo: item.surveyNo || '-',
                acres: item.acres || '0.00',
                crop: item.crop || '-',
                seedNum,
                chemNum,
                compNum,
                pestNum,
                cashNum,
                calcTotalLoan,
                kcc6Num,
                bookChargeNum,
                insuranceNum,
                shareCapitalNum,
                totalDeductionNum,
                netDisbursementNum,
                mdccAccountNo
              };
            });

            const dispTotalMembers = activeKcc2List.length;
            const dispTotalAcres = activeKcc2List.reduce((acc, it) => acc + (parseFloat(String(it.acres)) || 0), 0);
            const dispTotalSeed = activeKcc2List.reduce((acc, it) => acc + (it.seedNum || 0), 0);
            const dispTotalChem = activeKcc2List.reduce((acc, it) => acc + (it.chemNum || 0), 0);
            const dispTotalComp = activeKcc2List.reduce((acc, it) => acc + (it.compNum || 0), 0);
            const dispTotalPest = activeKcc2List.reduce((acc, it) => acc + (it.pestNum || 0), 0);
            const dispTotalCash = activeKcc2List.reduce((acc, it) => acc + (it.cashNum || 0), 0);
            const dispTotalLoan = activeKcc2List.reduce((acc, it) => acc + (it.calcTotalLoan || 0), 0);
            const dispTotalKcc6 = activeKcc2List.reduce((acc, it) => acc + (it.kcc6Num || 0), 0);
            const dispTotalBook = activeKcc2List.reduce((acc, it) => acc + (it.bookChargeNum || 0), 0);
            const dispTotalIns = activeKcc2List.reduce((acc, it) => acc + (it.insuranceNum || 0), 0);
            const dispTotalShare = activeKcc2List.reduce((acc, it) => acc + (it.shareCapitalNum || 0), 0);
            const dispTotalDed = activeKcc2List.reduce((acc, it) => acc + (it.totalDeductionNum || 0), 0);
            const dispTotalNet = activeKcc2List.reduce((acc, it) => acc + (it.netDisbursementNum || 0), 0);

            return (
              <div
                id="printable-kcc2-area"
                className="bg-white p-6 rounded-2xl border border-black/20 shadow-md text-black space-y-4 print:p-0 print:border-none print:shadow-none"
              >
                {/* Official PACS Header */}
                <div className="text-center space-y-1 border-b-2 border-black pb-3">
                  <h2 className="text-base font-black tracking-wide text-black uppercase">
                    {paccsName}
                  </h2>
                  <p className="text-xs font-semibold text-black">
                    {paccsAddress}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block border border-black bg-stone-100 px-4 py-0.5 text-xs font-black tracking-wider text-black uppercase">
                      KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்
                    </span>
                  </div>
                </div>

                {/* Metadata details table */}
                <table className="w-full border-collapse border border-black text-xs font-bold text-black mb-2">
                  <tbody>
                    <tr className="text-center">
                      <td className="border border-black bg-stone-50 p-1 w-[14%]">மத்திய வங்கி RCL எண்</td>
                      <td className="border border-black p-1 w-[20%] font-mono">{rclNo}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[14%]">மத்திய வங்கி RCL நாள்</td>
                      <td className="border border-black p-1 w-[20%] font-mono">{rclDate}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[14%]">படிவ நாள்</td>
                      <td className="border border-black p-1 w-[18%] font-mono">{formDate}</td>
                    </tr>
                    <tr className="text-center">
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">சங்க தீர்மான எண்</td>
                      <td className="border border-black p-1 w-[8%] font-mono">{resolutionNo}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[14%]">சங்க தீர்மான தேதி</td>
                      <td className="border border-black p-1 w-[18%] font-mono">{resolutionDate}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">பட்டுவாடா எண்</td>
                      <td className="border border-black p-1 w-[8%] font-mono">{disbursementNo}</td>
                      <td className="border border-black bg-stone-50 p-1 w-[12%]">பட்டுவாடா தேதி</td>
                      <td className="border border-black p-1 w-[18%] font-mono"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub Header Loan Summary Banner with Right Aligned Total */}
                <div className="flex justify-end mb-2">
                  <table className="border-collapse border border-black font-bold text-xs ml-auto">
                    <tbody>
                      <tr>
                        <td className="border border-black text-right px-3 py-1.5 bg-stone-50">
                          KCC 1ல் தற்போது பட்டுவாடா கோரும் தொகை
                        </td>
                        <td className="border border-black text-right px-3 py-1.5 font-mono text-sm font-black whitespace-nowrap">
                          ₹ {dispTotalLoan.toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Main KCC 2 Table matching reference image */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black">
                    <thead>
                      <tr className="bg-stone-50 text-black font-black text-[10px] text-center border-b border-black">
                        <th className="border border-black p-1 w-6">வ.எண்</th>
                        <th className="border border-black p-1 w-10">அ.எண்</th>
                        <th className="border border-black p-1 w-8">SB</th>
                        <th className="border border-black p-1 w-14">ERP</th>
                        <th className="border border-black p-1 text-center min-w-[85px]">பெயர்</th>
                        <th className="border border-black p-1 w-14">சர்வே எண்</th>
                        <th className="border border-black p-1 w-10">பரப்பு</th>
                        <th className="border border-black p-1 w-12">பயிர்</th>
                        <th className="border border-black p-1 w-10">விதை பகுதி</th>
                        <th className="border border-black p-1 w-12">ரசாயன உரம்</th>
                        <th className="border border-black p-1 w-12">தொழு உரம்</th>
                        <th className="border border-black p-1 w-12">பூச்சி மருந்து</th>
                        <th className="border border-black p-1 w-14">ரொக்கம்</th>
                        <th className="border border-black p-1 w-14">மொத்தம்</th>
                        <th className="border border-black p-1 w-12">CC6</th>
                        <th className="border border-black p-1 w-12">புத்தக பாரம்</th>
                        <th className="border border-black p-1 w-10">காப்பீடு</th>
                        <th className="border border-black p-1 w-12">பங்கு தொகை</th>
                        <th className="border border-black p-1 w-14">மொத்த பிடித்தம்</th>
                        <th className="border border-black p-1 w-16">நிகர பட்டுவாடா</th>
                        <th className="border border-black p-1 min-w-[80px]">MDCC கணக்கு எண்</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeKcc2List.length === 0 ? (
                        <tr>
                          <td colSpan={21} className="border border-black p-8 text-center text-sm font-bold text-stone-500 bg-stone-50">
                            நடப்பு பட்டுவாடா பகுதியில் உறுப்பினர்கள் / தரவுகள் எதுவும் சேர்க்கப்படவில்லை.
                          </td>
                        </tr>
                      ) : (
                        activeKcc2List.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-black text-center font-medium text-[10px]">
                          <td className="border border-black p-1 font-mono font-bold">{idx + 1}</td>
                          <td className="border border-black p-1 font-mono font-bold">{item.aNo}</td>
                          <td className="border border-black p-1 font-mono">{item.sb}</td>
                          <td className="border border-black p-1 font-mono font-bold">{item.erp}</td>
                          <td className="border border-black p-1 text-center font-bold text-black whitespace-nowrap">{item.memberName}</td>
                          <td className="border border-black p-1 font-mono text-center">{item.surveyNo}</td>
                          <td className="border border-black p-1 text-right font-mono font-bold">{formatAcres(item.acres)}</td>
                          <td className="border border-black p-1 text-center font-semibold">{item.crop}</td>
                          <td className="border border-black p-1 text-center font-mono">
                            {item.seedNum ? item.seedNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.chemNum ? item.chemNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.compNum ? item.compNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.pestNum ? item.pestNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-semibold">
                            {item.cashNum ? item.cashNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-bold">
                            {item.calcTotalLoan ? item.calcTotalLoan.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.kcc6Num ? item.kcc6Num.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.bookChargeNum ? item.bookChargeNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-center font-mono">
                            {item.insuranceNum ? item.insuranceNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono">
                            {item.shareCapitalNum ? item.shareCapitalNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-bold">
                            {item.totalDeductionNum ? item.totalDeductionNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 text-right font-mono font-black text-black">
                            {item.netDisbursementNum ? item.netDisbursementNum.toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="border border-black p-1 font-mono text-center font-bold">{item.mdccAccountNo}</td>
                        </tr>
                      )))}

                      {/* Totals Summary Row */}
                      <tr className="bg-stone-50 font-black text-black text-[10px] border-t-2 border-black text-center">
                        <td colSpan={6} className="border border-black p-1 text-right uppercase font-black">
                          மொத்தம் ({dispTotalMembers} நபர்கள்)
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalAcres.toFixed(2)}
                        </td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center font-mono">
                          {dispTotalSeed ? dispTotalSeed.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalChem.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalComp.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalPest.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalCash.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalLoan.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalKcc6.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalBook.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-center font-mono font-black">
                          {dispTotalIns ? dispTotalIns.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalShare ? dispTotalShare.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalDed.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1 text-right font-mono font-black">
                          {dispTotalNet.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures Section - Secretary & President / Executive Officer with balanced moderate spacing */}
                <div className="pt-8 pb-4">
                  <div className="flex justify-center items-center gap-24 sm:gap-40 text-center text-xs font-black text-black">
                    <div className="space-y-1 text-center">
                      <div className="h-10"></div>
                      <div className="border-t-2 border-black pt-1.5 min-w-[140px] font-black text-xs">செயலாளர்</div>
                    </div>
                    <div className="space-y-1 text-center">
                      <div className="h-10"></div>
                      <div className="border-t-2 border-black pt-1.5 min-w-[180px] font-black text-xs">தலைவர் / செயலாட்சியர்</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: CROPWISE KCC 1 STATEMENT */}
      {activeTab === 'cropwise' && (
        <div className="space-y-6">
          {/* Controls & Toolbar Panel */}
          <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E2DC] pb-3">
              <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
                <Filter className="w-4 h-4 text-[#007A4D]" />
                <span>3. Cropwise (பயிர் வாரியான KCC1 பயிர்க்கடன் அறிக்கை & நேரடி உள்ளீடு)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={autoFillCropwiseFromActiveData}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="தற்போதைய பட்டுவாடா பட்டியலின் அடிப்படையில் தானாக கணக்கிட்டு நிரப்புக"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>பட்டுவாடாவிலிருந்து தானாக நிரப்பு</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddCropRow}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ புதிய பயிர் வரிசை</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCropwise}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer border border-stone-300"
                  title="அனைத்து உள்ளீடுகளையும் மீட்டமை"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>மீட்டமை</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDirectPDF}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Cropwise அறிக்கையை நேரடியாக PDF ஆக பதிவிறக்கம் செய்ய"
                >
                  <FileDown className="w-3.5 h-3.5 text-stone-950" />
                  <span>{isGeneratingPdf ? 'PDF தயாராகிறது...' : 'PDF பதிவிறக்கம்'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-[#007A4D] hover:bg-[#00633e] text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>அச்சிடு / PDF (Print Legal Landscape)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-stone-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Config Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்கத்தின் பெயர் (PACCS Name)
                </label>
                <input
                  type="text"
                  value={paccsName}
                  onChange={(e) => setPaccsName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்கத்தின் முகவரி & மாவட்டம்
                </label>
                <input
                  type="text"
                  value={paccsAddress}
                  onChange={(e) => setPaccsAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL எண்
                </label>
                <input
                  type="text"
                  value={rclNo}
                  onChange={(e) => setRclNo(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL நாள்
                </label>
                <input
                  type="text"
                  value={rclDate}
                  onChange={(e) => setRclDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none font-mono"
                />
              </div>
            </div>

            {/* Filter by batch for auto-fill helper */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">பட்டுவாடா தொகுதி:</span>
                <select
                  value={filterDisbNo}
                  onChange={(e) => setFilterDisbNo(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 outline-none cursor-pointer"
                >
                  <option value="all">அனைத்து பட்டுவாடாக்களும் (All)</option>
                  {disbNumbers.map(no => (
                    <option key={no} value={no}>பட்டுவாடா எண்: {no}</option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] text-stone-500 italic">
                * அட்டவணையில் நேரடியாக எண்களை உள்ளீடு செய்யலாம். அச்சிடும்போது PDF போன்ற துல்லியமான அச்சுப் படிவம் வரும்.
              </div>
            </div>
          </div>

          {/* PRINTABLE & DIRECT EDIT AREA */}
          <div
            id="printable-cropwise-area"
            className="bg-white p-6 rounded-2xl border border-black/20 shadow-md text-black space-y-4 print:p-0 print:border-none print:shadow-none"
          >
            {/* 1. Official Header Box Table */}
            <table className="w-full border-collapse border border-black text-center text-xs font-black text-black">
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 text-sm font-black tracking-wide uppercase">
                    {paccsName}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-xs font-bold">
                    {paccsAddress}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-xs font-black bg-stone-50">
                    KCC 1 ல் பயிர்க்கடன் பட்டுவாடா விபரம்
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-xs font-bold font-mono">
                    மத்திய வங்கி RCL No: {rclNo} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; நாள்:{rclDate}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2. Members Category & Bank Remittance Table (4 Columns, 6 Rows) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-stone-50 text-center font-black text-black">
                    <th className="border border-black p-1.5 w-[28%]">உறுப்பினர்கள் வகை</th>
                    <th className="border border-black p-1.5 w-[22%]">தொகை</th>
                    <th className="border border-black p-1.5 w-[25%]">வங்கி கிளையில்<br/>இருசால் தேதி</th>
                    <th className="border border-black p-1.5 w-[25%]">வங்கி கிளையில்<br/>இருசால் தொகை</th>
                  </tr>
                </thead>
                <tbody className="font-semibold">
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">புதிய உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.newMemberAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, newMemberAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[0]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[0] = { ...updated[0], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[0]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[0] = { ...updated[0], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">SC/ST உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.scstAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, scstAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[1]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[1] = { ...updated[1], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[1]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[1] = { ...updated[1], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">இதர உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.otherAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, otherAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[2]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[2] = { ...updated[2], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[2]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[2] = { ...updated[2], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">SF/MF உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.sfmfAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, sfmfAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[3]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[3] = { ...updated[3], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[3]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[3] = { ...updated[3], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">OF உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.ofAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, ofAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[4]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[4] = { ...updated[4], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[4]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[4] = { ...updated[4], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-bold">பெண் உறுப்பினர்கள்</td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={catAmounts.femaleAmt}
                        onChange={(e) => setCatAmounts({ ...catAmounts, femaleAmt: e.target.value })}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[5]?.date || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[5] = { ...updated[5], date: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={remittances[5]?.amount || ''}
                        onChange={(e) => {
                          const updated = [...remittances];
                          updated[5] = { ...updated[5], amount: e.target.value };
                          setRemittances(updated);
                        }}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-50/50"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Title Banner */}
            <div className="border border-black bg-stone-100 p-1.5 text-center text-xs font-black tracking-wider text-black uppercase">
              பயிர் வாரியான KCC1 பயிர்க்கடன் விபரம்
            </div>

            {/* 4. Editable Cropwise Statement Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-stone-50 font-black text-center text-[11px] text-black">
                    <th className="border border-black p-1 w-10">வ.எண்</th>
                    <th className="border border-black p-1 min-w-[120px]">பயிர்</th>
                    <th className="border border-black p-1 w-16">எண்ணிக்கை</th>
                    <th className="border border-black p-1 w-20">நிலபரப்பு<br/>ஏ.செ</th>
                    <th className="border border-black p-1 w-20">விதை பகுதி</th>
                    <th className="border border-black p-1 w-24">இரசாயன<br/>உரம் 50%</th>
                    <th className="border border-black p-1 w-20">தொழு<br/>உரம்</th>
                    <th className="border border-black p-1 w-20">பூச்சி மருந்து</th>
                    <th className="border border-black p-1 w-24">ரொக்கம்</th>
                    <th className="border border-black p-1 w-24">மொத்தம்</th>
                    <th className="no-print border border-black p-1 w-10 text-stone-400">நீக்கு</th>
                  </tr>
                </thead>
                <tbody className="font-semibold">
                  {editableCropRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30">
                      <td className="border border-black p-1 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.crop}
                          onChange={(e) => handleCropRowChange(idx, 'crop', e.target.value)}
                          placeholder="பயிர் பெயர்"
                          className="w-full px-2 py-1 text-center font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.count}
                          onChange={(e) => handleCropRowChange(idx, 'count', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-center font-mono font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.acres}
                          onChange={(e) => handleCropRowChange(idx, 'acres', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-1 py-1 text-center font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.seed}
                          onChange={(e) => handleCropRowChange(idx, 'seed', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.chem}
                          onChange={(e) => handleCropRowChange(idx, 'chem', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.comp}
                          onChange={(e) => handleCropRowChange(idx, 'comp', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.pest}
                          onChange={(e) => handleCropRowChange(idx, 'pest', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.cash}
                          onChange={(e) => handleCropRowChange(idx, 'cash', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border border-black p-0.5">
                        <input
                          type="text"
                          value={r.totalLoan}
                          onChange={(e) => handleCropRowChange(idx, 'totalLoan', e.target.value)}
                          placeholder="0"
                          className="w-full px-1 py-1 text-right font-mono font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="no-print border border-black p-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCropRow(idx)}
                          disabled={editableCropRows.length <= 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1 cursor-pointer"
                          title="வரிசையை நீக்கு"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-stone-100 font-black text-black border-t-2 border-black">
                    <td colSpan={2} className="border border-black p-1 text-center font-black">
                      மொத்தம்
                    </td>
                    <td className="border border-black p-1 text-center font-mono font-black">
                      {cropTotCount > 0 ? cropTotCount : '0'}
                    </td>
                    <td className="border border-black p-1 text-center font-mono font-black">
                      {cropTotAcres > 0 ? cropTotAcres.toFixed(2) : '0.00'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotSeed > 0 ? cropTotSeed.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotChem > 0 ? cropTotChem.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotComp > 0 ? cropTotComp.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotPest > 0 ? cropTotPest.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotCash > 0 ? cropTotCash.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black">
                      {cropTotLoan > 0 ? cropTotLoan.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="no-print border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Official Signatures Section - 3 Signatures with generous signing height and NO box / border lines */}
            <div className="pt-20 pb-8">
              <div className="flex justify-between items-center px-6 sm:px-14 text-center text-xs font-black text-black">
                <div className="min-w-[140px] text-center font-black text-xs">செயலாளர்</div>
                <div className="min-w-[240px] text-center font-black text-xs">தலைவர் / செயலாட்சியர்</div>
                <div className="min-w-[150px] text-center font-black text-xs">சரக மேற்பார்வையாளர்</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INSURANCE (காப்பீடு) STATEMENT */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          {/* Controls & Toolbar Panel (No Print) */}
          <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E2DC] pb-3">
              <div>
                <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#007A4D]" />
                  <span>4. காப்பீடு (Insurance விபத்துக் காப்பீடு) தலைப்பு & அச்சு அமைப்புகள்</span>
                </div>
                <p className="text-[11px] text-[#007A4D] font-bold mt-1 bg-[#D1EAE0]/50 px-2 py-0.5 rounded-md inline-block">
                  ※ பகுதி 8ல் காப்பீடு தொகை உள்ளீடு செய்யப்பட்ட உறுப்பினர்கள் மட்டுமே இவ்வறிக்கையில் அச்சிடப்படுவர்
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadInsuranceFromBatch(filterDisbNo)}
                  className="flex items-center gap-1.5 bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                  title="தேர்ந்தெடுக்கப்பட்ட பட்டுவாடாவிலிருந்து காப்பீடு உள்ள உறுப்பினர்களை மட்டும் தானாக ஏற்று"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>பட்டுவாடாவிலிருந்து ஏற்று</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddInsuranceRow}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>வரிசை சேர்</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetInsurance}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  title="இயல்புநிலைக்கு மீட்டமை"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                  <span>மீட்டமை</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>அச்சிடு (Print)</span>
                </button>
              </div>
            </div>

            {/* Filter by Disbursement Batch in Insurance tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  பட்டுவாடா தொகுதி வடிகட்டி:
                </label>
                <select
                  value={filterDisbNo}
                  onChange={(e) => {
                    const newDisb = e.target.value;
                    setFilterDisbNo(newDisb);
                    handleLoadInsuranceFromBatch(newDisb);
                  }}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-[#007A4D] focus:ring-2 focus:ring-[#007A4D] outline-none cursor-pointer"
                >
                  <option value="all">அனைத்து பட்டுவாடா தொகுதிகள் (All)</option>
                  {disbNumbers.map(dNo => (
                    <option key={dNo} value={dNo}>{dNo}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center justify-between text-xs pt-4">
                <span className="text-stone-600">
                  தேர்ந்தெடுக்கப்பட்ட பட்டுவாடாவில் காப்பீடு பெற்றவர்கள்: <strong className="text-[#007A4D] font-mono text-sm">{editableInsuranceRows.length}</strong> நபர்கள்
                </span>
                <span className="text-stone-600">
                  மொத்த சந்தாத் தொகை: <strong className="text-[#007A4D] font-mono text-sm">₹ {insuranceTotalSubscription.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Editable Header Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  அனுப்புநர் பதவி / பதவிப் பெயர்
                </label>
                <input
                  type="text"
                  value={insSenderRole}
                  onChange={(e) => setInsSenderRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  சங்கத்தின் பெயர்
                </label>
                <input
                  type="text"
                  value={insSenderSociety}
                  onChange={(e) => setInsSenderSociety(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  அனுப்புநர் ஊர் / இருப்பிடம்
                </label>
                <input
                  type="text"
                  value={insSenderPlace}
                  onChange={(e) => setInsSenderPlace(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பெறுநர் பதவி / பெயர்
                </label>
                <input
                  type="text"
                  value={insReceiverRole}
                  onChange={(e) => setInsReceiverRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பெறுநர் வங்கி பெயர்
                </label>
                <input
                  type="text"
                  value={insReceiverBank}
                  onChange={(e) => setInsReceiverBank(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பெறுநர் வங்கி துணைத் தலைப்பு
                </label>
                <input
                  type="text"
                  value={insReceiverSub}
                  onChange={(e) => setInsReceiverSub(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  பெறுநர் கிளை
                </label>
                <input
                  type="text"
                  value={insReceiverPlace}
                  onChange={(e) => setInsReceiverPlace(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL எண்
                </label>
                <input
                  type="text"
                  value={insRclNo}
                  onChange={(e) => setInsRclNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  மத்திய வங்கி RCL நாள்
                </label>
                <input
                  type="text"
                  value={insRclDate}
                  onChange={(e) => setInsRclDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  அறிக்கையின் முதன்மைத் தலைப்பு
                </label>
                <input
                  type="text"
                  value={insBannerTitle}
                  onChange={(e) => setInsBannerTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#007A4D] outline-none"
                />
              </div>
            </div>
          </div>

          {/* PRINTABLE AREA: INSURANCE STATEMENT (Exact match to PDF) */}
          <div
            id="printable-insurance-area"
            className="bg-white p-6 rounded-2xl border border-black shadow-md text-black space-y-0 print:p-0 print:border-none print:shadow-none"
          >
            {/* 1. Two-Column Sender & Receiver Header (அனுப்புநர் & பெறுநர்) matching PDF */}
            <div className="grid grid-cols-2 border-1.5 border-black text-xs">
              <div className="border-r-1.5 border-black p-3 space-y-1 font-bold">
                <div className="inline-block border-1.5 border-black px-2 py-0.5 font-black text-xs mb-1">
                  அனுப்புநர்
                </div>
                <div className="space-y-0.5 leading-tight font-bold text-xs">
                  <div>{insSenderRole}</div>
                  <div>{insSenderSociety}</div>
                  <div>{insSenderPlace}</div>
                </div>
              </div>
              <div className="p-3 space-y-1 font-bold">
                <div className="inline-block border-1.5 border-black px-2 py-0.5 font-black text-xs mb-1">
                  பெறுநர்
                </div>
                <div className="space-y-0.5 leading-tight font-bold text-xs">
                  <div>{insReceiverRole}</div>
                  <div>{insReceiverBank}</div>
                  <div>{insReceiverSub}</div>
                  <div>{insReceiverPlace}</div>
                </div>
              </div>
            </div>

            {/* 2. RCL No, Date & Title Banner matching PDF */}
            <div className="border-x-1.5 border-b-1.5 border-black text-xs">
              <div className="flex justify-center items-center gap-8 px-4 py-1.5 border-b-1.5 border-black font-black text-xs">
                <span>மத்திய வங்கி RCL No: {insRclNo}</span>
                <span>நாள்:{insRclDate}</span>
              </div>
              <div className="p-2 text-center font-black text-sm tracking-wide bg-white">
                {insBannerTitle}
              </div>
            </div>

            {/* 3. Insurance Details 13-Column Table matching PDF exactly */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-1.5 border-black text-xs text-black">
                <thead>
                  <tr className="bg-white font-black text-[11px] text-center border-b-1.5 border-black">
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[4.5%]">வ எண்</th>
                    <th colSpan={5} className="border-1.5 border-black p-1.5">உறுப்பினர் விபரம்</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[14%]">தகப்பனார் /<br/>கணவர் பெயர்</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[8.5%]">கிராமம்</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[11%]">குடும்ப<br/>அட்டை<br/>எண்</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[8.5%]">உடலில்<br/>உள்ள<br/>குறைபாடு</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[11%]">நாமினியின்<br/>பெயர்</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[6%]">உறவு</th>
                    <th rowSpan={2} className="border-1.5 border-black p-1.5 w-[7.5%]">சந்தாத்<br/>தொகை</th>
                    <th rowSpan={2} className="no-print border-1.5 border-black p-1 w-[3%]">நீக்கு</th>
                  </tr>
                  <tr className="bg-white font-black text-[11px] text-center border-b-1.5 border-black">
                    <th className="border-1.5 border-black p-1 w-[5.5%]">அ எண்</th>
                    <th className="border-1.5 border-black p-1 w-[6.5%]">SB எண்</th>
                    <th className="border-1.5 border-black p-1 w-[6%]">ERP</th>
                    <th className="border-1.5 border-black p-1 w-[5%]">Initial</th>
                    <th className="border-1.5 border-black p-1 w-[11%]">பெயர்</th>
                  </tr>
                </thead>
                <tbody>
                  {editableInsuranceRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 text-center border-b border-black text-[11px]">
                      <td className="border-1.5 border-black p-1 font-bold">{idx + 1}</td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.aNo}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'aNo', e.target.value)}
                          className="w-full px-1 py-0.5 text-center font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.sb}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'sb', e.target.value)}
                          className="w-full px-1 py-0.5 text-center bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.erp}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'erp', e.target.value)}
                          className="w-full px-1 py-0.5 text-center font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.ins}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'ins', e.target.value)}
                          className="w-full px-1 py-0.5 text-center bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'name', e.target.value)}
                          className="w-full px-1 py-0.5 text-left font-bold text-black bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.fatherOrHusbandName}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'fatherOrHusbandName', e.target.value)}
                          className="w-full px-1 py-0.5 text-left bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.village}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'village', e.target.value)}
                          className="w-full px-1 py-0.5 text-center bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.rationCard}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'rationCard', e.target.value)}
                          className="w-full px-1 py-0.5 text-center font-mono bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.disability}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'disability', e.target.value)}
                          className="w-full px-1 py-0.5 text-center bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.namini}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'namini', e.target.value)}
                          className="w-full px-1 py-0.5 text-left font-medium bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.relation}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'relation', e.target.value)}
                          className="w-full px-1 py-0.5 text-center bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="border-1.5 border-black p-0.5">
                        <input
                          type="text"
                          value={r.subscription}
                          onChange={(e) => handleInsuranceFieldChange(idx, 'subscription', e.target.value)}
                          className="w-full px-1 py-0.5 text-center font-bold bg-transparent outline-none focus:bg-amber-100/50 rounded"
                        />
                      </td>
                      <td className="no-print border-1.5 border-black p-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInsuranceRow(idx)}
                          disabled={editableInsuranceRows.length <= 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1 cursor-pointer"
                          title="வரிசையை நீக்கு"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row matching PDF */}
                  <tr className="bg-white font-black text-black border-t-2 border-black">
                    <td colSpan={12} className="border-1.5 border-black p-2 text-right"></td>
                    <td className="border-1.5 border-black p-2 text-center font-black text-xs">
                      {insuranceTotalSubscription > 0 ? insuranceTotalSubscription.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="no-print border-1.5 border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOM EXCEL UPLOAD & PRINT */}
      {activeTab === 'custom-excel' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E2DC] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D1EAE0] text-[#007A4D] flex items-center justify-center font-bold">
                <Upload className="w-5 h-5 text-[#007A4D]" />
              </div>
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  உங்களிடம் உள்ள எக்ஸெல் (.xlsx / .csv) கோப்பை பதிவேற்றி அச்சிடுதல்
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  உங்கள் கணினியில் ஏற்கனவே உள்ள எக்ஸெல் சீட்டை இங்கு பதிவேற்றி உடனடியாக அச்சுப் படிவமாகவோ அல்லது PDF ஆகவோ மாற்றலாம்.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-[#007A4D]/30 bg-[#FAF9F5] p-8 rounded-2xl text-center space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-[#007A4D] mx-auto opacity-80" />
              <div>
                <p className="font-bold text-stone-800 text-sm">
                  உங்கள் எக்ஸெல் (.xlsx அல்லது .csv) கோப்பை தேர்ந்தெடுக்கவும்
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  கோப்பைத் தேர்ந்தெடுத்தவுடன் அட்டவணை தானாகவே திரையில் தோன்றும், அதை உடனடியாக அச்சிடலாம்.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#007A4D] hover:bg-[#00633e] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>எக்ஸெல் கோப்பைத் தேர்ந்தெடு (Select Excel File)</span>
              </button>

              {uploadedFileName && (
                <div className="inline-flex items-center gap-2 bg-[#D1EAE0] text-[#007A4D] font-bold text-xs px-3 py-1 rounded-full border border-[#007A4D]/20 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ஏற்றப்பட்ட கோப்பு: {uploadedFileName} ({uploadedExcelData.length} வரிகள்)</span>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Excel Preview Table */}
          {uploadedExcelData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E2DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E2DC] pb-3">
                <h4 className="font-extrabold text-stone-900 text-sm">
                  ஏற்றப்பட்ட எக்ஸெல் கோப்பின் முன்னோட்டம் ({uploadedExcelData.length} தரவுகள்)
                </h4>

                <button
                  onClick={handlePrint}
                  className="bg-[#007A4D] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-[#00633e]"
                >
                  <Printer className="w-4 h-4" />
                  <span>இந்த எக்ஸெல் அட்டவணையை அச்சிடு (Print)</span>
                </button>
              </div>

              <div id="printable-kcc1-area" className="overflow-x-auto">
                <div className="text-center mb-4 pb-2 border-b border-stone-800">
                  <h3 className="font-black text-lg text-stone-900 uppercase">{uploadedFileName.replace(/\.[^/.]+$/, '')}</h3>
                  <p className="text-xs text-stone-600 font-bold">PACS அச்சு அறிக்கை | தேதி: {formDate}</p>
                </div>

                <table className="w-full border-collapse border border-stone-800 text-xs text-stone-900">
                  <thead>
                    <tr className="bg-stone-100 font-black text-[11px] text-center border-b border-stone-800">
                      {excelHeaders.map((header, hIdx) => (
                        <th key={hIdx} className="border border-stone-800 p-2">{header || `பத்தி ${hIdx + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedExcelData.map((row: any[], rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50 border-b border-stone-300">
                        {excelHeaders.map((_, cIdx) => (
                          <td key={cIdx} className="border border-stone-800 p-2 font-medium">
                            {row[cIdx] !== undefined ? String(row[cIdx]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
