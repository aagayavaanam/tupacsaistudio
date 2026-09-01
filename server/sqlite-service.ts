import { getDb, queryObjects, runQuery, saveDb } from './sqlite-db';

export async function clearAllDbTables() {
  const db = await getDb();
  runQuery(db, 'DELETE FROM members');
  runQuery(db, 'DELETE FROM paduvada');
  runQuery(db, 'DELETE FROM bank_sheet');
  runQuery(db, 'DELETE FROM ah_paduvada');
  runQuery(db, 'DELETE FROM ah_bank_sheet');
  saveDb();
  return { success: true, message: 'All SQLite tables cleared.' };
}

export async function getSqliteStatus() {
  const db = await getDb();
  const membersRes = queryObjects(db, 'SELECT COUNT(*) as cnt FROM members');
  const paduvadaRes = queryObjects(db, 'SELECT COUNT(*) as cnt FROM paduvada');
  const bankSheetRes = queryObjects(db, 'SELECT COUNT(*) as cnt FROM bank_sheet');
  const ahPaduvadaRes = queryObjects(db, 'SELECT COUNT(*) as cnt FROM ah_paduvada');
  const ahBankSheetRes = queryObjects(db, 'SELECT COUNT(*) as cnt FROM ah_bank_sheet');

  return {
    membersCount: membersRes[0]?.cnt || 0,
    paduvadaCount: paduvadaRes[0]?.cnt || 0,
    bankSheetCount: bankSheetRes[0]?.cnt || 0,
    ahPaduvadaCount: ahPaduvadaRes[0]?.cnt || 0,
    ahBankSheetCount: ahBankSheetRes[0]?.cnt || 0,
    databaseEngine: 'SQLite 3 (Server Native)',
    status: 'Active'
  };
}

// MEMBERS
export async function getMembersFromDb() {
  const db = await getDb();
  const rows = queryObjects(db, 'SELECT * FROM members ORDER BY id ASC');
  return rows.map(r => ({
    memberNo: r.member_no || '',
    aClass: r.member_no || '',
    sb: r.sb || '',
    erp: r.erp || '',
    ins: r.ins || '',
    name: r.name || '',
    fatherOrHusbandName: r.care_of || '',
    careOf: r.care_of || '',
    door: r.door || '',
    street: r.street || '',
    village: r.village || '',
    aadharNo: r.aadhar_no || '',
    adhar: r.aadhar_no || '',
    mobile: r.mobile || '',
    rationCard: r.ration_card || '',
    namini: r.namini || '',
    relation: r.relation || '',
    mdcc: r.mdcc || '',
    caste: r.caste || '',
    gender: r.gender || '',
    totalShare: r.total_share || '',
    landAcres: parseFloat(r.total_share || '0') || 0
  }));
}

export async function saveMemberToDb(m: any) {
  const db = await getDb();
  const memberNo = m.aClass || m.memberNo || '';
  if (!memberNo) return;

  const now = new Date().toISOString();
  runQuery(db, `
    INSERT INTO members (
      member_no, sb, erp, ins, name, care_of, door, street, village,
      aadhar_no, mobile, ration_card, namini, relation, mdcc, caste, gender, total_share, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(member_no) DO UPDATE SET
      sb=excluded.sb, erp=excluded.erp, ins=excluded.ins, name=excluded.name,
      care_of=excluded.care_of, door=excluded.door, street=excluded.street, village=excluded.village,
      aadhar_no=excluded.aadhar_no, mobile=excluded.mobile, ration_card=excluded.ration_card,
      namini=excluded.namini, relation=excluded.relation, mdcc=excluded.mdcc, caste=excluded.caste,
      gender=excluded.gender, total_share=excluded.total_share, updated_at=excluded.updated_at
  `, [
    memberNo, m.sb || '', m.erp || '', m.ins || '', m.name || '',
    m.careOf || m.fatherOrHusbandName || '', m.door || '', m.street || '', m.village || '',
    m.aadharNo || m.adhar || '', m.mobile || '', m.rationCard || '', m.namini || '',
    m.relation || '', m.mdcc || '', m.caste || '', m.gender || '',
    m.totalShare ?? m.landAcres ?? '', now, now
  ]);
}

// PADUVADA
export async function deduplicatePaduvadaInDb() {
  const db = await getDb();
  try {
    runQuery(db, `
      DELETE FROM paduvada
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM paduvada 
        GROUP BY a_class, current_disb_no, crop, survey_no, acres, total_loan_amount
      )
    `);
  } catch (err) {
    console.error('Error deduplicating paduvada in DB:', err);
  }
}

