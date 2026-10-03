import React, { useState, useRef } from 'react';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2,
  ExternalLink,
  FileText,
  IndianRupee,
  Printer,
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import { LoanMember, KCCDisbursementRecord } from '../types';
import { CooperativeLogo } from './CooperativeLogo';
import { numberToTamilWords } from '../utils/formatters';

interface AHApplicationScreenProps {
  members: LoanMember[];
  disbursements?: KCCDisbursementRecord[];
  spreadsheetId?: string;
  onAddNewMember?: () => void;
}

// Helper to separate initial and name into distinct visual cells matching uploaded document
const splitInitialAndName = (fullName?: string, initial?: string): { ins: string; name: string } => {
  if (initial && initial.trim()) {
    const cleanIns = initial.trim().replace(/\./g, '');
    let cleanName = (fullName || '').trim();
    if (cleanName.startsWith(cleanIns)) {
      cleanName = cleanName.substring(cleanIns.length).trim().replace(/^\./, '').trim();
    }
    return { ins: cleanIns, name: cleanName };
  }
  const parts = (fullName || '').trim().split(' ');
  if (parts.length >= 2 && parts[0].length <= 2) {
    return { ins: parts[0].replace(/\./g, ''), name: parts.slice(1).join(' ') };
  }
  return { ins: '', name: fullName || '' };
};

