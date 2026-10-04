import { getMembersFromFirestore } from '../server/firebase-service';
import fs from 'fs';

async function main() {
  const members = await getMembersFromFirestore();
  if (!members || members.length === 0) {
    console.error('No members in firestore');
    return;
  }
  members.sort((a, b) => {
    const numA = parseInt(a.aClass || a.memberNo || '0', 10);
    const numB = parseInt(b.aClass || b.memberNo || '0', 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.aClass || '').localeCompare(b.aClass || '');
  });

  const content = `import { LoanMember, KCCDisbursementRecord, KCCBankAccount } from '../types';

export const INITIAL_LOAN_MEMBERS: LoanMember[] = ${JSON.stringify(members, null, 2)};

export const INITIAL_DISBURSEMENTS: KCCDisbursementRecord[] = [
  {
    id: "DISB-2026-001",
    memberNo: "1822",
    memberName: "ஜேசுராஜ் J",
    season: "2026 - பசுவடை / சொர்ணவாரி",
    part1: {
      rclNumber: "RCL/2026/089",
      rclDate: "2026-07-15",
      sanctionedAmount: 150000,
      notes: "தொடக்க அனுமதிக்கப்பட்ட கடன் தொகை",
      isSaved: true,
      updatedAt: "2026-07-15 10:30"
    },
    part2Data: {
      currentDisbNo: "1"
    },
    createdDate: "2026-07-15",
    status: "வரைவு (Draft)"
  }
];

export const INITIAL_BANK_ACCOUNTS: KCCBankAccount[] = [
  {
    accountNo: "803890024",
    memberNo: "1822",
    memberName: "ஜேசுராஜ் J",
    ifscCode: "TNSC0010200",
    branchName: "TU3 PACCS தலைமை கிளை",
    accountType: "KCC Crop Credit",
    sanctionLimit: 150000,
    currentBalance: 150000,
    status: "செயலில் உள்ளது (Active)"
  }
];
`;

  fs.writeFileSync('src/data/initialData.ts', content, 'utf8');
  console.log('✅ Updated src/data/initialData.ts with', members.length, 'members!');
  process.exit(0);
}

main();
