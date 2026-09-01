import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Users,
  Coins,
  Send,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Database,
  Save,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  FileDown,
  Printer,
  Filter
} from 'lucide-react';
import { extractSpreadsheetId, formatIndianCurrency } from '../utils/formatters';

export interface KCCBankRow {
  id?: string;
  rowIndex?: number;
  date: string; // Column A: தேதி
  memberPayment: number; // Column B: உறுப்பினர் செலுத்தும் தொகை
  disbursementMemberCount: number; // Column C: உறுப்பினர் எண்ணிக்கை
  disbursementAmount: number; // Column D: பட்டுவாடா தொகை
  bankPayment: number; // Column E: வங்கியில் செலுத்தும் தொகை
  colF?: string | number; // Column F: KCC கடன் இருப்பு / F காலம்
  colG?: string | number; // Column G: வட்டி இருப்பு / G காலம்
  colH?: string | number; // Column H: மொத்த இருப்பு / H காலம்
  colI?: string | number; // Column I: உறுப்பினர் கணக்கு இருப்பு / I காலம்
  colJ?: string | number; // Column J: வங்கி கணக்கு இருப்பு / J காலம்
  bankLevelBalance?: number;
  memberLevelTotal?: number;
  totalMemberCount?: number;
  totalDisbursedAmount?: number;
  netMeasure?: number;
  bankOutstandingStatus?: string;
  obF?: number | string;
  rowObF?: number;
  calculatedColF?: number;
  calculatedColG?: number;
}

interface KCCBankAccountScreenProps {
  spreadsheetId?: string;
}

