import React, { useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';

interface LoanMemberMasterScreenProps {
  members: LoanMember[];
  onAddMember: (member: LoanMember) => void;
  onSetMembers: (members: LoanMember[]) => void;
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
}

export const LoanMemberMasterScreen: React.FC<LoanMemberMasterScreenProps> = ({
  members,
  onAddMember,
  onSetMembers,
  spreadsheetId,
  onSetSpreadsheetId
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'name' | 'memberNo' | 'aadhar'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<LoanMember | null>(null);
  const [editingMember, setEditingMember] = useState<LoanMember | null>(null);
  
  // Sheet sync states
  const [sheetInput, setSheetInput] = useState<string>(spreadsheetId || '');
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
    setSheetStatusMsg({ type: 'info', text: 'கூகுள் சீட் Masterdata -> Loanmember தரவுகள் பெறப்படுகின்றன...' });

    try {
      const response = await fetch(`/api/sheets/members?spreadsheetId=${cleanId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error || 'பிழை ஏற்பட்டது'} (${data.details})`
          : (data.error || 'கூகுள் சீட் பெற முடியவில்லை');
        throw new Error(errorMsg);
      }

      if (data.headers && data.headers.length > 0) {
        setSheetHeaders(data.headers);
      }

      if (data.members && data.members.length > 0) {
        onSetMembers(data.members);
        setSheetStatusMsg({
          type: 'success',
          text: `வெற்றியுடன் ${data.members.length} உறுப்பினர்களின் தகவல்கள் கூகுள் சீட்டிலிருந்து பெறப்பட்டன!`
        });
      } else {
        setSheetStatusMsg({
          type: 'info',
          text: 'கூகுள் சீட்டில் தரவுகள் ஏதுமில்லை. அல்லது Loanmember சீட் தயார் நிலையில் உள்ளது.'
        });
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
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-stone-500 font-medium hidden md:inline">பார்வை:</span>
            <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#E2E2DC]">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#007A4D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="கார்டு பார்வை"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>கார்டுகள்</span>
              </button>
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
            </div>
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

      {/* Members Display: Card View or Table View */}
      {viewMode === 'cards' ? (
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
      ) : (
        /* Full 18-Header Table View */
        <div className="bg-white rounded-2xl border border-[#E2E2DC] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#007A4D] text-white border-b border-[#005c3a] font-bold whitespace-nowrap">
                  <th className="p-3">A Class</th>
                  <th className="p-3">SB</th>
                  <th className="p-3">ERP</th>
                  <th className="p-3">Ins</th>
                  <th className="p-3">Name</th>
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
                  filteredMembers.map((m) => (
                    <tr key={m.memberNo} className="hover:bg-[#D1EAE0]/30 transition-colors whitespace-nowrap">
                      <td className="p-3 font-extrabold text-[#007A4D] bg-[#D1EAE0]/20">{m.aClass || m.memberNo}</td>
                      <td className="p-3 font-semibold text-stone-800">{m.sb || '-'}</td>
                      <td className="p-3 font-mono text-stone-700">{m.erp || '-'}</td>
                      <td className="p-3 text-stone-700">{m.ins || '-'}</td>
                      <td className="p-3 font-bold text-stone-900">{m.name}</td>
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
                      <td className="p-3 text-slate-600">{m.gender || '-'}</td>
                      <td className="p-3 font-bold text-emerald-700 font-mono">{formatIndianCurrency(m.totalShare ?? m.landAcres)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
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
                            title="விபரம் பார்க்க"
                          >
                            <Eye className="w-4 h-4" />
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
    </div>
  );
};
