export interface LoanMember {
  memberNo: string;
  name: string;
  fatherOrHusbandName: string;
  village: string;
  mobile: string;
  aadharNo: string;
  landAcres: number;
  
  // Specific Google Sheet Loanmember fields
  aClass?: string;
  sb?: string;
  erp?: string;
  ins?: string;
  careOf?: string;
  door?: string;
  street?: string;
  adhar?: string;
  rationCard?: string;
  namini?: string;
  relation?: string;
  mdcc?: string;
  caste?: string;
  gender?: string;
  totalShare?: string | number;
  kccAccountNo?: string;
  bankBranch?: string;
}

export interface Part1RCLDetails {
  rclNumber: string;
  rclDate: string;
  sanctionedAmount: number | '';
  notes?: string;
  isSaved?: boolean;
  updatedAt?: string;
}

export interface KCCDisbursementRecord {
  id: string;
  memberNo: string;
  memberName: string;
  season: string; // e.g., 2026-2027 Kharif / Rabi
  part1: Part1RCLDetails;
  // Parts 2 to 11 will be added sequentially as user specifies
  part2Data?: Record<string, any>;
  part3Data?: Record<string, any>;
  part4Data?: Record<string, any>;
  part5Data?: Record<string, any>;
  part6Data?: Record<string, any>;
  part7Data?: Record<string, any>;
  part8Data?: Record<string, any>;
  part9Data?: Record<string, any>;
  part10Data?: Record<string, any>;
  part11Data?: Record<string, any>;
  createdDate: string;
  status: 'வரைவு (Draft)' | 'சமர்ப்பிக்கப்பட்டது (Submitted)' | 'அனுமதிக்கப்பட்டது (Approved)';
}

export interface KCCBankAccount {
  accountNo: string;
  memberNo: string;
  memberName: string;
  ifscCode: string;
  branchName: string;
  accountType: 'KCC Loan SB' | 'KCC Crop Credit';
  sanctionLimit: number;
  currentBalance: number;
  status: 'செயலில் உள்ளது (Active)' | 'முடக்கம் (Frozen)';
}

export interface KCCBankRow {
  id: string;
  date: string;                      // Col A: தேதி
  memberPayment: number;              // Col B: உறுப்பினர் செலுத்துதல்
  disbursementMemberCount: number;    // Col C: பட்டுவாடா உறுப்பினர்
  disbursementAmount: number;         // Col D: பட்டுவாடா தொகை
  bankPayment: number;                // Col E: வங்கிக்கு செலுத்துதல்
  bankLevelBalance?: number;          // Col F: வங்கி அளவு நிலுவை
  memberLevelTotal?: number;          // Col G: மெம்பர் அளவு மொத்தம்
  totalMemberCount?: number;          // Col H: மொத்த உறுப்பினர் எண்ணிக்கை
  totalDisbursedAmount?: number;      // Col I: இதுவரை பட்டுவாடா செய்தது
  netMeasure?: number;                // Col J: தொகையின் அளவீடு
  bankOutstandingStatus?: string;     // Col K: வங்கியின் நிலுவை தொகை
  rowIndex?: number;
}

export type NavigationMenu = 
  | 'home' 
  | 'interest-crop'
  | 'interest-jewel'
  | 'interest-shg'
  | 'loan-member-master' 
  | 'kcc-disbursement' 
  | 'kcc-bank-account' 
  | 'ah-disbursement' 
  | 'ah-bank-account' 
  | 'kcc-application'
  | 'ah-application'
  | 'google-sheet-sync' 
  | 'print-reports'
  | 'storage';