export const KCCBankAccountScreen: React.FC<KCCBankAccountScreenProps> = ({
  spreadsheetId: propSpreadsheetId
}) => {
  // Input form state for 5 columns (A - E)
  const [inputDate, setInputDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [memberPayment, setMemberPayment] = useState<string>('');
  const [memberCount, setMemberCount] = useState<string>('');
  const [disbursementAmount, setDisbursementAmount] = useState<string>('');
  const [bankPayment, setBankPayment] = useState<string>('');

  // OB Balance states (Columns F & G - persistent across entries)
  const [obF, setObF] = useState<string>(() => localStorage.getItem('kcc_ob_f') || '');
  const [obG, setObG] = useState<string>(() => localStorage.getItem('kcc_ob_g') || '');
  const [obH, setObH] = useState<string>('');
  const [obI, setObI] = useState<string>('');
  const [obJ, setObJ] = useState<string>('');
  const [showObSection, setShowObSection] = useState<boolean>(false);

  // Editing modal state
  const [editingRow, setEditingRow] = useState<KCCBankRow | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editMemberPayment, setEditMemberPayment] = useState<string>('');
  const [editMemberCount, setEditMemberCount] = useState<string>('');
  const [editDisbursementAmount, setEditDisbursementAmount] = useState<string>('');
  const [editBankPayment, setEditBankPayment] = useState<string>('');
  const [editColF, setEditColF] = useState<string>('');
  const [editColG, setEditColG] = useState<string>('');
  const [editColH, setEditColH] = useState<string>('');
  const [editColI, setEditColI] = useState<string>('');
  const [editColJ, setEditColJ] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Deleting modal state
  const [deletingRow, setDeletingRow] = useState<KCCBankRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // PDF Date Filter & Table Sort states
  const [pdfFilterMonth, setPdfFilterMonth] = useState<string>('');
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');
  const [tableSortAscending, setTableSortAscending] = useState<boolean>(false);

  // Data & fetch states
  const [bankRows, setBankRows] = useState<KCCBankRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Configuration settings (optional sync)
  const sheetId = extractSpreadsheetId(
    propSpreadsheetId || localStorage.getItem('tu3_paccs_sheet_id') || ''
  );
  const scriptUrl = localStorage.getItem('tu3_paccs_script_url') || '';

  useEffect(() => {
    fetchBankRows();
    fetchObSettings();
  }, [sheetId, scriptUrl]);

  // Fetch server-wide OB Balance settings
  const fetchObSettings = async () => {
    try {
      const res = await fetch('/api/settings/kcc-ob');
      const data = await res.json();
      if (data && data.success) {
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
      console.log('OB settings load notice:', err);
    }
  };

  // Save OB settings to server database so it persists across all computers
  const saveObSettingsToServer = async (newObF: string, newObG: string) => {
    try {
      await fetch('/api/settings/kcc-ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obF: newObF, obG: newObG })
      });
    } catch (err) {
      console.log('OB settings save notice:', err);
    }
  };

  // Format date helper to DD/MM/YYYY
  const formatDateDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '—';
    const cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [y, m, d] = cleanStr.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanStr)) {
      const [y, m, d] = cleanStr.split('/');
      return `${d}/${m}/${y}`;
    }
    return cleanStr;
  };

  // Fetch bank rows from Firebase & SQLite database
  const fetchBankRows = async () => {
    setIsLoading(true);
    setStatusMsg({
      type: 'info',
      text: 'KCC வங்கிக் கணக்கு தகவல்கள் பெறப்படுகின்றன...'
    });

    try {
      const primaryUrl = `/api/sheets/get-bank-sheet?spreadsheetId=${encodeURIComponent(
        sheetId
      )}&webAppUrl=${encodeURIComponent(scriptUrl)}`;
      let res = await fetch(primaryUrl);
      let result = await res.json();

      if (!result.success) {
        const fallbackUrl = `/api/sheets/get-bank-rows?spreadsheetId=${encodeURIComponent(
          sheetId
        )}&webAppUrl=${encodeURIComponent(scriptUrl)}`;
        res = await fetch(fallbackUrl);
        result = await res.json();
      }

      if (result.success && Array.isArray(result.data)) {
        setBankRows(result.data);
        if (result.obF !== undefined && result.obF !== '') {
          setObF(String(result.obF));
          localStorage.setItem('kcc_ob_f', String(result.obF));
        }
        if (result.obG !== undefined && result.obG !== '') {
          setObG(String(result.obG));
          localStorage.setItem('kcc_ob_g', String(result.obG));
        }
        setStatusMsg({
          type: 'success',
          text: `${result.data.length} பதிவுகள் வெற்றிகரமாகப் பெறப்பட்டன.`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: result.error || 'தரவை பெற முடியவில்லை.'
        });
      }
    } catch (err: any) {
      console.error('Error fetching bank rows:', err);
      setStatusMsg({
        type: 'error',
        text: 'தரவுத்தளத்திலிருந்து பதிவுகளைப் பெறுவதில் பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // Submit Form - Add row to SQLite (Columns A to E, plus optional OB Balance F to J)
  const handleSubmitRow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputDate) {
      setStatusMsg({ type: 'error', text: 'தயவுசெய்து தேதியை உள்ளிடவும்.' });
      return;
    }

    const disbAmt = parseFloat(disbursementAmount) || 0;
    const bankPay = parseFloat(bankPayment) || 0;
    const memPay = parseFloat(memberPayment) || 0;

    // Calculate Column F & G starting from previous row's calculated balance
    let currentObF = parseFloat(obF) || 0;
    let currentObG = parseFloat(obG) || 0;
    if (processedBankRows.length > 0) {
      currentObF = processedBankRows[processedBankRows.length - 1].calculatedColF;
      currentObG = processedBankRows[processedBankRows.length - 1].calculatedColG;
    }

    const calculatedColF = currentObF + disbAmt - bankPay;
    const calculatedColG = currentObG + disbAmt - memPay;

    const payload: any = {
      date: inputDate,
      memberPayment: memPay,
      disbursementMemberCount: parseInt(memberCount, 10) || 0,
      disbursementAmount: disbAmt,
      bankPayment: bankPay,
      colF: calculatedColF,
      bankLevelBalance: calculatedColF,
      colG: calculatedColG,
      memberLevelTotal: calculatedColG
    };

    if (bankRows.length === 0 && obF !== '') {
      payload.obF = parseFloat(obF) || 0;
    }

    const newRowId = `bank-row-${Date.now()}`;
    const newOptimisticRow: KCCBankRow = {
      id: newRowId,
      rowIndex: bankRows.length + 2,
      date: inputDate,
      memberPayment: memPay,
      disbursementMemberCount: parseInt(memberCount, 10) || 0,
      disbursementAmount: disbAmt,
      bankPayment: bankPay,
      colF: calculatedColF,
      bankLevelBalance: calculatedColF,
      colG: calculatedColG,
      memberLevelTotal: calculatedColG,
      calculatedColF,
      calculatedColG
    };

    // Optimistically add to UI state immediately (<1ms)
    setBankRows(prev => [...prev, newOptimisticRow]);

    // Save OB balance choices to localStorage so they persist across future entries
    if (obF) localStorage.setItem('kcc_ob_f', obF);
    if (obG) localStorage.setItem('kcc_ob_g', obG);

    // Reset transactional form input values immediately
    setMemberPayment('');
    setMemberCount('');
    setDisbursementAmount('');
    setBankPayment('');
    setObH('');
    setObI('');
    setObJ('');

    setIsSubmitting(true);
    setStatusMsg({
      type: 'success',
      text: 'தகவல்கள் உடனடியாக சேமிக்கப்பட்டுவிட்டன!'
    });

    try {
      const res = await fetch('/api/sheets/add-bank-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          webAppUrl: scriptUrl,
          bankRow: { ...payload, id: newRowId }
        })
      });

      const result = await res.json();

      if (result.success) {
        // Refresh rows silently in background
        fetchBankRows();
      } else {
        setStatusMsg({
          type: 'error',
          text: result.error || 'தரவுத்தளத்தில் பதிவதில் தோல்வி ஏற்பட்டது.'
        });
      }
    } catch (err: any) {
      console.error('Error adding bank row:', err);
      setStatusMsg({
        type: 'error',
        text: 'தரவைச் சேமிக்கும் போது பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Open edit modal
  const handleStartEdit = (row: KCCBankRow) => {
    setEditingRow(row);
    // Convert date to YYYY-MM-DD for date input if possible
    let formattedDate = row.date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.date)) {
      const [d, m, y] = row.date.split('/');
      formattedDate = `${y}-${m}-${d}`;
    }
    setEditDate(formattedDate);
    setEditMemberPayment(String(row.memberPayment ?? ''));
    setEditMemberCount(String(row.disbursementMemberCount ?? ''));
    setEditDisbursementAmount(String(row.disbursementAmount ?? ''));
    setEditBankPayment(String(row.bankPayment ?? ''));
    setEditColF(String(row.colF ?? row.bankLevelBalance ?? ''));
    setEditColG(String(row.colG ?? row.memberLevelTotal ?? ''));
    setEditColH(String(row.colH ?? row.totalMemberCount ?? ''));
    setEditColI(String(row.colI ?? row.totalDisbursedAmount ?? ''));
    setEditColJ(String(row.colJ ?? row.netMeasure ?? ''));
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    setIsUpdating(true);
    try {
      const updatedPayload: any = {
        date: editDate,
        memberPayment: parseFloat(editMemberPayment) || 0,
        disbursementMemberCount: parseInt(editMemberCount, 10) || 0,
        disbursementAmount: parseFloat(editDisbursementAmount) || 0,
        bankPayment: parseFloat(editBankPayment) || 0,
        colF: editColF !== '' ? parseFloat(editColF) || 0 : 0,
        colG: editColG !== '' ? parseFloat(editColG) || 0 : 0,
        colH: editColH !== '' ? parseFloat(editColH) || 0 : 0,
        colI: editColI !== '' ? parseFloat(editColI) || 0 : 0,
        colJ: editColJ !== '' ? parseFloat(editColJ) || 0 : 0,
        bankLevelBalance: editColF !== '' ? parseFloat(editColF) || 0 : 0,
        memberLevelTotal: editColG !== '' ? parseFloat(editColG) || 0 : 0,
        totalMemberCount: editColH !== '' ? parseFloat(editColH) || 0 : 0,
        totalDisbursedAmount: editColI !== '' ? parseFloat(editColI) || 0 : 0,
        netMeasure: editColJ !== '' ? parseFloat(editColJ) || 0 : 0,
      };

      const res = await fetch('/api/sheets/update-bank-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          webAppUrl: scriptUrl,
          rowIndex: editingRow.rowIndex,
          date: editingRow.date,
          bankRow: updatedPayload
        })
      });

      const result = await res.json();

      if (result.success) {
        setStatusMsg({
          type: 'success',
          text: 'பதிவு வெற்றியுடன் திருத்தப்பட்டது!'
        });
        setEditingRow(null);
        await fetchBankRows();
      } else {
        setStatusMsg({
          type: 'error',
          text: result.error || 'பதிவைத் திருத்துவதில் தோல்வி ஏற்பட்டது.'
        });
      }
    } catch (err: any) {
      console.error('Error updating bank row:', err);
      setStatusMsg({
        type: 'error',
        text: 'பதிவைத் திருத்துவதில் பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingRow) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/sheets/delete-bank-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingRow.id,
          spreadsheetId: sheetId,
          webAppUrl: scriptUrl,
          rowIndex: deletingRow.rowIndex,
          date: deletingRow.date,
          memberPayment: deletingRow.memberPayment,
          disbursementAmount: deletingRow.disbursementAmount,
          bankPayment: deletingRow.bankPayment
        })
      });

      const result = await res.json();

      if (result.success) {
        setStatusMsg({
          type: 'success',
          text: 'பதிவு வெற்றியுடன் நீக்கப்பட்டது!'
        });
        setDeletingRow(null);
        await fetchBankRows();
      } else {
        setStatusMsg({
          type: 'error',
          text: result.error || 'பதிவை நீக்குவதில் தோல்வி ஏற்பட்டது.'
        });
      }
    } catch (err: any) {
      console.error('Error deleting bank row:', err);
      setStatusMsg({
        type: 'error',
        text: 'பதிவை நீக்குவதில் பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to parse dates safely
  const parseRowDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const clean = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return new Date(clean + 'T00:00:00');
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('/');
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      const dd = d.padStart(2, '0');
      const mm = m.padStart(2, '0');
      return new Date(`${y}-${mm}-${dd}T00:00:00`);
    }
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Process bank rows sorted chronologically by Date to compute Columns F, G, H, I, J dynamically as a Running Total:
  // Column F = Previous Running Balance F (or OB F) + D (பட்டுவாடா தொகை) - E (வங்கி செலுத்துதல்)
  // Column G = Previous Running Balance G (or OB G) + D (பட்டுவாடா தொகை) - B (உறுப்பினர் செலுத்தல்)
  // Column H = Previous Running Count H + C (உறுப்பினர் எண்ணிக்கை)
  // Column I = Previous Running Disbursed I + D (பட்டுவாடா தொகை)
  // Column J = Column G - Column F (நிகர தொகையின் நிலைமை)
  const processedBankRows = useMemo(() => {
    // Sort rows chronologically by date ascending so running total follows exact calendar order
    const sortedBankRows = [...bankRows].sort((a, b) => {
      const timeA = parseRowDate(a.date)?.getTime() || 0;
      const timeB = parseRowDate(b.date)?.getTime() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.rowIndex || 0) - (b.rowIndex || 0);
    });

    let runningColF = parseFloat(obF) || 0;
    let runningColG = parseFloat(obG) || 0;
    let runningColH = parseFloat(obH) || 0;
    let runningColI = parseFloat(obI) || 0;

    return sortedBankRows.map((row, idx) => {
      const memPay = typeof row.memberPayment === 'number'
        ? row.memberPayment
        : parseFloat(String(row.memberPayment || 0).replace(/[^0-9.-]/g, '')) || 0;
      const memCount = typeof row.disbursementMemberCount === 'number'
        ? row.disbursementMemberCount
        : parseInt(String(row.disbursementMemberCount || 0).replace(/[^0-9.-]/g, ''), 10) || 0;
      const disbAmt = typeof row.disbursementAmount === 'number'
        ? row.disbursementAmount
        : parseFloat(String(row.disbursementAmount || 0).replace(/[^0-9.-]/g, '')) || 0;
      const bankPay = typeof row.bankPayment === 'number'
        ? row.bankPayment
        : parseFloat(String(row.bankPayment || 0).replace(/[^0-9.-]/g, '')) || 0;

      // 1. Column F: Previous Row's Ending F (or initial OB for idx===0) + D - E
      let rowObF = runningColF;
      if (idx === 0) {
        if (obF !== undefined && obF !== null && obF !== '') {
          rowObF = parseFloat(obF) || 0;
        } else if (row.obF !== undefined && row.obF !== null && row.obF !== '' && !isNaN(Number(row.obF))) {
          rowObF = typeof row.obF === 'number' ? row.obF : parseFloat(String(row.obF).replace(/[^0-9.-]/g, '')) || 0;
        } else {
          const savedF = typeof (row.colF ?? row.bankLevelBalance) === 'number'
            ? Number(row.colF ?? row.bankLevelBalance)
            : parseFloat(String(row.colF ?? row.bankLevelBalance ?? 0).replace(/[^0-9.-]/g, '')) || 0;
          if (savedF !== 0) {
            rowObF = savedF - disbAmt + bankPay;
          }
        }
      }
      const calculatedColF = rowObF + disbAmt - bankPay;
      runningColF = calculatedColF;

      // 2. Column G: Previous Row's Ending G (or initial OB for idx===0) + D - B
      let rowObG = runningColG;
      if (idx === 0) {
        if (obG !== undefined && obG !== null && obG !== '') {
          rowObG = parseFloat(obG) || 0;
        } else if (row.obG !== undefined && row.obG !== null && row.obG !== '' && !isNaN(Number(row.obG))) {
          rowObG = typeof row.obG === 'number' ? row.obG : parseFloat(String(row.obG).replace(/[^0-9.-]/g, '')) || 0;
        } else {
          const savedG = typeof (row.colG ?? row.memberLevelTotal) === 'number'
            ? Number(row.colG ?? row.memberLevelTotal)
            : parseFloat(String(row.colG ?? row.memberLevelTotal ?? 0).replace(/[^0-9.-]/g, '')) || 0;
          if (savedG !== 0) {
            rowObG = savedG - disbAmt + memPay;
          }
        }
      }
      const calculatedColG = rowObG + disbAmt - memPay;
      runningColG = calculatedColG;

      // 3. Column H: Cumulative count
      const calculatedColH = runningColH + memCount;
      runningColH = calculatedColH;

      // 4. Column I: Cumulative disbursement amount
      const calculatedColI = runningColI + disbAmt;
      runningColI = calculatedColI;

      // 5. Column J: Net Difference (Column G - Column F)
      const calculatedColJ = calculatedColG - calculatedColF;

      return {
        ...row,
        originalIdx: idx,
        rowObF,
        rowObG,
        calculatedColF,
        calculatedColG,
        calculatedColH,
        calculatedColI,
        calculatedColJ
      };
    });
  }, [bankRows, obF, obG, obH, obI]);

  // Filtered rows for PDF and Section 3 table based on pdfStartDate and pdfEndDate
  const filteredPdfRows = useMemo(() => {
    return processedBankRows.filter((row) => {
      if (!pdfStartDate && !pdfEndDate) return true;
      const d = parseRowDate(row.date);
      if (!d) return true;
      if (pdfStartDate) {
        const start = new Date(pdfStartDate + 'T00:00:00');
        if (d < start) return false;
      }
      if (pdfEndDate) {
        const end = new Date(pdfEndDate + 'T23:59:59');
        if (d > end) return false;
      }
      return true;
    });
  }, [processedBankRows, pdfStartDate, pdfEndDate]);

  // Display table in descending order (latest row at the top) or ascending chronological order based on tableSortAscending
  const displayedBankRows = useMemo(() => {
    return tableSortAscending ? [...processedBankRows] : [...processedBankRows].reverse();
  }, [processedBankRows, tableSortAscending]);

  // Month & Preset handlers
  const handlePdfMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // e.g. "2026-08"
    setPdfFilterMonth(val);
    if (val) {
      const [yearStr, monthStr] = val.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(year, month, 0).getDate();
      setPdfStartDate(`${val}-01`);
      setPdfEndDate(`${val}-${String(lastDay).padStart(2, '0')}`);
    } else {
      setPdfStartDate('');
      setPdfEndDate('');
    }
  };

  const getCurrentMonthStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const setThisMonthPreset = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setPdfFilterMonth(`${y}-${m}`);
    setPdfStartDate(`${y}-${m}-01`);
    setPdfEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  };

  const setLastMonthPreset = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setPdfFilterMonth(`${y}-${m}`);
    setPdfStartDate(`${y}-${m}-01`);
    setPdfEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  };

  const setAllDataPreset = () => {
    setPdfFilterMonth('');
    setPdfStartDate('');
    setPdfEndDate('');
  };

  // Generate and Download PDF Report
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('பாப்-அப் தடுக்கப்பட்டது. தயவுசெய்து உங்கள் உலாவியில் Pop-up அனுமதி வழங்கவும்.');
      return;
    }

    const startFormatted = pdfStartDate ? formatDateDDMMYYYY(pdfStartDate) : 'துவக்கம்';
    const endFormatted = pdfEndDate ? formatDateDDMMYYYY(pdfEndDate) : 'முடிவு';
    const periodText = (pdfStartDate || pdfEndDate)
      ? `${startFormatted} முதல் ${endFormatted} வரை`
      : 'அனைத்து பதிவுகளும்';

    const rowsToPrint = [...filteredPdfRows]; // Ascending chronological order
    const totalMemPay = rowsToPrint.reduce((acc, r) => acc + (parseFloat(String(r.memberPayment)) || 0), 0);
    const totalMemCount = rowsToPrint.reduce((acc, r) => acc + (parseInt(String(r.disbursementMemberCount), 10) || 0), 0);
    const totalDisbAmt = rowsToPrint.reduce((acc, r) => acc + (parseFloat(String(r.disbursementAmount)) || 0), 0);
    const totalBankPay = rowsToPrint.reduce((acc, r) => acc + (parseFloat(String(r.bankPayment)) || 0), 0);

    const latestFilterRow = rowsToPrint.length > 0 ? rowsToPrint[rowsToPrint.length - 1] : null;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ta">
      <head>
        <meta charset="UTF-8">
        <title>KCC Bank Account Statement - ${periodText}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Tamil', sans-serif;
            color: #1c1917;
            margin: 0;
            padding: 12px;
            font-size: 11px;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007A4D;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .header h1 {
            margin: 0;
            font-size: 17px;
            color: #007A4D;
            font-weight: 800;
          }
          .header h2 {
            margin: 2px 0 0 0;
            font-size: 13px;
            color: #333;
            font-weight: 700;
          }
          .period-badge {
            display: inline-block;
            background: #EAF4EF;
            color: #007A4D;
            padding: 3px 12px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 11px;
            margin-top: 6px;
            border: 1px solid #007A4D;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          .summary-card {
            border: 1px solid #d6d3d1;
            border-radius: 6px;
            padding: 6px 8px;
            background: #fcfbf9;
          }
          .summary-card .title {
            font-size: 9px;
            color: #57534e;
            font-weight: bold;
            text-transform: uppercase;
          }
          .summary-card .value {
            font-size: 12px;
            font-weight: 800;
            color: #0c0a09;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #a8a29e;
            padding: 5px 6px;
            text-align: left;
          }
          th {
            background-color: #007A4D;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
          }
          tr:nth-child(even) {
            background-color: #f5f5f4;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: monospace, monospace; }
          .total-row {
            background-color: #e7e5e4 !important;
            font-weight: bold;
          }
          .signatures {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            padding: 0 30px;
          }
          .signature-box {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            border-top: 1px dashed #444;
            padding-top: 5px;
            width: 140px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TU3 Paccs</h1>
          <h2>KCC வங்கி கணக்கு அறிக்கை (KCC Bank Account Statement)</h2>
          <div class="period-badge">காலம்: ${periodText}</div>
        </div>

        ${latestFilterRow ? `
        <div class="summary-grid">
          <div class="summary-card" style="border-left: 3px solid #007A4D;">
            <div class="title">F: வங்கி அளவில் இருப்பு</div>
            <div class="value">${formatIndianCurrency(latestFilterRow.calculatedColF)}</div>
          </div>
          <div class="summary-card" style="border-left: 3px solid #2563eb;">
            <div class="title">G: உறுப்பினர் அளவில் இருப்பு</div>
            <div class="value">${formatIndianCurrency(latestFilterRow.calculatedColG)}</div>
          </div>
          <div class="summary-card" style="border-left: 3px solid #d97706;">
            <div class="title">H: உறுப்பினர் எண்ணிக்கை</div>
            <div class="value">${latestFilterRow.calculatedColH?.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-card" style="border-left: 3px solid #9333ea;">
            <div class="title">I: மொத்த பட்டுவாடா</div>
            <div class="value">${formatIndianCurrency(latestFilterRow.calculatedColI)}</div>
          </div>
          <div class="summary-card" style="border-left: 3px solid ${latestFilterRow.calculatedColJ >= 0 ? '#15803d' : '#be123c'};">
            <div class="title">J: தொகையின் நிலைமை</div>
            <div class="value">${formatIndianCurrency(latestFilterRow.calculatedColJ)}</div>
          </div>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>வரிசை</th>
              <th>தேதி</th>
              <th>B: உறுப்பினர் செலுத்தல் (₹)</th>
              <th>C: எண்ணிக்கை</th>
              <th>D: பட்டுவாடா தொகை (₹)</th>
              <th>E: வங்கி செலுத்துதல் (₹)</th>
              <th>F: வங்கி அளவில் (₹)</th>
              <th>G: உறுப்பினர் அளவில் (₹)</th>
              <th>H: எண்ணிக்கை (கூட்டு)</th>
              <th>I: மொத்த பட்டுவாடா (₹)</th>
              <th>J: தொகையின் நிலைமை (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsToPrint.map((row, idx) => `
              <tr>
                <td class="text-center font-mono">#${row.rowIndex || idx + 1}</td>
                <td class="text-center">${formatDateDDMMYYYY(row.date)}</td>
                <td class="text-right font-mono">${formatIndianCurrency(row.memberPayment)}</td>
                <td class="text-center font-mono">${row.disbursementMemberCount}</td>
                <td class="text-right font-mono">${formatIndianCurrency(row.disbursementAmount)}</td>
                <td class="text-right font-mono">${formatIndianCurrency(row.bankPayment)}</td>
                <td class="text-right font-mono" style="font-weight:bold;">${formatIndianCurrency(row.calculatedColF)}</td>
                <td class="text-right font-mono" style="font-weight:bold;">${formatIndianCurrency(row.calculatedColG)}</td>
                <td class="text-center font-mono" style="font-weight:bold;">${row.calculatedColH?.toLocaleString('en-IN')}</td>
                <td class="text-right font-mono" style="font-weight:bold;">${formatIndianCurrency(row.calculatedColI)}</td>
                <td class="text-right font-mono" style="font-weight:bold; color: ${row.calculatedColJ >= 0 ? '#000' : '#b91c1c'};">${formatIndianCurrency(row.calculatedColJ)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" class="text-center">மொத்தம் / Total</td>
              <td class="text-right font-mono">${formatIndianCurrency(totalMemPay)}</td>
              <td class="text-center font-mono">${totalMemCount}</td>
              <td class="text-right font-mono">${formatIndianCurrency(totalDisbAmt)}</td>
              <td class="text-right font-mono">${formatIndianCurrency(totalBankPay)}</td>
              <td colspan="5" class="text-center">மொத்த பதிவுகள்: ${rowsToPrint.length}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">தயாரித்தவர்</div>
          <div class="signature-box">எழுத்தர்</div>
          <div class="signature-box">செயலாளர்</div>
          <div class="signature-box">தலைவர்</div>
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
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Get the last row for report boxes
  const lastRow = processedBankRows.length > 0 ? processedBankRows[processedBankRows.length - 1] : null;

  // Calculate Column J net value logic for status text
  const lastNetValueJ = lastRow
    ? lastRow.calculatedColJ
    : ((parseFloat(obG) || 0) - (parseFloat(obF) || 0));

  const jStatusText =
    lastNetValueJ >= 0
      ? 'வங்கியில் அதிகம் இருக்கும் தொகை'
      : 'வங்கியில் செலுத்த வேண்டிய தொகை';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#005233] via-[#007A4D] to-[#009960] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Building2 className="w-6 h-6 text-[#A3E0C8]" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              KCC வங்கிக் கணக்கு (KCC Bank Account)
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#D1EAE0] leading-relaxed max-w-2xl">
            A, B, C, D, E ஆகிய 5 விபரங்களை உள்ளிட்டு நேரடியாகத் தரவுத்தளத்தில்
            சேமிக்கலாம்.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBankRows}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#005233] hover:bg-[#EAF4EF] font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>புதுப்பி (Refresh Data)</span>
          </button>
        </div>
      </div>

      {/* Status Notification Toast/Bar */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            {statusMsg.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            {statusMsg.type === 'info' && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form: 5 Inputs for Columns A to E */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 md:p-6 space-y-5">
        <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base md:text-lg font-black text-stone-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#007A4D]" />
              <span>பகுதி 1: புதிய தகவலை உள்ளிடுக (Columns A to E)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              விபரங்களை உள்ளிட்டு &quot;தரவுத்தளத்தில் சேமி&quot; அழுத்தவும்.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#007A4D] border border-emerald-200 rounded-full text-xs font-bold w-fit">
            <Database className="w-3.5 h-3.5" />
            நேரடித் தரவு உள்ளீடு (Direct Entry)
          </span>
        </div>

        <form onSubmit={handleSubmitRow} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Field 1: Column A - தேதி */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#007A4D]" />
                <span>1. தேதி (Column A)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl text-sm text-stone-900 font-semibold outline-hidden transition-all"
              />
            </div>

            {/* Field 2: Column B - உறுப்பினர் செலுத்தும் தொகை */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. உறுப்பினர் செலுத்தும் தொகை (B)</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={memberPayment}
                onChange={(e) => setMemberPayment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl text-sm text-stone-900 font-semibold outline-hidden transition-all"
              />
              {memberPayment !== '' && (
                <span className="text-[11px] font-bold text-emerald-700 block">
                  {formatIndianCurrency(memberPayment)}
                </span>
              )}
            </div>

            {/* Field 3: Column C - உறுப்பினர் எண்ணிக்கை */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>3. உறுப்பினர் எண்ணிக்கை (C)</span>
              </label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl text-sm text-stone-900 font-semibold outline-hidden transition-all"
              />
              {memberCount !== '' && !isNaN(Number(memberCount)) && (
                <span className="text-[11px] font-bold text-blue-700 block">
                  {Number(memberCount).toLocaleString('en-IN')} நபர்கள்
                </span>
              )}
            </div>

            {/* Field 4: Column D - பட்டுவாடா தொகை */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-purple-600" />
                <span>4. பட்டுவாடா தொகை (Column D)</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={disbursementAmount}
                onChange={(e) => setDisbursementAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl text-sm text-stone-900 font-semibold outline-hidden transition-all"
              />
              {disbursementAmount !== '' && (
                <span className="text-[11px] font-bold text-purple-700 block">
                  {formatIndianCurrency(disbursementAmount)}
                </span>
              )}
            </div>

            {/* Field 5: Column E - வங்கியில் செலுத்தும் தொகை */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>5. வங்கியில் செலுத்தும் தொகை (E)</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={bankPayment}
                onChange={(e) => setBankPayment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] focus:bg-white focus:ring-2 focus:ring-[#007A4D]/20 rounded-xl text-sm text-stone-900 font-semibold outline-hidden transition-all"
              />
              {bankPayment !== '' && (
                <span className="text-[11px] font-bold text-amber-700 block">
                  {formatIndianCurrency(bankPayment)}
                </span>
              )}
            </div>
          </div>

          {/* OB Balance Inputs (Columns F & G) Section */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowObSection(!showObSection)}
              className="inline-flex items-center gap-2 text-xs font-black text-[#007A4D] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-xs"
            >
              <span>{showObSection ? '▲ OB Balance (ஆரம்ப இருப்பு) பகுதியை மறை' : '▼ ஆரம்ப இருப்பு (OB Balance) தொகைகள் உள்ளிட கிளிக் செய்க (வங்கி அளவில் / உறுப்பினர் அளவில்)'}</span>
            </button>

            {showObSection && (
              <div className="mt-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span>ஆரம்ப இருப்பு (Opening Balance / OB) அமைப்புகள்</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                    (சர்வரில் நிரந்தரமாக சேமிக்கப்படும்)
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  முதன்முதலாக பதிவிடும்போது அல்லது துவக்க இருப்பை மாற்ற விரும்புமானால் இங்கு தொகையை உள்ளிடலாம்.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-800">
                      வங்கி அளவில் ஆரம்ப இருப்பு (OB F) - எ.கா: 29626115
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="29626115"
                      value={obF}
                      onChange={(e) => {
                        const val = e.target.value;
                        setObF(val);
                        if (val) localStorage.setItem('kcc_ob_f', val);
                        else localStorage.removeItem('kcc_ob_f');
                        saveObSettingsToServer(val, obG);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:border-[#007A4D] outline-none shadow-xs"
                    />
                    {obF !== '' && (
                      <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                        {formatIndianCurrency(obF)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-800">
                      உறுப்பினர் அளவில் ஆரம்ப இருப்பு (OB G) - எ.கா: 29626450
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="29626450"
                      value={obG}
                      onChange={(e) => {
                        const val = e.target.value;
                        setObG(val);
                        if (val) localStorage.setItem('kcc_ob_g', val);
                        else localStorage.removeItem('kcc_ob_g');
                        saveObSettingsToServer(obF, val);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:border-[#007A4D] outline-none shadow-xs"
                    />
                    {obG !== '' && (
                      <span className="text-[11px] font-bold text-blue-700 block mt-0.5">
                        {formatIndianCurrency(obG)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center justify-between gap-2">
                    <span>
                      <strong>F: வங்கி அளவில் தொகை கணக்கீடு:</strong> OB ({formatIndianCurrency(obF)}) + D: பட்டுவாடா தொகை ({formatIndianCurrency(disbursementAmount)}) - E: வங்கி செலுத்துதல் ({formatIndianCurrency(bankPayment)})
                    </span>
                    <span className="font-black text-[#007A4D] text-xs whitespace-nowrap bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      = {formatIndianCurrency((parseFloat(obF) || 0) + (parseFloat(disbursementAmount) || 0) - (parseFloat(bankPayment) || 0))}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-lg border border-blue-200 text-[11px] text-blue-900 font-semibold flex items-center justify-between gap-2">
                    <span>
                      <strong>G: உறுப்பினர் அளவில் தொகை கணக்கீடு:</strong> OB ({formatIndianCurrency(obG)}) + D: பட்டுவாடா தொகை ({formatIndianCurrency(disbursementAmount)}) - B: உறுப்பினர் செலுத்துதல் ({formatIndianCurrency(memberPayment)})
                    </span>
                    <span className="font-black text-blue-700 text-xs whitespace-nowrap bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                      = {formatIndianCurrency((parseFloat(obG) || 0) + (parseFloat(disbursementAmount) || 0) - (parseFloat(memberPayment) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#007A4D] hover:bg-[#005233] text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? 'சேமிக்கப்படுகிறது...'
                  : 'தரவுத்தளத்தில் சேமி (Save Record)'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* REPORT BOXES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#007A4D]" />
            <h3 className="text-base md:text-lg font-black text-stone-900">
              பகுதி 2: கடைசி இருப்பு & அறிக்கைப் பெட்டிகள் (Latest Row Status Report)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-semibold">
            கடைசி வரியிலுள்ள F, G, H, I, J தொகைகள்
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Column A - கடைசி உள்ளிட்ட தேதி */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-[#007A4D]/40 transition-all space-y-1">
            <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
              கடைசி உள்ளிட்ட தேதி (A)
            </span>
            <div className="text-base font-black text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#007A4D]" />
              <span>{lastRow ? formatDateDDMMYYYY(lastRow.date) : '—'}</span>
            </div>
            <span className="text-[10px] text-stone-400 font-medium block">
              கடைசியாக பதிவான நாள்
            </span>
          </div>

          {/* Card 2: Column F - வங்கி அளவில் தொகை */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs hover:border-emerald-300 transition-all space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              Column F (வங்கி அளவில் தொகை)
            </span>
            <div className="text-base font-black text-emerald-950">
              {formatIndianCurrency(
                lastRow ? lastRow.calculatedColF : (parseFloat(obF) || 0)
              )}
            </div>
            <span className="text-[10px] text-emerald-700/80 font-medium block">
              வங்கி அளவில் தொகை
            </span>
          </div>

          {/* Card 3: Column G - உறுப்பினர் அளவில் தொகை */}
          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200/80 shadow-2xs hover:border-blue-300 transition-all space-y-1">
            <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider block">
              Column G (உறுப்பினர் அளவில் தொகை)
            </span>
            <div className="text-base font-black text-blue-950">
              {formatIndianCurrency(
                lastRow ? lastRow.calculatedColG : (parseFloat(obG) || 0)
              )}
            </div>
            <span className="text-[10px] text-blue-700/80 font-medium block">
              உறுப்பினர் அளவில் தொகை
            </span>
          </div>

          {/* Card 4: Column H - உறுப்பினர் எண்ணிக்கை */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 shadow-2xs hover:border-amber-300 transition-all space-y-1">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">
              Column H (உறுப்பினர் எண்ணிக்கை)
            </span>
            <div className="text-base font-black text-amber-950">
              {(lastRow ? lastRow.calculatedColH : (parseFloat(obH) || 0)).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-amber-700/80 font-medium block">
              உறுப்பினர் எண்ணிக்கை
            </span>
          </div>

          {/* Card 5: Column I - மொத்த பட்டுவாடா தொகை */}
          <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200/80 shadow-2xs hover:border-purple-300 transition-all space-y-1">
            <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider block">
              Column I (மொத்த பட்டுவாடா தொகை)
            </span>
            <div className="text-base font-black text-purple-950">
              {formatIndianCurrency(
                lastRow ? lastRow.calculatedColI : (parseFloat(obI) || 0)
              )}
            </div>
            <span className="text-[10px] text-purple-700/80 font-medium block">
              மொத்த பட்டுவாடா தொகை
            </span>
          </div>

          {/* Card 6: Column J - தொகையின் நிலைமை */}
          <div
            className={`rounded-2xl p-4 text-white shadow-2xs space-y-1 transition-all ${
              lastNetValueJ >= 0 ? 'bg-slate-900' : 'bg-rose-950 border border-rose-800'
            }`}
          >
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider block ${
                lastNetValueJ >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              Column J (தொகையின் நிலைமை)
            </span>
            <div className="text-base font-black text-white">
              {formatIndianCurrency(
                lastRow ? lastRow.calculatedColJ : ((parseFloat(obG) || 0) - (parseFloat(obF) || 0))
              )}
            </div>
            <span
              className={`text-[10px] font-bold block ${
                lastNetValueJ >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {jStatusText}
            </span>
          </div>
        </div>
      </div>

      {/* PDF Download & Date Filter Section between Section 2 & Section 3 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-[#007A4D]" />
            <h3 className="text-base font-black text-stone-900">
              PDF அறிக்கை பதிவிறக்கம் (Download PDF Report)
            </h3>
          </div>
          <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
            தேர்ந்தெடுக்கப்பட்ட பதிவுகள்: {filteredPdfRows.length} / {bankRows.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Month Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#007A4D]" />
              மாதம் தேர்ந்தெடுக்க (Select Month):
            </label>
            <input
              type="month"
              value={pdfFilterMonth}
              onChange={handlePdfMonthChange}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#007A4D]/20 focus:border-[#007A4D] bg-stone-50"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ஆரம்ப தேதி (Start Date):
            </label>
            <input
              type="date"
              value={pdfStartDate}
              onChange={(e) => {
                setPdfStartDate(e.target.value);
                setPdfFilterMonth('');
              }}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#007A4D]/20 focus:border-[#007A4D] bg-stone-50"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              முடிவு தேதி (End Date):
            </label>
            <input
              type="date"
              value={pdfEndDate}
              onChange={(e) => {
                setPdfEndDate(e.target.value);
                setPdfFilterMonth('');
              }}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#007A4D]/20 focus:border-[#007A4D] bg-stone-50"
            />
          </div>

          {/* PDF Download Action Button */}
          <div>
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-[#007A4D] hover:bg-[#00633e] text-white font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PDF பதிவிறக்கம் (Download PDF)</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              வேகமான தெரிவுகள்:
            </span>
            <button
              onClick={setThisMonthPreset}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                pdfFilterMonth === getCurrentMonthStr()
                  ? 'bg-[#007A4D] text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              இந்த மாதம்
            </button>
            <button
              onClick={setLastMonthPreset}
              className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-all cursor-pointer"
            >
              கடந்த மாதம்
            </button>
            <button
              onClick={setAllDataPreset}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                !pdfStartDate && !pdfEndDate
                  ? 'bg-[#007A4D] text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              அனைத்து பதிவுகளும் ({bankRows.length})
            </button>
          </div>

          {(pdfStartDate || pdfEndDate) && (
            <button
              onClick={setAllDataPreset}
              className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer text-xs"
            >
              வடிகட்டியை நீக்கு (Clear Filter)
            </button>
          )}
        </div>
      </div>

      {/* Live Data Table Display */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#007A4D]" />
            <div>
              <h3 className="text-base font-black text-stone-900">
                பகுதி 3: KCC Banksheet தொடர் இருப்பு அட்டவணை (Running Total Table)
              </h3>
              <p className="text-[11px] text-stone-500 font-semibold">
                தேதி வரிசைப்படி தொடர் இருப்பு (Running Total) மற்றும் இறுதி இருப்பு பார்முலாக்களின் அடிப்படையில் கணக்கிடப்பட்டது.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTableSortAscending(!tableSortAscending)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#007A4D]" />
              <span>
                வரிசை: {tableSortAscending ? 'காலவரிசைப்படி (1,2,3...)' : 'புதிய தேதி முதலில் (Descending)'}
              </span>
            </button>
            <span className="text-xs font-black text-[#007A4D] bg-[#EAF4EF] px-3 py-1 rounded-full border border-[#007A4D]/20 whitespace-nowrap">
              மொத்த வரிகள்: {bankRows.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-stone-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#007A4D] mx-auto" />
            <p className="text-sm font-semibold">
              KCC Banksheet பதிவுகள் ஏற்றப்படுகின்றன...
            </p>
          </div>
        ) : bankRows.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <Database className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-600">
              KCC Banksheet-ல் பதிவுகள் ஏதுமில்லை.
            </p>
            <p className="text-xs text-stone-400">
              மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் பதிவை உள்ளிடவும்.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-800 font-black border-b border-stone-200">
                  <th className="p-3 border-r border-stone-200 text-center">வரிசை</th>
                  <th className="p-3 border-r border-stone-200">
                    A: தேதி
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right">
                    B: உறுப்பினர் செலுத்தல் (₹)
                  </th>
                  <th className="p-3 border-r border-stone-200 text-center">
                    C: எண்ணிக்கை
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right">
                    D: பட்டுவாடா (₹)
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right">
                    E: வங்கி செலுத்தல் (₹)
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right bg-emerald-50 text-emerald-950">
                    <div>F: வங்கி அளவில் இருப்பு (₹)</div>
                    <div className="text-[10px] text-emerald-700 font-normal mt-0.5">[முந்தைய F + D - E]</div>
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right bg-blue-50 text-blue-950">
                    <div>G: உறுப்பினர் அளவில் இருப்பு (₹)</div>
                    <div className="text-[10px] text-blue-700 font-normal mt-0.5">[முந்தைய G + D - B]</div>
                  </th>
                  <th className="p-3 border-r border-stone-200 text-center bg-amber-50 text-amber-950">
                    <div>H: மொத்த எண்ணிக்கை</div>
                    <div className="text-[10px] text-amber-700 font-normal mt-0.5">[தொடர் H + C]</div>
                  </th>
                  <th className="p-3 border-r border-stone-200 text-right bg-purple-50 text-purple-950">
                    <div>I: மொத்த பட்டுவாடா (₹)</div>
                    <div className="text-[10px] text-purple-700 font-normal mt-0.5">[தொடர் I + D]</div>
                  </th>
                  <th className="p-3 border-r border-stone-200 bg-slate-100 text-slate-900 text-right">
                    <div>J: தொகையின் நிலைமை (₹)</div>
                    <div className="text-[10px] text-slate-600 font-normal mt-0.5">[G - F]</div>
                  </th>
                  <th className="p-3 text-center bg-stone-200 text-stone-900 font-black">
                    செயல் (Action)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800">
                {displayedBankRows.map((row) => {
                  const isLatest = lastRow && row.id ? row.id === lastRow.id : row.originalIdx === processedBankRows.length - 1;
                  const rowNumber = row.rowIndex || (row.originalIdx !== undefined ? row.originalIdx + 1 : 1);
                  return (
                    <tr
                      key={row.id || `row-${row.originalIdx}`}
                      className={`hover:bg-stone-50 transition-colors ${
                        isLatest ? 'bg-emerald-50/40 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 border-r border-stone-200 text-stone-500 font-mono text-[11px]">
                        #{rowNumber}
                      </td>
                      <td className="p-3 border-r border-stone-200 font-bold text-stone-900 whitespace-nowrap">
                        {formatDateDDMMYYYY(row.date)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono">
                        {formatIndianCurrency(row.memberPayment)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-center font-mono">
                        {row.disbursementMemberCount}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono">
                        {formatIndianCurrency(row.disbursementAmount)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono">
                        {formatIndianCurrency(row.bankPayment)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono bg-emerald-50/30 font-bold text-emerald-900">
                        {formatIndianCurrency(row.calculatedColF)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono bg-blue-50/30 font-bold text-blue-900">
                        {formatIndianCurrency(row.calculatedColG)}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-center font-mono bg-amber-50/30 font-bold text-amber-900">
                        {row.calculatedColH?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 border-r border-stone-200 text-right font-mono bg-purple-50/30 font-bold text-purple-900">
                        {formatIndianCurrency(row.calculatedColI)}
                      </td>
                      <td className={`p-3 border-r border-stone-200 text-right font-mono font-bold ${
                        row.calculatedColJ >= 0 ? 'bg-slate-50 text-slate-900' : 'bg-rose-50 text-rose-900'
                      }`}>
                        <div>{formatIndianCurrency(row.calculatedColJ)}</div>
                        <div className={`text-[10px] font-bold mt-0.5 ${
                          row.calculatedColJ >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {row.calculatedColJ >= 0 ? 'வங்கியில் அதிகம் இருக்கிறது' : 'வங்கியில் செலுத்த வேண்டும்'}
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title="திருத்து"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>திருத்து</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRow(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title="நீக்கு"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>நீக்கு</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL POPUP */}
      {editingRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 text-[#007A4D]">
                <Pencil className="w-5 h-5" />
                <h3 className="text-lg font-black text-stone-900">
                  KCC வங்கிப் பதிவைத் திருத்துதல் (Edit Row)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  தேதி (Column A)
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    உறுப்பினர் செலுத்துதல் (B)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editMemberPayment}
                    onChange={(e) => setEditMemberPayment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] rounded-xl text-sm font-semibold"
                  />
                  {editMemberPayment !== '' && (
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      {formatIndianCurrency(editMemberPayment)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    உறுப்பினர் எண்ணிக்கை (C)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editMemberCount}
                    onChange={(e) => setEditMemberCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] rounded-xl text-sm font-semibold"
                  />
                  {editMemberCount !== '' && !isNaN(Number(editMemberCount)) && (
                    <span className="text-[11px] font-bold text-blue-700 block">
                      {Number(editMemberCount).toLocaleString('en-IN')} நபர்கள்
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    பட்டுவாடா தொகை (D)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editDisbursementAmount}
                    onChange={(e) => setEditDisbursementAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] rounded-xl text-sm font-semibold"
                  />
                  {editDisbursementAmount !== '' && (
                    <span className="text-[11px] font-bold text-purple-700 block">
                      {formatIndianCurrency(editDisbursementAmount)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    வங்கி செலுத்தல் (E)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editBankPayment}
                    onChange={(e) => setEditBankPayment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-[#007A4D] rounded-xl text-sm font-semibold"
                  />
                  {editBankPayment !== '' && (
                    <span className="text-[11px] font-bold text-amber-700 block">
                      {formatIndianCurrency(editBankPayment)}
                    </span>
                  )}
                </div>
              </div>

              {/* Advanced / F to J Column Edits */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="text-xs font-black text-stone-800 block border-b border-stone-200 pb-1">
                  இருப்பு தொகைகள் (Columns F - J)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">
                      F: வங்கி அளவில் தொகை
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editColF}
                      onChange={(e) => setEditColF(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">
                      G: உறுப்பினர் அளவில் தொகை
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editColG}
                      onChange={(e) => setEditColG(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">
                      H: உறுப்பினர் எண்ணிக்கை
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={editColH}
                      onChange={(e) => setEditColH(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">
                      I: மொத்த பட்டுவாடா தொகை
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editColI}
                      onChange={(e) => setEditColI(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-600">
                    J: தொகையின் நிலைமை
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editColJ}
                    onChange={(e) => setEditColJ(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs"
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-[#007A4D] hover:bg-[#005233] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>சேமி (Update)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL POPUP */}
      {deletingRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  நீக்குவதை உறுதிப்படுத்துக
                </h3>
                <p className="text-xs text-stone-500 font-semibold">
                  Confirm Deletion
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              தேதி <strong className="text-stone-900">{formatDateDDMMYYYY(deletingRow.date)}</strong> கொண்ட
              KCC வங்கிக் கணக்கு பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs"
              >
                ரத்து செய்
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>நீக்கு (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Section for User in Tamil */}
      <div className="bg-stone-900 text-stone-200 rounded-2xl p-5 md:p-6 space-y-3">
        <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <span>வழிகாட்டுதல் மற்றும் விபரங்கள் (Guide & Details)</span>
        </h4>
        <div className="text-xs md:text-sm leading-relaxed space-y-2 text-stone-300">
          <p>
            1. <strong>தரவு சேமிப்பு:</strong> இந்த ஆப் பக்கத்தில் உள்ளிடப்படும் தகவல்கள்
            பாதுகாப்பாக ஃபயர் பேஸ் (Firebase Cloud Database) மற்றும் தரவுத்தளத்தில் சேமிக்கப்படுகின்றன.
          </p>
          <p>
            2. <strong>Columns A to E உள்ளீடு:</strong> படிவத்தில்
            தேதி (A), உறுப்பினர் செலுத்தல் (B), உறுப்பினர் எண்ணிக்கை (C),
            பட்டுவாடா தொகை (D), வங்கி செலுத்தல் (E) ஆகியவை உள்ளிடப்படும்.
          </p>
          <p>
            3. <strong>Columns F to J கணக்கீடு:</strong> உள்ளிடப்பட்ட தகவல்களின் அடிப்படையில் F, G, H, I, J பத்திகள் தானாகக் கணக்கிடப்பட்டு மேலே உள்ள அறிக்கைப் பெட்டிகளிலும் அட்டவணையிலும் காண்பிக்கப்படும்.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KCCBankAccountScreen;

