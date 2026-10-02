import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2,
  Edit3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { LoanMember, KCCDisbursementRecord } from '../types';
import { CooperativeLogo } from './CooperativeLogo';

interface KCCApplicationScreenProps {
  members: LoanMember[];
  disbursements?: KCCDisbursementRecord[];
  spreadsheetId?: string;
  onAddNewMember?: () => void;
}

// Helper to format full name with initial properly in Tamil (Initial + Name)
const formatNameWithInitial = (name?: string, initial?: string): string => {
  const cleanName = (name || '').trim();
  const cleanIns = (initial || '').trim();
  
  if (!cleanName) return '';
  if (!cleanIns || cleanIns === '-') return cleanName;
  
  if (cleanName.startsWith(`${cleanIns}.`) || cleanName.startsWith(`${cleanIns} `)) {
    return cleanName;
  }
  
  return `${cleanIns}. ${cleanName}`;
};

export const KCCApplicationScreen: React.FC<KCCApplicationScreenProps> = ({
  members = []
}) => {
  // Search inputs - EMPTY ON INITIAL LOAD as requested
  const [borrowerAClassInput, setBorrowerAClassInput] = useState<string>('');
  const [guarantorAClassInput, setGuarantorAClassInput] = useState<string>('');

  // Search status & feedback messages
  const [borrowerSearchStatus, setBorrowerSearchStatus] = useState<string>('');
  const [guarantorSearchStatus, setGuarantorSearchStatus] = useState<string>('');
  const [newTabStatus, setNewTabStatus] = useState<string>('');

  // Toggle manual edit drawer for inputs (collapsed by default for compact UI)
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);

  // Society details (Pure Tamil strings - No Devanagari/Hindi characters)
  const [societyName] = useState('T.U.3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு');
  const [societySubName] = useState('கடன் சங்கம் தேவாரம் - தேனி மாவட்டம்.');
  const [loanSchemeTitle] = useState('உழவர் கடன் அட்டை திட்டத்தின் (Kisan Credit Card) கீழ் பயிர்க்கடன் விண்ணப்பம்');
  const [loanCategoryText] = useState('கடன் வகை:- நபர் ஜாமீன்,அடமானம்');
  const [farmerType] = useState('கடன்தாரர் வகை SF/MF/OF');

  // Recipient details (Pure Tamil strings)
  const [recipientDesignation] = useState('செயலாளர் அவர்கள்');
  const [recipientSociety] = useState('TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் தேவாரம்');
  const [recipientTaluk] = useState('உத்தமபாளையம் தாலுகா');
  const [recipientDistrict] = useState('தேனி மாவட்டம்');

  // Borrower personal fields - EMPTY ON START (Only filled when borrower number entered)
  const [borrowerAClass, setBorrowerAClass] = useState<string>('');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerCareOf, setBorrowerCareOf] = useState<string>('');
  const [borrowerDoor, setBorrowerDoor] = useState<string>('');
  const [borrowerStreet, setBorrowerStreet] = useState<string>('');
  const [borrowerVillage, setBorrowerVillage] = useState<string>('');
  const [borrowerMobile, setBorrowerMobile] = useState<string>('');
  const [borrowerAadhar, setBorrowerAadhar] = useState<string>('');
  const [borrowerMdccKcc, setBorrowerMdccKcc] = useState<string>('');
  const [borrowerErp, setBorrowerErp] = useState<string>('');
  const [borrowerSb, setBorrowerSb] = useState<string>('');
  const [borrowerPan, setBorrowerPan] = useState<string>('');
  const [borrowerRationCard, setBorrowerRationCard] = useState<string>('');

  // Guarantor personal fields - EMPTY ON START
  const [guarantorAClass, setGuarantorAClass] = useState<string>('');
  const [guarantorName, setGuarantorName] = useState<string>('');
  const [guarantorCareOf, setGuarantorCareOf] = useState<string>('');
  const [guarantorAddress, setGuarantorAddress] = useState<string>('');
  const [guarantorMobile, setGuarantorMobile] = useState<string>('');
  const [guarantorAadhar, setGuarantorAadhar] = useState<string>('');

  // Clear all borrower details helper
  const clearBorrowerFields = () => {
    setBorrowerAClass('');
    setBorrowerName('');
    setBorrowerCareOf('');
    setBorrowerDoor('');
    setBorrowerStreet('');
    setBorrowerVillage('');
    setBorrowerMobile('');
    setBorrowerAadhar('');
    setBorrowerMdccKcc('');
    setBorrowerErp('');
    setBorrowerSb('');
    setBorrowerPan('');
    setBorrowerRationCard('');
    setBorrowerSearchStatus('');
  };

  // Clear all guarantor details helper
  const clearGuarantorFields = () => {
    setGuarantorAClass('');
    setGuarantorName('');
    setGuarantorCareOf('');
    setGuarantorAddress('');
    setGuarantorMobile('');
    setGuarantorAadhar('');
    setGuarantorSearchStatus('');
  };

  // Search for Borrower: Only populate if entered
  const performBorrowerSearch = (query: string) => {
    const q = query.trim();
    if (!q) {
      clearBorrowerFields();
      return;
    }

    const cleanQuery = q.replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });

    if (found) {
      setBorrowerAClass(found.aClass || found.memberNo || q);
      setBorrowerName(formatNameWithInitial(found.name, found.ins));
      setBorrowerCareOf(found.fatherOrHusbandName || found.careOf || '');
      setBorrowerDoor(found.door || '');
      setBorrowerStreet(found.street || '');
      setBorrowerVillage(found.village || '');
      setBorrowerMobile(found.mobile || '');
      setBorrowerAadhar(found.aadharNo || found.adhar || '');
      setBorrowerMdccKcc(found.mdcc || found.kccAccountNo || '');
      setBorrowerErp(found.erp || '');
      setBorrowerSb(found.sb || '');
      setBorrowerRationCard(found.rationCard || '');
      setBorrowerSearchStatus(`✓ ${formatNameWithInitial(found.name, found.ins)} (A-Class: ${found.aClass || found.memberNo}) பெறப்பட்டது`);
    } else {
      clearBorrowerFields();
      setBorrowerAClass(q);
      setBorrowerSearchStatus(`எண் "${q}" கண்டறியப்படவில்லை`);
    }
  };

  // Search for Guarantor: Only populate if entered
  const performGuarantorSearch = (query: string) => {
    const q = query.trim();
    if (!q) {
      clearGuarantorFields();
      return;
    }

    const cleanQuery = q.replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });

    if (found) {
      setGuarantorAClass(found.aClass || found.memberNo || q);
      setGuarantorName(formatNameWithInitial(found.name, found.ins));
      setGuarantorCareOf(found.fatherOrHusbandName || found.careOf || '');
      const addr = [found.door, found.street, found.village].filter(Boolean).join(', ');
      setGuarantorAddress(addr || found.village || '');
      setGuarantorMobile(found.mobile || '');
      setGuarantorAadhar(found.aadharNo || found.adhar || '');
      setGuarantorSearchStatus(`✓ ${formatNameWithInitial(found.name, found.ins)} பெறப்பட்டது`);
    } else {
      clearGuarantorFields();
      setGuarantorAClass(q);
      setGuarantorSearchStatus(`எண் "${q}" பட்டியலில் இல்லை`);
    }
  };

  const handleSearchBorrower = () => {
    performBorrowerSearch(borrowerAClassInput);
  };

  const handleSearchGuarantor = () => {
    performGuarantorSearch(guarantorAClassInput);
  };

  const handleBorrowerInputChange = (val: string) => {
    setBorrowerAClassInput(val);
    if (!val.trim()) {
      clearBorrowerFields();
      return;
    }
    const cleanQuery = val.trim().replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });
    if (found) {
      setBorrowerAClass(found.aClass || found.memberNo || val.trim());
      setBorrowerName(formatNameWithInitial(found.name, found.ins));
      setBorrowerCareOf(found.fatherOrHusbandName || found.careOf || '');
      setBorrowerDoor(found.door || '');
      setBorrowerStreet(found.street || '');
      setBorrowerVillage(found.village || '');
      setBorrowerMobile(found.mobile || '');
      setBorrowerAadhar(found.aadharNo || found.adhar || '');
      setBorrowerMdccKcc(found.mdcc || found.kccAccountNo || '');
      setBorrowerErp(found.erp || '');
      setBorrowerSb(found.sb || '');
      setBorrowerRationCard(found.rationCard || '');
      setBorrowerSearchStatus(`✓ ${formatNameWithInitial(found.name, found.ins)} பெறப்பட்டது`);
    } else {
      clearBorrowerFields();
      setBorrowerAClass(val.trim());
    }
  };

  const handleGuarantorInputChange = (val: string) => {
    setGuarantorAClassInput(val);
    if (!val.trim()) {
      clearGuarantorFields();
      return;
    }
    const cleanQuery = val.trim().replace(/^A-?/i, '');
    const found = members.find(m => {
      const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
      const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
      return a === cleanQuery || no === cleanQuery;
    });
    if (found) {
      setGuarantorAClass(found.aClass || found.memberNo || val.trim());
      setGuarantorName(formatNameWithInitial(found.name, found.ins));
      setGuarantorCareOf(found.fatherOrHusbandName || found.careOf || '');
      const addr = [found.door, found.street, found.village].filter(Boolean).join(', ');
      setGuarantorAddress(addr || found.village || '');
      setGuarantorMobile(found.mobile || '');
      setGuarantorAadhar(found.aadharNo || found.adhar || '');
      setGuarantorSearchStatus(`✓ ${formatNameWithInitial(found.name, found.ins)} பெறப்பட்டது`);
    } else {
      clearGuarantorFields();
      setGuarantorAClass(val.trim());
    }
  };

  // =========================================================================
  // PRINT HANDLER: OPENS APPLICATION PRINT FORM IN A NEW TAB (புதிய டேப்)
  // Strictly constrained to EXACTLY 3 LEGAL PAGES without overflow
  // =========================================================================
  const handleCreateAndPrintApplication = () => {
    if (borrowerAClassInput.trim()) {
      performBorrowerSearch(borrowerAClassInput);
    }
    if (guarantorAClassInput.trim()) {
      performGuarantorSearch(guarantorAClassInput);
    }

    const docEl = document.getElementById('kcc-application-exact-doc');
    if (!docEl) {
      window.print();
      return;
    }

    // Collect all stylesheets from head
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const appMemberLabel = borrowerName 
      ? `கடன்தாரர்: ${borrowerName} (A-${borrowerAClassInput || borrowerAClass || ''})`
      : 'கேசிசி கடன் விண்ணப்பம்';

    const newTabHtml = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>கேசிசி கடன் விண்ணப்ப படிவம் - ${borrowerName || 'KCC Form'} (3 பக்கங்கள் லீகல் அச்சு)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${headStyles}
  <style>
    @page {
      size: legal portrait !important;
      margin: 8mm 10mm 8mm 10mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .page-sheet-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
      }
      #kcc-application-exact-doc {
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .legal-page {
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 0 0 4px 0 !important;
        border-bottom: none !important;
        box-sizing: border-box !important;
      }
      .legal-page-last {
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 0 !important;
        border-bottom: none !important;
        box-sizing: border-box !important;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #000000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta Malar", "Noto Sans Tamil", sans-serif;
      line-height: 1.35;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #064e3b;
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
      box-shadow: 0 8px 30px rgba(0,0,0,0.18);
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
    }
    #kcc-application-exact-doc {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
    }
    .legal-page {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      padding: 0 0 4px 0 !important;
      margin-bottom: 0 !important;
      border-bottom: none !important;
      box-sizing: border-box !important;
    }
    .legal-page-last {
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      padding-top: 0 !important;
      border-bottom: none !important;
      box-sizing: border-box !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      border: 1.5px solid #000000 !important;
    }
    th, td {
      border: 1px solid #000000 !important;
    }
    .border-dashed {
      border-bottom: none !important;
    }
    .border-black {
      border-color: #000000 !important;
    }
  </style>