export async function getPaduvadaFromDb(disbNo?: string) {
  const db = await getDb();
  await deduplicatePaduvadaInDb();

  let rows = queryObjects(db, 'SELECT * FROM paduvada ORDER BY id ASC');
  
  if (disbNo && String(disbNo).trim() !== '') {
    const target = String(disbNo).trim();
    rows = rows.filter(r => String(r.current_disb_no || '').trim() === target);
  }

  const items = rows.map((r, index) => ({
    id: `db-${r.id}-${r.a_class}`,
    dbId: r.id,
    rowIndex: r.row_index || (index + 2),
    rclNumber: r.rcl_number || '',
    rclDate: r.rcl_date || '',
    sanctionedAmount: r.sanctioned_amount || '',
    currentDisbNo: r.current_disb_no || '',
    resolutionNo: r.resolution_no || '',
    resolutionDate: r.resolution_date || '',
    aClass: r.a_class || '',
    name: r.name || '',
    careOf: r.care_of || '',
    sb: r.sb || '',
    erp: r.erp || '',
    ins: r.ins || '',
    door: r.door || '',
    street: r.street || '',
    village: r.village || '',
    aadharNo: r.aadhar_no || '',
    mobile: r.mobile || '',
    rationCard: r.ration_card || '',
    namini: r.namini || '',
    relation: r.relation || '',
    mdcc: r.mdcc || '',
    caste: r.caste || '',
    totalShare: r.total_share || '',
    surveyNo: r.survey_no || '',
    acres: r.acres || '',
    crop: r.crop || '',
    seed: r.seed || '',
    chemicalFertilizer: r.chemical_fertilizer || '',
    pesticide: r.pesticide || '',
    plowing: r.plowing || '',
    harvesting: r.harvesting || '',
    fertilizerKind: r.fertilizer_kind || '',
    organicFertilizer: r.organic_fertilizer || '',
    totalLoanAmount: r.total_loan_amount || '',
    farmerClass: r.farmer_class || '',
    disability: r.disability || '',
    mortgageType: r.mortgage_type || '',
    guaranteeType: r.guarantee_type || '',
    passbookFee: r.passbook_fee || '',
    insurance: r.insurance || '',
    shareCapital: r.share_capital || '',
    prevLoanNo: r.prev_loan_no || '',
    prevLoanDate: r.prev_loan_date || '',
    prevLoanAmount: r.prev_loan_amount || '',
    addedAt: r.added_at || ''
  }));

  let maxDisbNo = 0;
  items.forEach(item => {
    const val = parseInt((item.currentDisbNo || '').toString().trim(), 10);
    if (!isNaN(val) && val > maxDisbNo) {
      maxDisbNo = val;
    }
  });

  return {
    data: items,
    totalCount: items.length,
    maxDisbNo: maxDisbNo > 0 ? maxDisbNo.toString() : '0'
  };
}

