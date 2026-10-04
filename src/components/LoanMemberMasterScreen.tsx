import React, { useState, useMemo, useRef } from 'react';
import { LoanMember } from '../types';
import { formatMobile, formatRationCard, formatMDCC, formatAadhar, formatIndianCurrency, formatIndianInputNumber, extractSpreadsheetId } from '../utils/formatters';
import { 
  Users, 
  Search, 
  UserPlus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  CreditCard,
  RefreshCw,
  ExternalLink,
  Link,
  AlertCircle,
  Loader2,
  LayoutGrid,
  Table,
  Eye,
  Edit,
  X,
  User,
  Building,
  ShieldCheck,
  FileText,
  Fingerprint,
  Filter,
  RotateCcw,
  Sparkles,
  Printer,
  Copy,
  Check,
  IdCard,
  ChevronRight,
  Hash,
  Trash2
} from 'lucide-react';
import { MemberDossierView } from './MemberDossierView';
import { fetchMembersFromGoogleSheet, DEFAULT_SPREADSHEET_ID } from '../utils/googleSheetClient';
import { deleteMemberFromFirestore, saveMemberToFirestore } from '../services/memberFirestoreService';

interface LoanMemberMasterScreenProps {
  members: LoanMember[];
  onAddMember: (member: LoanMember) => void;
  onSetMembers: (members: LoanMember[]) => void;
  onDeleteMember?: (memberNo: string) => void;
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
}