</head>
<body>
  <!-- Print Control Bar (Hidden when printing) -->
  <div class="no-print no-print-bar">
    <div style="display: flex; align-items: center; gap: 14px;">
      <span style="font-size: 24px;">📋</span>
      <div>
        <div style="font-weight: 900; font-size: 15px; color: #ffffff; letter-spacing: 0.2px;">
          கேசிசி கடன் விண்ணப்ப அச்சுப் படிவம் (KCC Application Print Form)
        </div>
        <div style="font-size: 12px; color: #a7f3d0; margin-top: 2px;">
          துல்லியமாக 3 பக்கங்கள் • லீகல் அளவு (Legal Size 8.5" x 14") • ${appMemberLabel}
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 900; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        🖨️ விண்ணப்பத்தை அச்சிடுக (Print Form)
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.18); color: #ffffff; border: 1px solid rgba(255,255,255,0.35); padding: 9px 15px; border-radius: 7px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ✕ மூடுக (Close)
      </button>
    </div>
  </div>

  <!-- Document Sheet Container -->
  <div class="page-sheet-container">
    <div id="kcc-application-exact-doc">
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

    let opened = false;
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(newTabHtml);
        printWindow.document.close();
        opened = true;
      }
    } catch {
      opened = false;
    }

    if (!opened) {
      // Fallback via Blob URL anchor click if window.open was blocked by popup blocker
      try {
        const blob = new Blob([newTabHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          link.remove();
          URL.revokeObjectURL(blobUrl);
        }, 5000);
        opened = true;
      } catch {
        // Last fallback: inline print
        window.print();
      }
    }

    setNewTabStatus('புதிய டேப்பில் உருவாக்கப்பட்டது!');
    setTimeout(() => setNewTabStatus(''), 4000);
  };

  // Helper to generate pristine A4 Self-Declaration HTML exactly like uploaded format
  const generateDeclarationHtml = (
    memberAClass: string,
    name: string,
    careOf: string,
    door: string,
    street: string,
    village: string,
    mobile: string
  ) => {
    return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>சுய உறுதிமொழி - ${name || memberAClass || 'உறுப்பினர்'} (A4 - 1 பக்கம்)</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 14mm 20mm 12mm 20mm !important;
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
      line-height: 1.5;
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
      padding: 16mm 20mm 14mm 22mm;
      margin: 20px auto;
      background: #ffffff;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      box-sizing: border-box;
      position: relative;
    }
    @media print {
      html, body {
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
      .a4-page-sheet {
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-before: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📄</span>
      <span>சுய உறுதிமொழி படிவம் (A4 ஒரே தாள் அச்சு) - ${name || memberAClass || 'உறுப்பினர்'}</span>
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

  <div class="a4-page-sheet text-black">
    <!-- Centered Document Title -->
    <div style="text-align: center; margin-top: 3mm; margin-bottom: 7mm;">
      <h1 style="font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; margin: 0; display: inline-block;">
        சுய உறுதிமொழி
      </h1>
    </div>

    <!-- Sender (அனுப்புநர்) Section with Boxed Member Number -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 5.5mm; font-size: 14.5px; line-height: 1.5;">
      <div style="width: 100px; font-weight: bold; flex-shrink: 0;">அனுப்புநர்</div>
      <div style="flex-grow: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span>உறுப்பினர் எண் :</span>
          <span style="border: 1.5px solid #000; padding: 1px 12px; font-weight: bold; font-family: monospace; font-size: 15px; background: #fff; min-width: 80px; display: inline-block; text-align: center;">
            ${memberAClass || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}
          </span>
        </div>
        ${name ? `
        <div style="font-weight: bold; font-size: 15.5px; margin-top: 2px;">
          ${name}
        </div>
        <div>${careOf || ''}</div>
        ${door ? `<div>${door}</div>` : ''}
        ${street ? `<div>${street}</div>` : ''}
        ${village ? `<div>${village}</div>` : ''}
        <div style="margin-top: 3px;">
          செல் : <span style="font-family: monospace; font-weight: bold;">${mobile || ''}</span>
        </div>
        ` : `
        <!-- When no borrower number entered, maintain appropriate generous handwriting spaces -->
        <div style="min-height: 22px; margin-top: 3px;">&nbsp;</div>
        <div style="min-height: 22px;">&nbsp;</div>
        <div style="min-height: 22px;">&nbsp;</div>
        <div style="min-height: 22px;">&nbsp;</div>
        <div style="min-height: 22px;">&nbsp;</div>
        <div style="margin-top: 3px; min-height: 22px;">
          செல் : <span style="display: inline-block; min-width: 160px;">&nbsp;</span>
        </div>
        `}
      </div>
    </div>

    <!-- Recipient (பெறுநர்) Section -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 5.5mm; font-size: 14.5px; line-height: 1.5;">
      <div style="width: 100px; font-weight: bold; flex-shrink: 0;">பெறுநர்</div>
      <div style="flex-grow: 1;">
        <div>செயலாட்சியர் / செயலாளர் அவர்கள்</div>
        <div>TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்</div>
        <div>தேவாரம்</div>
      </div>
    </div>

    <!-- Subject (பொருள்) Section -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 6mm; font-size: 14.5px; line-height: 1.5;">
      <div style="width: 100px; font-weight: bold; flex-shrink: 0;">பொருள்</div>
      <div style="flex-grow: 1;">
        <div>KCC பயிர்க்கடன் - கால்நடை பராமரிப்பு வளர்ப்பு மூலதனக்கடன்</div>
        <div>வட்டி தொகையை செலுத்த ஒப்புக்கொள்ளுதல் - தொடர்பாக.</div>
      </div>
    </div>

    <!-- Salutation & Full Declaration Body Text -->
    <div style="margin-bottom: 8mm; font-size: 14.5px;">
      <div style="font-weight: bold; margin-bottom: 5px;">ஐயா,</div>
      <p style="text-indent: 40px; margin: 0; text-align: justify; line-height: 1.85;">
        நான் நமது சங்கத்தில் KCC கடன் திட்டத்தின்கீழ் பயிர்க்கடன் / கால்நடை வளர்ப்பு மூலதனக்கடன் ரூ. &nbsp;<span style="display: inline-block; min-width: 170px; border-bottom: 1.5px dotted #000; text-align: center; vertical-align: bottom; font-weight: bold; font-family: monospace;">&nbsp;</span>&nbsp; /- கோரி விண்ணப்பித்துள்ளேன். KCC திட்டத்தின்கீழ் இச்சங்கத்தில் ஒப்படைக்கப்பட்ட நில ஆவணங்கள் / கால்நடைகள் மூலம் பிற கூட்டுறவு சங்கத்திலோ, பிற வணிக வங்கிகளிலோ கடன் பெறவில்லை. மேற்படி எனக்கு வழங்கும் கடனை சங்கம் நிர்ணயிக்கும் தவணை தேதிக்கு முன்பு செலுத்தி விடுவேன். எனக்கு வழங்கும் கடன் தொகைக்கு அரசிடமிருந்து வட்டி மானியம் வராதபட்சத்தில் கடன் தொகையுடன் வட்டியும் சேர்த்து சங்கத்திற்கு செலுத்தி விடுகிறேன் என உறுதியளிக்கிறேன்.
      </p>
    </div>

    <!-- Sign-off (இப்படிக்கு) Section at Right -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 14mm; font-size: 14.5px;">
      <div style="text-align: center; width: 150px;">
        <div style="font-weight: bold; margin-bottom: 45px;">இப்படிக்கு</div>
        <div style="color: #666; font-size: 11.5px; font-weight: normal;">(கையொப்பம்)</div>
      </div>
    </div>

    <!-- Date & Place (நாள் & இடம்) at Bottom Left -->
    <div style="line-height: 1.7; font-size: 14.5px;">
      <div>நாள் &nbsp;&nbsp;&nbsp;:</div>
      <div>இடம் : தேவாரம்</div>
    </div>
  </div>

</body>
</html>`;
  };

  // Open Self-Declaration in a new tab with auto-print
  const handleOpenDeclarationNewTab = (
    curAClass?: string,
    curName?: string,
    curCareOf?: string,
    curDoor?: string,
    curStreet?: string,
    curVillage?: string,
    curMobile?: string
  ) => {
    const aClass = curAClass ?? borrowerAClass;
    const name = curName ?? borrowerName;
    const careOf = curCareOf ?? borrowerCareOf;
    const door = curDoor ?? borrowerDoor;
    const street = curStreet ?? borrowerStreet;
    const village = curVillage ?? borrowerVillage;
    const mobile = curMobile ?? borrowerMobile;

    const html = generateDeclarationHtml(aClass, name, careOf, door, street, village, mobile);
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
      try {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          link.remove();
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      } catch {
        window.print();
      }
    }
  };

  const handleOpenDeclaration = () => {
    let targetAClass = borrowerAClass;
    let targetName = borrowerName;
    let targetCareOf = borrowerCareOf;
    let targetDoor = borrowerDoor;
    let targetStreet = borrowerStreet;
    let targetVillage = borrowerVillage;
    let targetMobile = borrowerMobile;

    // If borrower is entered in the input box but not searched yet, auto-search
    if (borrowerAClassInput && !borrowerName) {
      const cleanQuery = borrowerAClassInput.trim().replace(/^A-?/i, '');
      const found = members.find(m => {
        const a = String(m.aClass || '').trim().replace(/^A-?/i, '');
        const no = String(m.memberNo || '').trim().replace(/^A-?/i, '');
        return a === cleanQuery || no === cleanQuery;
      });
      if (found) {
        targetAClass = found.aClass || found.memberNo || borrowerAClassInput.trim();
        targetName = formatNameWithInitial(found.name, found.ins);
        targetCareOf = found.fatherOrHusbandName || found.careOf || '';
        targetDoor = found.door || '';
        targetStreet = found.street || '';
        targetVillage = found.village || '';
        targetMobile = found.mobile || '';
        
        setBorrowerAClass(targetAClass);
        setBorrowerName(targetName);
        setBorrowerCareOf(targetCareOf);
        setBorrowerDoor(targetDoor);
        setBorrowerStreet(targetStreet);
        setBorrowerVillage(targetVillage);
        setBorrowerMobile(targetMobile);
        if (found.aadharNo || found.adhar) setBorrowerAadhar(found.aadharNo || found.adhar || '');
        if (found.mdcc || found.kccAccountNo) setBorrowerMdccKcc(found.mdcc || found.kccAccountNo || '');
        if (found.erpNo || found.erp) setBorrowerErp(found.erpNo || found.erp || '');
        if (found.sbAccountNo || found.sbNo) setBorrowerSb(found.sbAccountNo || found.sbNo || '');
        if (found.panNo || found.pan) setBorrowerPan(found.panNo || found.pan || '');
        if (found.smartCardNo || found.rationCardNo) setBorrowerRationCard(found.smartCardNo || found.rationCardNo || '');
      }
    }

    // Directly open in new tab for A4 review and printing
    handleOpenDeclarationNewTab(targetAClass, targetName, targetCareOf, targetDoor, targetStreet, targetVillage, targetMobile);
    setNewTabStatus('சுய உறுதிமொழி புதிய டேப்பில் திறக்கப்பட்டது!');
    setTimeout(() => setNewTabStatus(''), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Component Print Styles */}
      <style>{`
        @media print {
          @page {
            size: legal portrait !important;
            margin: 8mm 10mm 8mm 10mm !important;
          }
          header, aside, nav, .no-print, button {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          div.h-screen, div.overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          main {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .preview-wrapper {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #kcc-application-exact-doc {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .legal-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
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
            width: 100% !important;
            box-sizing: border-box !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            border: 1.5px solid #000000 !important;
          }
          th, td {
            border: 1px solid #000000 !important;
          }
        }
      `}</style>

      {/* ============================================================== */}
      {/* COMPACT TOP SEARCH & APPLICATION CONTROLS                      */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Compact Inputs for Borrower and Guarantor */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Borrower A-Class Input - COMPACT (Empty on start) */}
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
                  if (e.key === 'Enter') handleSearchBorrower();
                }}
                placeholder="எ.கா: 5562"
                className="w-20 sm:w-24 px-2 py-1.5 bg-transparent font-bold text-stone-900 text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchBorrower}
                title="கடன்தாரர் விபரங்களை தேடு"
                className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>தேடு</span>
              </button>
            </div>

            {/* Guarantor A-Class Input - COMPACT (Empty on start) */}
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600">
              <span className="px-2.5 py-1.5 bg-stone-100 text-stone-700 font-bold text-xs border-r border-stone-300 whitespace-nowrap flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-800" />
                <span>ஜாமீன்தாரர் எண்</span>
              </span>
              <input
                type="text"
                value={guarantorAClassInput}
                onChange={(e) => handleGuarantorInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchGuarantor();
                }}
                placeholder="எ.கா: 1002"
                className="w-20 sm:w-24 px-2 py-1.5 bg-transparent font-bold text-stone-900 text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchGuarantor}
                title="ஜாமீன்தாரர் விபரங்களை தேடு"
                className="px-2.5 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>தேடு</span>
              </button>
            </div>
          </div>

          {/* Right: Primary Create & Print Button */}
          <div className="flex items-center gap-2">
            {newTabStatus && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded border border-emerald-300 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{newTabStatus}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleCreateAndPrintApplication}
              className="flex items-center gap-2 px-4 py-2 bg-[#007A4D] hover:bg-[#00603c] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="புதிய டேப்பில் விண்ணப்ப அச்சு படிவத்தை உருவாக்கவும்"
            >
              <ExternalLink className="w-4 h-4" />
              <span>விண்ணப்பத்தை உருவாக்கு</span>
            </button>

            {/* New Button: சுய உறுதிமொழி (A4 Declaration) */}
            <button
              type="button"
              onClick={handleOpenDeclaration}
              className="flex items-center gap-2 px-4 py-2 bg-[#b45309] hover:bg-[#92400e] text-white rounded-lg font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shrink-0"
              title="சுய உறுதிமொழி ஏ4 அச்சுப் படிவத்தை உருவாக்கவும்"
            >
              <FileText className="w-4 h-4" />
              <span>சுய உறுதிமொழி</span>
            </button>
          </div>
        </div>

        {/* Compact Summary Strip - Only shown when borrower or guarantor entered */}
        {(borrowerName || guarantorName || borrowerSearchStatus || guarantorSearchStatus) && (
          <div className="mt-2 pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {borrowerName ? (
                <div className="flex items-center gap-1 text-stone-900">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                    கடன்தாரர் A-{borrowerAClass}
                  </span>
                  <strong className="text-stone-950 font-black">{borrowerName}</strong>
                  {borrowerCareOf && <span className="text-stone-600 text-[11px]">(த/பெ: {borrowerCareOf})</span>}
                  {borrowerMobile && <span className="text-stone-700 font-mono font-bold text-[11px]">📞 {borrowerMobile}</span>}
                </div>
              ) : (
                borrowerSearchStatus && <span className="text-stone-500 text-[11px]">{borrowerSearchStatus}</span>
              )}

              {guarantorName ? (
                <div className="flex items-center gap-1 text-stone-900 border-l border-stone-300 pl-3">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[11px]">
                    ஜாமீன்தாரர் A-{guarantorAClass}
                  </span>
                  <strong className="text-stone-950 font-black">{guarantorName}</strong>
                  {guarantorCareOf && <span className="text-stone-600 text-[11px]">(த/பெ: {guarantorCareOf})</span>}
                  {guarantorMobile && <span className="text-stone-700 font-mono font-bold text-[11px]">📞 {guarantorMobile}</span>}
                </div>
              ) : (
                guarantorSearchStatus && <span className="text-stone-500 text-[11px] border-l border-stone-300 pl-3">{guarantorSearchStatus}</span>
              )}
            </div>

            {/* Optional manual edit button */}
            <button
              type="button"
              onClick={() => setIsManualEditOpen(!isManualEditOpen)}
              className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>விபரங்களை திருத்து</span>
              {isManualEditOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Collapsible Manual Edit Panel */}
        {isManualEditOpen && (
          <div className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-stone-500 block">கடன்தாரர் பெயர்</label>
              <input
                type="text"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">த/பெ</label>
              <input
                type="text"
                value={borrowerCareOf}
                onChange={(e) => setBorrowerCareOf(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">கிராமம்</label>
              <input
                type="text"
                value={borrowerVillage}
                onChange={(e) => setBorrowerVillage(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">கைபேசி</label>
              <input
                type="text"
                value={borrowerMobile}
                onChange={(e) => setBorrowerMobile(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">ஆதார் எண்</label>
              <input
                type="text"
                value={borrowerAadhar}
                onChange={(e) => setBorrowerAadhar(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">மத்திய வங்கி எண்</label>
              <input
                type="text"
                value={borrowerMdccKcc}
                onChange={(e) => setBorrowerMdccKcc(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">சங்க ERP எண்</label>
              <input
                type="text"
                value={borrowerErp}
                onChange={(e) => setBorrowerErp(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">சங்க சேமிப்பு எண் (SB)</label>
              <input
                type="text"
                value={borrowerSb}
                onChange={(e) => setBorrowerSb(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">குடும்ப அட்டை எண்</label>
              <input
                type="text"
                value={borrowerRationCard}
                onChange={(e) => setBorrowerRationCard(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">ஜாமீன்தாரர் பெயர்</label>
              <input
                type="text"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">ஜாமீன் முகவரி</label>
              <input
                type="text"
                value={guarantorAddress}
                onChange={(e) => setGuarantorAddress(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block">ஜாமீன் ஆதார்</label>
              <input
                type="text"
                value={guarantorAadhar}
                onChange={(e) => setGuarantorAadhar(e.target.value)}
                className="w-full p-1 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3-PAGE LEGAL DOCUMENT CONTAINER - STRICT 3 PAGES               */}
      {/* ============================================================== */}
      <div className="preview-wrapper flex justify-center bg-stone-200/50 p-2 md:p-6 overflow-x-auto">
        <div 
          id="kcc-application-exact-doc"
          className="bg-white text-black p-4 md:p-7 shadow-2xl rounded-sm w-full max-w-[860px] font-sans text-[11.5px] leading-tight border border-black"
        >
          {/* ============================================================== */}
          {/* ======================= PAGE 1 =============================== */}
          {/* ============================================================== */}
          <div className="legal-page mb-6 pb-2 border-b-2 border-dashed border-stone-400">
            {/* Cooperative Handshake Emblem Icon */}
            <div className="flex justify-center mb-1">
              <CooperativeLogo className="w-20 h-13 mx-auto" />
            </div>

            {/* Header Title - Pure Tamil without any Devanagari */}
            <div className="text-center">
              <div className="text-[18px] font-black text-black leading-snug tracking-wide">
                {societyName}
              </div>
              <div className="text-[17px] font-black text-black leading-snug mt-0.5">
                {societySubName}
              </div>
              <div className="text-[13.5px] font-bold text-black mt-1">
                {loanSchemeTitle}
              </div>
            </div>

            {/* Meta Row (Bordered Bar) - நாள் is empty for handwriting */}
            <table className="w-full mt-2.5 border-collapse border border-black">
              <tbody>
                <tr className="text-[12.5px] font-bold text-center">
                  <td className="border border-black py-1.5 px-2">{loanCategoryText}</td>
                  <td className="border border-black py-1.5 px-2">{farmerType}</td>
                  <td className="border border-black py-1.5 px-3 w-1/3 text-left font-mono">நாள்:- &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                </tr>
              </tbody>
            </table>

            {/* Top 2 Columns: அனுப்புநர் (Left) & பெறுநர் (Right Flush) */}
            <div className="flex justify-between items-start gap-4 mt-3">
              {/* Left Column: அனுப்புநர் with Passport Photo box */}
              <div className="w-[60%]">
                <table className="w-full border-collapse border border-black text-[12px]">
                  <tbody>
                    <tr>
                      <th colSpan={3} className="border border-black py-1.5 px-2.5 text-left font-black bg-stone-100 text-[13px]">
                        அனுப்புநர்
                      </th>
                    </tr>
                    <tr>
                      <td className="border border-black py-1.5 px-2 font-bold w-16 text-stone-800 text-[12.5px]">உ எண்</td>
                      {/* Borrower A-Class: Displayed only when entered */}
                      <td className="border border-black py-1.5 px-2 font-black font-mono text-[15px] text-black">
                        {borrowerAClass}
                      </td>
                      {/* Photo Box: Generous Passport size (3.5cm x 4.5cm fits in 125x160) */}
                      <td rowSpan={5} className="border border-black p-1 text-center align-middle w-[130px]">
                        <div className="w-[125px] h-[160px] border border-black flex flex-col items-center justify-center text-center p-1.5 mx-auto bg-stone-50/50">
                          <span className="text-[12px] font-bold text-black leading-tight">
                            கடன்தாரர்<br/>புகைப்படம்
                          </span>
                          <span className="text-[10px] text-stone-600 mt-1 font-normal">
                            (பாஸ்போர்ட் சைஸ்)
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12.5px]">பெயர்</td>
                      {/* Borrower Name */}
                      <td className="border border-black py-1.5 px-2 font-black text-[15px] text-black tracking-wide">
                        {borrowerName}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12.5px]">த/பெ</td>
                      {/* Borrower Care of */}
                      <td className="border border-black py-1.5 px-2 font-bold text-[13.5px] text-black">
                        {borrowerCareOf}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12.5px] align-top">முகவரி</td>
                      {/* Borrower Address */}
                      <td className="border border-black py-1.5 px-2 font-bold text-[12.5px] text-black leading-snug">
                        {borrowerDoor && <div>{borrowerDoor}</div>}
                        {borrowerStreet && <div>{borrowerStreet}</div>}
                        {borrowerVillage && <div>{borrowerVillage}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12.5px]">செல்</td>
                      {/* Borrower Mobile */}
                      <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                        {borrowerMobile}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column: பெறுநர் (Right Flush) */}
              <div className="w-[40%] flex justify-end">
                <table className="w-full border-collapse border border-black text-[12px]">
                  <tbody>
                    <tr>
                      <th className="border border-black py-1.5 px-2.5 text-left font-black bg-stone-100 text-[13px]">
                        பெறுநர்
                      </th>
                    </tr>
                    <tr>
                      <td className="border border-black p-3 font-bold leading-relaxed align-top h-[160px] text-[12px]">
                        <div className="text-[12.5px] font-black">{recipientDesignation}</div>
                        <div className="mt-1">{recipientSociety}</div>
                        <div>{recipientTaluk}</div>
                        <div>{recipientDistrict}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Letter Body Opening */}
            <div className="mt-2.5 text-[12px] leading-relaxed">
              <div className="font-black text-[12.5px]">ஐயா,</div>
              <div className="indent-6 text-justify mt-0.5">
                கீழ்கண்ட விபரப்படி சொந்தமாக நிலம் உள்ளது. எனவே எனக்கு பயிர்சாகுபடி செய்வதற்காக உழவர் கடன் அட்டை திட்டத்தின் கீழ் நபர் ஜாமீன் பேரில் கடன் அனுமதிக்குமாறு கேட்டுக்கொள்கிறேன்.
              </div>
            </div>

            {/* Table: சொந்த நிலம் & குத்தகை நிலம் - BLANK CELLS for manual entry */}
            <table className="w-full border-collapse border border-black mt-2.5 text-[11.5px]">
              <thead>
                <tr className="text-center font-bold">
                  <th colSpan={3} className="border border-black py-1 px-1 bg-stone-100 text-[12px] font-black">சொந்த நிலம்</th>
                  <th colSpan={3} className="border border-black py-1 px-1 bg-stone-100 text-[12px] font-black">குத்தகை நிலம்</th>
                  <th rowSpan={2} className="border border-black py-1 px-1 bg-stone-100 w-16 text-[12px] font-black">மொத்தம்</th>
                  <th rowSpan={2} className="border border-black py-1 px-1 bg-stone-100 w-16 text-[12px] font-black">குறிப்பு</th>
                </tr>
                <tr className="text-center font-bold">
                  <th className="border border-black py-1 px-1 bg-stone-50">சர்வே எண்</th>
                  <th className="border border-black py-1 px-1 bg-stone-50">பாசன விபரம்</th>
                  <th className="border border-black py-1 px-1 bg-stone-50">பரப்பு ஏ செ</th>
                  <th className="border border-black py-1 px-1 bg-stone-50">சர்வே எண்</th>
                  <th className="border border-black py-1 px-1 bg-stone-50">பாசன விபரம்</th>
                  <th className="border border-black py-1 px-1 bg-stone-50">பரப்பு ஏ செ</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="text-center h-7">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
                <tr className="text-center font-bold h-7 bg-stone-50">
                  <td className="border border-black p-1 font-black">மொத்தம்</td>
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
            <div className="text-[10px] italic mt-1 text-stone-700">
              *பாசன விபரம் என்பதற்கு நஞ்சை மானாவாரி கிணறு ஆறு பாசன விபரத்தை குறிப்பிட வேண்டும்
            </div>

            {/* Section: நபர் பிணையம் அடிப்படையாக இருந்தால் பிணையாதாரர் விபரம் */}
            <div className="mt-3">
              <div className="border border-black py-1.5 px-2 font-black text-center text-[12.5px] bg-stone-100">
                நபர் பிணையம் அடிப்படையாக இருந்தால் பிணையாதாரர் விபரம்
              </div>

              <table className="w-full border-collapse border border-black text-[11.5px]">
                <tbody>
                  {/* Row 1: உ.எண் on Left, Photo in Center-Left, and Survey columns at the Far Right */}
                  <tr>
                    <td className="border border-black py-1.5 px-2 font-bold w-16 text-stone-800 text-[12px]">உ.எண்</td>
                    {/* Guarantor A-Class */}
                    <td className="border border-black py-1.5 px-2 font-black font-mono text-[14.5px] text-black w-44">
                      {guarantorAClass}
                    </td>
                    {/* Passport Photo Box */}
                    <td rowSpan={6} className="border border-black p-1 text-center align-middle w-[125px]">
                      <div className="w-[120px] h-[155px] border border-black flex flex-col items-center justify-center text-center p-1.5 mx-auto bg-stone-50/50">
                        <span className="text-[12px] font-bold text-black leading-tight">
                          ஜாமீன்தாரர்<br/>புகைப்படம்
                        </span>
                        <span className="text-[10px] text-stone-600 mt-1 font-normal">
                          (பாஸ்போர்ட் சைஸ்)
                        </span>
                      </div>
                    </td>
                    {/* Land Details placed firmly at the Far Right Edge */}
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">சர்வே எண்</th>
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">பாசன விபரம்</th>
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">பரப்பு ஏ செ</th>
                  </tr>

                  {/* Row 2: பெயர் */}
                  <tr className="h-7">
                    <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12px]">பெயர்</td>
                    <td className="border border-black py-1.5 px-2 font-black text-[14.5px] text-black tracking-wide">
                      {guarantorName}
                    </td>
                    <td className="border border-black p-1 text-center font-mono"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center font-mono"></td>
                  </tr>

                  {/* Row 3: த/பெ */}
                  <tr className="h-7">
                    <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12px]">த/பெ</td>
                    <td className="border border-black py-1.5 px-2 font-bold text-[13.5px] text-black">
                      {guarantorCareOf}
                    </td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>

                  {/* Row 4: முகவரி */}
                  <tr>
                    <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12px] align-top">முகவரி</td>
                    <td className="border border-black py-1.5 px-2 font-bold text-[12.5px] text-black align-top leading-snug">
                      <div className="min-h-[40px]">
                        {guarantorAddress}
                      </div>
                    </td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>

                  {/* Row 5: மொத்தம் */}
                  <tr className="h-7">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-center font-bold">மொத்தம்</td>
                    <td className="border border-black p-1 text-center font-mono font-bold"></td>
                  </tr>

                  {/* Row 6: செல் */}
                  <tr className="h-7">
                    <td className="border border-black py-1.5 px-2 font-bold text-stone-800 text-[12px]">செல்</td>
                    <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                      {guarantorMobile}
                    </td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: நில அடமானமாக இருந்தால் விபரம் - BLANK CELLS (End of Page 1) */}
            <div className="mt-3">
              <div className="border border-black py-1.5 px-2 font-black text-center text-[12.5px] bg-stone-100">
                நில அடமானமாக இருந்தால் விபரம்
              </div>

              <table className="w-full border-collapse border border-black text-[11.5px]">
                <tbody>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/3 text-[12px]">நிலம் இருக்கும் கிராமத்தின் பெயர்</td>
                    <td className="border border-black py-1.5 px-2"></td>
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">சர்வே எண்</th>
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">பாசன விபரம்</th>
                    <th className="border border-black py-1 text-center font-bold bg-stone-50 w-24">பரப்பு ஏசெ</th>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold text-[12px]">பதிவு அலுவலகம்</td>
                    <td className="border border-black py-1.5 px-2"></td>
                    <td className="border border-black p-1 text-center font-mono"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center font-mono"></td>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold text-[12px]">அடமான பதிவு எண்/தேதி</td>
                    <td className="border border-black py-1.5 px-2 font-mono"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold text-[12px]">வழிகாட்டி மதிப்பு</td>
                    <td className="border border-black py-1.5 px-2 font-mono"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold text-[12px]">அடவு தொகை</td>
                    <td className="border border-black py-1.5 px-2 font-mono"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* ============================================================== */}
          {/* Visual Page Break 1 for Screen Preview */}
            <div className="no-print my-6 py-2 bg-stone-100 border-y border-dashed border-stone-400 text-center font-bold text-xs text-stone-600 flex items-center justify-center gap-2">
              <span>📄 தாள் 1 / 3 முடிவு (End of Page 1 - Legal Sheet)</span>
            </div>

          {/* ======================= PAGE 2 =============================== */}
          {/* ============================================================== */}
          <div className="legal-page mb-6 pb-2 border-b-2 border-dashed border-stone-400">
            {/* Section: ஒப்பந்த சாகுபடி (Tieup) அடிப்படையாக இருந்தால் விபரம் */}
            <div>
              <div className="border border-black py-1.5 px-2 font-black text-center text-[12.5px] bg-stone-100">
                ஒப்பந்த சாகுபடி (Tieup) அடிப்படையாக இருந்தால் விபரம்
              </div>
              <table className="w-full border-collapse border border-black text-[12px]">
                <tbody>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/4">ஒப்பந்த நிறுவனத்தின் பெயர்</td>
                    <td className="border border-black py-1.5 px-2 w-1/4"></td>
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/4">பதிவு தேதி:- </td>
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/4">உறுப்பினர் பதிவு எண்: </td>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold">சாகுபடி செய்ய உத்தேசித்துள்ள கரும்பு/பயிரின் பரப்பு</td>
                    <td className="border border-black py-1.5 px-2"></td>
                    <td className="border border-black py-1.5 px-2.5 font-bold">மொத்தம்: </td>
                    <td className="border border-black py-1.5 px-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: நகை அடமானமாக இருந்தால் விபரம் */}
            <div className="mt-3">
              <div className="border border-black py-1.5 px-2 font-black text-center text-[12.5px] bg-stone-100">
                நகை அடமானமாக இருந்தால் விபரம்
              </div>
              <table className="w-full border-collapse border border-black text-[12px]">
                <tbody>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/3">கடன் தேதியில் ஒரு கிராமிற்கு மார்க்கெட் மதிப்பு</td>
                    <td className="border border-black py-1.5 px-2 font-mono font-bold"></td>
                    <td className="border border-black py-1.5 px-2.5 font-bold w-1/3">கடன் தேதியில் ஒரு கடன் வழங்கும் மதிப்பு</td>
                    <td className="border border-black py-1.5 px-2 font-mono font-bold"></td>
                  </tr>
                  <tr className="h-7.5">
                    <td className="border border-black py-1.5 px-2.5 font-bold">நகை மதிப்பீட்டாளர் குறிப்பு</td>
                    <td colSpan={3} className="border border-black py-1.5 px-2"></td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black mt-1 text-[11.5px] text-center">
                <thead>
                  <tr className="font-bold bg-stone-100">
                    <th className="border border-black py-1.5 px-1 font-black">நகை விபரம்</th>
                    <th className="border border-black py-1.5 px-1 font-black">எண்ணிக்கை</th>
                    <th className="border border-black py-1.5 px-1 font-black">மொத்த எடை</th>
                    <th className="border border-black py-1.5 px-1 font-black">நிகர எடை</th>
                    <th className="border border-black py-1.5 px-1 font-black">மார்க்கெட் மதிப்பு</th>
                    <th className="border border-black py-1.5 px-1 font-black">கடன் வழங்கும் மதிப்பு</th>
                    <th className="border border-black py-1.5 px-1 font-black">நகை மதிப்பீட்டாளர் சுருக்கொப்பம்</th>
                    <th className="border border-black py-1.5 px-1 font-black">சாகுபடி பயிர் கடன் அளவுப்படி தொகை</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-7">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="h-7">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="text-center font-bold h-7 bg-stone-50">
                    <td className="border border-black p-1 font-black">மொத்தம்</td>
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
              <div className="text-[10px] italic mt-0.5 text-stone-700">
                * சாகுபடி செய்யும் கடன் அளவுப்படி வழங்கும் தொகைக்கு ஈடாக நகை மதிப்பு இருக்க வேண்டும்
              </div>
            </div>

            {/* Declarations (4 Paragraphs) - Compact & readable Tamil typography */}
            <div className="space-y-1 mt-2 text-[9.5px] leading-tight text-justify">
              <p className="border border-black py-1 px-1.5">
                இத்துடன் நான் ஈடாக கொடுத்திருக்கும் நிலம்/நகைகள் எனக்குத் தனிமையில் பாத்தியப்பட்டது. மேற்படி சொத்துக்களை இக்கடனுக்கு ஈடாக கொடுக்க எனக்கு பாத்தியமுண்டு இந்த நகைகளை தாங்கள் மாவட்ட மத்திய கூட்டுறவு வங்கியில் மறு ஈடு வைக்க இதன் மூலம் ஒப்புதல் அளிக்கின்றேன்
              </p>
              <p className="border border-black py-1 px-1.5">
                நான் வாங்கும் இக்கடனை உரிய கெடு தேதிக்குள் திருப்பி செலுத்தாதபட்சத்தில் சங்கத்தின் உபவிதிகளின்படி இக்கடனுக்கு ஈடு வழங்கியுள்ள நிலம்/நகையை ஏலம் போட்டு ஏலத்தில் கிடைத்த தொகையை கடனுக்கு வரவு வைத்துக் கொள்ளவும் அத்தொகை கடனுக்கு போதவில்லை என்றால் மீதமுள்ள தொகையை நான் செலுத்தவும் அவ்வாறு செலுத்தவில்லை எனில் என் மீது உரிய சட்டபூர்வ நடவடிக்கை எடுக்க இதன் மூலம் ஒப்புதல் அளிக்கின்றேன்
              </p>
              <p className="border border-black py-1 px-1.5">
                இக்கடனுக்கு ஈடு வழங்கியுள்ள கீழ்கண்ட சொத்துக்கள் மூலமும் சங்கத்தாருக்கு யாதொரு நஷ்டமும் குறைவும் கெடுதலும் ஏற்படாமல் பாதுகாத்துக் கொடுக்கவும் இதன் மூலம் ஒப்புக்கொள்கிறேன் மேலும் கடன் பெறும்போது ஈடுகாட்டும் நிலம்/நகை மதிப்பு குறைந்தால் அக்குறைவு மதிப்புக்கான கடன் தொகையை திருப்பிச் செலுத்தவும் அல்லது கூடுதல் நிலம்/நகையை ஈடு கொடுக்கவும் இதன் மூலம் ஒப்புதல் அளிக்கிறேன்
              </p>
              <p className="border border-black py-1 px-1.5">
                நான் வாங்கும் கடனை மேற்படி பத்திரத்தில் காணப்படும் நிபந்தனைகளுக்கும் அதில் காணப்படாததும் இப்போதுள்ள சங்க விதிகளிலும் உபவிதிகளிலும் இனி ஏற்படும் விதிகளிலும் உபவிதிகளிலும் உள்ள நிபந்தனைகளுக்கும் இந்த விண்ணப்பத்தில் உள்ள ஷரத்துகளுக்கும் நானும் என் வாரிசுகளும் என் பிரதிநிதிகளும் கட்டுப்பட்டவர்கள் என உறுதி கூறுகின்றேன்
              </p>
            </div>

            {/* Section: கடன் கோரும் விபரம் - 5 ROWS as requested */}
            <div className="mt-3">
              <div className="border border-black py-1.5 px-2 font-black text-center text-[12.5px] bg-stone-100">
                கடன் கோரும் விபரம்
              </div>

              <table className="w-full border-collapse border border-black text-[11.5px]">
                <thead>
                  <tr className="text-center font-bold bg-stone-100">
                    <th rowSpan={2} className="border border-black py-1.5 px-1 font-black">சாகுபடி செய்யும் பயிரின் பெயர்</th>
                    <th colSpan={2} className="border border-black py-1.5 px-1 font-black">பயிரிட உள்ள</th>
                    <th colSpan={5} className="border border-black py-1.5 px-1 font-black">கடன் தேவை விபரம்</th>
                  </tr>
                  <tr className="text-center font-bold bg-stone-50">
                    <th className="border border-black py-1 px-1">சர்வே எண்</th>
                    <th className="border border-black py-1 px-1">பரப்பு ஏ.செ.</th>
                    <th className="border border-black py-1 px-1">விதை</th>
                    <th className="border border-black py-1 px-1">உரம்</th>
                    <th className="border border-black py-1 px-1">பூச்சி மருந்து</th>
                    <th className="border border-black py-1 px-1">ரொக்கம்</th>
                    <th className="border border-black py-1 px-1">மொத்தம்</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="text-center h-7.5">
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  ))}
                  <tr className="text-center font-bold bg-stone-50 h-7.5">
                    <td className="border border-black p-1 font-black">மொத்தம்</td>
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

            {/* Declarations (Points 1 to 5) */}
            <div className="border border-black p-2.5 mt-3 text-[10.5px] space-y-1 leading-normal">
              <div>1. நான் எனக்கு தேவையான விதைப்பகுதியை வெளிமார்க்கெட்டில் வாங்க உள்ளதால் விதைப்பகுதியை ரொக்கமாக வழங்க கோருகிறேன்</div>
              <div>2. நான் பயிரிடும் பயிருக்கு தொழு உரம் தேவையாக இருப்பதால் வெளிமார்க்கெட்டில் வாங்க உரப் பகுதியில் 50% ரொக்கமாக வழங்க கோருகிறேன்</div>
              <div>3. பூச்சி மருந்து வெளிமார்க்கெட்டில் வாங்க 100% ரொக்கமாக வழங்க கோருகிறேன்</div>
              <div>4. அடமான கடனாக இருந்தால் தமிழ்நாடு கூட்டுறவுச் சட்டம் பிரிவு 41மற்றும் அதன் கீழ் ஏற்படுத்தப்பட்ட விதி எண் - 68ல் தெரிவித்துள்ளபடி படிவம் 26ஐ இத்துடன் இணைத்துள்ளேன்.</div>
              <div>5. கடனுக்கு தேவைப்படும் உறுப்பினர் பங்குத் தொகையையும் பயிர் காப்பீடு இருந்தால் அதற்கான பிரிமியத்தையும் செலுத்த சம்மதிக்கின்றேன்</div>
            </div>

            {/* Signatures: பிணையாதாரர் & கடன்தாரர் - Perfectly positioned toward the bottom */}
            <div className="flex justify-between items-end mt-10 mb-4 px-12 font-black text-[13px]">
              <div className="text-center">
                <div className="mb-8 font-normal text-stone-500 text-[11px]">(கையொப்பம் / கைரேகை)</div>
                <div className="border-t-2 border-black pt-1.5 px-8 inline-block">பிணையாதாரர் கையொப்பம்</div>
              </div>
              <div className="text-center">
                <div className="mb-8 font-normal text-stone-500 text-[11px]">(கையொப்பம் / கைரேகை)</div>
                <div className="border-t-2 border-black pt-1.5 px-8 inline-block">கடன்தாரர் கையொப்பம்</div>
              </div>
            </div>
          </div>
          {/* ============================================================== */}
          {/* Visual Page Break 2 for Screen Preview */}
            <div className="no-print my-6 py-2 bg-stone-100 border-y border-dashed border-stone-400 text-center font-bold text-xs text-stone-600 flex items-center justify-center gap-2">
              <span>📄 தாள் 2 / 3 முடிவு (End of Page 2 - Legal Sheet)</span>
            </div>

          {/* ======================= PAGE 3 =============================== */}
          {/* ============================================================== */}
          <div className="legal-page-last">
            {/* Member Details Table with PROMINENT LARGER INPUT DETAILS */}
            <table className="w-full border-collapse border border-black text-[12px]">
              <tbody>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold w-1/4 text-stone-800">கடன்தாரர் ஆதார் எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black w-1/4 text-[14.5px] text-black tracking-wider">
                    {borrowerAadhar}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 font-bold w-1/4 text-stone-800">பிணையாதாரர் ஆதார் எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black w-1/4 text-[14.5px] text-black tracking-wider">
                    {guarantorAadhar}
                  </td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் கைபேசி எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                    {borrowerMobile}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">பிணையாதாரர் கைபேசி எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                    {guarantorMobile}
                  </td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் மத்திய வங்கி KCC எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                    {borrowerMdccKcc}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">VAO சான்று காலாவதி தேதி</td>
                  <td className="border border-black py-1.5 px-2 font-mono text-[12px]"></td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் சங்க ERP எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                    {borrowerErp}
                  </td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் சங்க சேமிப்பு எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black">
                    {borrowerSb ? `SB  ${borrowerSb}` : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் பான் எண்</td>
                  <td className="border border-black py-1.5 px-2 font-mono font-black text-[13.5px] text-black">
                    {borrowerPan}
                  </td>
                  <td className="border border-black py-1.5 px-2"></td>
                  <td className="border border-black py-1.5 px-2"></td>
                </tr>
                <tr className="h-7.5">
                  <td className="border border-black py-1.5 px-2.5 font-bold text-stone-800">கடன்தாரர் குடும்ப அட்டை எண்</td>
                  <td colSpan={3} className="border border-black py-1.5 px-2 font-mono font-black text-[14px] text-black tracking-wider">
                    {borrowerRationCard}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Previous Loan Particulars & Share Capital - BLANK for manual entry */}
            <table className="w-full border-collapse border border-black mt-3 text-[11.5px] text-center">
              <thead>
                <tr className="font-bold bg-stone-100">
                  <th className="border border-black py-1.5 px-1 font-black">முன்கடன் எண்</th>
                  <th className="border border-black py-1.5 px-1 font-black">முன்கடன் தேதி</th>
                  <th className="border border-black py-1.5 px-1 font-black">முன்கடன் தொகை</th>
                  <th className="border border-black py-1.5 px-1 font-black">இதுவரை உள்ள பங்குதொகை</th>
                  <th className="border border-black py-1.5 px-1 font-black">தற்போது பிடிக்கும் பங்கு தொகை</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-7.5">
                  <td className="border border-black p-1 font-mono"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-mono"></td>
                  <td className="border border-black p-1 font-mono"></td>
                  <td className="border border-black p-1 font-mono"></td>
                </tr>
              </tbody>
            </table>

            <div className="border border-black py-1.5 px-2 mt-3 font-black text-[11.5px] bg-stone-100">
              பயிர் கடன்அளவு விகிதப்படி (Ratio) மேற்படி பயிருக்கு ஏக்கர் ஒன்றுக்கு அனுமதிக்கப்படும் தொகை:
            </div>

            {/* Table: கடன் கோரும் பரப்பு ஏ செ - BLANK for manual entry */}
            <table className="w-full border-collapse border border-black mt-1.5 text-[11px] text-center">
              <thead>
                <tr className="font-bold bg-stone-50">
                  <th className="border border-black py-1 px-1">கடன் கோரும் பரப்பு ஏ செ</th>
                  <th className="border border-black py-1 px-1">விதை</th>
                  <th className="border border-black py-1 px-1">இரசாயன உரம் 50%</th>
                  <th className="border border-black py-1 px-1">தொழு உரம் 50%</th>
                  <th className="border border-black py-1 px-1">பூச்சி மருந்து</th>
                  <th className="border border-black py-1 px-1">ரொக்கம்</th>
                  <th className="border border-black py-1 px-1">மொத்தம்</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(2)].map((_, i) => (
                  <tr key={i} className="h-7.5">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Below Table: கடன் அனுமதிக்கப்படும் - BLANK for manual entry */}
            <table className="w-full border-collapse border border-black mt-3 text-[11px] text-center">
              <thead>
                <tr className="font-bold bg-stone-100">
                  <th colSpan={2} className="border border-black py-1 px-1 font-black">கடன் அனுமதிக்கப்படும்</th>
                  <th colSpan={2} className="border border-black py-1 px-1 font-black">பொருள் பகுதி</th>
                  <th colSpan={2} className="border border-black py-1 px-1 font-black">ரொக்க பகுதி</th>
                  <th colSpan={2} className="border border-black py-1 px-1 font-black">மொத்த கடன் தொகை</th>
                </tr>
                <tr className="font-bold bg-stone-50">
                  <th className="border border-black py-1 px-1">சர்வே எண்</th>
                  <th className="border border-black py-1 px-1">பரப்பு ஏசெ</th>
                  <th className="border border-black py-1 px-1">விதை</th>
                  <th className="border border-black py-1 px-1">உரம் 50%</th>
                  <th className="border border-black py-1 px-1">தொழு</th>
                  <th className="border border-black py-1 px-1">பூச்சி</th>
                  <th className="border border-black py-1 px-1">ரொக்கம்</th>
                  <th className="border border-black py-1 px-1">மொத்தம்</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="h-7.5">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Section: சங்க அலுவலக பரிந்துரை */}
            <div className="border border-black mt-3.5">
              <div className="py-1 px-2 font-black text-center text-[12px] bg-stone-100 border-b border-black">
                சங்க அலுவலக பரிந்துரை
              </div>
              <div className="p-2.5 text-[11.5px] leading-relaxed text-justify">
                மேலே குறிப்பிட்டுள்ள விண்ணப்பத்துடன் இணைத்து பெறப்பட்ட ஆவணங்களை பரிசீலனை செய்ததில் அனைத்தும் மத்திய கூட்டுறவு வங்கி தெரிவிக்கும் கடன் நடைமுறைகளுக்குட்பட்டு உள்ளது. மேலும் பயிர் சாகுபடி செய்ய விண்ணப்பதாரர் நிலத்தை தயார் நிலையில் வைத்துள்ளதால் மேற்படி உறுப்பினருக்கு ரூ ___________________ /- கே.சி.சி பயிர்க்கடன் திட்டத்தின் கீழ் கடன் அனுமதிக்க தலைவர் அவர்களுக்கு பரிந்துரைக்கப்படுகிறது.
              </div>
              {/* 3 Signatures: எழுத்தர், உதவி செயலாளர், செயலாளர் */}
              <div className="flex justify-between items-end mt-7 pb-2 px-10 font-black text-[12px]">
                <div className="text-center">
                  <div className="border-t border-black pt-1 px-3">எழுத்தர்</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-black pt-1 px-3">உதவி செயலாளர்</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-black pt-1 px-3">செயலாளர்</div>
                </div>
              </div>
            </div>

            {/* Section: தலைவர் / செயலாட்சியர் அனுமதி உத்தரவு */}
            <div className="border border-black mt-3.5">
              <div className="py-1 px-2 font-black text-center text-[12px] bg-stone-100 border-b border-black">
                தலைவர் / செயலாட்சியர் அனுமதி உத்தரவு
              </div>
              <div className="p-2.5 text-[11.5px] leading-relaxed text-justify">
                சங்க செயலாளர் மற்றும் பணியாளர்களின் பரிந்துரையின் பெயரில் மேற்படி உறுப்பினருக்கு ரூ ___________________ /- கே.சி.சி பயிர்க்கடன் திட்டத்தின் கீழ் கடன் அனுமதிக்கப்படுகிறது.
              </div>
              <div className="flex justify-between items-end mt-5 pb-2 px-6 text-[11.5px] font-bold">
                <div className="space-y-1">
                  <div>கடன் அனுமதி நாள் : __________________</div>
                  <div>சங்க தீர்மான எண் மற்றும் நாள் : __________________</div>
                </div>
                <div className="text-center pr-4">
                  <div className="border-t border-black pt-1 px-4">தலைவர் / செயலாட்சியர்</div>
                </div>
              </div>
            </div>

            {/* Section: சரக மேற்பார்வையாளர் பரிந்துரை */}
            <div className="border border-black mt-3.5">
              <div className="py-1 px-2 font-black text-center text-[12px] bg-stone-100 border-b border-black">
                சரக மேற்பார்வையாளர் பரிந்துரை
              </div>
              <div className="p-2.5 text-[11.5px] leading-relaxed text-justify">
                மேற்கண்ட உறுப்பினருக்கு ”உழவர் கடன் அட்டை” திட்டத்தின்கீழ் .............................. பயிர் சாகுபடிக்கு ரூ. ......................................................./- கடன் அனுமதிக்க மத்திய கூட்டுறவு வங்கிக்கு பரிந்துரை செய்யப்படுகிறது.
              </div>
              <div className="flex justify-end items-end mt-7 pb-2 pr-10 font-black text-[12px]">
                <div className="border-t border-black pt-1 px-6 text-center">சரக மேற்பார்வையாளர்</div>
              </div>
            </div>
          </div>
          {/* ============================================================== */}
          {/* Visual Page Break 3 for Screen Preview */}
            <div className="no-print my-6 py-2 bg-emerald-50 border-y border-dashed border-emerald-400 text-center font-bold text-xs text-emerald-800 flex items-center justify-center gap-2">
              <span>✓ தாள் 3 / 3 முடிவு (End of Page 3 - விண்ணப்ப படிவம் நிறைவுற்றது)</span>
            </div>
        </div>
      </div>
    </div>
  );
};