export async function savePaduvadaToDb(p: any) {
  const db = await getDb();
  const addedAt = p.addedAt || new Date().toLocaleString('ta-IN');
  const targetAClass = p.aClass || '';
  const targetDisbNo = p.currentDisbNo || '';
  const targetCrop = p.crop || '';
  const targetSurvey = p.surveyNo || '';

  // If a record with the exact same A-Class, Disb No, Crop, and Survey No exists, update it to avoid duplicates
  if (targetAClass && targetDisbNo && targetCrop) {
    const existing = queryObjects(db, `
      SELECT id FROM paduvada
      WHERE a_class=? AND current_disb_no=? AND crop=? AND (survey_no=? OR ?='' OR survey_no='')
      LIMIT 1
    `, [targetAClass, targetDisbNo, targetCrop, targetSurvey, targetSurvey]);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      runQuery(db, `
        UPDATE paduvada SET
          rcl_number=?, rcl_date=?, sanctioned_amount=?, current_disb_no=?, resolution_no=?, resolution_date=?,
          name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
          ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
          crop=?, seed=?, chemical_fertilizer=?, pesticide=?, plowing=?, harvesting=?, fertilizer_kind=?,
          organic_fertilizer=?, total_loan_amount=?, farmer_class=?, disability=?, mortgage_type=?,
          guarantee_type=?, passbook_fee=?, insurance=?, share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?, added_at=?
        WHERE id=?
      `, [
        p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
        p.name || '', p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '', p.aadharNo || '', p.mobile || '',
        p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '', p.acres || '',
        p.crop || '', p.seed || '', p.chemicalFertilizer || '', p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
        p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '', p.mortgageType || '',
        p.guaranteeType || '', p.passbookFee || '', p.insurance || '', p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
        addedAt, existingId
      ]);
      return;
    }
  }

  runQuery(db, `
    INSERT INTO paduvada (
      rcl_number, rcl_date, sanctioned_amount, current_disb_no, resolution_no, resolution_date,
      a_class, name, care_of, sb, erp, ins, door, street, village, aadhar_no, mobile, ration_card,
      namini, relation, mdcc, caste, total_share, survey_no, acres, crop, seed, chemical_fertilizer,
      pesticide, plowing, harvesting, fertilizer_kind, organic_fertilizer, total_loan_amount,
      farmer_class, disability, mortgage_type, guarantee_type, passbook_fee, insurance,
      share_capital, prev_loan_no, prev_loan_date, prev_loan_amount, added_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
    p.resolutionNo || '', p.resolutionDate || '', p.aClass || '', p.name || '',
    p.careOf || '', p.sb || '', p.erp || '', p.ins || '',
    p.door || '', p.street || '', p.village || '', p.aadharNo || '',
    p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
    p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '',
    p.acres || '', p.crop || '', p.seed || '', p.chemicalFertilizer || '',
    p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
    p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '',
    p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '', p.insurance || '',
    p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
    addedAt
  ]);
}

export async function updatePaduvadaInDb(p: any, aClass?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = await getDb();
  const targetAClass = aClass || p.aClass || '';
  const targetDisbNo = currentDisbNo || p.currentDisbNo || '';
  const targetCrop = crop || p.crop || '';
  const targetId = id || p.dbId || (String(p.id || '').startsWith('db-') ? String(p.id).split('-')[1] : '');

  // 1. If explicit SQLite numeric ID is available, update that exact row
  if (targetId && !isNaN(parseInt(targetId, 10))) {
    const numId = parseInt(targetId, 10);
    runQuery(db, `
      UPDATE paduvada SET
        rcl_number=?, rcl_date=?, sanctioned_amount=?, current_disb_no=?, resolution_no=?, resolution_date=?,
        name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
        ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
        crop=?, seed=?, chemical_fertilizer=?, pesticide=?, plowing=?, harvesting=?, fertilizer_kind=?,
        organic_fertilizer=?, total_loan_amount=?, farmer_class=?, disability=?, mortgage_type=?,
        guarantee_type=?, passbook_fee=?, insurance=?, share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?
      WHERE id=?
    `, [
      p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
      p.name || '', p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '', p.aadharNo || '', p.mobile || '',
      p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '', p.acres || '',
      p.crop || '', p.seed || '', p.chemicalFertilizer || '', p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
      p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '', p.mortgageType || '',
      p.guaranteeType || '', p.passbookFee || '', p.insurance || '', p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
      numId
    ]);
    return;
  }

  if (!targetAClass) return;

  // 2. If crop is specified, update ONLY that person's specific crop entry so other crops (e.g. coconut, banana) are never overwritten!
  if (targetCrop && targetDisbNo) {
    runQuery(db, `
      UPDATE paduvada SET
        rcl_number=?, rcl_date=?, sanctioned_amount=?, current_disb_no=?, resolution_no=?, resolution_date=?,
        name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
        ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
        crop=?, seed=?, chemical_fertilizer=?, pesticide=?, plowing=?, harvesting=?, fertilizer_kind=?,
        organic_fertilizer=?, total_loan_amount=?, farmer_class=?, disability=?, mortgage_type=?,
        guarantee_type=?, passbook_fee=?, insurance=?, share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?
      WHERE a_class=? AND current_disb_no=? AND crop=?
    `, [
      p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
      p.name || '', p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '', p.aadharNo || '', p.mobile || '',
      p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '', p.acres || '',
      p.crop || '', p.seed || '', p.chemicalFertilizer || '', p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
      p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '', p.mortgageType || '',
      p.guaranteeType || '', p.passbookFee || '', p.insurance || '', p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
      targetAClass, targetDisbNo, targetCrop
    ]);
    return;
  }

  // 3. Fallback: match by aClass and currentDisbNo
  runQuery(db, `
    UPDATE paduvada SET
      rcl_number=?, rcl_date=?, sanctioned_amount=?, current_disb_no=?, resolution_no=?, resolution_date=?,
      name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
      ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
      crop=?, seed=?, chemical_fertilizer=?, pesticide=?, plowing=?, harvesting=?, fertilizer_kind=?,
      organic_fertilizer=?, total_loan_amount=?, farmer_class=?, disability=?, mortgage_type=?,
      guarantee_type=?, passbook_fee=?, insurance=?, share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?
    WHERE a_class=? ${targetDisbNo ? 'AND current_disb_no=?' : ''}
  `, targetDisbNo ? [
    p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
    p.name || '', p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '', p.aadharNo || '', p.mobile || '',
    p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '', p.acres || '',
    p.crop || '', p.seed || '', p.chemicalFertilizer || '', p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
    p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '', p.mortgageType || '',
    p.guaranteeType || '', p.passbookFee || '', p.insurance || '', p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
    targetAClass, targetDisbNo
  ] : [
    p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
    p.name || '', p.careOf || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '', p.aadharNo || '', p.mobile || '',
    p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '', p.acres || '',
    p.crop || '', p.seed || '', p.chemicalFertilizer || '', p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
    p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '', p.mortgageType || '',
    p.guaranteeType || '', p.passbookFee || '', p.insurance || '', p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
    targetAClass
  ]);
}

export async function deletePaduvadaFromDb(aClass?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = await getDb();
  if (id) {
    const rawId = String(id).startsWith('db-') ? parseInt(String(id).split('-')[1], 10) : parseInt(id, 10);
    if (!isNaN(rawId) && rawId > 0) {
      runQuery(db, 'DELETE FROM paduvada WHERE id=?', [rawId]);
      return;
    }
  }
  if (!aClass) return;

  if (currentDisbNo && crop) {
    runQuery(db, 'DELETE FROM paduvada WHERE a_class=? AND current_disb_no=? AND crop=?', [aClass, currentDisbNo, crop]);
  } else if (currentDisbNo) {
    runQuery(db, 'DELETE FROM paduvada WHERE a_class=? AND current_disb_no=?', [aClass, currentDisbNo]);
  } else {
    runQuery(db, 'DELETE FROM paduvada WHERE a_class=?', [aClass]);
  }
}

export async function deduplicateBankSheetInDb() {
  const db = await getDb();
  try {
    runQuery(db, `
      DELETE FROM bank_sheet 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM bank_sheet 
        GROUP BY date, member_payment, disbursement_member_count, disbursement_amount, bank_payment
      )
    `);
  } catch (err) {
    console.error('Error deduplicating bank_sheet in DB:', err);
  }
}

// BANK SHEET
export async function getBankSheetFromDb() {
  const db = await getDb();
  
  // Deduplicate any previously duplicated rows automatically
  await deduplicateBankSheetInDb();

  const rows = queryObjects(db, 'SELECT * FROM bank_sheet ORDER BY id ASC');

  const items = rows.map((r, index) => {
    const netVal = r.net_measure || 0;
    const defaultOutstandingText = netVal >= 0 ? 'வங்கியில் அதிகமாக உள்ளது' : 'வங்கிக்கு இன்னும் செலுத்த வேண்டும்';

    return {
      id: `db-bank-${r.id}`,
      rowIndex: r.row_index || (index + 2),
      date: r.date || '',
      memberPayment: r.member_payment || 0,
      disbursementMemberCount: r.disbursement_member_count || 0,
      disbursementAmount: r.disbursement_amount || 0,
      bankPayment: r.bank_payment || 0,
      bankLevelBalance: r.bank_level_balance || 0,
      memberLevelTotal: r.member_level_total || 0,
      totalMemberCount: r.total_member_count || 0,
      totalDisbursedAmount: r.total_disbursed_amount || 0,
      netMeasure: netVal,
      bankOutstandingStatus: r.bank_outstanding_status || defaultOutstandingText,
      colF: r.col_f || r.bank_level_balance || 0,
      colG: r.col_g || r.member_level_total || 0,
      colH: r.col_h || r.total_member_count || 0,
      colI: r.col_i || r.total_disbursed_amount || 0,
      colJ: r.col_j || r.net_measure || 0,
    };
  });

  return {
    data: items,
    totalCount: items.length
  };
}

export async function saveBankRowToDb(b: any) {
  const db = await getDb();
  const addedAt = new Date().toLocaleString('ta-IN');

  const dateVal = b.date || '';
  const memPay = parseFloat(b.memberPayment || 0) || 0;
  const disbCnt = parseFloat(b.disbursementMemberCount || 0) || 0;
  const disbAmt = parseFloat(b.disbursementAmount || 0) || 0;
  const bankPay = parseFloat(b.bankPayment || 0) || 0;

  // Check if an existing row matches key parameters to avoid creating duplicate rows
  const existing = queryObjects(db, `
    SELECT id FROM bank_sheet 
    WHERE date=? AND member_payment=? AND disbursement_amount=? AND bank_payment=?
    LIMIT 1
  `, [dateVal, memPay, disbAmt, bankPay]);

  if (existing && existing.length > 0) {
    const idToUpdate = existing[0].id;
    runQuery(db, `
      UPDATE bank_sheet SET
        disbursement_member_count=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE id=?
    `, [
      disbCnt,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      idToUpdate
    ]);
  } else {
    runQuery(db, `
      INSERT INTO bank_sheet (
        date, member_payment, disbursement_member_count, disbursement_amount, bank_payment,
        bank_level_balance, member_level_total, total_member_count, total_disbursed_amount,
        net_measure, bank_outstanding_status, col_f, col_g, col_h, col_i, col_j, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dateVal, memPay, disbCnt, disbAmt, bankPay,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      addedAt
    ]);
  }
  saveDb();
}