export const AHApplicationScreen: React.FC<AHApplicationScreenProps> = ({
  members = []
}) => {
  // Initialized completely empty so form is blank by default until member is searched
  const [borrowerAClassInput, setBorrowerAClassInput] = useState<string>('');
  const [guarantorAClassInput, setGuarantorAClassInput] = useState<string>('');

  // Search status & feedback messages
  const [borrowerSearchStatus, setBorrowerSearchStatus] = useState<string>('');
  const [guarantorSearchStatus, setGuarantorSearchStatus] = useState<string>('');

  // Tab opening guards to prevent rapid double-triggering
  const isOpeningDeclarationRef = useRef(false);
  const isOpeningPhotoProofRef = useRef(false);
  const isOpeningSevenPercentRef = useRef(false);
  const isOpeningAppRef = useRef(false);

  // In-app modal preview state for bulletproof previewing in iframe / popup-blocked browsers
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
  }>({
    isOpen: false,
    title: '',
    html: ''
  });

  // Universal preview opener: tries clean same-origin new window first, falls back to in-app modal
  const openDocumentPreview = (html: string, title: string) => {
    let opened = false;
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        opened = true;
      }
    } catch {
      opened = false;
    }

    if (!opened) {
      setPreviewModal({
        isOpen: true,
        title,
        html
      });
    }
  };

  // Society details matching uploaded template
  const [societyTitle] = useState('KCC - கால்நடை வளர்ப்பு மற்றும் அவை தொடர்பான இதர பணிகளுக்கான மூலதன கடன் மனு');
  const [societyBanner] = useState('TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம், தேவாரம்');

  // Borrower personal fields - initialized EMPTY
  const [borrowerAClass, setBorrowerAClass] = useState<string>('');
  const [borrowerIns, setBorrowerIns] = useState<string>('');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerCareOf, setBorrowerCareOf] = useState<string>('');
  const [borrowerDoor, setBorrowerDoor] = useState<string>('');
  const [borrowerStreet, setBorrowerStreet] = useState<string>('');
  const [borrowerVillage, setBorrowerVillage] = useState<string>('');
  const [borrowerMobile, setBorrowerMobile] = useState<string>('');
  const [borrowerAadhar, setBorrowerAadhar] = useState<string>('');
  const [borrowerRationCard, setBorrowerRationCard] = useState<string>('');
  const [borrowerMdccKcc, setBorrowerMdccKcc] = useState<string>('');
  const [borrowerErp, setBorrowerErp] = useState<string>('');
  const [borrowerSb, setBorrowerSb] = useState<string>('');
  const [borrowerPan, setBorrowerPan] = useState<string>('');

  // Animal Husbandry specific fields - Table 1
  const [animalType, setAnimalType] = useState<string>('');
  const [animalCount, setAnimalCount] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanReqAmount, setLoanReqAmount] = useState<string>('');
  const [eligibleCount, setEligibleCount] = useState<string>('');
  const [eligibleCash, setEligibleCash] = useState<string>('');

  // Previous Loan & Share details - Table 2 (Single row of large boxes below headers)
  const [prevLoanNo, setPrevLoanNo] = useState<string>('');
  const [prevLoanDate, setPrevLoanDate] = useState<string>('');
  const [prevLoanAmount, setPrevLoanAmount] = useState<string>('');
  const [existingShare, setExistingShare] = useState<string>('');
  const [deductedShare, setDeductedShare] = useState<string>('');

  // Self-Declaration Certificate (சுய அறிவிப்பு உறுதிமொழி) print state
  const [declarationBlankMode] = useState<boolean>(false);
  const [declarationLayoutMode, setDeclarationLayoutMode] = useState<'standard' | 'lineByLine'>('lineByLine');
  const [declarationInterestRate, setDeclarationInterestRate] = useState<string>('7%');
  const [declarationDate, setDeclarationDate] = useState<string>(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}.${m}.${y}`;
  });
  const [declarationPlace, setDeclarationPlace] = useState<string>('தேவாரம்');

  // Guarantor personal fields - initialized EMPTY
  const [guarantorAClass, setGuarantorAClass] = useState<string>('');
  const [guarantorIns, setGuarantorIns] = useState<string>('');
  const [guarantorName, setGuarantorName] = useState<string>('');
  const [guarantorCareOf, setGuarantorCareOf] = useState<string>('');
  const [guarantorDoor, setGuarantorDoor] = useState<string>('');
  const [guarantorStreet, setGuarantorStreet] = useState<string>('');
  const [guarantorVillage, setGuarantorVillage] = useState<string>('');
  const [guarantorMobile, setGuarantorMobile] = useState<string>('');
  const [guarantorAadhar, setGuarantorAadhar] = useState<string>('');
  const [guarantorRationCard, setGuarantorRationCard] = useState<string>('');
  const [guarantorMdccKcc, setGuarantorMdccKcc] = useState<string>('');
  const [guarantorErp, setGuarantorErp] = useState<string>('');
  const [guarantorSb, setGuarantorSb] = useState<string>('');

  // Clear all fields for printing a completely blank form
  const clearAllFields = () => {
    setBorrowerAClassInput('');
    setGuarantorAClassInput('');
    setBorrowerAClass('');
    setBorrowerIns('');
    setBorrowerName('');
    setBorrowerCareOf('');
    setBorrowerDoor('');
    setBorrowerStreet('');
    setBorrowerVillage('');
    setBorrowerMobile('');
    setBorrowerAadhar('');
    setBorrowerRationCard('');
    setBorrowerMdccKcc('');
    setBorrowerErp('');
    setBorrowerSb('');
    setBorrowerPan('');
    setBorrowerSearchStatus('');
    setAnimalType('');
    setAnimalCount('');
    setLoanAmount('');
    setLoanReqAmount('');
    setEligibleCount('');
    setEligibleCash('');
    setPrevLoanNo('');
    setPrevLoanDate('');
    setPrevLoanAmount('');
    setExistingShare('');
    setDeductedShare('');

    setGuarantorAClass('');
    setGuarantorIns('');
    setGuarantorName('');
    setGuarantorCareOf('');
    setGuarantorDoor('');
    setGuarantorStreet('');
    setGuarantorVillage('');
    setGuarantorMobile('');
    setGuarantorAadhar('');
    setGuarantorRationCard('');
    setGuarantorMdccKcc('');
    setGuarantorErp('');
    setGuarantorSb('');
    setGuarantorSearchStatus('');
  };

  const performBorrowerSearch = (query: string) => {
    const q = query.trim();
    if (!q) {
      setBorrowerAClass('');
      setBorrowerIns('');
      setBorrowerName('');
      setBorrowerCareOf('');
      setBorrowerDoor('');
      setBorrowerStreet('');
      setBorrowerVillage('');
      setBorrowerMobile('');
      setBorrowerAadhar('');
      setBorrowerRationCard('');
      setBorrowerMdccKcc('');
      setBorrowerErp('');
      setBorrowerSb('');
      setBorrowerPan('');
      setAnimalType('');
      setAnimalCount('');
      setLoanAmount('');
      setLoanReqAmount('');
      setEligibleCount('');
      setEligibleCash('');
      setPrevLoanNo('');
      setPrevLoanDate('');
      setPrevLoanAmount('');
      setExistingShare('');
      setDeductedShare('');
      setBorrowerSearchStatus('');
      return;
    }
    const cleanQuery = q.replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });

    if (found) {
      const parsed = splitInitialAndName(found.name, found.ins);
      setBorrowerAClass(found.aClass || found.memberNo || q);
      setBorrowerIns(parsed.ins);
      setBorrowerName(parsed.name);
      setBorrowerCareOf(found.fatherOrHusbandName || found.careOf || '');
      setBorrowerDoor(found.door || '');
      setBorrowerStreet(found.street || '');
      setBorrowerVillage(found.village || '');
      setBorrowerMobile(found.mobile || '');
      setBorrowerAadhar(found.aadharNo || found.adhar || '');
      setBorrowerRationCard(found.smartCardNo || found.rationCard || '');
      setBorrowerMdccKcc(found.mdcc || found.kccAccountNo || '');
      setBorrowerErp(found.erpNo || found.erp || '');
      setBorrowerSb(found.sbAccountNo || found.sb || '');
      setBorrowerPan(found.panNo || found.pan || '');
      setAnimalType('');
      setAnimalCount('');
      setBorrowerSearchStatus(`கண்டறியப்பட்டது: உ-${found.aClass || found.memberNo}`);
    } else {
      setBorrowerAClass(q);
      setBorrowerIns('');
      setBorrowerName('');
      setBorrowerCareOf('');
      setBorrowerDoor('');
      setBorrowerStreet('');
      setBorrowerVillage('');
      setBorrowerMobile('');
      setBorrowerAadhar('');
      setBorrowerRationCard('');
      setBorrowerMdccKcc('');
      setBorrowerErp('');
      setBorrowerSb('');
      setBorrowerPan('');
      setBorrowerSearchStatus(`எண் "${q}" பட்டியலில் இல்லை`);
    }
  };

  const performGuarantorSearch = (query: string) => {
    const q = query.trim();
    if (!q) {
      setGuarantorAClass('');
      setGuarantorIns('');
      setGuarantorName('');
      setGuarantorCareOf('');
      setGuarantorDoor('');
      setGuarantorStreet('');
      setGuarantorVillage('');
      setGuarantorMobile('');
      setGuarantorAadhar('');
      setGuarantorRationCard('');
      setGuarantorErp('');
      setGuarantorSb('');
      setGuarantorSearchStatus('');
      return;
    }
    const cleanQuery = q.replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });

    if (found) {
      const parsed = splitInitialAndName(found.name, found.ins);
      setGuarantorAClass(found.aClass || found.memberNo || q);
      setGuarantorIns(parsed.ins);
      setGuarantorName(parsed.name);
      setGuarantorCareOf(found.fatherOrHusbandName || found.careOf || '');
      setGuarantorDoor(found.door || '');
      setGuarantorStreet(found.street || '');
      setGuarantorVillage(found.village || '');
      setGuarantorMobile(found.mobile || '');
      setGuarantorAadhar(found.aadharNo || found.adhar || '');
      setGuarantorRationCard(found.smartCardNo || found.rationCard || '');
      setGuarantorMdccKcc(found.mdcc || found.kccAccountNo || '');
      setGuarantorErp(found.erpNo || found.erp || '');
      setGuarantorSb(found.sbAccountNo || found.sb || '');
      setGuarantorSearchStatus(`கண்டறியப்பட்டது: உ-${found.aClass || found.memberNo}`);
    } else {
      setGuarantorAClass(q);
      setGuarantorIns('');
      setGuarantorName('');
      setGuarantorCareOf('');
      setGuarantorDoor('');
      setGuarantorStreet('');
      setGuarantorVillage('');
      setGuarantorMobile('');
      setGuarantorAadhar('');
      setGuarantorRationCard('');
      setGuarantorMdccKcc('');
      setGuarantorErp('');
      setGuarantorSb('');
      setGuarantorSearchStatus(`எண் "${q}" பட்டியலில் இல்லை`);
    }
  };

  const handleBorrowerInputChange = (val: string) => {
    setBorrowerAClassInput(val);
    if (!val.trim()) {
      performBorrowerSearch('');
      return;
    }
    const cleanQuery = val.trim().replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });
    if (found) {
      const parsed = splitInitialAndName(found.name, found.ins);
      setBorrowerAClass(found.aClass || found.memberNo || val.trim());
      setBorrowerIns(parsed.ins);
      setBorrowerName(parsed.name);
      setBorrowerCareOf(found.fatherOrHusbandName || found.careOf || '');
      setBorrowerDoor(found.door || '');
      setBorrowerStreet(found.street || '');
      setBorrowerVillage(found.village || '');
      setBorrowerMobile(found.mobile || '');
      setBorrowerAadhar(found.aadharNo || found.adhar || '');
      setBorrowerRationCard(found.smartCardNo || found.rationCard || '');
      setBorrowerMdccKcc(found.mdcc || found.kccAccountNo || '');
      setBorrowerErp(found.erpNo || found.erp || '');
      setBorrowerSb(found.sbAccountNo || found.sb || '');
      setBorrowerPan(found.panNo || found.pan || '');
      setBorrowerSearchStatus(`கண்டறியப்பட்டது: உ-${found.aClass || found.memberNo}`);
    } else {
      setBorrowerAClass(val.trim());
      setBorrowerSearchStatus('');
    }
  };

  const handleGuarantorInputChange = (val: string) => {
    setGuarantorAClassInput(val);
    if (!val.trim()) {
      performGuarantorSearch('');
      return;
    }
    const cleanQuery = val.trim().replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });
    if (found) {
      const parsed = splitInitialAndName(found.name, found.ins);
      setGuarantorAClass(found.aClass || found.memberNo || val.trim());
      setGuarantorIns(parsed.ins);
      setGuarantorName(parsed.name);
      setGuarantorCareOf(found.fatherOrHusbandName || found.careOf || '');
      setGuarantorDoor(found.door || '');
      setGuarantorStreet(found.street || '');
      setGuarantorVillage(found.village || '');
      setGuarantorMobile(found.mobile || '');
      setGuarantorAadhar(found.aadharNo || found.adhar || '');
      setGuarantorRationCard(found.smartCardNo || found.rationCard || '');
      setGuarantorMdccKcc(found.mdcc || found.kccAccountNo || '');
      setGuarantorErp(found.erpNo || found.erp || '');
      setGuarantorSb(found.sbAccountNo || found.sb || '');
      setGuarantorSearchStatus(`கண்டறியப்பட்டது: உ-${found.aClass || found.memberNo}`);
    } else {
      setGuarantorAClass(val.trim());
      setGuarantorMdccKcc('');
      setGuarantorSearchStatus('');
    }
  };

  // Helper to generate pristine A4 Self-Declaration Certificate (சுய அறிவிப்பு உறுதிமொழி)
  const generateDeclarationHtml = (
    fullName: string,
    careOf: string,
    loanAmt: string,
    dateStr: string = declarationDate,
    placeStr: string = declarationPlace,
    interestRateStr: string = declarationInterestRate,
    isBlank: boolean = declarationBlankMode,
    layoutMode: 'standard' | 'lineByLine' = declarationLayoutMode
  ) => {
    const isFilled = !isBlank && Boolean(fullName && fullName.trim());
    const loanNumeric = loanAmt ? parseFloat(loanAmt.replace(/[^0-9.]/g, '')) : 0;
    const loanAmtWords = loanNumeric > 0 ? numberToTamilWords(loanNumeric) : '';
    const formattedLoanAmt = loanNumeric > 0 ? loanNumeric.toLocaleString('en-IN') : loanAmt;

    const bodyContent = `
    <div style="font-size: 16px; line-height: 2.3; color: #000; text-align: justify;">
      <p style="text-indent: 40px; margin: 0;">
        திரு / திருமதி ${isFilled && fullName ? `<span style="border-bottom: 1.5px solid #000; font-weight: bold; padding: 0 8px; display: inline-block; min-width: 220px; text-align: center; font-size: 17px;">${fullName}</span>` : '<span style="border-bottom: 1.5px solid #000; display: inline-block; min-width: 240px;">&nbsp;</span>'} 
        த/பெ அல்லது க/பெ ${isFilled && careOf ? `<span style="border-bottom: 1.5px solid #000; font-weight: bold; padding: 0 8px; display: inline-block; min-width: 200px; text-align: center; font-size: 17px;">${careOf}</span>` : '<span style="border-bottom: 1.5px solid #000; display: inline-block; min-width: 220px;">&nbsp;</span>'} 
        ஆகிய நான் எனக்கு சொந்தமான மாடுகளின் / ஆடுகளின் / கோழிகளின் பராமரிப்பு செலவிற்காக ரூ. ${isFilled && formattedLoanAmt ? `<span style="border-bottom: 1.5px solid #000; font-weight: bold; padding: 0 8px; display: inline-block; min-width: 140px; text-align: center; font-size: 17px;">${formattedLoanAmt}</span>` : '<span style="border-bottom: 1.5px solid #000; display: inline-block; min-width: 150px;">&nbsp;</span>'} 
        (ரூபாய் ${isFilled && loanAmtWords ? `<span style="border-bottom: 1.5px solid #000; font-weight: bold; padding: 0 8px; display: inline-block; min-width: 260px; text-align: center; font-size: 16px;">${loanAmtWords} ரூபாய்</span>` : '<span style="border-bottom: 1.5px solid #000; display: inline-block; min-width: 320px;">&nbsp;</span>'} மட்டும்) 
        கேசிசி கால்நடை மூலதனக்கடன் <span style="border-bottom: 1.5px solid #000; font-weight: bold; padding: 0 6px; display: inline-block; min-width: 60px; text-align: center;">${interestRateStr || '7%'}</span> வட்டி விகிதத்தில் கடன் அளவு திட்டத்தின்படி TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கத்தில் பெற்றுக்கொண்டுள்ளேன். இக்கடன் பெறுவதற்கு ஆதாரமாக காட்டப்பட்ட மாடுகள் - ஆடுகள் - கோழிகள் எனக்கு சொந்தமானது என்றும் இவற்றை ஆதாரமாகக் கொண்டு வேறு எங்கும் கேசிசி கடன் பெறவில்லை என்றும் உறுதி அளிக்கிறேன். கேசிசி கடன் பெறுவதற்கு ஆதாரமாக காட்டப்பட்ட மேற்படி மாடுகளை / ஆடுகளை / கோழிகளை எந்த நேரத்திலும் வங்கியின் உயரதிகாரிகள் பார்வையிட சம்மதிக்கிறேன் என்றும், இக்கடன் பெற ஆதாரமாக காட்டப்பட்ட மாடுகளை / ஆடுகளை / கோழிகளை கடன் தீரும் வரை விற்கமாட்டேன் என்றும் உறுதி கூறுகிறேன். இக்கடன் பெற்றதில் ஏதேனும் தவறுகள் / முறைகேடுகள் கண்டறியப்பட்டால் என் மீது எடுக்கப்படும் குற்றவியல் நடவடிக்கைக்கு உட்படுகிறேன் என்றும் சுய அறிவிப்பு உறுதிமொழி அளிக்கிறேன்.
      </p>
    </div>
    `;

    return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>சுய அறிவிப்பு உறுதிமொழி - ${isFilled ? fullName : 'வெற்று படிவம்'} (A4)</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 15mm 20mm 15mm 20mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #000000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta Malar", "Noto Sans Tamil", sans-serif;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #78350f;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .a4-page-sheet {
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      padding: 24mm 22mm 20mm 22mm;
      margin: 20px auto;
      background: #ffffff;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      box-sizing: border-box;
      position: relative;
    }
    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
      .a4-page-sheet {
        width: 210mm !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        padding: 12mm 15mm 12mm 15mm !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📄</span>
      <span>சுய அறிவிப்பு உறுதிமொழி (A4 அச்சு) - ${isFilled ? fullName : 'வெற்று படிவம்'}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 900; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        🖨️ ஏ4 அச்சிடுக (Print A4)
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.18); color: #ffffff; border: 1px solid rgba(255,255,255,0.35); padding: 9px 15px; border-radius: 7px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ✕ மூடுக (Close)
      </button>
    </div>
  </div>

  <div class="a4-page-sheet">
    <div style="text-align: center; margin-top: 6mm; margin-bottom: 12mm;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 6px 0; color: #000; letter-spacing: 0.5px;">
        சுய அறிவிப்பு உறுதிமொழி
      </h1>
      <div style="font-size: 16.5px; font-weight: bold; color: #000;">
        ( Self -Declaration Certificate )
      </div>
    </div>

    ${bodyContent}

    <div style="margin-top: 65px; font-size: 16px; line-height: 1.8;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div><strong>நாள் &nbsp;&nbsp;&nbsp;:</strong> &nbsp;${dateStr || ''}</div>
          <div style="margin-top: 6px;"><strong>இடம் &nbsp;:</strong> &nbsp;${placeStr || 'தேவாரம்'}</div>
        </div>
        <div style="text-align: center; min-width: 220px;">
          <div style="font-weight: bold; margin-bottom: 60px;">இப்படிக்கு,</div>
          <div style="border-top: 1px dotted #000; padding-top: 6px; font-weight: bold; font-size: 15.5px;">
            ${isFilled ? `(${fullName})` : '(கடன்தாரர் கையொப்பம்)'}
          </div>
          <div style="font-size: 13.5px; color: #444; margin-top: 2px;">
            கடன்தாரர் கையொப்பம்
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleOpenDeclarationNewTab = (
    fullName: string,
    careOf: string,
    loanAmt: string
  ) => {
    const html = generateDeclarationHtml(
      fullName, 
      careOf, 
      loanAmt, 
      declarationDate, 
      declarationPlace, 
      declarationInterestRate, 
      declarationBlankMode, 
      'standard'
    );

    openDocumentPreview(html, 'சுய அறிவிப்பு உறுதிமொழி');
  };

  const handleOpenDeclaration = () => {
    if (isOpeningDeclarationRef.current) return;
    isOpeningDeclarationRef.current = true;
    setTimeout(() => {
      isOpeningDeclarationRef.current = false;
    }, 1500);

    // If borrower number was entered in input, resolve member details
    const activeAClass = borrowerAClassInput.trim() || borrowerAClass;
    let memberName = borrowerName;
    let memberIns = borrowerIns;
    let memberCareOf = borrowerCareOf;

    if (activeAClass) {
      const found = members.find(m => 
        String(m.aClass || m.memberNo).toLowerCase() === activeAClass.toLowerCase() ||
        String(m.aClass || m.memberNo).replace(/\D/g, '') === activeAClass.replace(/\D/g, '')
      );
      if (found) {
        const split = splitInitialAndName(found.name, found.ins);
        memberName = split.name;
        memberIns = split.ins;
        memberCareOf = found.careOf || found.fatherOrHusbandName || '';
        if (!borrowerName) {
          performBorrowerSearch(activeAClass);
        }
      }
    }

    const fullName = memberName ? (memberIns ? `${memberIns}. ${memberName}` : memberName) : '';
    const careOf = memberCareOf || '';
    const currentLoanAmt = loanAmount || loanReqAmount || '';

    // Directly open in a separate new tab! No popup on the same page.
    handleOpenDeclarationNewTab(fullName, careOf, currentLoanAmt);
  };

  // Helper to generate pristine A4 Photo Proof Certificate (புகைப்பட சான்று) matching uploaded template
  const generatePhotoProofHtml = (data: {
    memberNo: string;
    memberName: string;
    memberIns: string;
    careOf: string;
    door: string;
    street: string;
    village: string;
    mobile: string;
    photoDate?: string;
  }) => {
    const isFilled = Boolean(data.memberName && data.memberName.trim());
    const memberFullName = isFilled 
      ? (data.memberIns ? `${data.memberIns}  ${data.memberName}` : data.memberName) 
      : '';

    const addressHtml = isFilled ? `
      ${data.door ? `<div>${data.door}</div>` : ''}
      ${data.street ? `<div>${data.street}</div>` : ''}
      ${data.village ? `<div>${data.village}</div>` : ''}
    ` : '&nbsp;';

    return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>புகைப்பட சான்று - ${isFilled ? memberFullName : 'வெற்று படிவம்'} (A4)</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 15mm 20mm 15mm 20mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #000000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta Malar", "Noto Sans Tamil", sans-serif;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #1e3a8a;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .a4-page-sheet {
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      padding: 18mm 20mm 16mm 20mm;
      margin: 20px auto;
      background: #ffffff;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      box-sizing: border-box;
      position: relative;
    }
    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
      .a4-page-sheet {
        width: 210mm !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        padding: 12mm 16mm 12mm 16mm !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📷</span>
      <span>புகைப்பட சான்று (A4 அச்சு) - ${isFilled ? memberFullName : 'வெற்று படிவம்'}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 900; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        🖨️ ஏ4 அச்சிடுக (Print A4)
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.18); color: #ffffff; border: 1px solid rgba(255,255,255,0.35); padding: 9px 15px; border-radius: 7px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ✕ மூடுக (Close)
      </button>
    </div>
  </div>

  <div class="a4-page-sheet">
    <!-- Header: கூட்டுறவே! / Logo / நாட்டுயர்வு ! -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <div style="font-weight: 800; font-size: 15px; color: #000; letter-spacing: 0.5px;">
        கூட்டுறவே!
      </div>
      <div style="text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 115" width="70" height="48" style="display: inline-block; vertical-align: middle;">
          <defs>
            <clipPath id="coopEmblemClipPhoto">
              <ellipse cx="80" cy="57.5" rx="77" ry="53"/>
            </clipPath>
            <linearGradient id="coopSunGradPhoto" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFDE00"/>
              <stop offset="35%" stopColor="#FF9E00"/>
              <stop offset="85%" stopColor="#E85D04"/>
              <stop offset="100%" stopColor="#DC2626"/>
            </linearGradient>
            <linearGradient id="coopGroundGradPhoto" x1="0%" y1="30%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16A34A"/>
              <stop offset="30%" stopColor="#22C55E"/>
              <stop offset="60%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#0284C7"/>
            </linearGradient>
          </defs>
          <g clipPath="url(#coopEmblemClipPhoto)">
            <rect x="0" y="0" width="160" height="58" fill="url(#coopSunGradPhoto)"/>
            <rect x="0" y="54" width="160" height="61" fill="url(#coopGroundGradPhoto)"/>
            <path d="M 0 55 Q 80 48 160 55 L 160 115 L 0 115 Z" fill="url(#coopGroundGradPhoto)"/>
          </g>
          <g stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF">
            <path d="M 3 37 C 18 36 28 37 42 41 C 45 35 48 29 55 24 C 63 19 75 20 86 26 C 92 30 94 36 90 40 C 85 43 76 39 68 36 C 61 34 54 38 49 44 C 44 50 42 56 43 64 C 43 71 47 77 53 79 C 45 81 37 80 30 75 C 23 69 16 62 3 60 Z" />
            <path d="M 50 43 C 54 33 62 24 74 24 C 82 24 90 28 88 36 C 86 41 78 41 71 37 C 65 34 58 37 53 43" fill="#FFFFFF" strokeWidth="2.5"/>
            <path d="M 69 31 C 73 28 78 28 81 31" fill="none" strokeWidth="1.8"/>
            <path d="M 58 36 C 61 41 65 44 71 43" fill="none" strokeWidth="1.8"/>
            <path d="M 157 24 C 138 23 128 25 116 31 C 103 38 88 41 76 41 C 82 43 89 47 96 52 C 103 58 114 65 125 61 C 136 56 146 55 157 57" fill="#FFFFFF" strokeWidth="2.6"/>
            <path d="M 96 52 C 99 56 102 63 98 67 C 94 71 88 70 84 66 C 79 61 78 54 77 48" fill="#FFFFFF" strokeWidth="2.4"/>
            <path d="M 89 63 C 92 66 95 65 96 62" fill="none" strokeWidth="1.6"/>
            <path d="M 88 66 C 89 71 86 76 81 78 C 76 79 71 77 68 72 C 65 67 65 61 66 56" fill="#FFFFFF" strokeWidth="2.4"/>
            <path d="M 78 71 C 81 74 84 73 85 70" fill="none" strokeWidth="1.6"/>
            <path d="M 75 75 C 76 80 72 84 67 85 C 62 86 57 83 55 78 C 53 73 54 67 56 63" fill="#FFFFFF" strokeWidth="2.4"/>
            <path d="M 66 78 C 69 81 72 80 73 77" fill="none" strokeWidth="1.6"/>
            <path d="M 62 81 C 62 86 57 89 52 89 C 47 89 43 85 42 80 C 41 75 43 70 47 67" fill="#FFFFFF" strokeWidth="2.4"/>
            <path d="M 54 83 C 56 86 59 85 60 82" fill="none" strokeWidth="1.6"/>
            <path d="M 44 48 C 38 52 35 59 36 67 C 37 74 42 79 49 81" fill="none" strokeWidth="2.2"/>
            <path d="M 33 55 C 29 60 28 66 31 71 C 33 75 37 78 42 79" fill="none" strokeWidth="2.2"/>
            <path d="M 10 38 L 10 59" fill="none" strokeWidth="2.2"/>
            <path d="M 150 25 L 150 56" fill="none" strokeWidth="2.2"/>
          </g>
          <ellipse cx="80" cy="57.5" rx="77" ry="53" fill="none" stroke="#000000" strokeWidth="3"/>
        </svg>
      </div>
      <div style="font-weight: 800; font-size: 15px; color: #000; letter-spacing: 0.5px;">
        நாட்டுயர்வு !
      </div>
    </div>

    <!-- Society Name & Place -->
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-size: 16.5px; font-weight: 800; color: #000; letter-spacing: 0.3px; margin-bottom: 4px;">
        TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் லிட்
      </div>
      <div style="font-size: 14.5px; font-weight: 700; color: #000;">
        தேவாரம் - 625530 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; தேனி மாவட்டம்
      </div>
    </div>

    <!-- Horizontal Divider Line -->
    <hr style="border: none; border-top: 1.5px solid #000; margin: 10px 0 16px 0;" />

    <!-- Big Photo Frame Box -->
    <div style="width: 100%; height: 132mm; border: 2.5px solid #000; background: #ffffff; margin-bottom: 18px; box-sizing: border-box;">
    </div>

    <!-- Section Title: கால்நடை பராமரிப்பு கோரும் உறுப்பினரின் விபரம் -->
    <div style="text-align: center; font-weight: 800; font-size: 16px; margin-bottom: 22px; color: #000; letter-spacing: 0.3px;">
      கால்நடை பராமரிப்பு கோரும் உறுப்பினரின் விபரம்
    </div>

    <!-- Details and Signature Container -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 28px;">
      <!-- Left: Member Details Table -->
      <table style="border-collapse: collapse; font-size: 14.5px; line-height: 1.85; color: #000;">
        <tbody>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">உறுப்பினர் எண்</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-weight: 800; font-family: monospace; font-size: 15.5px; padding: 2px 0; vertical-align: top;">
              ${data.memberNo || ''}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">உறுப்பினர் பெயர்</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-weight: 800; font-size: 15.5px; padding: 2px 0; vertical-align: top;">
              ${memberFullName || ''}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">த க பெயர்</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-weight: 700; font-size: 15px; padding: 2px 0; vertical-align: top;">
              ${data.careOf || ''}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">முகவரி</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-weight: 600; font-size: 14.5px; padding: 2px 0; vertical-align: top; line-height: 1.5;">
              ${addressHtml}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">செல்</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-weight: 800; font-family: monospace; font-size: 15px; padding: 2px 0; vertical-align: top;">
              ${data.mobile || ''}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; padding: 2px 6px 2px 0; white-space: nowrap; vertical-align: top;">புகைப்படம் எடுக்கப்பட்ட தேதி</td>
            <td style="padding: 2px 10px; vertical-align: top; font-weight: 700;">:</td>
            <td style="font-size: 14.5px; padding: 2px 0; vertical-align: top;">
              ${data.photoDate || ''}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Right: Member Signature Section (dropped down further for signing) -->
      <div style="text-align: center; min-width: 220px; margin-right: 24px; position: relative; top: 28px;">
        <div style="font-weight: 800; font-size: 15px; color: #000;">
          உறுப்பினர் கையொப்பம்
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleOpenPhotoProofNewTab = (data: {
    memberNo: string;
    memberName: string;
    memberIns: string;
    careOf: string;
    door: string;
    street: string;
    village: string;
    mobile: string;
    photoDate?: string;
  }) => {
    const html = generatePhotoProofHtml(data);
    openDocumentPreview(html, 'புகைப்பட சான்று');
  };

  const handleOpenPhotoProof = () => {
    if (isOpeningPhotoProofRef.current) return;
    isOpeningPhotoProofRef.current = true;
    setTimeout(() => {
      isOpeningPhotoProofRef.current = false;
    }, 1500);

    const activeAClass = borrowerAClassInput.trim() || borrowerAClass;
    let memberName = borrowerName;
    let memberIns = borrowerIns;
    let memberCareOf = borrowerCareOf;
    let door = borrowerDoor;
    let street = borrowerStreet;
    let village = borrowerVillage;
    let mobile = borrowerMobile;

    if (activeAClass) {
      const found = members.find(m => 
        String(m.aClass || m.memberNo).toLowerCase() === activeAClass.toLowerCase() ||
        String(m.aClass || m.memberNo).replace(/\D/g, '') === activeAClass.replace(/\D/g, '')
      );
      if (found) {
        const split = splitInitialAndName(found.name, found.ins);
        memberName = split.name;
        memberIns = split.ins;
        memberCareOf = found.careOf || found.fatherOrHusbandName || '';
        door = found.door || '';
        street = found.street || '';
        village = found.village || '';
        mobile = found.mobile || '';
        if (!borrowerName) {
          performBorrowerSearch(activeAClass);
        }
      }
    }

    handleOpenPhotoProofNewTab({
      memberNo: activeAClass,
      memberName,
      memberIns,
      careOf: memberCareOf,
      door,
      street,
      village,
      mobile,
      photoDate: ''
    });
  };

  // Helper to generate pristine A4 7% Self-Undertaking (7% சுய உறுதிமொழி) matching uploaded document
  const generateSevenPercentHtml = (data: {
    memberNo: string;
    memberName: string;
    memberIns: string;
    careOf: string;
    door: string;
    street: string;
    village: string;
    mobile: string;
    loanAmt: string;
    dateStr?: string;
  }) => {
    const isFilled = Boolean(data.memberName && data.memberName.trim());
    const memberFullName = isFilled 
      ? (data.memberIns ? `${data.memberIns}  ${data.memberName}` : data.memberName) 
      : '';
    const loanNumeric = data.loanAmt ? parseFloat(data.loanAmt.replace(/[^0-9.]/g, '')) : 0;
    const formattedLoanAmt = loanNumeric > 0 ? loanNumeric.toLocaleString('en-IN') : data.loanAmt;

    return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>7% சுய உறுதிமொழி - ${isFilled ? memberFullName : 'வெற்று படிவம்'} (A4)</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 22mm 24mm 20mm 24mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #000000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta Malar", "Noto Sans Tamil", sans-serif;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #5b21b6;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .a4-page-sheet {
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      padding: 24mm 24mm 22mm 24mm;
      margin: 20px auto;
      background: #ffffff;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      box-sizing: border-box;
      position: relative;
    }
    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
      .a4-page-sheet {
        width: 210mm !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        padding: 16mm 18mm 16mm 18mm !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📜</span>
      <span>7% சுய உறுதிமொழி (A4 அச்சு) - ${isFilled ? memberFullName : 'வெற்று படிவம்'}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 900; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        🖨️ ஏ4 அச்சிடுக (Print A4)
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.18); color: #ffffff; border: 1px solid rgba(255,255,255,0.35); padding: 9px 15px; border-radius: 7px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ✕ மூடுக (Close)
      </button>
    </div>
  </div>

  <div class="a4-page-sheet">
    <!-- Centered Document Title -->
    <div style="text-align: center; margin-bottom: 34px;">
      <h1 style="font-size: 20px; font-weight: 800; margin: 0; color: #000; letter-spacing: 0.5px;">
        சுய உறுதிமொழி
      </h1>
    </div>

    <!-- Sender (அனுப்புநர்) Section -->
    <div style="margin-bottom: 26px; font-size: 15px; line-height: 1.8;">
      <div style="font-weight: 700; margin-bottom: 4px; color: #000;">அனுப்புநர்</div>
      <div style="margin-left: 95px; line-height: 1.6;">
        <table style="border-collapse: collapse; font-size: 15px;">
          <tbody>
            <tr>
              <td style="font-weight: 700; padding: 2px 0; white-space: nowrap; vertical-align: top; width: 130px; color: #000;">உறுப்பினர் எண்</td>
              <td style="padding: 2px 10px; vertical-align: top; font-weight: 700; width: 20px; text-align: center; color: #000;">:</td>
              <td style="padding: 2px 0; vertical-align: top;">
                ${isFilled ? `<span style="font-weight: 800; font-family: monospace; font-size: 16px; color: #000;">${data.memberNo}</span>` : '<span style="border-bottom: 1px dotted #000; display: inline-block; min-width: 160px;">&nbsp;</span>'}
              </td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td style="padding: 3px 0 5px 0; vertical-align: top; line-height: 1.6; color: #000;">
                ${isFilled ? `
                  <div style="font-weight: 700; font-size: 15.5px;">${memberFullName}</div>
                  <div style="font-size: 15px;">${data.careOf || ''}</div>
                  <div style="font-size: 14.5px;">${data.door ? data.door : ''}</div>
                  <div style="font-size: 14.5px;">${data.street ? data.street : ''}</div>
                  <div style="font-size: 14.5px;">${data.village ? data.village : ''}</div>
                ` : `
                  <div style="border-bottom: 1px dotted #000; min-width: 220px; height: 22px; margin-bottom: 6px;"></div>
                  <div style="border-bottom: 1px dotted #000; min-width: 220px; height: 22px; margin-bottom: 6px;"></div>
                  <div style="border-bottom: 1px dotted #000; min-width: 220px; height: 22px; margin-bottom: 6px;"></div>
                  <div style="border-bottom: 1px dotted #000; min-width: 220px; height: 22px; margin-bottom: 6px;"></div>
                `}
              </td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td style="padding: 4px 0 2px 0; vertical-align: top;">
                <span style="font-weight: 700; color: #000;">செல் : </span>
                ${isFilled ? `<span style="font-weight: 800; font-family: monospace; font-size: 15.5px; color: #000;">${data.mobile}</span>` : '<span style="border-bottom: 1px dotted #000; display: inline-block; min-width: 180px;">&nbsp;</span>'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recipient (பெறுநர்) Section -->
    <div style="margin-bottom: 26px; font-size: 15px; line-height: 1.8;">
      <div style="font-weight: 700; margin-bottom: 4px; color: #000;">பெறுநர்</div>
      <div style="margin-left: 95px; line-height: 1.6; font-weight: normal; color: #000;">
        <div>செயலாட்சியர் / செயலாளர் அவர்கள்</div>
        <div>TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்</div>
        <div>தேவாரம்</div>
      </div>
    </div>

    <!-- Subject (பொருள்) Section -->
    <div style="margin-bottom: 26px; font-size: 15px; line-height: 1.8;">
      <div style="display: flex; align-items: flex-start;">
        <div style="font-weight: 700; width: 95px; flex-shrink: 0; color: #000;">பொருள்</div>
        <div style="font-weight: normal; line-height: 1.6; color: #000;">
          <div>KCC பயிர்க்கடன் - கால்நடை பராமரிப்பு வளர்ப்பு மூலதனக்கடன்</div>
          <div>வட்டி தொகையை செலுத்த ஒப்புக்கொள்ளுதல் - தொடர்பாக.</div>
        </div>
      </div>
    </div>

    <!-- Salutation & Body Paragraph -->
    <div style="margin-bottom: 35px; font-size: 15px; line-height: 2.2; text-align: justify; color: #000;">
      <div style="font-weight: 700; margin-bottom: 12px;">ஐயா,</div>
      <p style="text-indent: 50px; margin: 0;">
        நான் நமது சங்கத்தில் KCC கடன் திட்டத்தின் கீழ் பயிர்க்கடன் / கால்நடை வளர்ப்பு மூலதனக்கடன் ரூ. ${isFilled && formattedLoanAmt ? `<strong style="border-bottom: 1.5px solid #000; padding: 0 8px; font-size: 16px;">${formattedLoanAmt}/-</strong>` : '<span style="border-bottom: 1px dotted #000; display: inline-block; min-width: 160px; text-align: center;">&nbsp;</span>/-'} கோரி விண்ணப்பித்துள்ளேன். KCC திட்டத்தின்கீழ் இச்சங்கத்தில் ஒப்படைக்கப்பட்ட நில ஆவணங்கள் / கால்நடைகள் மூலம் பிற கூட்டுறவு சங்கத்திலோ, பிற வணிக வங்கிகளிலோ கடன் பெறவில்லை. மேற்படி எனக்கு வழங்கும் கடனை சங்கம் நிர்ணயிக்கும் தவணை தேதிக்கு முன்பு செலுத்தி விடுவேன். எனக்கு வழங்கும் கடன் தொகைக்கு அரசிடமிருந்து வட்டி மானியம் வராதபட்சத்தில் கடன் தொகையுடன் வட்டியும் சேர்த்து சங்கத்திற்கு செலுத்தி விடுகிறேன் என உறுதியளிக்கிறேன்.
      </p>
    </div>

    <!-- Closing / Signature Section -->
    <div style="margin-top: 50px; font-size: 15px; line-height: 1.8;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="line-height: 2; color: #000;">
          <div><strong>நாள் &nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;${data.dateStr || ''}</div>
          <div style="margin-top: 6px;"><strong>இடம் &nbsp;&nbsp;&nbsp;:</strong> &nbsp;தேவாரம்</div>
        </div>
        <div style="text-align: center; min-width: 220px; color: #000;">
          <div style="font-weight: 700; margin-bottom: 60px;">இப்படிக்கு</div>
          <div style="font-weight: 700; font-size: 15px;">
            ${isFilled ? `(${memberFullName})` : '(உறுப்பினர் கையொப்பம்)'}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleOpenSevenPercentProofNewTab = (data: {
    memberNo: string;
    memberName: string;
    memberIns: string;
    careOf: string;
    door: string;
    street: string;
    village: string;
    mobile: string;
    loanAmt: string;
    dateStr?: string;
  }) => {
    const html = generateSevenPercentHtml(data);
    openDocumentPreview(html, '7% சுய உறுதிமொழி');
  };

  const handleOpenSevenPercentProof = () => {
    if (isOpeningSevenPercentRef.current) return;
    isOpeningSevenPercentRef.current = true;
    setTimeout(() => {
      isOpeningSevenPercentRef.current = false;
    }, 1500);

    const activeAClass = borrowerAClassInput.trim() || borrowerAClass;
    let memberName = borrowerName;
    let memberIns = borrowerIns;
    let memberCareOf = borrowerCareOf;
    let door = borrowerDoor;
    let street = borrowerStreet;
    let village = borrowerVillage;
    let mobile = borrowerMobile;

    if (activeAClass) {
      const found = members.find(m => 
        String(m.aClass || m.memberNo).toLowerCase() === activeAClass.toLowerCase() ||
        String(m.aClass || m.memberNo).replace(/\D/g, '') === activeAClass.replace(/\D/g, '')
      );
      if (found) {
        const split = splitInitialAndName(found.name, found.ins);
        memberName = split.name;
        memberIns = split.ins;
        memberCareOf = found.careOf || found.fatherOrHusbandName || '';
        door = found.door || '';
        street = found.street || '';
        village = found.village || '';
        mobile = found.mobile || '';
        if (!borrowerName) {
          performBorrowerSearch(activeAClass);
        }
      }
    }

    const currentLoanAmt = loanAmount || loanReqAmount || '';

    handleOpenSevenPercentProofNewTab({
      memberNo: activeAClass,
      memberName,
      memberIns,
      careOf: memberCareOf,
      door,
      street,
      village,
      mobile,
      loanAmt: currentLoanAmt,
      dateStr: ''
    });
  };

  const handleCreateAndPrintApplication = () => {
    if (isOpeningAppRef.current) return;
    isOpeningAppRef.current = true;
    setTimeout(() => {
      isOpeningAppRef.current = false;
    }, 1500);

    if (borrowerAClassInput.trim()) {
      performBorrowerSearch(borrowerAClassInput);
    }
    if (guarantorAClassInput.trim()) {
      performGuarantorSearch(guarantorAClassInput);
    }

    const docEl = document.getElementById('ah-application-exact-doc');
    if (!docEl) {
      window.print();
      return;
    }

    // Ensure all live input values in the DOM have their value attributes updated for serialization
    docEl.querySelectorAll('input').forEach((input) => {
      input.setAttribute('value', input.value);
    });

    // Collect all stylesheets from head to preserve full Tailwind and custom CSS
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const appMemberLabel = borrowerName 
      ? `கடன்தாரர்: ${borrowerName} (A-${borrowerAClassInput || borrowerAClass || ''})`
      : 'AH கால்நடை கடன் விண்ணப்பம்';

    const newTabHtml = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>கால்நடை பராமரிப்பு கடன் விண்ணப்ப படிவம் - ${borrowerName || 'AH Form'} (2 பக்கங்கள் லீகல் அச்சு)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${headStyles}
  <style>
    @page {
      size: legal portrait !important;
      margin: 5mm 8mm 5mm 8mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    input {
      border: none !important;
      background: transparent !important;
      outline: none !important;
      font-family: inherit !important;
      color: #000000 !important;
      text-align: center !important;
      box-shadow: none !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #000000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta Malar", "Noto Sans Tamil", sans-serif;
      line-height: 1.25;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #007A4D;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }
    .page-sheet-container {
      max-width: 8.5in;
      margin: 20px auto 40px auto;
      background: #ffffff;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
    }
    #ah-application-exact-doc {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .legal-page {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      margin: 0 0 20px 0 !important;
      padding-bottom: 6px !important;
      border-bottom: 2px dashed #94a3b8 !important;
    }
    .legal-page-last {
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding-bottom: 0 !important;
      border-bottom: none !important;
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
      border: 1.5px solid #000000 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    @media print {
      .no-print, .no-print-bar {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-sheet-container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
      }
      #ah-application-exact-doc {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .legal-page {
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 0 !important;
        border-bottom: none !important;
      }
      .legal-page-last {
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 0 !important;
        border-bottom: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar no-print">
    <div style="font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 8px;">
      <span>🐄</span>
      <span>${appMemberLabel} - (2 பக்கங்கள் லீகல் அச்சு)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; padding: 8px 22px; border-radius: 6px; font-weight: 900; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
        🖨️ விண்ணப்பத்தை அச்சிடுக (Print Legal)
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.2); color: #ffffff; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ✕ மூடுக (Close)
      </button>
    </div>
  </div>

  <div class="page-sheet-container">
    <div id="ah-application-exact-doc">
      ${docEl.innerHTML}
    </div>
  </div>

  <script>
    function triggerPrint() {
      setTimeout(function() {
        window.print();
      }, 400);
    }
    if (document.readyState === 'complete') {
      triggerPrint();
    } else {
      window.addEventListener('load', triggerPrint);
    }
  </script>
</body>
</html>`;

    openDocumentPreview(newTabHtml, appMemberLabel);
  };
  return (
    <div className="space-y-4">
      {/* Component Print Styles */}
      <style>{`
        @media print {
          @page {
            size: legal portrait !important;
            margin: 5mm 8mm 5mm 8mm !important;
          }
          header, aside, nav, .no-print, button {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          input {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            font-family: inherit !important;
            color: #000000 !important;
            text-align: center !important;
            box-shadow: none !important;
          }
          .preview-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          #ah-application-exact-doc {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .legal-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
          .legal-page-last {
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            border-bottom: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            border: 1.5px solid #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th, td, tr {
            border: 1px solid #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* COMPACT TOP SEARCH & CONTROLS - ONLY BORROWER & GUARANTOR INPUTS */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Compact Inputs for Borrower and Guarantor */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Borrower A-Class Input */}
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600">
              <span className="px-2.5 py-1.5 bg-stone-100 text-stone-700 font-bold text-xs border-r border-stone-300 whitespace-nowrap flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-800" />
                <span>கடன்தாரர் எண்</span>
              </span>
              <input
                type="text"
                value={borrowerAClassInput}
                onChange={(e) => handleBorrowerInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') performBorrowerSearch(borrowerAClassInput);
                }}
                placeholder="எ.கா: 5566"
                className="w-24 sm:w-28 px-2.5 py-1.5 bg-transparent font-bold text-stone-900 text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => performBorrowerSearch(borrowerAClassInput)}
                title="கடன்தாரர் விபரங்களை தேடு"
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>தேடு</span>
              </button>
            </div>

            {/* Guarantor A-Class Input */}
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600">
              <span className="px-2.5 py-1.5 bg-stone-100 text-stone-700 font-bold text-xs border-r border-stone-300 whitespace-nowrap flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-800" />
                <span>பிணையதாரர் எண்</span>
              </span>
              <input
                type="text"
                value={guarantorAClassInput}
                onChange={(e) => handleGuarantorInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') performGuarantorSearch(guarantorAClassInput);
                }}
                placeholder="எ.கா: 5567"
                className="w-24 sm:w-28 px-2.5 py-1.5 bg-transparent font-bold text-stone-900 text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => performGuarantorSearch(guarantorAClassInput)}
                title="பிணையதாரர் விபரங்களை தேடு"
                className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>தேடு</span>
              </button>
            </div>

            {/* Quick Loan Amount Input */}
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600">
              <span className="px-2.5 py-1.5 bg-stone-100 text-stone-700 font-bold text-xs border-r border-stone-300 whitespace-nowrap flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-800" />
                <span>கடன் தொகை ₹</span>
              </span>
              <input
                type="text"
                value={loanAmount}
                onChange={(e) => {
                  setLoanAmount(e.target.value);
                  setLoanReqAmount(e.target.value);
                }}
                placeholder="எ.கா: 1,60,000"
                className="w-24 sm:w-28 px-2.5 py-1.5 bg-transparent font-bold text-stone-900 text-xs sm:text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCreateAndPrintApplication}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#007A4D] hover:bg-[#00603c] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="2 பக்க லீகல் விண்ணப்ப அச்சு படிவத்தை உருவாக்கவும்"
            >
              <ExternalLink className="w-4 h-4" />
              <span>விண்ணப்பத்தை உருவாக்கு</span>
            </button>



            {/* Button: சுய அறிவிப்பு உறுதிமொழி */}
            <button
              type="button"
              onClick={handleOpenDeclaration}
              className="flex items-center gap-2 px-4 py-2 bg-[#b45309] hover:bg-[#92400e] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="சுய அறிவிப்பு உறுதிமொழி ஏ4 தனி டேப்பில் திறக்க"
            >
              <ExternalLink className="w-4 h-4" />
              <span>சுய அறிவிப்பு உறுதிமொழி</span>
            </button>

            {/* Button: புகைப்பட சான்று */}
            <button
              type="button"
              onClick={handleOpenPhotoProof}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="புகைப்பட சான்று ஏ4 தனி டேப்பில் திறக்க"
            >
              <Camera className="w-4 h-4" />
              <span>புகைப்பட சான்று</span>
            </button>

            {/* Button: 7% சுய உறுதிமொழி */}
            <button
              type="button"
              onClick={handleOpenSevenPercentProof}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="7% சுய உறுதிமொழி ஏ4 தனி டேப்பில் திறக்க"
            >
              <FileText className="w-4 h-4" />
              <span>7% சுய உறுதிமொழி</span>
            </button>
          </div>
        </div>

        {/* Compact Status Indicator when borrower or guarantor found */}
        {(borrowerName || guarantorName || borrowerSearchStatus || guarantorSearchStatus) && (
          <div className="mt-2 pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {borrowerName ? (
                <div className="flex items-center gap-1 text-stone-900">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                    கடன்தாரர் உ-{borrowerAClass}
                  </span>
                  <strong className="text-stone-950 font-black">{borrowerIns ? `${borrowerIns}. ` : ''}{borrowerName}</strong>
                  {borrowerCareOf && <span className="text-stone-600 text-[11px]">(த/பெ: {borrowerCareOf})</span>}
                  {borrowerMobile && <span className="text-stone-700 font-mono text-[11px]">📱 {borrowerMobile}</span>}
                </div>
              ) : borrowerSearchStatus ? (
                <span className="text-amber-700 font-medium">{borrowerSearchStatus}</span>
              ) : null}

              {guarantorName ? (
                <div className="flex items-center gap-1 text-stone-900">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[11px]">
                    பிணையாதாரர் உ-{guarantorAClass}
                  </span>
                  <strong className="text-stone-950 font-black">{guarantorIns ? `${guarantorIns}. ` : ''}{guarantorName}</strong>
                  {guarantorCareOf && <span className="text-stone-600 text-[11px]">(த/பெ: {guarantorCareOf})</span>}
                </div>
              ) : guarantorSearchStatus ? (
                <span className="text-amber-700 font-medium">{guarantorSearchStatus}</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW CONTAINER - EXACTLY 2 PAGES FOR LEGAL SHEET (8.5in x 14in) */}
      <div className="preview-wrapper flex justify-center bg-stone-200/50 p-2 md:p-6 overflow-x-auto">
        <div 
          id="ah-application-exact-doc"
          className="bg-white text-black p-4 md:p-6 shadow-2xl rounded-sm w-full max-w-[860px] font-sans text-[10.5px] sm:text-[11px] leading-snug border border-black"
        >
          {/* ============================================================== */}
          {/* PAGE 1: PRECISELY TERMINATES AT GUARANTOR & BORROWER SIGNATURES*/}
          {/* ============================================================== */}
          <div className="legal-page mb-5 pb-2 border-b-2 border-dashed border-stone-400">
            {/* Cooperative Handshake Emblem Icon */}
            <div className="flex justify-center mb-1">
              <CooperativeLogo className="w-16 h-10 mx-auto" />
            </div>

            {/* Header Titles Box - Crisp black borders */}
            <div className="text-center mb-0">
              <div className="border border-black py-1 px-2.5 font-black text-[12.5px] sm:text-[13px] bg-white tracking-wide">
                {societyTitle}
              </div>
              <div className="border border-black border-t-0 py-1 px-2.5 font-black text-[13px] sm:text-[13.5px] bg-white tracking-wide">
                {societyBanner}
              </div>
            </div>

            {/* Loan Number & Date strip table */}
            <table className="w-full border border-black border-t-0 text-[11px] font-bold">
              <tbody>
                <tr>
                  <td className="py-1 px-2 w-[28%] whitespace-nowrap">கால்நடை பராமரிப்பு கடன் எண்</td>
                  <td className="border-r border-black py-1 px-2 w-[22%] font-mono"></td>
                  <td className="py-1 px-2 w-[12%] text-right whitespace-nowrap">நாள் :</td>
                  <td className="py-1 px-2 w-[38%] font-mono"></td>
                </tr>
              </tbody>
            </table>

            {/* Section: அனுப்புநர் (Borrower) Box with exact Initial cell and Photo box */}
            <div className="mt-2 mb-1.5">
              <div className="font-bold text-[11.5px] mb-0.5">அனுப்புநர்</div>
              <table className="w-full border-collapse border border-black text-[10.5px]">
                <tbody>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold w-[11%]">உ எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold w-[25%] text-[11.5px]">
                      {borrowerAClass || ''}
                    </td>
                    <td rowSpan={6} className="border border-black p-1 w-[20%] text-center align-middle bg-white">
                      <div className="flex flex-col items-center justify-center h-full min-h-[115px] text-[10px] text-stone-700 font-bold leading-snug">
                        <span>மனுதாரர் புகைப்படம்</span>
                        <span className="text-[9px] text-stone-500 font-normal mt-1">(பாஸ்போர்ட் அளவு)</span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1 font-bold w-[18%]">உ ஆதார் எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold text-[11px] w-[26%]">
                      {borrowerAadhar || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">பெயர்</td>
                    <td className="border border-black p-0">
                      <div className="flex h-full items-stretch">
                        <span className="border-r border-black px-2 py-1 font-bold flex items-center justify-center shrink-0 min-w-[28px]">
                          {borrowerIns || ''}
                        </span>
                        <span className="px-2 py-1 font-bold flex items-center grow text-[11px]">
                          {borrowerName || ''}
                        </span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">உ குடும்ப அட்டை</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {borrowerRationCard || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">த பெ</td>
                    <td className="border border-black px-2 py-1 font-bold">
                      {borrowerCareOf || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">உ கைபேசி எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {borrowerMobile || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">முகவரி</td>
                    <td className="border border-black px-2 py-1">
                      {borrowerDoor || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">MDCC KCC எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {borrowerMdccKcc || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold"></td>
                    <td className="border border-black px-2 py-1">
                      {borrowerStreet || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">ERP எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {borrowerErp || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold"></td>
                    <td className="border border-black px-2 py-1">
                      {borrowerVillage || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">SB எண்</td>
                    <td className="border border-black p-0">
                      <div className="flex h-full items-stretch">
                        <span className="border-r border-black px-2 py-1 font-bold flex items-center justify-center shrink-0 min-w-[34px]">
                          SB
                        </span>
                        <span className="px-2 py-1 font-mono font-bold flex items-center grow">
                          {borrowerSb || ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: பெறுநர் (Recipient) - Address shifted to the right as requested */}
            <div className="my-2 text-[11px] leading-snug">
              <div className="font-bold underline mb-0.5 text-[11.5px]">பெறுநர்</div>
              <div className="pl-24 sm:pl-28 space-y-0.5 text-stone-900 font-medium text-[11px]">
                <div>தலைவர் / செயலாளர் அவர்கள்,</div>
                <div>TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்,</div>
                <div>உத்தமபாளையம் தாலுகா &nbsp;&nbsp;&nbsp;&nbsp; தேனி மாவட்டம்.</div>
              </div>
              <div className="font-bold mt-1 text-[11px]">ஐயா - அம்மையீர்,</div>
            </div>

            {/* Table 1: கால்நடை பராமரிப்பு மூலதனக் கடன் கோரும் விபரம் - Enlarged boxes for entering amounts */}
            <div className="mt-2">
              <div className="font-bold text-center text-[12px] mb-1">
                கால்நடை பராமரிப்பு மூலதனக் கடன் கோரும் விபரம்
              </div>
              <table className="w-full border-collapse border border-black text-[10.5px] sm:text-[11px] text-center">
                <thead>
                  <tr className="font-bold bg-stone-50/50">
                    <th rowSpan={2} className="border border-black p-1.5 w-[24%]">கால்நடைகளின் வகை</th>
                    <th rowSpan={2} className="border border-black p-1.5 w-[20%]">கால்நடைகளின் எண்ணிக்கை</th>
                    <th colSpan={2} className="border border-black p-1.5 w-[28%]">கடன்அளவு திட்டத்தின்படி தகுதியான</th>
                    <th colSpan={2} className="border border-black p-1.5 w-[28%]">கடன் தேவை விபரம்</th>
                  </tr>
                  <tr className="font-bold bg-stone-50/50">
                    <th className="border border-black p-1 w-[14%]">எண்ணிக்கை</th>
                    <th className="border border-black p-1 w-[14%]">ரொக்கம்</th>
                    <th className="border border-black p-1 w-[14%]">எண்ணிக்கை</th>
                    <th className="border border-black p-1 w-[14%]">ரொக்கம்</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-12 sm:h-13">
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={animalType}
                        onChange={(e) => {
                          setAnimalType(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-[12px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={animalCount}
                        onChange={(e) => {
                          setAnimalCount(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={eligibleCount}
                        onChange={(e) => {
                          setEligibleCount(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={eligibleCash}
                        onChange={(e) => {
                          setEligibleCash(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={animalCount}
                        onChange={(e) => {
                          setAnimalCount(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={loanAmount || loanReqAmount}
                        onChange={(e) => {
                          setLoanAmount(e.target.value);
                          setLoanReqAmount(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] sm:text-[14px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                  </tr>
                  <tr className="h-10 sm:h-11">
                    <td className="border border-black p-0"></td>
                    <td className="border border-black p-0"></td>
                    <td className="border border-black p-0"></td>
                    <td className="border border-black p-0"></td>
                    <td className="border border-black p-0"></td>
                    <td className="border border-black p-0"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 2: முன்கடன் & பங்குத்தொகை விபரம் - Enlarged boxes below headers */}
            <div className="mt-2">
              <table className="w-full border-collapse border border-black text-[10.5px] sm:text-[11px] text-center">
                <thead>
                  <tr className="font-bold bg-stone-50/50">
                    <th className="border border-black p-1.5 w-[20%]">முன்கடன் எண்</th>
                    <th className="border border-black p-1.5 w-[20%]">முன்கடன் தேதி</th>
                    <th className="border border-black p-1.5 w-[20%]">முன்கடன் தொகை</th>
                    <th className="border border-black p-1.5 w-[20%]">இதுவரை உள்ள பங்குத்தொகை</th>
                    <th className="border border-black p-1.5 w-[20%]">தற்போது பிடிக்கும் பங்கு தொகை</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-12 sm:h-13">
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={prevLoanNo}
                        onChange={(e) => {
                          setPrevLoanNo(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={prevLoanDate}
                        onChange={(e) => {
                          setPrevLoanDate(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={prevLoanAmount}
                        onChange={(e) => {
                          setPrevLoanAmount(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={existingShare}
                        onChange={(e) => {
                          setExistingShare(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={deductedShare}
                        onChange={(e) => {
                          setDeductedShare(e.target.value);
                          e.currentTarget.setAttribute('value', e.target.value);
                        }}
                        placeholder=""
                        className="w-full h-full text-center bg-transparent border-none outline-none font-mono font-bold text-[13px] print:text-black focus:bg-amber-50/40"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: நபர் பிணையம் அடிப்படையாக இருந்தால் பிணையாதாரர் விபரம் */}
            <div className="mt-2.5">
              <div className="font-bold text-center text-[11.5px] mb-1">
                நபர் பிணையம் அடிப்படையாக இருந்தால் பிணையாதாரர் விபரம்
              </div>
              <table className="w-full border-collapse border border-black text-[10.5px]">
                <tbody>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold w-[11%]">உ எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold w-[25%] text-[11.5px]">
                      {guarantorAClass || ''}
                    </td>
                    <td rowSpan={6} className="border border-black p-1 w-[20%] text-center align-middle bg-white">
                      <div className="flex flex-col items-center justify-center h-full min-h-[115px] text-[10px] text-stone-700 font-bold leading-snug">
                        <span>பிணையாதாரர் புகைப்படம்</span>
                        <span className="text-[9px] text-stone-500 font-normal mt-1">(பாஸ்போர்ட் அளவு)</span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1 font-bold w-[18%]">பி ஆதார் எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold text-[11px] w-[26%]">
                      {guarantorAadhar || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">பெயர்</td>
                    <td className="border border-black p-0">
                      <div className="flex h-full items-stretch">
                        <span className="border-r border-black px-2 py-1 font-bold flex items-center justify-center shrink-0 min-w-[28px]">
                          {guarantorIns || ''}
                        </span>
                        <span className="px-2 py-1 font-bold flex items-center grow text-[11px]">
                          {guarantorName || ''}
                        </span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">பி குடும்ப அட்டை</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {guarantorRationCard || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">த பெ</td>
                    <td className="border border-black px-2 py-1 font-bold">
                      {guarantorCareOf || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">பி கைபேசி எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {guarantorMobile || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold">முகவரி</td>
                    <td className="border border-black px-2 py-1">
                      {guarantorDoor || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">MDCC KCC எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {guarantorMdccKcc || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold"></td>
                    <td className="border border-black px-2 py-1">
                      {guarantorStreet || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">ERP எண்</td>
                    <td className="border border-black px-2 py-1 font-mono font-bold">
                      {guarantorErp || ''}
                    </td>
                  </tr>
                  <tr className="h-6 sm:h-6.5">
                    <td className="border border-black px-2 py-1 font-bold"></td>
                    <td className="border border-black px-2 py-1">
                      {guarantorVillage || ''}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">SB எண்</td>
                    <td className="border border-black p-0">
                      <div className="flex h-full items-stretch">
                        <span className="border-r border-black px-2 py-1 font-bold flex items-center justify-center shrink-0 min-w-[34px]">
                          SB
                        </span>
                        <span className="px-2 py-1 font-mono font-bold flex items-center grow">
                          {guarantorSb || ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: நிலஅடமானம் (Land Mortgage) - Enlarged fonts as requested */}
            <div className="mt-2.5 text-[11px]">
              <div className="font-bold text-center text-[12px]">
                நிலஅடமானம் விபரம்
              </div>
              <div className="text-center italic text-[10px] text-stone-700">
                (1.60 இலட்சத்திற்கு கூடுதலாக கடன் பெறும் நிகழ்வில் இணைக்கப்பட வேண்டும்)
              </div>
              <div className="my-1 font-medium text-[11px] sm:text-[11.5px]">எனக்கு கீழ்கண்டவாறு சொந்தநிலம் உள்ளது.</div>
              <table className="w-full border-collapse border border-black text-center text-[10.5px] sm:text-[11px]">
                <thead>
                  <tr className="font-bold bg-stone-50/40">
                    <th rowSpan={2} className="border border-black p-1">சர்வே எண்கள்</th>
                    <th rowSpan={2} className="border border-black p-1">பாசன விபரம்</th>
                    <th colSpan={2} className="border border-black p-1">நிலத்தின் பரப்பு</th>
                    <th rowSpan={2} className="border border-black p-1">SF / MF / OF</th>
                  </tr>
                  <tr className="font-bold bg-stone-50/40">
                    <th className="border border-black p-1">ஏக்கர்</th>
                    <th className="border border-black p-1">செண்ட்</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-6">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="h-6">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: நகை அடமானம் (Jewel Pledge) - Enlarged fonts as requested */}
            <div className="mt-2.5 text-[11px]">
              <div className="font-bold text-center text-[12px]">
                கேசிசி கடனுக்கு ஈடாக பெறப்படும் நகைகளின் விவரம்
              </div>
              <div className="text-center italic text-[10px] text-stone-700">
                (1.60 இலட்சத்திற்கு கூடுதலாக கடன் பெறும் நிகழ்வில் இணைக்கப்பட வேண்டும்.)
              </div>
              <div className="my-1 text-justify leading-relaxed text-[10.5px] sm:text-[11px]">
                எனக்கு சொந்தமான நகைகளை ஈடாகவைத்து கால்நடை மற்றும் அவைசார்ந்த தொழில்களுக்கான மூலதன கடன் (KCC கடன்) பெறுவதற்கு உரிய ஆவணங்களை இத்துடன் இணைத்துள்ளேன். எனக்கு ரூ. ………………… கடன் அனுமதி செய்து தருமாறு கேட்டுக் கொள்கிறேன்.
              </div>
              <table className="w-full border-collapse border border-black text-center text-[10px] sm:text-[10.5px]">
                <thead>
                  <tr className="font-bold bg-stone-50/40">
                    <th rowSpan={2} className="border border-black p-1">உறுப்பினர் பெயர் / எண்</th>
                    <th rowSpan={2} className="border border-black p-1">கடன் தேதி</th>
                    <th rowSpan={2} className="border border-black p-1">நகையின் விபரம்</th>
                    <th colSpan={2} className="border border-black p-1">நகையின் மொத்த எடை</th>
                    <th colSpan={2} className="border border-black p-1">கழிவு</th>
                    <th colSpan={2} className="border border-black p-1">நிகர எடை</th>
                    <th rowSpan={2} className="border border-black p-1">நகையின் மொத்த மதிப்பு</th>
                    <th rowSpan={2} className="border border-black p-1">கடன் தொகை ரூ.</th>
                    <th rowSpan={2} className="border border-black p-1">தவணை தேதி</th>
                  </tr>
                  <tr className="font-bold bg-stone-50/40">
                    <th className="border border-black p-1">கி</th>
                    <th className="border border-black p-1">மி.கி</th>
                    <th className="border border-black p-1">கி</th>
                    <th className="border border-black p-1">மி.கி</th>
                    <th className="border border-black p-1">கி</th>
                    <th className="border border-black p-1">மி.கி</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-6">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Agreement sentence */}
            <div className="mt-2 text-[10.5px] sm:text-[11px] text-justify leading-relaxed">
              தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கத்தின் சட்டவிதிகளுக்கு உட்பட்டு பெற்ற கடனை உரிய தவணை தேதிகளில் செலுத்தி வருவேன் என்றும், தவணை தவறும் பட்சத்தில் என்னால் ஈடாக வைக்கப்பட்ட நகைகளை ஏலம் விட்டு கடனின் தவணை தொகைகளுக்கு ஈடுசெய்து கொள்ள இதன் மூலம் சம்மதிக்கிறேன்
            </div>

            {/* Signatures Row - Ample dedicated signing space as requested */}
            <div className="flex justify-between items-end mt-6 mb-2 px-8 sm:px-14 font-black text-[12.5px]">
              <div className="text-center w-52 sm:w-60">
                {/* Dedicated blank signing area */}
                <div className="h-14 sm:h-16 flex items-end justify-center mb-1 text-[10.5px] text-stone-400 font-normal">
                  (கையொப்பம் / கைரேகை)
                </div>
                <div className="pt-1.5 px-3 border-t-2 border-black inline-block w-full text-center">
                  பிணையாதாரர் கையொப்பம்
                </div>
              </div>
              <div className="text-center w-52 sm:w-60">
                {/* Dedicated blank signing area */}
                <div className="h-14 sm:h-16 flex items-end justify-center mb-1 text-[10.5px] text-stone-400 font-normal">
                  (கையொப்பம் / கைரேகை)
                </div>
                <div className="pt-1.5 px-3 border-t-2 border-black inline-block w-full text-center">
                  கடன்தாரர் கையொப்பம்
                </div>
              </div>
            </div>
          </div>

          {/* Visual Page Break 1 for Screen Preview */}
          <div className="no-print my-6 py-2 bg-stone-100 border-y border-dashed border-stone-400 text-center font-bold text-xs text-stone-600 flex items-center justify-center gap-2">
            <span>📄 தாள் 1 முடிவு: பிணையாதாரர் & கடன்தாரர் கையொப்பம் (End of Page 1 - Legal Sheet)</span>
          </div>

          {/* ============================================================== */}
          {/* PAGE 2: MEETHI ULLA THAGAVALGAL - LEGAL SHEET 2                */}
          {/* ============================================================== */}
          <div className="legal-page-last pt-1">
            {/* Boxed Title 1: கடன் கோரும் உறுப்பினர் உறுதிமொழி */}
            <div className="flex justify-center my-2">
              <div className="border-2 border-black px-10 py-1 font-black text-center text-[13px] inline-block tracking-wide">
                கடன் கோரும் உறுப்பினர் உறுதிமொழி
              </div>
            </div>

            <div className="p-2.5 text-[12px] space-y-2 leading-relaxed text-justify">
              <div>1. இக்கடன் பெறப்பட்ட காரியத்திற்கு மட்டுமே பயன்படுத்தப்படும் என்று உறுதி கூறுகிறேன்.</div>
              <div>2. இக்கடனுக்கு ஆதாரமாக காட்டப்படும் கால்நடைகள் எனக்கு சொந்தமானவை என்று உறுதிகூறுகிறேன்.</div>
              <div>3. தமிழ்நாடு கூட்டுறவுச் சங்கங்களின் சட்டம் 1983 மற்றும் விதிகள் 1988, தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கத்தின் துணைவிதிகளுக்குட்பட்டு பெற்ற கடனை உரிய தவணை தேதிக்குள் செலுத்திவிடுவேன் என்றும், தவறும் பட்சத்தில் சங்கம் மேற்கொள்ளும் சட்டப்பூர்வ நடவடிக்கைகளுக்கு சம்மதிக்கிறேன் என்றும் உறுதியளிக்கிறேன்.</div>
              <div>4. இத்துடன் சுயஉறுதிமொழி சான்று இணைத்துள்ளேன்.</div>
            </div>

            <div className="flex justify-end mt-4 mb-3 pr-10 text-[12px] font-bold">
              <div className="pt-1 px-6 text-center border-t border-dotted border-stone-500">
                உறுப்பினர் கையொப்பம்
              </div>
            </div>

            {/* Section: இணைப்பு */}
            <div className="mt-3 p-2.5 text-[12px] space-y-1 border border-stone-400 rounded-sm bg-stone-50/50">
              <div className="font-bold underline mb-1 text-[12.5px]">இணைப்பு :</div>
              <div className="pl-6 space-y-0.5">
                <div>1. ஆதார் அட்டை நகல்</div>
                <div>2. குடும்ப அட்டை நகல்</div>
                <div>3. ஆதாரமாக காட்டப்படும் கால்நடைகளுடன் உறுப்பினர் நின்று எடுத்த புகைப்படம்</div>
                <div>4. சுய உறுதிமொழி அறிவிப்பு சான்றிதழ்</div>
              </div>
            </div>

            {/* Boxed Title 2: தலைவர் மற்றும் செயலாளர் உறுதிமொழி */}
            <div className="flex justify-center mt-5 mb-2">
              <div className="border-2 border-black px-10 py-1 font-black text-center text-[13px] inline-block tracking-wide">
                தலைவர் மற்றும் செயலாளர் உறுதிமொழி
              </div>
            </div>

            <div className="p-2 text-[12px] leading-relaxed text-justify">
              மேற்கண்டவாறு கடன்கோரும் உறுப்பினரால் கொடுக்கப்பட்ட விபரங்கள் அனைத்தும் சரியானவை என்றும் இக்கடனுக்கு ஆதாரமாக காட்டப்படும் கால்நடைகள் சங்கச் செயலாளரால் நேரில் கள ஆய்வு செய்யப்பட்டதில் சரியாக உள்ளது என்றும் எனவே கடன்தாரர் கோருகிறபடி ரூ: {loanAmount ? <span className="font-mono font-bold underline px-1.5">{loanAmount}</span> : '__________'} (ரூபாய் ________________________________________மட்டும்) விவசாயகடன் அட்டை திட்டம் மூலம் (கேசிசி) கால் நடைவளர்ப்பு மற்றும் அவை சார்ந்த தொழில்களுக்கான மூலதனக் கடன் அனுமதிக்கலாம் என சான்றுசெய்கிறோம்.
            </div>

            <div className="flex justify-between items-end mt-8 mb-4 px-16 font-black text-[13px]">
              <div className="pt-1 px-6 text-center">செயலாளர்</div>
              <div className="pt-1 px-6 text-center">தலைவர்</div>
            </div>

            {/* Boxed Title 3: சரகமேற்பார்வையாளர் சான்று */}
            <div className="flex justify-center mt-5 mb-2">
              <div className="border-2 border-black px-10 py-1 font-black text-center text-[13px] inline-block tracking-wide">
                சரகமேற்பார்வையாளர் சான்று
              </div>
            </div>

            <div className="p-2 text-[12px] leading-relaxed text-justify">
              மேற்கண்ட உறுப்பினர் கோரும் கடனுக்கு ஆதாரமாக காட்டப்படும் கால்நடைகள் என்னால் நேரில் களஆய்வு செய்யப்பட்டதில் சரியாக உள்ளது. எனவே விவசாயகடன் அட்டைதிட்டத்தின் கீழ் கால் நடைவளர்ப்பு மற்றும் அவை சார்ந்த தொழில்களுக்கு மூலதனக் கடன் (Working Capital) ரூ: {loanAmount ? <span className="font-mono font-bold underline px-1.5">{loanAmount}</span> : '____________-'} (ரூபாய்_____________________________________மட்டும்) கடன் அனுமதிக்கலாம்.
            </div>

            <div className="flex justify-end mt-8 mb-4 pr-16 font-black text-[13px]">
              <div className="pt-1 px-6 text-center">சரகமேற்பார்வையாளர்</div>
            </div>

            {/* Boxed Title 4: அலுவலக உபயோகத்திற்கு */}
            <div className="flex justify-center mt-5 mb-2">
              <div className="border-2 border-black px-10 py-1 font-black text-center text-[13px] inline-block tracking-wide">
                அலுவலக உபயோகத்திற்கு
              </div>
            </div>

            <div className="p-2 text-[12px] leading-relaxed text-justify">
              நிர்வாகக்குழுதீர்மானம் எண். _____ தேதி ______________ ன்படி உஎண் : <span className="font-mono font-bold">[{borrowerAClass || '        '}]</span> திரு-திருமதி <span className="font-bold">[{borrowerName ? `${borrowerIns ? `${borrowerIns} ` : ''}${borrowerName}` : '________________________'}]</span> அவர்களுக்கு நபர் ஜாமீன் பெயரில் - நிலஅடமானத்தின் பெயரில் - நகைஈட்டின் பெயரில் - ரூ: {loanAmount ? <span className="font-mono font-bold underline px-1.5">{loanAmount}</span> : '_________________________'} மட்டும் (ரூபாய் _____________________________________________ மட்டும்) _______வட்டிவிகிதத்தில் ________________ மாததவணையில் கீழ்க்கண்டவாறு கால்நடைவளர்ப்பு மற்றும் அவை சார்ந்த தொழில்களுக்கு மூலதனக் கடன் கேசிசிகடன் திட்டத்தின் கீழ் அனுமதிக்கப்படுகிறது
            </div>

            <table className="w-full border-collapse border-2 border-black text-[11.5px] text-center mt-2.5">
              <thead>
                <tr className="font-bold bg-stone-50/50">
                  <th className="border border-black p-2">கால்நடைகளின் வகை</th>
                  <th className="border border-black p-2">கால்நடைகளின் எண்ணிக்கை</th>
                  <th className="border border-black p-2">அனுமதிக்கப்பட்ட கடன்தொகை (ரூபாயில்)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-8 font-bold">
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5 font-bold">{animalCount || ''}</td>
                  <td className="border border-black p-1.5 font-bold">{loanAmount || ''}</td>
                </tr>
                <tr className="h-8">
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
                <tr className="text-center font-bold h-8">
                  <td className="border border-black p-1.5 font-black">மொத்தம்</td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-8 mb-4 pr-16 font-black text-[13px]">
              <div className="pt-1 px-6 text-center">செயலாளர்</div>
            </div>
          </div>
          {/* Visual Page Break 2 for Screen Preview */}
          <div className="no-print my-6 py-2 bg-emerald-50 border-y border-dashed border-emerald-400 text-center font-bold text-xs text-emerald-800 flex items-center justify-center gap-2">
            <span>✓ தாள் 2 முடிவு (End of Page 2 - லீகல் அச்சு விண்ணப்பம் நிறைவுற்றது)</span>
          </div>
        </div>
      </div>

      {/* In-App Document Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[94vh] flex flex-col overflow-hidden border border-stone-300">
            {/* Modal Header */}
            <div className="bg-[#007A4D] text-white px-5 py-3 flex items-center justify-between gap-3 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="font-black text-sm sm:text-base tracking-wide">
                  {previewModal.title} - அச்சு முன்னோட்டம் (Print Preview)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('preview-modal-iframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ அச்சிடுக (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.open();
                        win.document.write(previewModal.html);
                        win.document.close();
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="புதிய டேப்பில் திறக்க"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">புதிய டேப்பில்</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal({ isOpen: false, title: '', html: '' })}
                  className="bg-white/20 hover:bg-rose-600 text-white font-black text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
                  title="மூடுக"
                >
                  ✕ மூடுக
                </button>
              </div>
            </div>

            {/* Modal Body with Sandboxed/srcDoc Iframe */}
            <div className="flex-1 bg-stone-100 p-2 sm:p-4 overflow-auto flex justify-center">
              <iframe
                id="preview-modal-iframe"
                srcDoc={previewModal.html}
                title={previewModal.title}
                className="w-full h-full bg-white rounded-lg shadow-md border border-stone-200"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
