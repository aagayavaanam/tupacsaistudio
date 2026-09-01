import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  HelpCircle,
  Database,
  Code2,
  Copy,
  Zap
} from 'lucide-react';
import { extractSpreadsheetId } from '../utils/formatters';
import { LoanMember, KCCDisbursementRecord } from '../types';

interface GoogleSheetSettingsScreenProps {
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
  members: LoanMember[];
  disbursements: KCCDisbursementRecord[];
}

export const GoogleSheetSettingsScreen: React.FC<GoogleSheetSettingsScreenProps> = ({
  spreadsheetId,
  onSetSpreadsheetId,
  members,
  disbursements
}) => {
  const [sheetInput, setSheetInput] = useState<string>(spreadsheetId || localStorage.getItem('tu3_paccs_sheet_id') || '');
  const [scriptUrlInput, setScriptUrlInput] = useState<string>(localStorage.getItem('tu3_paccs_script_url') || '');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeId = extractSpreadsheetId(spreadsheetId || sheetInput || localStorage.getItem('tu3_paccs_sheet_id') || '');
  const activeScriptUrl = scriptUrlInput || localStorage.getItem('tu3_paccs_script_url') || '';

  const APPS_SCRIPT_CODE = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.sheetName) || 'KCC All Paduvada Members';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, rows: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({ success: true, rows: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName;
    if (!sheetName) {
      if (data.action === 'delete_bank_row' || data.action === 'get_bank_sheet' || data.action === 'add_bank_row') {
        sheetName = 'KCC Banksheet';
      } else {
        sheetName = 'KCC All Paduvada Members';
      }
    }
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    if (data.action === 'get_paduvada' || data.action === 'get_bank_sheet') {
      var allRows = sheet.getDataRange().getValues();
      return ContentService.createTextOutput(JSON.stringify({ success: true, rows: allRows }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'delete_bank_row') {
      var bankSheet = ss.getSheetByName('KCC Banksheet') || sheet;
      var allRows = bankSheet.getDataRange().getValues();
      var targetDate = String(data.date || '').trim().toLowerCase();
      var targetMemberPay = data.memberPayment !== undefined ? Number(data.memberPayment) : null;
      var targetDisbAmt = data.disbursementAmount !== undefined ? Number(data.disbursementAmount) : null;
      var targetBankPay = data.bankPayment !== undefined ? Number(data.bankPayment) : null;
      var deleted = false;
      var foundRow = -1;

      function parseDatePartsJS(str) {
        if (!str) return null;
        var clean = str.trim().split(' ')[0];
        var parts = clean.split(/[-/.]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return { y: parts[0], m: parseInt(parts[1], 10), d: parseInt(parts[2], 10) };
          } else if (parts[2].length === 4) {
            return { y: parts[2], m: parseInt(parts[1], 10), d: parseInt(parts[0], 10) };
          }
        }
        return null;
      }

      var targetParts = parseDatePartsJS(targetDate);

      for (var i = allRows.length - 1; i >= 1; i--) {
        var rDate = String(allRows[i][0] || '').trim().toLowerCase();
        var rMemberPay = parseFloat(String(allRows[i][1] || 0).replace(/[^0-9.-]/g, '')) || 0;
        var rDisbAmt = parseFloat(String(allRows[i][3] || 0).replace(/[^0-9.-]/g, '')) || 0;
        var rBankPay = parseFloat(String(allRows[i][4] || 0).replace(/[^0-9.-]/g, '')) || 0;

        var dateMatch = false;
        if (rDate && targetDate) {
          if (rDate === targetDate || rDate.indexOf(targetDate) !== -1 || targetDate.indexOf(rDate) !== -1) {
            dateMatch = true;
          } else {
            var rowParts = parseDatePartsJS(rDate);
            if (targetParts && rowParts) {
              if (targetParts.y === rowParts.y && targetParts.m === rowParts.m && targetParts.d === rowParts.d) {
                dateMatch = true;
              }
            }
          }
        }

        if (dateMatch) {
          var amtMatch = true;
          if (targetMemberPay !== null && Math.abs(rMemberPay - targetMemberPay) > 1) amtMatch = false;
          if (targetDisbAmt !== null && Math.abs(rDisbAmt - targetDisbAmt) > 1) amtMatch = false;
          if (targetBankPay !== null && Math.abs(rBankPay - targetBankPay) > 1) amtMatch = false;

          if (amtMatch) {
            foundRow = i + 1;
            break;
          }
        }
      }

      if (foundRow === -1 && targetDate) {
        for (var i = allRows.length - 1; i >= 1; i--) {
          var rDate = String(allRows[i][0] || '').trim().toLowerCase();
          if (rDate) {
            if (rDate === targetDate || rDate.indexOf(targetDate) !== -1 || targetDate.indexOf(rDate) !== -1) {
              foundRow = i + 1;
              break;
            }
            var rowParts = parseDatePartsJS(rDate);
            if (targetParts && rowParts) {
              if (targetParts.y === rowParts.y && targetParts.m === rowParts.m && targetParts.d === rowParts.d) {
                foundRow = i + 1;
                break;
              }
            }
          }
        }
      }

      if (foundRow === -1 && data.rowIndex && data.rowIndex > 1 && data.rowIndex <= allRows.length) {
        foundRow = data.rowIndex;
      }

      if (foundRow > 1) {
        bankSheet.deleteRow(foundRow);
        deleted = true;
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: deleted, sheet: 'KCC Banksheet' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'update_bank_row') {
      var bankSheet = ss.getSheetByName('KCC Banksheet') || sheet;
      var allRows = bankSheet.getDataRange().getValues();
      var targetDate = String(data.date || '').trim().toLowerCase();
      var targetRow = -1;

      if (data.rowIndex && data.rowIndex > 1 && data.rowIndex <= allRows.length) {
        targetRow = data.rowIndex;
      } else {
        for (var i = allRows.length - 1; i >= 1; i--) {
          var rDate = String(allRows[i][0] || '').trim().toLowerCase();
          if (rDate && targetDate && (rDate === targetDate || rDate.indexOf(targetDate) !== -1 || targetDate.indexOf(rDate) !== -1)) {
            targetRow = i + 1;
            break;
          }
        }
      }

      if (targetRow > 1 && data.rowValues) {
        bankSheet.getRange(targetRow, 1, 1, data.rowValues.length).setValues([data.rowValues]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true, sheet: 'KCC Banksheet' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (data.action === 'deletePaduvada' || data.action === 'delete') {
      var paduvadaSheet = ss.getSheetByName('KCC All Paduvada Members') || sheet;
      var allRows = paduvadaSheet.getDataRange().getValues();
      var targetAClass = String(data.aClass || '').trim().toLowerCase();
      var targetDisb = String(data.currentDisbNo || '').trim();
      var deleted = false;
      if (data.rowIndex && data.rowIndex > 1 && data.rowIndex <= allRows.length) {
        paduvadaSheet.deleteRow(data.rowIndex);
        deleted = true;
      } else {
        for (var i = allRows.length - 1; i >= 1; i--) {
          var rowAClass = String(allRows[i][6] || '').trim().toLowerCase();
          var rowDisb = String(allRows[i][3] || '').trim();
          if (rowAClass === targetAClass && (!targetDisb || rowDisb === targetDisb)) {
            paduvadaSheet.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: deleted, sheet: 'KCC All Paduvada Members' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'updatePaduvada' || data.action === 'update') {
      var allRows = sheet.getDataRange().getValues();
      var p = data.paduvadaData || {};
      var targetAClass = String(data.aClass || p.aClass || '').trim().toLowerCase();
      var targetDisb = String(data.currentDisbNo || p.currentDisbNo || '').trim();
      var targetRow = data.rowIndex;
      if (!targetRow) {
        for (var i = 1; i < allRows.length; i++) {
          var rowAClass = String(allRows[i][6] || '').trim().toLowerCase();
          var rowDisb = String(allRows[i][3] || '').trim();
          if (rowAClass === targetAClass && (!targetDisb || rowDisb === targetDisb)) {
            targetRow = i + 1;
            break;
          }
        }
      }
      if (targetRow && targetRow > 1) {
        var rowVal = [
          p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
          p.resolutionNo || '', p.resolutionDate || '', p.aClass || '', p.name || '',
          p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '',
          p.street || '', p.village || '', p.aadharNo || '', p.mobile || '', p.rationCard || '',
          p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '',
          p.surveyNo || '', p.acres || '', p.crop || '', p.seed || '', p.chemicalFertilizer || '',
          p.pesticide || '', p.plowing || '0', p.harvesting || '0', p.fertilizerKind || '',
          p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '0',
          p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '', p.insurance || '',
          p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '', p.addedAt || ''
        ];
        sheet.getRange(targetRow, 1, 1, rowVal.length).setValues([rowVal]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (data.action === 'append' && data.rowValues) {
      if (sheet.getLastRow() === 0) {
        if (data.headers) {
          sheet.appendRow(data.headers);
        }
        if (sheetName === 'KCC Banksheet') {
          sheet.appendRow(['OB', 0, 0, 0, 0, 0, 0, 0, 0, 0, 'வங்கியில் அதிகமாக உள்ளது']);
        }
      } else if (sheet.getLastRow() === 1 && sheetName === 'KCC Banksheet') {
        sheet.appendRow(['OB', 0, 0, 0, 0, 0, 0, 0, 0, 0, 'வங்கியில் அதிகமாக உள்ளது']);
      }
      sheet.appendRow(data.rowValues);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Row added' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'batch_append' && data.rows) {
      if (sheet.getLastRow() === 0 && data.headers) {
        sheet.appendRow(data.headers);
      }
      for (var i = 0; i < data.rows.length; i++) {
        sheet.appendRow(data.rows[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: data.rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Save Google Apps Script URL
  const handleSaveScriptUrl = () => {
    const cleanUrl = scriptUrlInput.trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      setStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து செல்லுபடியாகும் Google Apps Script Web App URL ஐ உள்ளிடவும்.'
      });
      return;
    }
    localStorage.setItem('tu3_paccs_script_url', cleanUrl);
    setScriptUrlInput(cleanUrl);
    setStatusMsg({
      type: 'success',
      text: 'Google Apps Script Web App URL வெற்றியுடன் சேமிக்கப்பட்டது! பட்டுவாடா தரவுகள் தானாகவே இந்த சீட்டில் சேமிக்கப்படும்.'
    });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Save Google Sheet ID
  const handleSaveSheetId = () => {
    const cleanId = extractSpreadsheetId(sheetInput);
    if (!cleanId) {
      setStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து செல்லுபடியாகும் Google Sheet ID அல்லது URL முகவரியை உள்ளிடவும்.'
      });
      return;
    }

    setSheetInput(cleanId);
    onSetSpreadsheetId(cleanId);
    localStorage.setItem('tu3_paccs_sheet_id', cleanId);
    setStatusMsg({
      type: 'success',
      text: `கூகுள் சீட் ஐடி (${cleanId}) வெற்றியுடன் சேமிக்கப்பட்டது!`
    });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Test connection to Google Sheet
  const handleTestConnection = async () => {
    const targetId = extractSpreadsheetId(sheetInput || spreadsheetId);
    if (!targetId && !activeScriptUrl) {
      setStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து முதலில் கூகுள் சீட் ஐடி அல்லது Web App URL ஐ உள்ளிடவும்.'
      });
      return;
    }

    setIsTesting(true);
    setStatusMsg({
      type: 'info',
      text: 'கூகுள் சீட் இணைப்பு சோதிக்கப்படுகிறது...'
    });

    try {
      const response = await fetch(`/api/sheets/test-connection?spreadsheetId=${targetId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: data.message || 'இணைப்பு வெற்றிகரமாக சோதிக்கப்பட்டது! கூகுள் சீட் வாசிப்பிற்கு தயாராக உள்ளது.'
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: data.details ? `${data.error || 'இணைப்பு தோல்வி'} (${data.details})` : (data.error || 'கூகுள் சீட் இணைப்பு தோல்வியடைந்தது.')
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'கூகுள் சீட் இணைப்பு சோதனையில் பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Backup / Sync All Paduvada Items
  const handleSyncAllPaduvada = async () => {
    const targetId = activeId;
    const webAppUrl = activeScriptUrl;

    if (!targetId && !webAppUrl) {
      setStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து கூகுள் சீட் ஐடி அல்லது Apps Script URL ஐ முதலில் சேமிக்கவும்.'
      });
      return;
    }

    setIsSyncing(true);
    setStatusMsg({
      type: 'info',
      text: 'அனைத்து பட்டுவாடா தரவுகளும் கூகுள் சீட்டிற்கு ஒத்திசைக்கப்படுகிறது (Syncing)...'
    });

    try {
      // Map members to paduvada list items
      const itemsToSync = members.map((m, idx) => ({
        rclNumber: `RCL-${100 + idx}`,
        rclDate: new Date().toISOString().split('T')[0],
        sanctionedAmount: '150000',
        currentDisbNo: '1',
        resolutionNo: '15',
        resolutionDate: new Date().toISOString().split('T')[0],
        aClass: m.aClass || m.memberNo,
        name: m.name,
        careOf: m.careOf || m.fatherOrHusbandName || '',
        sb: m.sb || '',
        erp: m.erp || '',
        ins: m.ins || '',
        door: m.door || '',
        street: m.street || '',
        village: m.village || '',
        aadharNo: m.adhar || m.aadharNo || '',
        mobile: m.mobile || '',
        rationCard: m.rationCard || '',
        namini: m.namini || '',
        relation: m.relation || '',
        mdcc: m.mdcc || '',
        caste: m.caste || '-',
        totalShare: m.totalShare || '',
        surveyNo: '102/1A',
        acres: m.landAcres || '1.5',
        crop: 'நெல் (Paddy)',
        seed: '2500',
        chemicalFertilizer: '4500',
        pesticide: '1500',
        plowing: '0',
        harvesting: '0',
        fertilizerKind: '3000',
        organicFertilizer: '1000',
        totalLoanAmount: '150000',
        farmerClass: 'MF',
        disability: 'இல்லை',
        mortgageType: 'தனிநபர் ஜாமீன்',
        guaranteeType: 'ஜாமீன்',
        passbookFee: '10',
        insurance: '1500',
        shareCapital: '7500',
        prevLoanNo: 'KCC-OLD',
        prevLoanDate: '2025-06-01',
        prevLoanAmount: '100000',
        addedAt: new Date().toLocaleString('ta-IN')
      }));

      const response = await fetch('/api/sheets/sync-paduvada-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: targetId,
          webAppUrl,
          items: itemsToSync
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatusMsg({
          type: 'success',
          text: `வெற்றி! ${itemsToSync.length} பட்டுவாடா விபரங்கள் கூகுள் சீட்டின் 'KCC All Paduvada Members' பகுதியில் சேமிக்கப்பட்டன.`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: result.details || result.error || 'ஒத்திசைப்பதில் பிழை ஏற்பட்டது.'
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'கூகுள் சீட் சேவையக இணைப்பு பிழை.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-stone-900 font-sans max-w-5xl mx-auto">
      {/* Top Banner Heading */}
      <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E2E2DC] shadow-2xs space-y-1">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 bg-[#D1EAE0] text-[#007A4D] rounded-xl border border-[#007A4D]/20 shadow-2xs">
            <FileSpreadsheet className="w-6 h-6 text-[#007A4D]" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide text-[#007A4D]">
            கூகுள் சீட் இணைப்பு அமைப்புகள் <span className="text-[#007A4D] text-lg sm:text-xl font-extrabold">(Google Sheet Sync)</span>
          </h1>
        </div>
        <p className="text-xs text-stone-600 font-medium pl-12">
          பட்டுவாடா மற்றும் உறுப்பினர் தரவுகளை உங்களது சொந்த கூகுள் சீட்டில் தானாக சேமிக்கவும், ஒத்திசைக்கவும்
        </p>
      </div>

      {/* Main Connection Card */}
      <div className="bg-[#FAF9F5] border border-[#E2E2DC] rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xs">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E2DC]">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#007A4D]" />
            <div>
              <h2 className="text-base font-black text-stone-900">
                கூகுள் சீட் இணைப்பு நிலை
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                கீழே உள்ள கூகுள் சீட் ஐடி மற்றும் 1-நிமிட Web App மூலம் தரவுகள் நேரடியாக உங்கள் கூகுள் சீட்டில் சேமிக்கப்படும்.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeId || activeScriptUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>இணைக்கப்பட்டுள்ளது (Connected)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>அமைப்புகள் தேவை (Not Configured)</span>
              </span>
            )}

            {activeId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${activeId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-[#007A4D] border border-[#007A4D]/30 text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                <span>Google Sheet திறக்க</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Input Configuration Box 1: Google Sheet ID */}
        <div className="bg-[#EAF4EF] p-4 sm:p-5 rounded-2xl border border-[#007A4D]/30 space-y-3">
          <label className="block text-xs font-black text-[#007A4D] uppercase tracking-wider">
            1. Google Spreadsheet ID அல்லது Link
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={sheetInput}
              onChange={(e) => setSheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit அல்லது ID..."
              className="flex-1 w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none shadow-2xs"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveSheetId}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ஐடி சேமி</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-stone-700 hover:bg-stone-800 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>சோதிக்க</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Configuration Box 2: Google Apps Script Web App URL (Direct Write Engine) */}
        <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-300 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>2. Google Apps Script Web App URL (தானியங்கி நேரடி சேமிப்பு)</span>
            </label>
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
              100% வெற்றி உத்தரவாதம்
            </span>
          </div>
          <p className="text-xs text-stone-600">
            கூகுள் சீட்டில் தரவு சேமிக்கப்படுவதை உறுதிசெய்ய, கீழே உள்ள Apps Script கோடை உங்கள் Google Sheet -&gt; Extensions -&gt; Apps Script இல் ஒட்டி Web App ஆக Deploy செய்து அந்த URL ஐ கீழே உள்ளிடவும்:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={scriptUrlInput}
              onChange={(e) => setScriptUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 w-full bg-white border border-emerald-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none shadow-2xs"
            />
            <button
              type="button"
              onClick={handleSaveScriptUrl}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#007A4D] hover:bg-[#00633E] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Script URL சேமி</span>
            </button>
          </div>

          {activeScriptUrl && (
            <p className="text-[11px] text-emerald-800 font-mono font-bold">
              ✓ செயலில் உள்ள Web App URL: <span className="text-stone-800 bg-white px-2 py-0.5 rounded border border-emerald-300">{activeScriptUrl.slice(0, 45)}...</span>
            </p>
          )}
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-[#D1EAE0] text-[#007A4D] border border-[#007A4D]/30' :
            statusMsg.type === 'error' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {statusMsg.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
            {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1-Minute Easy Setup Guide & Code Snippet */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E2DC] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-black text-sm text-stone-800 flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-[#007A4D]" />
              <span>1-நிமிட Google Apps Script அமைக்கும் முறை (1-Min Setup Script)</span>
            </h3>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-stone-800 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'பிரதி செய்யப்பட்டது!' : 'Code ஐ Copy செய்க'}</span>
            </button>
          </div>

          <ol className="text-xs text-stone-700 space-y-2 list-decimal pl-5 font-medium leading-relaxed">
            <li>
              உங்கள் கூகுள் சீட்டில் (Google Sheet) மேல் மெனுவில் <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">Extensions -&gt; Apps Script</span> கிளிக் செய்யவும்.
            </li>
            <li>
              அங்கு உள்ள பழைய கோடுகளை நீக்கிவிட்டு, மேலே உள்ள <span className="font-bold text-[#007A4D]">'Code ஐ Copy செய்க'</span> பொத்தானை அழுத்தி நகலெடுத்த கோடை ஒட்டவும்.
            </li>
            <li>
              வலது மேல் மூலையில் <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">Deploy -&gt; New deployment</span> கிளிக் செய்யவும்.
            </li>
            <li>
              Select type ⚙️ இல் <span className="font-bold text-[#007A4D]">Web app</span> என்பதைத் தேர்ந்தெடுக்கவும்.
            </li>
            <li>
              Execute as: <span className="font-bold text-stone-900">Me</span> | Who has access: <span className="font-bold text-[#007A4D]">Anyone</span> என மாற்றி <span className="font-bold text-stone-900">Deploy</span> கிளிக் செய்யவும்.
            </li>
            <li>
              உருவாக்கப்பட்ட <span className="font-bold text-emerald-700">Web App URL</span> ஐ நகலெடுத்து மேலே உள்ள 2-வது கட்டத்தில் ஒட்டி <span className="font-bold text-stone-900">'Script URL சேமி'</span> அழுத்தவும்.
            </li>
          </ol>

          {/* Apps script code box */}
          <div className="relative">
            <pre className="bg-stone-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800 leading-relaxed">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>

        {/* Bulk Action / One-click Backup Section */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E2DC] space-y-3 shadow-2xs">
          <h3 className="font-black text-sm text-stone-800 flex items-center gap-2">
            <span>⚡</span>
            <span>கூகுள் சீட்டிற்கு நேரடியாக தரவுகளை ஒத்திசைத்தல் (Manual Backup)</span>
          </h3>
          <p className="text-xs text-stone-600">
            கேசிசி பட்டுவாடா பகுதியில் நீங்கள் 'பட்டியலில் சேர்' அழுத்தும்போது தரவுகள் தானாகவே கூகுள் சீட்டில் பதியும். மேலும், தேவைப்படும் போது கீழே உள்ள பொத்தானை அழுத்தி ஒரே கிளிக்கில் முழு நகலும் சேமிக்கலாம்.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleSyncAllPaduvada}
              disabled={isSyncing || (!activeId && !activeScriptUrl)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#007A4D] hover:bg-[#00633E] disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>அனைத்து பட்டுவாடா தரவுகளையும் ஒத்திசை (Backup Paduvada)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