export async function updateBankRowInDb(b: any, id?: string, oldDate?: string, rowIndex?: number) {
  const db = await getDb();
  let dbId = id;
  if (dbId && typeof dbId === 'string' && dbId.startsWith('db-bank-')) {
    dbId = dbId.replace('db-bank-', '');
  }

  if (dbId && !isNaN(Number(dbId)) && Number(dbId) > 0) {
    runQuery(db, `
      UPDATE bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE id=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      Number(dbId)
    ]);
  } else if (oldDate || b.date) {
    const targetDate = oldDate || b.date;
    runQuery(db, `
      UPDATE bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE date=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      targetDate
    ]);
  } else if (rowIndex) {
    runQuery(db, `
      UPDATE bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE row_index=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      rowIndex
    ]);
  }
  saveDb();
}

export async function deleteBankRowFromDb(idOrDate?: string, rowIndex?: number, date?: string) {
  const db = await getDb();
  let deleted = false;

  if (idOrDate) {
    const rawId = String(idOrDate).replace('db-bank-', '');
    if (!isNaN(Number(rawId)) && Number(rawId) > 0) {
      runQuery(db, 'DELETE FROM bank_sheet WHERE id=?', [Number(rawId)]);
      deleted = true;
    }
  }

  if (!deleted && date) {
    runQuery(db, 'DELETE FROM bank_sheet WHERE date=?', [date]);
    deleted = true;
  }

  if (!deleted && idOrDate && typeof idOrDate === 'string' && !idOrDate.startsWith('db-bank-')) {
    runQuery(db, 'DELETE FROM bank_sheet WHERE date=? OR id=?', [idOrDate, idOrDate]);
    deleted = true;
  }

  if (!deleted && rowIndex) {
    runQuery(db, 'DELETE FROM bank_sheet WHERE row_index=?', [rowIndex]);
    deleted = true;
  }

  saveDb();
}

export async function clearAllBankRowsFromDb() {
  const db = await getDb();
  runQuery(db, 'DELETE FROM bank_sheet');
  saveDb();
}

export async function getAppSettingFromDb(key: string): Promise<string> {
  const db = await getDb();
  const rows = queryObjects(db, 'SELECT value FROM app_settings WHERE key=?', [key]);
  return rows[0]?.value || '';
}

export async function saveAppSettingToDb(key: string, value: string) {
  const db = await getDb();
  runQuery(db, 'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, value]);
  saveDb();
}

// =====================================
// AH PADUVADA DATABASE FUNCTIONS
// =====================================

export async function deduplicateAhPaduvadaInDb() {
  const db = await getDb();
  try {
    runQuery(db, `
      DELETE FROM ah_paduvada
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM ah_paduvada 
        GROUP BY a_class, current_disb_no, livestock_type, livestock_count, total_loan_amount
      )
    `);
  } catch (err) {
    console.error('Error deduplicating ah_paduvada in DB:', err);
  }
}

export async function getAhPaduvadaFromDb(disbNo?: string) {
  const db = await getDb();
  await deduplicateAhPaduvadaInDb();

  let sql = 'SELECT * FROM ah_paduvada ORDER BY id ASC';
  let params: any[] = [];

  const targetDisb = (disbNo || '').toString().trim();
  if (targetDisb !== '') {
    sql = 'SELECT * FROM ah_paduvada WHERE current_disb_no=? OR current_disb_no=? ORDER BY id ASC';
    params = [targetDisb, parseInt(targetDisb, 10).toString()];
  }

  const rows = queryObjects(db, sql, params);

  const items = rows.map((r, index) => ({
    id: `db-ah-${r.id}`,
    dbId: r.id,
    rowIndex: r.row_index || (index + 2),
    financialYear: r.financial_year || '',
    rclNumber: r.rcl_number || '',
    rclDate: r.rcl_date || '',
    sanctionedAmount: r.sanctioned_amount || '',
    officerDesignation: r.officer_designation || '',
    officerName: r.officer_name || '',
    currentDisbNo: r.current_disb_no || '',
    resolutionNo: r.resolution_no || '',
    resolutionDate: r.resolution_date || '',
    aClass: r.a_class || '',
    memberNo: r.a_class || '',
    name: r.name || '',
    careOf: r.care_of || '',
    fatherOrHusbandName: r.care_of || '',
    sb: r.sb || '',
    erp: r.erp || '',
    ins: r.ins || '',
    door: r.door || '',
    street: r.street || '',
    village: r.village || '',
    aadharNo: r.aadhar_no || '',
    adhar: r.aadhar_no || '',
    mobile: r.mobile || '',
    rationCard: r.ration_card || '',
    namini: r.namini || '',
    relation: r.relation || '',
    mdcc: r.mdcc || '',
    caste: r.caste || '',
    category: r.caste || '',
    totalShare: r.total_share || '',
    surveyNo: r.survey_no || '',
    acres: r.acres || r.livestock_count || '',
    crop: r.crop || r.livestock_type || '',
    livestockType: r.livestock_type || r.crop || 'மாடுகள்',
    livestockCount: r.livestock_count || r.acres || '',
    seed: r.seed || '0',
    chemicalFertilizer: r.chemical_fertilizer || '0',
    pesticide: r.pesticide || '0',
    plowing: r.plowing || '0',
    harvesting: r.harvesting || '0',
    fertilizerKind: r.fertilizer_kind || '0',
    organicFertilizer: r.organic_fertilizer || r.loan_amount || '0',
    cash: r.organic_fertilizer || r.loan_amount || '0',
    totalLoanAmount: r.total_loan_amount || '',
    loanAmount: r.loan_amount || r.total_loan_amount || '',
    farmerClass: r.farmer_class || 'MF',
    disability: r.disability || '0',
    mortgageType: r.mortgage_type || '',
    guaranteeType: r.guarantee_type || '',
    passbookFee: r.passbook_fee || '0',
    insurance: r.insurance || '0',
    shareCapital: r.share_capital || '0',
    prevLoanNo: r.prev_loan_no || 'AH -',
    prevLoanDate: r.prev_loan_date || '',
    prevLoanAmount: r.prev_loan_amount || '0',
    addedAt: r.added_at || ''
  }));

  let maxDisbNo = 0;
  items.forEach(item => {
    const val = parseInt((item.currentDisbNo || '').toString().trim(), 10);
    if (!isNaN(val) && val > maxDisbNo) {
      maxDisbNo = val;
    }
  });

  return {
    data: items,
    totalCount: items.length,
    maxDisbNo: maxDisbNo > 0 ? maxDisbNo.toString() : '0'
  };
}

export async function saveAhPaduvadaToDb(p: any) {
  const db = await getDb();
  const addedAt = p.addedAt || new Date().toLocaleString('ta-IN');
  const targetAClass = p.aClass || p.memberNo || '';
  const targetDisbNo = p.currentDisbNo || '';
  const targetLivestock = p.livestockType || p.crop || '';
  const targetCount = p.livestockCount || p.acres || '';

  // If record with same A-Class, Disb No, and Livestock Type exists, update it to avoid duplicates
  if (targetAClass && targetDisbNo) {
    const existing = queryObjects(db, `
      SELECT id FROM ah_paduvada
      WHERE a_class=? AND current_disb_no=? AND (livestock_type=? OR crop=? OR ?='')
      LIMIT 1
    `, [targetAClass, targetDisbNo, targetLivestock, targetLivestock, targetLivestock]);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      runQuery(db, `
        UPDATE ah_paduvada SET
          financial_year=?, rcl_number=?, rcl_date=?, sanctioned_amount=?, officer_designation=?, officer_name=?,
          current_disb_no=?, resolution_no=?, resolution_date=?,
          name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
          ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
          crop=?, livestock_type=?, livestock_count=?, seed=?, chemical_fertilizer=?, pesticide=?,
          plowing=?, harvesting=?, fertilizer_kind=?, organic_fertilizer=?, total_loan_amount=?, loan_amount=?,
          farmer_class=?, disability=?, mortgage_type=?, guarantee_type=?, passbook_fee=?, insurance=?,
          share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?, added_at=?
        WHERE id=?
      `, [
        p.financialYear || '', p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.officerDesignation || '', p.officerName || '',
        p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
        p.name || '', p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '',
        p.aadharNo || p.adhar || '', p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || p.category || '',
        p.totalShare ?? p.landAcres ?? '', p.surveyNo || '-', p.acres || targetCount || '',
        targetLivestock, targetLivestock, targetCount, p.seed || '0', p.chemicalFertilizer || '0', p.pesticide || '0',
        p.plowing || '0', p.harvesting || '0', p.fertilizerKind || '0', p.organicFertilizer || p.loanAmount || '0',
        p.totalLoanAmount || '', p.loanAmount || '', p.farmerClass || 'MF', p.disability || '0', p.mortgageType || '',
        p.guaranteeType || '', p.passbookFee || '0', p.insurance || '0', p.shareCapital || '0',
        p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
        addedAt, existingId
      ]);
      return;
    }
  }

  runQuery(db, `
    INSERT INTO ah_paduvada (
      financial_year, rcl_number, rcl_date, sanctioned_amount, officer_designation, officer_name,
      current_disb_no, resolution_no, resolution_date,
      a_class, name, care_of, sb, erp, ins, door, street, village, aadhar_no, mobile, ration_card,
      namini, relation, mdcc, caste, total_share, survey_no, acres, crop, livestock_type, livestock_count,
      seed, chemical_fertilizer, pesticide, plowing, harvesting, fertilizer_kind, organic_fertilizer,
      total_loan_amount, loan_amount, farmer_class, disability, mortgage_type, guarantee_type,
      passbook_fee, insurance, share_capital, prev_loan_no, prev_loan_date, prev_loan_amount, added_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    p.financialYear || '', p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.officerDesignation || '', p.officerName || '',
    p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
    targetAClass, p.name || '', p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '',
    p.door || '', p.street || '', p.village || '', p.aadharNo || p.adhar || '',
    p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
    p.mdcc || '', p.caste || p.category || '', p.totalShare ?? p.landAcres ?? '', p.surveyNo || '-',
    p.acres || targetCount || '', targetLivestock, targetLivestock, targetCount,
    p.seed || '0', p.chemicalFertilizer || '0', p.pesticide || '0', p.plowing || '0', p.harvesting || '0',
    p.fertilizerKind || '0', p.organicFertilizer || p.loanAmount || '0', p.totalLoanAmount || '', p.loanAmount || '',
    p.farmerClass || 'MF', p.disability || '0', p.mortgageType || '', p.guaranteeType || '',
    p.passbookFee || '0', p.insurance || '0', p.shareCapital || '0',
    p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
    addedAt
  ]);
}