export const LoanMemberMasterScreen: React.FC<LoanMemberMasterScreenProps> = ({
  members,
  onAddMember,
  onSetMembers,
  onDeleteMember,
  spreadsheetId,
  onSetSpreadsheetId
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'name' | 'memberNo' | 'aadhar'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<LoanMember | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'dossier'>('table');
  const [selectedDossierMember, setSelectedDossierMember] = useState<LoanMember | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<LoanMember | null>(null);
  const [editingMember, setEditingMember] = useState<LoanMember | null>(null);
  
  // Sheet sync states
  const [sheetInput, setSheetInput] = useState<string>(spreadsheetId || '1YJlGj7g2yH9kN_2-JVEuuHrIQhJ_ZGvHgGPh_Xg13pI');
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [isSubmittingToSheet, setIsSubmittingToSheet] = useState<boolean>(false);
  const [sheetStatusMsg, setSheetStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([
    'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
    'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
  ]);

  // Form states for exact 18 fields
  const [aClassVal, setAClassVal] = useState<string>(String(1001 + members.length));
  const [sbVal, setSbVal] = useState<string>('');
  const [erpVal, setErpVal] = useState<string>('');
  const [insVal, setInsVal] = useState<string>('');
  const [nameVal, setNameVal] = useState<string>('');
  const [careOfVal, setCareOfVal] = useState<string>('');
  const [doorVal, setDoorVal] = useState<string>('');
  const [streetVal, setStreetVal] = useState<string>('');
  const [villageVal, setVillageVal] = useState<string>('');
  const [adharVal, setAdharVal] = useState<string>('');
  const [mobileVal, setMobileVal] = useState<string>('');
  const [rationCardVal, setRationCardVal] = useState<string>('');
  const [naminiVal, setNaminiVal] = useState<string>('');
  const [relationVal, setRelationVal] = useState<string>('');
  const [mdccVal, setMdccVal] = useState<string>('');
  const [casteVal, setCasteVal] = useState<string>('');
  const [genderVal, setGenderVal] = useState<string>('ஆண் (Male)');
  const [totalShareVal, setTotalShareVal] = useState<string | number>(100);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Enhanced search filtering logic for name, member number (A Class), or Aadhar number
  const filteredMembers = useMemo(() => {
    const rawTerm = searchTerm.trim();
    if (!rawTerm) return members;

    const term = rawTerm.toLowerCase();
    const digitsOnlyTerm = rawTerm.replace(/[^0-9]/g, '');

    return members.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const careOf = (m.careOf || m.fatherOrHusbandName || '').toLowerCase();
      const aClass = (m.aClass || m.memberNo || '').toLowerCase();
      const rawAadhar = (m.aadharNo || m.adhar || '').replace(/[^0-9]/g, '');
      const formattedAadhar = formatAadhar(m.aadharNo || m.adhar || '').toLowerCase();
      const mobile = (m.mobile || '').replace(/[^0-9]/g, '');
      const village = (m.village || '').toLowerCase();
      const sb = (m.sb || '').toLowerCase();
      const erp = (m.erp || '').toLowerCase();
      const rationCard = (m.rationCard || '').toLowerCase();
      const mdcc = (m.mdcc || '').toLowerCase();

      if (searchCategory === 'name') {
        return name.includes(term) || careOf.includes(term);
      }

      if (searchCategory === 'memberNo') {
        return aClass.includes(term) || sb.includes(term) || erp.includes(term);
      }

      if (searchCategory === 'aadhar') {
        return (digitsOnlyTerm.length > 0 && rawAadhar.includes(digitsOnlyTerm)) || 
               formattedAadhar.includes(term);
      }

      // Default 'all': searches Name, Member No (A Class), Aadhar, Mobile, Village, SB, ERP
      return (
        name.includes(term) ||
        careOf.includes(term) ||
        aClass.includes(term) ||
        (digitsOnlyTerm.length > 0 && rawAadhar.includes(digitsOnlyTerm)) ||
        formattedAadhar.includes(term) ||
        (digitsOnlyTerm.length > 0 && mobile.includes(digitsOnlyTerm)) ||
        village.includes(term) ||
        sb.includes(term) ||
        erp.includes(term) ||
        rationCard.includes(term) ||
        mdcc.includes(term)
      );
    });
  }, [members, searchTerm, searchCategory]);

  // Active member for Dossier inspector view
  const activeDossierMember = selectedDossierMember || filteredMembers[0] || null;

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;
    const headers = [
      'வரிசை எண்', 'A Class', 'SB எண்', 'ERP எண்', 'Ins', 'உறுப்பினர் பெயர்', 'தந்தை/கணவர் (C/o)', 
      'கதவு எண்', 'தெரு', 'கிராமம்', 'ஆதார் எண்', 'கைபேசி எண்', 'குடும்ப அட்டை எண்', 
      'வாரிசுதாரர்', 'உறவுமுறை', 'MDCC எண்', 'பிரிவு', 'பாலினம்', 'பங்கு தொகை'
    ];
    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      m.aClass || m.memberNo,
      m.sb || '',
      m.erp || '',
      m.ins || '',
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.careOf || m.fatherOrHusbandName || '').replace(/"/g, '""')}"`,
      `"${(m.door || '').replace(/"/g, '""')}"`,
      `"${(m.street || '').replace(/"/g, '""')}"`,
      `"${(m.village || '').replace(/"/g, '""')}"`,
      `'${m.aadharNo || m.adhar || ''}`,
      `'${m.mobile || ''}`,
      `"${(m.rationCard || '').replace(/"/g, '""')}"`,
      `"${(m.namini || '').replace(/"/g, '""')}"`,
      `"${(m.relation || '').replace(/"/g, '""')}"`,
      `'${m.mdcc || ''}`,
      `"${(m.caste || '').replace(/"/g, '""')}"`,
      `"${(m.gender || '').replace(/"/g, '""')}"`,
      m.totalShare ?? m.landAcres ?? 0
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TU3_உறுப்பினர்_பட்டியல்_18பத்திகள்_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    if (members.length === 0) return;
    const blob = new Blob([JSON.stringify(members, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TU3_உறுப்பினர்கள்_${members.length}_பேர்_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onSetMembers(parsed);
          setSheetStatusMsg({
            type: 'success',
            text: `வெற்றிகரமாக ${parsed.length} உறுப்பினர்களின் விபரங்கள் JSON கோப்பிலிருந்து ஏற்றப்பட்டன!`
          });
        } else {
          setSheetStatusMsg({
            type: 'error',
            text: 'கோப்பில் செல்லுபடியாகும் உறுப்பினர்களின் விபரங்கள் கிடைக்கவில்லை.'
          });
        }
      } catch (err) {
        setSheetStatusMsg({
          type: 'error',
          text: 'JSON கோப்பை வாசிப்பதில் பிழை ஏற்பட்டது.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteMemberConfirm = (m: LoanMember) => {
    setMemberToDelete(m);
  };

  const handleExecuteDelete = async () => {
    if (!memberToDelete) return;
    const targetNo = memberToDelete.memberNo || memberToDelete.aClass;
    setIsDeleting(true);

    try {
      // 1. Delete from Firebase Firestore Cloud DB
      await deleteMemberFromFirestore(targetNo);

      // 2. Also call backend delete endpoint
      fetch(`/api/sheets/members/${encodeURIComponent(targetNo)}`, { method: 'DELETE' }).catch(() => {});

      // 3. Update React state
      if (onDeleteMember) {
        onDeleteMember(targetNo);
      } else {
        onSetMembers(members.filter((m) => (m.memberNo || m.aClass) !== targetNo));
      }

      setSheetStatusMsg({
        type: 'success',
        text: `உறுப்பினர் [A-${memberToDelete.aClass || memberToDelete.memberNo}] ${memberToDelete.name} வெற்றிகரமாக நீக்கப்பட்டார்!`
      });

      if (selectedDossierMember && (selectedDossierMember.memberNo || selectedDossierMember.aClass) === targetNo) {
        setSelectedDossierMember(null);
      }
      if (selectedMemberDetail && (selectedMemberDetail.memberNo || selectedMemberDetail.aClass) === targetNo) {
        setSelectedMemberDetail(null);
      }
    } catch (err: any) {
      console.error(err);
      setSheetStatusMsg({
        type: 'error',
        text: 'உறுப்பினரை நீக்குவதில் பிழை: ' + (err.message || String(err))
      });
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  };

  const handlePrintDossier = (m: LoanMember) => {
    let printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <title>உறுப்பினர் சுயவிவர ஏடு - ${m.name} (A-${m.aClass || m.memberNo})</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; margin: 0; padding: 15px; }
    .header { text-align: center; border-bottom: 2.5px solid #007A4D; padding-bottom: 12px; margin-bottom: 16px; }
    .header h2 { margin: 0; color: #007A4D; font-size: 19px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #444; }
    .title-box { background: #eaf4ef; padding: 6px 14px; display: inline-block; border-radius: 6px; font-weight: 800; font-size: 14px; margin-top: 8px; color: #007A4D; border: 1px solid #c2e2d3; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
    th, td { border: 1px solid #444; padding: 6px 10px; }
    th { background: #f8fafc; text-align: left; width: 35%; font-weight: bold; }
    .section-title { font-weight: 800; font-size: 13.5px; color: #007A4D; margin: 14px 0 6px 0; border-bottom: 1.5px solid #007A4D; padding-bottom: 3px; }
    .sig-area { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>TU3 தேவாரம் தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம்</h2>
    <p>தேவாரம், உத்தமபாளையம் வட்டம், தேனி மாவட்டம்</p>
    <div class="title-box">உறுப்பினர் சுயவிவர ஏடு - A Class: ${m.aClass || m.memberNo} | பெயர்: ${m.name} ${m.ins ? `(${m.ins})` : ''}</div>
  </div>

  <div class="section-title">1. வங்கி &amp; கணக்கு அடையாள விபரங்கள்</div>
  <table>
    <tr><th>A Class (உறுப்பினர் எண்)</th><td><strong>${m.aClass || m.memberNo}</strong></td></tr>
    <tr><th>SB (வங்கி கணக்கு எண்)</th><td>${m.sb || '-'}</td></tr>
    <tr><th>ERP எண்</th><td>${m.erp || '-'}</td></tr>
    <tr><th>MDCC எண்</th><td>${m.mdcc || '-'}</td></tr>
  </table>

  <div class="section-title">2. தனிநபர் &amp; முழு முகவரி விபரங்கள்</div>
  <table>
    <tr><th>உறுப்பினர் பெயர் (Name)</th><td><strong>${m.name}</strong></td></tr>
    <tr><th>தலைப்பெழுத்து (Ins)</th><td>${m.ins || '-'}</td></tr>
    <tr><th>தந்தை / கணவர் பெயர் (C/o)</th><td>${m.careOf || m.fatherOrHusbandName || '-'}</td></tr>
    <tr><th>கதவு எண் (Door)</th><td>${m.door || '-'}</td></tr>
    <tr><th>தெரு (Street)</th><td>${m.street || '-'}</td></tr>
    <tr><th>கிராமம் (Village)</th><td>${m.village || '-'}</td></tr>
    <tr><th>பாலினம் (Gender)</th><td>${m.gender || '-'}</td></tr>
    <tr><th>பிரிவு (Caste)</th><td>${m.caste || '-'}</td></tr>
  </table>

  <div class="section-title">3. அடையாள ஆவணங்கள் &amp; தொடர்பு</div>
  <table>
    <tr><th>ஆதார் எண் (Aadhar)</th><td><strong>${formatAadhar(m.aadharNo || m.adhar)}</strong></td></tr>
    <tr><th>கைபேசி எண் (Mobile)</th><td><strong>${formatMobile(m.mobile)}</strong></td></tr>
    <tr><th>குடும்ப அட்டை எண் (Ration Card)</th><td>${formatRationCard(m.rationCard)}</td></tr>
  </table>

  <div class="section-title">4. வாரிசுதாரர் &amp; பங்கு மூலதன விபரங்கள்</div>
  <table>
    <tr><th>வாரிசுதாரர் பெயர் (Namini)</th><td>${m.namini || '-'}</td></tr>
    <tr><th>உறவுமுறை (Relation)</th><td>${m.relation || '-'}</td></tr>
    <tr><th>பங்கு தொகை (Total Share)</th><td><strong>₹ ${m.totalShare ?? m.landAcres ?? 0}</strong></td></tr>
  </table>

  <div class="sig-area">
    <div>உறுப்பினர் கையொப்பம்</div>
    <div>செயலாளர் கையொப்பம்</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setAClassVal(String(1001 + members.length));
    setSbVal('');
    setErpVal('');
    setInsVal('');
    setNameVal('');
    setCareOfVal('');
    setDoorVal('');
    setStreetVal('');
    setVillageVal('');
    setAdharVal('');
    setMobileVal('');
    setRationCardVal('');
    setNaminiVal('');
    setRelationVal('');
    setMdccVal('');
    setCasteVal('');
    setGenderVal('ஆண் (Male)');
    setTotalShareVal('100');
    setCustomFieldValues({});
    setShowAddModal(true);
  };

  const handleOpenEditModal = (member: LoanMember) => {
    setEditingMember(member);
    setAClassVal(member.aClass || member.memberNo || '');
    setSbVal(member.sb || '');
    setErpVal(member.erp || '');
    setInsVal(member.ins || '');
    setNameVal(member.name || '');
    setCareOfVal(member.careOf || member.fatherOrHusbandName || '');
    setDoorVal(member.door || '');
    setStreetVal(member.street || '');
    setVillageVal(member.village || '');
    setAdharVal(formatAadhar(member.aadharNo || member.adhar || ''));
    setMobileVal(formatMobile(member.mobile));
    setRationCardVal(formatRationCard(member.rationCard));
    setNaminiVal(member.namini || '');
    setRelationVal(member.relation || '');
    setMdccVal(formatMDCC(member.mdcc));
    setCasteVal(member.caste || '');
    setGenderVal(member.gender || 'ஆண் (Male)');
    const rawShare = member.totalShare ?? member.landAcres ?? 100;
    setTotalShareVal(formatIndianInputNumber(String(rawShare)));
    setCustomFieldValues({});
    setSelectedMemberDetail(null);
    setShowAddModal(true);
  };

  // Fetch members from Google Sheet via Server API
  const handleFetchFromGoogleSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = extractSpreadsheetId(sheetInput);

    if (!cleanId) {
      setSheetStatusMsg({
        type: 'error',
        text: 'தயவுசெய்து செல்லுபடியாகும் Google Sheet ID அல்லது URL உள்ளிடவும்.'
      });
      return;
    }

    onSetSpreadsheetId(cleanId);
    setIsFetchingSheet(true);
    setSheetStatusMsg({ type: 'info', text: 'கூகுள் சீட் Loanmember தரவுகள் பெறப்படுகின்றன...' });

    try {
      const result = await fetchMembersFromGoogleSheet(cleanId);

      if (result.success && result.members && result.members.length > 0) {
        onSetMembers(result.members);
        setSheetStatusMsg({
          type: 'success',
          text: `வெற்றியுடன் ${result.members.length} உறுப்பினர்களின் தகவல்கள் கூகுள் சீட்டிலிருந்து புதுப்பிக்கப்பட்டன!`
        });
      } else {
        throw new Error(result.error || 'கூகுள் சீட்டில் தரவுகள் கிடைக்கவில்லை அல்லது அனுமதி இல்லை.');
      }
    } catch (err: any) {
      console.error(err);
      setSheetStatusMsg({
        type: 'error',
        text: err.message || 'கூகுள் சீட் தகவலை பெறும்போது பிழை ஏற்பட்டது.'
      });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericTotalShare = Number(String(totalShareVal).replace(/[^0-9]/g, '')) || 0;
    const memberObj: LoanMember = {
      memberNo: editingMember ? editingMember.memberNo : (aClassVal || String(1001 + Math.floor(Math.random() * 8999))),
      name: nameVal,
      fatherOrHusbandName: careOfVal,
      village: villageVal,
      mobile: formatMobile(mobileVal),
      aadharNo: formatAadhar(adharVal),
      adhar: formatAadhar(adharVal),
      landAcres: numericTotalShare,
      aClass: aClassVal,
      sb: sbVal,
      erp: erpVal,
      ins: insVal,
      careOf: careOfVal,
      door: doorVal,
      street: streetVal,
      rationCard: formatRationCard(rationCardVal),
      namini: naminiVal,
      relation: relationVal,
      mdcc: formatMDCC(mdccVal),
      caste: casteVal,
      gender: genderVal,
      totalShare: numericTotalShare,
      kccAccountNo: editingMember?.kccAccountNo || `KCC-${Math.floor(330000 + Math.random() * 90000)}`,
      bankBranch: editingMember?.bankBranch || 'TU3 PACCS தலைமை கிளை'
    };

    // 1. Save permanently to Firebase Firestore
    try {
      await saveMemberToFirestore(memberObj);
    } catch (e) {
      console.warn('Firestore save notice:', e);
    }

    if (editingMember) {
      // Update existing member in state and local storage
      const updatedMembers = members.map((m) =>
        (m.memberNo === editingMember.memberNo || (m.aClass && m.aClass === editingMember.aClass))
          ? memberObj
          : m
      );
      onSetMembers(updatedMembers);
      try {
        localStorage.setItem('kcc_paccs_members', JSON.stringify(updatedMembers));
      } catch (err) {
        console.error(err);
      }
      setSheetStatusMsg({
        type: 'success',
        text: `உறுப்பினர் ${memberObj.name} (A Class: ${memberObj.aClass}) விவரங்கள் வெற்றியுடன் புதுப்பிக்கப்பட்டன!`
      });
    } else {
      // Add new member
      onAddMember(memberObj);

      const standard18Headers = [
        'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
        'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
      ];

      const targetHeaders = sheetHeaders.length > 0 ? sheetHeaders : standard18Headers;

      // Construct array of values matching the Google Sheet column headers
      const rowValues = targetHeaders.map((header) => {
        const h = header.toLowerCase().trim();
        if (h === 'a class' || h === 'aclass' || h.includes('memberno')) return memberObj.aClass || memberObj.memberNo;
        if (h === 'sb') return memberObj.sb || '';
        if (h === 'erp') return memberObj.erp || '';
        if (h === 'ins') return memberObj.ins || '';
        if (h === 'name' || h === 'பெயர்') return memberObj.name;
        if (h === 'c/o' || h === 'care of' || h.includes('father')) return memberObj.careOf || memberObj.fatherOrHusbandName;
        if (h === 'door') return memberObj.door || '';
        if (h === 'street') return memberObj.street || '';
        if (h === 'village' || h === 'கிராமம்') return memberObj.village;
        if (h === 'adhar' || h === 'aadhar' || h.includes('ஆதார்')) return memberObj.aadharNo;
        if (h === 'mobile' || h.includes('அலைபேசி')) return memberObj.mobile;
        if (h === 'ration card' || h === 'rationcard') return memberObj.rationCard || '';
        if (h === 'namini' || h === 'nominee') return memberObj.namini || '';
        if (h === 'relation') return memberObj.relation || '';
        if (h === 'mdcc') return memberObj.mdcc || '';
        if (h === 'caste') return memberObj.caste || '';
        if (h === 'gender') return memberObj.gender || '';
        if (h === 'total share' || h === 'totalshare') return String(memberObj.totalShare ?? '');
        return customFieldValues[header] || '';
      });

      // If Google Sheet ID is provided, append row directly to Google Sheet!
      const cleanId = extractSpreadsheetId(sheetInput || spreadsheetId);
      if (cleanId) {
        setIsSubmittingToSheet(true);
        try {
          const res = await fetch('/api/sheets/add-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              spreadsheetId: cleanId,
              member: memberObj,
              rowValues: rowValues
            })
          });

          const resData = await res.json();
          if (res.ok) {
            setSheetStatusMsg({
              type: 'success',
              text: `உறுப்பினர் ${memberObj.name} கூகுள் சீட் Masterdata -> Loanmember சீட்டில் வெற்றியுடன் பதிவானார்!`
            });
          } else {
            setSheetStatusMsg({
              type: 'error',
              text: `உள்ளூர் பயன்பாட்டில் சேர்க்கப்பட்டது. கூகுள் சீட் பிழை: ${resData.error || ''}`
            });
          }
        } catch (err: any) {
          setSheetStatusMsg({
            type: 'error',
            text: 'கூகுள் சீட் பதிவில் பிழை. உள்ளூர் பயன்பாட்டில் சேமிக்கப்பட்டது.'
          });
        } finally {
          setIsSubmittingToSheet(false);
        }
      }
    }

    setShowAddModal(false);
    setEditingMember(null);
    // Reset form
    setNameVal('');
    setCareOfVal('');
    setDoorVal('');
    setStreetVal('');
    setVillageVal('');
    setAdharVal('');
    setMobileVal('');
    setSbVal('');
    setErpVal('');
    setInsVal('');
    setRationCardVal('');
    setNaminiVal('');
    setRelationVal('');
    setMdccVal('');
    setCasteVal('');
    setCustomFieldValues({});
    setAClassVal(String(1001 + members.length + 1));
  };

  // CSV Export for Google Sheets compatibility
  const exportToCSV = () => {
    const headers = [
      'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
      'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
    ];
    const rows = members.map(m => [
      `"${m.aClass || m.memberNo}"`,
      `"${m.sb || ''}"`,
      `"${m.erp || ''}"`,
      `"${m.ins || ''}"`,
      `"${m.name}"`,
      `"${m.careOf || m.fatherOrHusbandName}"`,
      `"${m.door || ''}"`,
      `"${m.street || ''}"`,
      `"${m.village}"`,
      `"${m.aadharNo || m.adhar || ''}"`,
      `"${m.mobile}"`,
      `"${m.rationCard || ''}"`,
      `"${m.namini || ''}"`,
      `"${m.relation || ''}"`,
      `"${m.mdcc || ''}"`,
      `"${m.caste || ''}"`,
      `"${m.gender || ''}"`,
      `"${m.totalShare ?? m.landAcres ?? ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TU3_PACCS_Loanmember_Masterdata.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#005c3a] via-[#007A4D] to-[#004d30] text-white rounded-2xl p-5 md:p-6 border border-[#007A4D]/20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#D1EAE0] text-[#007A4D] font-extrabold text-xs px-2.5 py-0.5 rounded border border-[#007A4D]/20">
                Masterdata &gt; Loanmember
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              உறுப்பினர்களின் அடிப்படை தகவல்கள் (Loanmembers)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#007A4D] hover:bg-[#FAF9F5] text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#007A4D]" />
              <span>புதிய உறுப்பினர் சேர்</span>
            </button>
          </div>
        </div>

        {/* Total stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20 text-xs">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/20">
            <span className="text-white/80 block text-[11px]">மொத்த உறுப்பினர்கள்:</span>
            <span className="text-xl font-black text-white">{members.length}</span>
          </div>
        </div>
      </div>

      {/* Filter, Search, and View Mode Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E2DC] shadow-xs space-y-4">
        {/* Top row: Search Bar Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E2DC] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D1EAE0] flex items-center justify-center text-[#007A4D]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                உறுப்பினர் தேடல் (Member Search)
              </h3>
              <p className="text-[11px] text-stone-500">
                பெயர், உறுப்பினர் எண் (A Class), அல்லது ஆதார் எண் கொண்டு தேடவும்
              </p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <span className="text-xs text-stone-500 font-bold hidden md:inline">பார்வை முறை:</span>
            <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#E2E2DC] shadow-2xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#007A4D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="கூகுள் சீட்டின் 18 பத்திகள் அட்டவணை பார்வை"
              >
                <Table className="w-3.5 h-3.5" />
                <span>18 பத்திகள் அட்டவணை</span>
              </button>
              <button
                onClick={() => setViewMode('dossier')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'dossier'
                    ? 'bg-[#007A4D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="நவீன ஊடாடும் உறுப்பினர் சுயவிவரப் பலகை"
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>உறுப்பினர் விபர பலகை (Dossier)</span>
              </button>
            </div>

            {/* Quick Export & Print Action Buttons */}
            <input 
              type="file" 
              ref={jsonFileInputRef} 
              accept=".json" 
              onChange={handleImportJSON} 
              className="hidden" 
            />

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="18 பத்திகள் கொண்ட முழு பட்டியலை CSV கோப்பாக பதிவிறக்குக"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV பதிவிறக்கம்</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="அனைத்து உறுப்பினர்களின் முழு காப்புப் பிரதியை (JSON Backup) பதிவிறக்க"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">காப்புப் பிரதி (Backup)</span>
            </button>

            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="வேறு கணினியிலிருந்து பெறப்பட்ட JSON காப்புப் பிரதியை பதிவேற்ற (Restore)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">மீட்டெடு (Restore)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="அட்டவணையை அச்சிடுக"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">அச்சிடு</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#007A4D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchCategory === 'name'
                ? 'உறுப்பினர் பெயர் அல்லது தந்தை / கணவர் பெயர் உள்ளிடவும்...'
                : searchCategory === 'memberNo'
                ? 'உறுப்பினர் எண் / A Class (எ.கா: 1001, 1002)...'
                : searchCategory === 'aadhar'
                ? '12 இலக்க ஆதார் எண் உள்ளிடவும் (எ.கா: 8945 2311 9087)...'
                : 'உறுப்பினர் பெயர், எண் (A Class), ஆதார் எண் அல்லது கிராமம் மூலம் தேடுக...'
            }
            className="w-full pl-10 pr-10 py-3 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-[#D5D5CD] focus:border-[#007A4D] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#007A4D]/20 outline-none text-stone-900 transition-all placeholder:text-stone-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
              title="தேடலை அழிக்கவும் (Clear Search)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Category Pills & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-stone-400" />
              தேடல் பிரிவு:
            </span>

            <button
              onClick={() => setSearchCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchCategory === 'all'
                  ? 'bg-[#007A4D] text-white shadow-2xs'
                  : 'bg-[#F7F6F2] text-stone-700 hover:bg-stone-200 border border-[#E2E2DC]'
              }`}
            >
              அனைத்தும் (All)
            </button>

            <button
              onClick={() => setSearchCategory('name')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchCategory === 'name'
                  ? 'bg-[#007A4D] text-white shadow-2xs'
                  : 'bg-[#F7F6F2] text-stone-700 hover:bg-stone-200 border border-[#E2E2DC]'
              }`}
            >
              <User className="w-3 h-3" />
              <span>பெயர் (Name)</span>
            </button>

            <button
              onClick={() => setSearchCategory('memberNo')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchCategory === 'memberNo'
                  ? 'bg-[#007A4D] text-white shadow-2xs'
                  : 'bg-[#F7F6F2] text-stone-700 hover:bg-stone-200 border border-[#E2E2DC]'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>உறுப்பினர் எண் (A Class)</span>
            </button>

            <button
              onClick={() => setSearchCategory('aadhar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchCategory === 'aadhar'
                  ? 'bg-[#007A4D] text-white shadow-2xs'
                  : 'bg-[#F7F6F2] text-stone-700 hover:bg-stone-200 border border-[#E2E2DC]'
              }`}
            >
              <Fingerprint className="w-3 h-3" />
              <span>ஆதார் எண் (Aadhaar)</span>
            </button>
          </div>

          {/* Result Count and Clear Button */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-semibold bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#E2E2DC]">
              காட்டும் உறுப்பினர்கள்: <strong className="text-[#007A4D] font-black">{filteredMembers.length}</strong> / {members.length}
            </span>

            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchCategory('all');
                }}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="தேடலை மீட்டமை"
              >
                <RotateCcw className="w-3 h-3" />
                <span>மீட்டமை</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Search Banner when user typed query */}
        {searchTerm.trim() && (
          <div className="bg-[#EAF4EF] border border-[#007A4D]/20 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#007A4D] font-medium flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-[#007A4D] shrink-0" />
              <span>
                <strong>&quot;{searchTerm}&quot;</strong> க்கான தேடல் முடிவுகள் ({searchCategory === 'all' ? 'அனைத்து விவரங்களிலும்' : searchCategory === 'name' ? 'பெயரில்' : searchCategory === 'memberNo' ? 'உறுப்பினர் எண்ணில்' : 'ஆதார் எண்ணில்'}): <strong>{filteredMembers.length}</strong> உறுப்பினர்(கள்) கண்டறியப்பட்டனர்.
              </span>
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-stone-500 hover:text-stone-800 font-bold text-[11px] underline shrink-0 cursor-pointer"
            >
              தேடலை நீக்கு
            </button>
          </div>
        )}
      </div>

      {/* Members Display: Table View (Primary) or Modern Interactive Member Dossier */}
      {viewMode === 'dossier' && (
        <MemberDossierView
          members={filteredMembers}
          activeMember={activeDossierMember}
          onSelectMember={(m) => setSelectedDossierMember(m)}
          onEditMember={(m) => handleOpenEditModal(m)}
          onPrintDossier={(m) => handlePrintDossier(m)}
          onDeleteMember={(m) => handleDeleteMemberConfirm(m)}
          onSwitchToTable={() => setViewMode('table')}
        />
      )}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((m) => (
              <div
                key={m.memberNo}
                className="bg-white rounded-2xl border border-[#E2E2DC] shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header Banner */}
                <div className="bg-gradient-to-r from-[#005c3a] to-[#007A4D] text-white p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#D1EAE0] text-[#007A4D] font-black text-xs px-2.5 py-0.5 rounded-md shadow-2xs border border-[#007A4D]/20">
                        A Class: {m.aClass || m.memberNo}
                      </span>
                      {m.gender && (
                        <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded border border-white/20 font-medium">
                          {m.gender}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {m.ins && <span className="text-[#D1EAE0] font-mono text-sm">({m.ins})</span>}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                      title="உறுப்பினர் விவரங்களை திருத்த (Edit Member)"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>திருத்து</span>
                    </button>
                    <button
                      onClick={() => setSelectedMemberDetail(m)}
                      className="flex items-center gap-1 text-xs font-bold text-[#007A4D] bg-white hover:bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-white/40 transition-colors cursor-pointer"
                      title="கூகுள் சீட்டின் 18 தலைப்புகள் முழு விபரம் பார்க்க"
                    >
                      <Eye className="w-4 h-4 text-[#007A4D]" />
                      <span>முழு விபரம்</span>
                    </button>
                  </div>
                </div>

                {/* Card Body - 4 Grouped Sections matching Google Sheet 18 Columns */}
                <div className="p-4 space-y-3.5 text-xs text-stone-700 flex-1 bg-[#FAF9F5]">
                  {/* Group 1: Account Identifiers */}
                  <div className="bg-white p-3 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-2">
                    <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                      <Building className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>1. கணக்கு விபரங்கள் (Account Identifiers)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-700 font-medium">
                      <div>
                        <span className="text-stone-400 text-[10px] block">A Class (உறுப்பினர் எண்):</span>
                        <span className="font-extrabold text-stone-900">{m.aClass || m.memberNo}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">SB (வங்கி கணக்கு):</span>
                        <span className="font-bold text-[#007A4D]">{m.sb || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">ERP எண்:</span>
                        <span className="font-mono text-stone-800">{m.erp || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Personal & Address Details */}
                  <div className="bg-white p-3 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-2">
                    <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                      <User className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>2. தனிநபர் &amp; முகவரி (Personal &amp; Address)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-700 font-medium">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Ins (தலைப்பெழுத்து):</span>
                        <span className="font-bold text-stone-900">{m.ins || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">C/o (தந்தை/கணவர்):</span>
                        <span className="font-semibold text-stone-800">{m.careOf || m.fatherOrHusbandName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Village (கிராமம்):</span>
                        <span className="font-bold text-stone-900">{m.village || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Door (கதவு எண்):</span>
                        <span className="text-stone-800">{m.door || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Street (தெரு):</span>
                        <span className="text-stone-800">{m.street || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Gender (பாலினம்):</span>
                        <span className="text-stone-800">{m.gender || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Caste (பிரிவு):</span>
                        <span className="text-stone-800">{m.caste || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Contact & Identifiers */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-2.5">
                    <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>3. தொடர்பு &amp; அடையாள ஆவணங்கள் (Contact &amp; ID)</span>
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 px-2.5 bg-[#FAF9F5] rounded-lg border border-[#E2E2DC]/60">
                        <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#007A4D]" />
                          <span>அலைபேசி (Mobile):</span>
                        </span>
                        <span className="font-bold text-stone-900 font-mono">
                          {formatMobile(m.mobile)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 px-2.5 bg-white rounded-lg border border-[#E2E2DC]/60">
                        <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                          <Fingerprint className="w-3 h-3 text-[#007A4D]" />
                          <span>ஆதார் எண் (Aadhaar):</span>
                        </span>
                        <span className="font-mono text-stone-800 font-bold">
                          {formatAadhar(m.aadharNo || m.adhar)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 px-2.5 bg-[#FAF9F5] rounded-lg border border-[#E2E2DC]/60">
                        <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-[#007A4D]" />
                          <span>ரேஷன் கார்டு (Ration Card):</span>
                        </span>
                        <span className="font-mono text-stone-800 font-semibold">
                          {formatRationCard(m.rationCard)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 px-2.5 bg-white rounded-lg border border-[#E2E2DC]/60">
                        <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-[#007A4D]" />
                          <span>MDCC எண்:</span>
                        </span>
                        <span className="font-mono text-stone-800 font-semibold">
                          {formatMDCC(m.mdcc)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Group 4: Nominee & Share */}
                  <div className="bg-white p-3 rounded-xl border border-[#E2E2DC] shadow-2xs space-y-2">
                    <h4 className="font-extrabold text-[11px] text-amber-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>4. வாரிசுதாரர் &amp; பங்கு (Nominee &amp; Share)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-stone-700 font-medium">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Namini (வாரிசுதாரர்):</span>
                        <span className="font-semibold text-stone-800">{m.namini || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Relation (உறவுமுறை):</span>
                        <span className="text-stone-800">{m.relation || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Total Share (பங்கு தொகை):</span>
                        <span className="font-extrabold text-[#007A4D] bg-[#D1EAE0] px-2 py-0.5 rounded border border-[#007A4D]/20 inline-block font-mono">
                          {formatIndianCurrency(m.totalShare ?? m.landAcres)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-10 rounded-2xl border border-[#E2E2DC] text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-800">
                  எந்த உறுப்பினரும் கண்டறியப்படவில்லை
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  &quot;<span className="font-semibold text-stone-800">{searchTerm}</span>&quot; என்னும் தேடலுக்குரிய உறுப்பினர் விபரம் எதுவும் இல்லை. எழுத்துப் பிழை அல்லது வேறு தேடல் வகையை சரிபார்க்கவும்.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchCategory('all');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007A4D] hover:bg-[#005c3a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>அனைத்து உறுப்பினர்களையும் காட்டு (Reset)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full 18-Header Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#E2E2DC] shadow-2xs overflow-hidden">
          {/* Table Header Bar with Counts & Quick Info */}
          <div className="px-4 py-3 bg-[#FAF9F5] border-b border-[#E2E2DC] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#007A4D] bg-[#D1EAE0] px-2.5 py-1 rounded-md border border-[#007A4D]/20">
                18 பத்திகள் முழு அட்டவணை
              </span>
              <span className="text-stone-600 font-bold">
                காட்டப்படும் உறுப்பினர்கள்: <strong className="text-stone-900">{filteredMembers.length}</strong> / {members.length}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              💡 வரியை கிளிக் செய்து முழு விபரப் பலகையில் (Dossier) காணலாம்
            </div>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#007A4D] text-white border-b border-[#005c3a] font-bold whitespace-nowrap sticky top-0 z-10 shadow-xs">
                  <th className="p-3 text-center w-12">வ.எண்</th>
                  <th className="p-3">A Class</th>
                  <th className="p-3">SB</th>
                  <th className="p-3">ERP</th>
                  <th className="p-3">Ins</th>
                  <th className="p-3">உறுப்பினர் பெயர் (Name)</th>
                  <th className="p-3">C/o</th>
                  <th className="p-3">Door</th>
                  <th className="p-3">Street</th>
                  <th className="p-3">Village</th>
                  <th className="p-3">Adhar</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Ration Card</th>
                  <th className="p-3">Namini</th>
                  <th className="p-3">Relation</th>
                  <th className="p-3">Mdcc</th>
                  <th className="p-3">Caste</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Total Share</th>
                  <th className="p-3 text-center">செயல்</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E2DC]">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m, idx) => (
                    <tr 
                      key={m.memberNo} 
                      onClick={() => {
                        setSelectedDossierMember(m);
                      }}
                      className="hover:bg-[#D1EAE0]/30 transition-colors whitespace-nowrap cursor-pointer group"
                    >
                      <td className="p-3 text-center text-stone-500 font-mono font-bold bg-[#FAF9F5] group-hover:bg-[#D1EAE0]/40">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-extrabold text-[#007A4D] bg-[#D1EAE0]/20 font-mono">A-{m.aClass || m.memberNo}</td>
                      <td className="p-3 font-semibold text-stone-800">{m.sb || '-'}</td>
                      <td className="p-3 font-mono text-stone-700">{m.erp || '-'}</td>
                      <td className="p-3 text-stone-700 font-semibold">{m.ins || '-'}</td>
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.ins && <span className="text-[#007A4D] font-mono text-[11px]">({m.ins})</span>}
                      </td>
                      <td className="p-3 text-stone-700">{m.careOf || m.fatherOrHusbandName || '-'}</td>
                      <td className="p-3 text-stone-600">{m.door || '-'}</td>
                      <td className="p-3 text-stone-600">{m.street || '-'}</td>
                      <td className="p-3 font-semibold text-stone-800">{m.village || '-'}</td>
                      <td className="p-3 font-mono text-stone-700">{formatAadhar(m.aadharNo || m.adhar)}</td>
                      <td className="p-3 font-mono text-stone-800 font-semibold">{formatMobile(m.mobile)}</td>
                      <td className="p-3 font-mono text-stone-700">{formatRationCard(m.rationCard)}</td>
                      <td className="p-3 text-stone-700">{m.namini || '-'}</td>
                      <td className="p-3 text-stone-600">{m.relation || '-'}</td>
                      <td className="p-3 font-mono text-stone-700">{formatMDCC(m.mdcc)}</td>
                      <td className="p-3 text-stone-600">{m.caste || '-'}</td>
                      <td className="p-3 text-slate-600 font-medium">{m.gender || '-'}</td>
                      <td className="p-3 font-bold text-emerald-700 font-mono">{formatIndianCurrency(m.totalShare ?? m.landAcres)}</td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedDossierMember(m);
                              setViewMode('dossier');
                            }}
                            className="p-1.5 bg-[#D1EAE0] hover:bg-[#007A4D] hover:text-white text-[#007A4D] rounded-md transition-colors cursor-pointer"
                            title="நவீன விபர பலகையில் காண்க (Dossier View)"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 rounded-md transition-colors cursor-pointer"
                            title="உறுப்பினர் விவரங்களை திருத்த (Edit Member)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedMemberDetail(m)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-md transition-colors cursor-pointer"
                            title="முழு விபரம் மேலடுக்கில் பார்க்க"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintDossier(m)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-700 hover:text-white text-stone-700 rounded-md transition-colors cursor-pointer"
                            title="உறுப்பினர் விபர அட்டை அச்சிடு"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemberConfirm(m)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 hover:border-rose-600 rounded-md transition-all cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-2xs"
                            title="இந்த உறுப்பினரை நிரந்தரமாக நீக்க (Delete Member)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>நீக்கு</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={19} className="p-10 text-center bg-[#FAF9F5]">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                          <Search className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-stone-800">தேடலுக்குரிய உறுப்பினர் கிடைக்கவில்லை</span>
                        <p className="text-xs text-stone-500">
                          &quot;{searchTerm}&quot; என்னும் விபரத்திற்குரிய உறுப்பினர்கள் அட்டவணையில் இல்லை.
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSearchCategory('all');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007A4D] hover:bg-[#005c3a] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>மீட்டமை (Reset)</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Full Detail Modal Popup (Showing 18 Google Sheet Columns) */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E2E2DC] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#007A4D] text-white p-5 flex items-center justify-between border-b border-[#005c3a]">
              <div className="space-y-1">
                <span className="bg-[#D1EAE0] text-[#007A4D] font-black text-xs px-2.5 py-0.5 rounded-md border border-[#007A4D]/20">
                  A Class (உறுப்பினர் எண்): {selectedMemberDetail.aClass || selectedMemberDetail.memberNo}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {selectedMemberDetail.name} {selectedMemberDetail.ins && `(${selectedMemberDetail.ins})`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="p-2 text-[#D1EAE0] hover:text-white hover:bg-[#005c3a] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Structured Sections */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs bg-[#FAF9F5]">
              {/* Section 1: Account info */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] space-y-2.5 shadow-2xs">
                <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>1. கணக்கு &amp; சான்றிதழ் விவரங்கள்</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">1. A Class (உறுப்பினர் எண்)</span>
                    <span className="text-base font-extrabold text-[#007A4D]">{selectedMemberDetail.aClass || selectedMemberDetail.memberNo}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">2. SB (வங்கி கணக்கு)</span>
                    <span className="text-sm font-bold text-stone-900">{selectedMemberDetail.sb || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">3. ERP எண்</span>
                    <span className="text-sm font-mono text-stone-800">{selectedMemberDetail.erp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Personal & Address info */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] space-y-2.5 shadow-2xs">
                <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                  <User className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>2. தனிநபர் பெயர் &amp; முகவரி விவரங்கள்</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">4. Ins (தலைப்பெழுத்து)</span>
                    <span className="text-sm font-semibold text-stone-800">{selectedMemberDetail.ins || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">5. Name (பெயர்)</span>
                    <span className="text-sm font-bold text-stone-900">{selectedMemberDetail.name}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">6. C/o (தந்தை/கணவர்)</span>
                    <span className="text-sm font-semibold text-stone-800">{selectedMemberDetail.careOf || selectedMemberDetail.fatherOrHusbandName || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">7. Door (கதவு எண்)</span>
                    <span className="text-xs text-stone-800 font-medium">{selectedMemberDetail.door || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">8. Street (தெரு பெயர்)</span>
                    <span className="text-xs text-stone-800 font-medium">{selectedMemberDetail.street || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">9. Village (கிராமம்)</span>
                    <span className="text-xs font-bold text-stone-900">{selectedMemberDetail.village || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">17. Gender (பாலினம்)</span>
                    <span className="text-xs text-stone-800 font-medium">{selectedMemberDetail.gender || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Identifiers (One below another with left label and right value) */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] space-y-3 shadow-2xs">
                <h4 className="font-extrabold text-[11px] text-[#007A4D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>3. தொடர்பு &amp; அடையாள ஆவணங்கள் (Contact &amp; ID)</span>
                </h4>
                <div className="space-y-2">
                  {/* Row 1: Mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E2E2DC]">
                    <div className="flex items-center gap-2 text-stone-700 font-bold">
                      <Phone className="w-4 h-4 text-[#007A4D] shrink-0" />
                      <span>11. Mobile (அலைபேசி எண்):</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-stone-900 sm:text-right bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-stone-200">
                      {formatMobile(selectedMemberDetail.mobile)}
                    </span>
                  </div>

                  {/* Row 2: Aadhaar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-white rounded-xl border border-[#E2E2DC]">
                    <div className="flex items-center gap-2 text-stone-700 font-bold">
                      <Fingerprint className="w-4 h-4 text-[#007A4D] shrink-0" />
                      <span>10. Adhar (ஆதார் எண்):</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-stone-800 sm:text-right bg-[#FAF9F5] sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-stone-200">
                      {formatAadhar(selectedMemberDetail.aadharNo || selectedMemberDetail.adhar)}
                    </span>
                  </div>

                  {/* Row 3: Ration Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E2E2DC]">
                    <div className="flex items-center gap-2 text-stone-700 font-bold">
                      <FileText className="w-4 h-4 text-[#007A4D] shrink-0" />
                      <span>12. Ration Card (ரேஷன் கார்டு):</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-stone-800 sm:text-right bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-stone-200">
                      {formatRationCard(selectedMemberDetail.rationCard)}
                    </span>
                  </div>

                  {/* Row 4: MDCC */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-white rounded-xl border border-[#E2E2DC]">
                    <div className="flex items-center gap-2 text-stone-700 font-bold">
                      <Building className="w-4 h-4 text-[#007A4D] shrink-0" />
                      <span>15. Mdcc (MDCC வங்கி கணக்கு எண்):</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-stone-800 sm:text-right bg-[#FAF9F5] sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-stone-200">
                      {formatMDCC(selectedMemberDetail.mdcc)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Nominee, Caste & Total Share */}
              <div className="bg-white p-4 rounded-xl border border-[#E2E2DC] space-y-2.5 shadow-2xs">
                <h4 className="font-extrabold text-[11px] text-amber-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. வாரிசுதாரர் &amp; பங்கு விவரங்கள்</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">13. Namini (வாரிசுதாரர்)</span>
                    <span className="text-xs font-semibold text-stone-800">{selectedMemberDetail.namini || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">14. Relation (உறவுமுறை)</span>
                    <span className="text-xs text-stone-800">{selectedMemberDetail.relation || '-'}</span>
                  </div>
                  <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2E2DC]">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">16. Caste (சாதி/பிரிவு)</span>
                    <span className="text-xs text-stone-800">{selectedMemberDetail.caste || '-'}</span>
                  </div>
                  <div className="bg-[#D1EAE0] p-2.5 rounded-lg border border-[#007A4D]/20">
                    <span className="text-[10px] text-[#007A4D] uppercase font-extrabold block">18. Total Share (பங்கு தொகை)</span>
                    <span className="text-sm font-extrabold text-[#007A4D] font-mono">{formatIndianCurrency(selectedMemberDetail.totalShare ?? selectedMemberDetail.landAcres)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border-t border-[#E2E2DC] flex justify-between items-center">
              <button
                onClick={() => handleOpenEditModal(selectedMemberDetail)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>விவரங்களை திருத்து (Edit Member)</span>
              </button>
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="px-5 py-2 bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                மூடுக (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add/Edit Member */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E2E2DC] shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="border-b border-[#E2E2DC] pb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {editingMember
                    ? `உறுப்பினர் விவரங்களை திருத்துதல் - A Class: ${editingMember.aClass || editingMember.memberNo}`
                    : 'புதிய உறுப்பினர் சேர்க்கை படிவம் (Loanmember Registration)'}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {editingMember
                    ? 'உறுப்பினரின் விவரங்களை திருத்தி அமைத்து சேமிக்கவும்.'
                    : 'கூகுள் சீட்டின் 18 தலைப்புகளுக்கும் (A Class, SB, ERP, Ins, Name, C/o, Door, Street, Village, Adhar, Mobile, Ration Card, Namini, Relation, Mdcc, Caste, Gender, Total Share) ஏற்றவாறு வடிவமைக்கப்பட்ட படிவம்.'}
                </p>

                {sheetHeaders.length > 0 && !editingMember && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-stone-600">சீட் தலைப்புகள் (18):</span>
                    {sheetHeaders.map((h, i) => (
                      <span key={i} className="bg-[#D1EAE0] text-[#007A4D] font-mono text-[10px] px-2 py-0.5 rounded border border-[#007A4D]/20">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              {/* Section 1: A Class, SB, ERP */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2E2DC] space-y-3">
                <h4 className="font-extrabold text-[#007A4D] text-xs uppercase tracking-wider flex items-center gap-1">
                  <span>1. கணக்கு &amp; சான்றிதழ் விவரங்கள்</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      A Class (உறுப்பினர் எண்):
                    </label>
                    <input
                      type="text"
                      required
                      value={aClassVal}
                      onChange={(e) => setAClassVal(e.target.value)}
                      placeholder="எ.கா: 1001"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold bg-white text-[#007A4D] focus:ring-2 focus:ring-[#007A4D] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      SB (வங்கி கணக்கு எண்):
                    </label>
                    <input
                      type="text"
                      value={sbVal}
                      onChange={(e) => setSbVal(e.target.value)}
                      placeholder="SB Ac No"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      ERP (ERP எண்):
                    </label>
                    <input
                      type="text"
                      value={erpVal}
                      onChange={(e) => setErpVal(e.target.value)}
                      placeholder="ERP Code"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Name, Ins, C/o, Door, Street, Village, Gender */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2E2DC] space-y-3">
                <h4 className="font-extrabold text-[#007A4D] text-xs uppercase tracking-wider">
                  2. தனிநபர் பெயர் &amp; முகவரி விவரங்கள்
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Ins (தலைப்பெழுத்து):
                    </label>
                    <input
                      type="text"
                      value={insVal}
                      onChange={(e) => setInsVal(e.target.value)}
                      placeholder="தலைப்பெழுத்து / Initial"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none font-medium text-[#007A4D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Name (உறுப்பினர் பெயர்): *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      placeholder="உறுப்பினர் பெயர் உள்ளிடவும்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-medium bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      C/o (தந்தை / கணவர் பெயர்): *
                    </label>
                    <input
                      type="text"
                      required
                      value={careOfVal}
                      onChange={(e) => setCareOfVal(e.target.value)}
                      placeholder="தந்தை அல்லது கணவர் பெயர்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-medium bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Door (கதவு எண்):
                    </label>
                    <input
                      type="text"
                      value={doorVal}
                      onChange={(e) => setDoorVal(e.target.value)}
                      placeholder="கதவு எண்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Street (தெரு):
                    </label>
                    <input
                      type="text"
                      value={streetVal}
                      onChange={(e) => setStreetVal(e.target.value)}
                      placeholder="தெரு பெயர்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Village (கிராமம்): *
                    </label>
                    <input
                      type="text"
                      required
                      value={villageVal}
                      onChange={(e) => setVillageVal(e.target.value)}
                      placeholder="கிராமம் பெயர்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Gender (பாலினம்):
                    </label>
                    <select
                      value={genderVal}
                      onChange={(e) => setGenderVal(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    >
                      <option value="Male">ஆண் (Male)</option>
                      <option value="Female">பெண் (Female)</option>
                      <option value="Other">இதர (Other)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Mobile, Adhar, Ration Card, MDCC (Stacked vertically one below another with left label and right input) */}
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E2DC] space-y-3.5">
                <h4 className="font-extrabold text-[#007A4D] text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#007A4D]" />
                  <span>3. தொடர்பு &amp; அடையாள ஆவணங்கள்</span>
                </h4>
                <div className="space-y-3">
                  {/* Row 1: Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center bg-white p-2.5 rounded-lg border border-[#E2E2DC]">
                    <label className="font-bold text-stone-700 text-xs flex items-center gap-1.5 sm:col-span-1">
                      <Phone className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>11. Mobile (அலைபேசி எண்): *</span>
                    </label>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={mobileVal}
                        onChange={(e) => setMobileVal(formatMobile(e.target.value))}
                        placeholder="98421 - 56789"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-[#FAF9F5] focus:bg-white font-mono font-bold focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">5 - 5 இலக்கமாக பிரியும் (எ.கா: 98421 - 56789)</span>
                    </div>
                  </div>

                  {/* Row 2: Aadhaar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center bg-white p-2.5 rounded-lg border border-[#E2E2DC]">
                    <label className="font-bold text-stone-700 text-xs flex items-center gap-1.5 sm:col-span-1">
                      <Fingerprint className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>10. Adhar (ஆதார் எண்): *</span>
                    </label>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={adharVal}
                        onChange={(e) => setAdharVal(formatAadhar(e.target.value))}
                        placeholder="1234 - 5678 - 9012"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-[#FAF9F5] focus:bg-white font-mono font-semibold focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">12 இலக்கங்கள் (4 - 4 - 4 பிரிக்கப்படும்)</span>
                    </div>
                  </div>

                  {/* Row 3: Ration Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center bg-white p-2.5 rounded-lg border border-[#E2E2DC]">
                    <label className="font-bold text-stone-700 text-xs flex items-center gap-1.5 sm:col-span-1">
                      <FileText className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>12. Ration Card (ரேஷன் கார்டு):</span>
                    </label>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={rationCardVal}
                        onChange={(e) => setRationCardVal(formatRationCard(e.target.value))}
                        placeholder="NPHH - 123 - 000 - 111 - 222"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-[#FAF9F5] focus:bg-white font-mono font-semibold focus:ring-2 focus:ring-[#007A4D] outline-none uppercase text-stone-900"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">எழுத்துக்கள் - 12 இலக்கங்கள் (3 - 3 - 3 - 3)</span>
                    </div>
                  </div>

                  {/* Row 4: MDCC */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center bg-white p-2.5 rounded-lg border border-[#E2E2DC]">
                    <label className="font-bold text-stone-700 text-xs flex items-center gap-1.5 sm:col-span-1">
                      <Building className="w-3.5 h-3.5 text-[#007A4D]" />
                      <span>15. Mdcc (MDCC வங்கி கணக்கு எண்):</span>
                    </label>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={mdccVal}
                        onChange={(e) => setMdccVal(formatMDCC(e.target.value))}
                        placeholder="MDCC-782 - 1"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-[#FAF9F5] focus:bg-white font-mono font-semibold focus:ring-2 focus:ring-[#007A4D] outline-none uppercase text-stone-900"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">3 இலக்கம் பிரித்து அமைத்தல்</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Namini, Relation, Caste, Total Share */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2E2DC] space-y-3">
                <h4 className="font-extrabold text-amber-700 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E2E2DC] pb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. வாரிசுதாரர் &amp; பங்கு விவரங்கள்</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      13. Namini (வாரிசுதாரர்):
                    </label>
                    <input
                      type="text"
                      value={naminiVal}
                      onChange={(e) => setNaminiVal(e.target.value)}
                      placeholder="வாரிசுதாரர் பெயர்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      14. Relation (உறவுமுறை):
                    </label>
                    <input
                      type="text"
                      value={relationVal}
                      onChange={(e) => setRelationVal(e.target.value)}
                      placeholder="எ.கா: மனைவி / மகன்"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      16. Caste (பிரிவு/சாதி):
                    </label>
                    <input
                      type="text"
                      value={casteVal}
                      onChange={(e) => setCasteVal(e.target.value)}
                      placeholder="BC / MBC / SC / ST"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#007A4D] outline-none text-stone-900"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-stone-700 mb-1">
                      18. Total Share (மொத்த பங்குத் தொகை):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-extrabold text-xs">₹</span>
                      <input
                        type="text"
                        value={totalShareVal}
                        onChange={(e) => setTotalShareVal(formatIndianInputNumber(e.target.value))}
                        placeholder="100"
                        className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg bg-white font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-[#007A4D] outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">இந்திய ரூபாய் கமா பிரிப்புடன் (எ.கா: 1,00,000)</span>
                  </div>
                </div>
              </div>

              {spreadsheetId && (
                <div className="p-2.5 bg-[#D1EAE0] border border-[#007A4D]/30 rounded-xl text-[11px] text-[#007A4D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#007A4D] shrink-0" />
                  <span>இந்த உறுப்பினர் நேரடியாக உங்கள் <strong>Google Sheet (Loanmember)</strong> சீட்டில் 18 பத்திகளிலும் பதிவாகுவார்.</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#E2E2DC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  ரத்து
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingToSheet}
                  className="px-5 py-2 bg-[#007A4D] hover:bg-[#00633e] text-white rounded-xl font-bold shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingToSheet ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>பதிவாகிறது...</span>
                    </>
                  ) : (
                    <span>{editingMember ? 'விவரங்களை புதுப்பிக்க (Update)' : 'உறுப்பினர் சேமிக்க'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">உறுப்பினரை நீக்குவதை உறுதிப்படுத்தவும்</h3>
                <p className="text-xs text-rose-100">Firebase Firestore தரவுத்தளத்திலிருந்து நிரந்தரமாக நீக்கப்படும்</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">A Class (உறுப்பினர் எண்):</span>
                  <strong className="text-rose-700 font-mono text-sm font-black">A-{memberToDelete.aClass || memberToDelete.memberNo}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">உறுப்பினர் பெயர்:</span>
                  <strong className="text-stone-900 font-bold text-sm">{memberToDelete.name} {memberToDelete.ins ? `(${memberToDelete.ins})` : ''}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">தந்தை/கணவர் பெயர்:</span>
                  <span className="text-stone-800">{memberToDelete.careOf || memberToDelete.fatherOrHusbandName || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">கிராமம்:</span>
                  <span className="text-stone-800">{memberToDelete.village || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">SB கணக்கு:</span>
                  <span className="text-stone-800 font-mono">{memberToDelete.sb || '-'}</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                நீங்கள் <strong>{memberToDelete.name}</strong> அவர்களின் விபரங்களை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இந்த செயல் Firebase Firestore மற்றும் பட்டியலில் இருந்து உடனே நீக்கப்படும்.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>நீக்கப்படுகிறது...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ஆம், நிரந்தரமாக நீக்கு</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