export async function updateAhPaduvadaInDb(p: any, aClass?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = await getDb();
  const targetAClass = aClass || p.aClass || p.memberNo || '';
  const targetDisbNo = currentDisbNo || p.currentDisbNo || '';
  const targetLivestock = crop || p.livestockType || p.crop || '';
  const targetId = id || p.dbId || (String(p.id || '').startsWith('db-ah-') ? String(p.id).split('-')[2] : '');

  if (targetId && !isNaN(parseInt(targetId, 10))) {
    const numId = parseInt(targetId, 10);
    runQuery(db, `
      UPDATE ah_paduvada SET
        financial_year=?, rcl_number=?, rcl_date=?, sanctioned_amount=?, officer_designation=?, officer_name=?,
        current_disb_no=?, resolution_no=?, resolution_date=?,
        name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
        ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
        crop=?, livestock_type=?, livestock_count=?, seed=?, chemical_fertilizer=?, pesticide=?,
        plowing=?, harvesting=?, fertilizer_kind=?, organic_fertilizer=?, total_loan_amount=?, loan_amount=?,
        farmer_class=?, disability=?, mortgage_type=?, guarantee_type=?, passbook_fee=?, insurance=?,
        share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?
      WHERE id=?
    `, [
      p.financialYear || '', p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.officerDesignation || '', p.officerName || '',
      p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
      p.name || '', p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '',
      p.aadharNo || p.adhar || '', p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || p.category || '',
      p.totalShare ?? p.landAcres ?? '', p.surveyNo || '-', p.acres || p.livestockCount || '',
      targetLivestock, targetLivestock, p.livestockCount || p.acres || '',
      p.seed || '0', p.chemicalFertilizer || '0', p.pesticide || '0', p.plowing || '0', p.harvesting || '0',
      p.fertilizerKind || '0', p.organicFertilizer || p.loanAmount || '0', p.totalLoanAmount || '', p.loanAmount || '',
      p.farmerClass || 'MF', p.disability || '0', p.mortgageType || '', p.guaranteeType || '',
      p.passbookFee || '0', p.insurance || '0', p.shareCapital || '0',
      p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
      numId
    ]);
    return;
  }

  if (!targetAClass) return;

  runQuery(db, `
    UPDATE ah_paduvada SET
      financial_year=?, rcl_number=?, rcl_date=?, sanctioned_amount=?, officer_designation=?, officer_name=?,
      current_disb_no=?, resolution_no=?, resolution_date=?,
      name=?, care_of=?, sb=?, erp=?, ins=?, door=?, street=?, village=?, aadhar_no=?, mobile=?,
      ration_card=?, namini=?, relation=?, mdcc=?, caste=?, total_share=?, survey_no=?, acres=?,
      crop=?, livestock_type=?, livestock_count=?, seed=?, chemical_fertilizer=?, pesticide=?,
      plowing=?, harvesting=?, fertilizer_kind=?, organic_fertilizer=?, total_loan_amount=?, loan_amount=?,
      farmer_class=?, disability=?, mortgage_type=?, guarantee_type=?, passbook_fee=?, insurance=?,
      share_capital=?, prev_loan_no=?, prev_loan_date=?, prev_loan_amount=?
    WHERE a_class=? ${targetDisbNo ? 'AND current_disb_no=?' : ''}
  `, targetDisbNo ? [
    p.financialYear || '', p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.officerDesignation || '', p.officerName || '',
    p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
    p.name || '', p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '',
    p.aadharNo || p.adhar || '', p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || p.category || '',
    p.totalShare ?? p.landAcres ?? '', p.surveyNo || '-', p.acres || p.livestockCount || '',
    targetLivestock, targetLivestock, p.livestockCount || p.acres || '',
    p.seed || '0', p.chemicalFertilizer || '0', p.pesticide || '0', p.plowing || '0', p.harvesting || '0',
    p.fertilizerKind || '0', p.organicFertilizer || p.loanAmount || '0', p.totalLoanAmount || '', p.loanAmount || '',
    p.farmerClass || 'MF', p.disability || '0', p.mortgageType || '', p.guaranteeType || '',
    p.passbookFee || '0', p.insurance || '0', p.shareCapital || '0',
    p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
    targetAClass, targetDisbNo
  ] : [
    p.financialYear || '', p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.officerDesignation || '', p.officerName || '',
    p.currentDisbNo || '', p.resolutionNo || '', p.resolutionDate || '',
    p.name || '', p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '', p.door || '', p.street || '', p.village || '',
    p.aadharNo || p.adhar || '', p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '', p.mdcc || '', p.caste || p.category || '',
    p.totalShare ?? p.landAcres ?? '', p.surveyNo || '-', p.acres || p.livestockCount || '',
    targetLivestock, targetLivestock, p.livestockCount || p.acres || '',
    p.seed || '0', p.chemicalFertilizer || '0', p.pesticide || '0', p.plowing || '0', p.harvesting || '0',
    p.fertilizerKind || '0', p.organicFertilizer || p.loanAmount || '0', p.totalLoanAmount || '', p.loanAmount || '',
    p.farmerClass || 'MF', p.disability || '0', p.mortgageType || '', p.guaranteeType || '',
    p.passbookFee || '0', p.insurance || '0', p.shareCapital || '0',
    p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
    targetAClass
  ]);
}

export async function deleteAhPaduvadaFromDb(aClass?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = await getDb();
  if (id) {
    const rawId = String(id).startsWith('db-ah-') ? parseInt(String(id).split('-')[2], 10) : parseInt(id, 10);
    if (!isNaN(rawId) && rawId > 0) {
      runQuery(db, 'DELETE FROM ah_paduvada WHERE id=?', [rawId]);
      return;
    }
  }
  if (!aClass) return;

  if (currentDisbNo && crop) {
    runQuery(db, 'DELETE FROM ah_paduvada WHERE a_class=? AND current_disb_no=? AND (livestock_type=? OR crop=?)', [aClass, currentDisbNo, crop, crop]);
  } else if (currentDisbNo) {
    runQuery(db, 'DELETE FROM ah_paduvada WHERE a_class=? AND current_disb_no=?', [aClass, currentDisbNo]);
  } else {
    runQuery(db, 'DELETE FROM ah_paduvada WHERE a_class=?', [aClass]);
  }
}

// =====================================
// AH BANK SHEET DATABASE FUNCTIONS
// =====================================

export async function deduplicateAhBankSheetInDb() {
  const db = await getDb();
  try {
    runQuery(db, `
      DELETE FROM ah_bank_sheet 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM ah_bank_sheet 
        GROUP BY date, member_payment, disbursement_member_count, disbursement_amount, bank_payment
      )
    `);
  } catch (err) {
    console.error('Error deduplicating ah_bank_sheet in DB:', err);
  }
}

export async function getAhBankSheetFromDb() {
  const db = await getDb();
  await deduplicateAhBankSheetInDb();

  const rows = queryObjects(db, 'SELECT * FROM ah_bank_sheet ORDER BY id ASC');

  const items = rows.map((r, index) => {
    const netVal = r.net_measure || 0;
    const defaultOutstandingText = netVal >= 0 ? 'வங்கியில் அதிகமாக உள்ளது' : 'வங்கிக்கு இன்னும் செலுத்த வேண்டும்';

    return {
      id: `db-ah-bank-${r.id}`,
      rowIndex: r.row_index || (index + 2),
      date: r.date || '',
      memberPayment: r.member_payment || 0,
      disbursementMemberCount: r.disbursement_member_count || 0,
      disbursementAmount: r.disbursement_amount || 0,
      bankPayment: r.bank_payment || 0,
      bankLevelBalance: r.bank_level_balance || 0,
      memberLevelTotal: r.member_level_total || 0,
      totalMemberCount: r.total_member_count || 0,
      totalDisbursedAmount: r.total_disbursed_amount || 0,
      netMeasure: netVal,
      bankOutstandingStatus: r.bank_outstanding_status || defaultOutstandingText,
      colF: r.col_f || r.bank_level_balance || 0,
      colG: r.col_g || r.member_level_total || 0,
      colH: r.col_h || r.total_member_count || 0,
      colI: r.col_i || r.total_disbursed_amount || 0,
      colJ: r.col_j || r.net_measure || 0,
    };
  });

  return {
    data: items,
    totalCount: items.length
  };
}

export async function saveAhBankRowToDb(b: any) {
  const db = await getDb();
  const addedAt = new Date().toLocaleString('ta-IN');

  const dateVal = b.date || '';
  const memPay = parseFloat(b.memberPayment || 0) || 0;
  const disbCnt = parseFloat(b.disbursementMemberCount || 0) || 0;
  const disbAmt = parseFloat(b.disbursementAmount || 0) || 0;
  const bankPay = parseFloat(b.bankPayment || 0) || 0;

  const existing = queryObjects(db, `
    SELECT id FROM ah_bank_sheet 
    WHERE date=? AND member_payment=? AND disbursement_amount=? AND bank_payment=?
    LIMIT 1
  `, [dateVal, memPay, disbAmt, bankPay]);

  if (existing && existing.length > 0) {
    const idToUpdate = existing[0].id;
    runQuery(db, `
      UPDATE ah_bank_sheet SET
        disbursement_member_count=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE id=?
    `, [
      disbCnt,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      idToUpdate
    ]);
  } else {
    runQuery(db, `
      INSERT INTO ah_bank_sheet (
        date, member_payment, disbursement_member_count, disbursement_amount, bank_payment,
        bank_level_balance, member_level_total, total_member_count, total_disbursed_amount,
        net_measure, bank_outstanding_status, col_f, col_g, col_h, col_i, col_j, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dateVal, memPay, disbCnt, disbAmt, bankPay,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      addedAt
    ]);
  }
  saveDb();
}

export async function updateAhBankRowInDb(b: any, id?: string, oldDate?: string, rowIndex?: number) {
  const db = await getDb();
  let dbId = id;
  if (dbId && typeof dbId === 'string' && dbId.startsWith('db-ah-bank-')) {
    dbId = dbId.replace('db-ah-bank-', '');
  }

  if (dbId && !isNaN(Number(dbId)) && Number(dbId) > 0) {
    runQuery(db, `
      UPDATE ah_bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE id=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      Number(dbId)
    ]);
  } else if (oldDate || b.date) {
    const targetDate = oldDate || b.date;
    runQuery(db, `
      UPDATE ah_bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE date=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      targetDate
    ]);
  } else if (rowIndex) {
    runQuery(db, `
      UPDATE ah_bank_sheet SET
        date=?, member_payment=?, disbursement_member_count=?, disbursement_amount=?, bank_payment=?,
        bank_level_balance=?, member_level_total=?, total_member_count=?, total_disbursed_amount=?,
        net_measure=?, bank_outstanding_status=?, col_f=?, col_g=?, col_h=?, col_i=?, col_j=?
      WHERE row_index=?
    `, [
      b.date || '',
      parseFloat(b.memberPayment || 0) || 0,
      parseFloat(b.disbursementMemberCount || 0) || 0,
      parseFloat(b.disbursementAmount || 0) || 0,
      parseFloat(b.bankPayment || 0) || 0,
      parseFloat(b.bankLevelBalance || b.colF || 0) || 0,
      parseFloat(b.memberLevelTotal || b.colG || 0) || 0,
      parseFloat(b.totalMemberCount || b.colH || 0) || 0,
      parseFloat(b.totalDisbursedAmount || b.colI || 0) || 0,
      parseFloat(b.netMeasure || b.colJ || 0) || 0,
      b.bankOutstandingStatus || '',
      String(b.colF || ''),
      String(b.colG || ''),
      String(b.colH || ''),
      String(b.colI || ''),
      String(b.colJ || ''),
      rowIndex
    ]);
  }
  saveDb();
}

export async function deleteAhBankRowFromDb(idOrDate?: string, rowIndex?: number, date?: string) {
  const db = await getDb();
  let deleted = false;

  if (idOrDate) {
    const rawId = String(idOrDate).replace('db-ah-bank-', '');
    if (!isNaN(Number(rawId)) && Number(rawId) > 0) {
      runQuery(db, 'DELETE FROM ah_bank_sheet WHERE id=?', [Number(rawId)]);
      deleted = true;
    }
  }

  if (!deleted && date) {
    runQuery(db, 'DELETE FROM ah_bank_sheet WHERE date=?', [date]);
    deleted = true;
  }

  if (!deleted && idOrDate && typeof idOrDate === 'string' && !idOrDate.startsWith('db-ah-bank-')) {
    runQuery(db, 'DELETE FROM ah_bank_sheet WHERE date=? OR id=?', [idOrDate, idOrDate]);
    deleted = true;
  }

  if (!deleted && rowIndex) {
    runQuery(db, 'DELETE FROM ah_bank_sheet WHERE row_index=?', [rowIndex]);
    deleted = true;
  }

  saveDb();
}

export async function clearAllAhBankRowsFromDb() {
  const db = await getDb();
  runQuery(db, 'DELETE FROM ah_bank_sheet');
  saveDb();
}

