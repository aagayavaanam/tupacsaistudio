import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firestoreInstance: any = null;

function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (typeof value === 'number') {
    return (Number.isNaN(value) ? 0 : value) as unknown as T;
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefinedDeep(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function sanitizeFirestoreDocId(raw: string, fallbackPrefix = 'doc'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/\//g, '_')
    .replace(/[^a-zA-Z0-9_\u0B80-\u0BFF-]/g, '_')
    .replace(/^__+|__+$/g, '');
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

function isValidPaduvadaRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const aClass = String(item.aClass || item.memberNo || '').trim();
  const name = String(item.name || '').trim();
  return Boolean(aClass || name);
}

export function getFirebaseDb() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const apps = getApps();
      const app = apps.length === 0 ? initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      }) : apps[0];

      const databaseId = config.firestoreDatabaseId;
      firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
      console.log('✅ Firebase Firestore connected successfully. DB ID:', databaseId || '(default)');
      return firestoreInstance;
    }
  } catch (err: any) {
    console.error('❌ Error initializing Firebase Firestore:', err?.message || err);
  }
  return null;
}

// =====================================
// KCC BANK SHEET FIRESTORE OPERATIONS
// =====================================

export async function getBankRowsFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'bank_sheet'));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by id or createdAt or date
    items.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeA - timeB;
    });

    // Deduplicate items with identical date and financial figures
    const uniqueItems: any[] = [];
    const seenKeys = new Set<string>();
    for (const item of items) {
      const key = `${item.date || ''}_${item.memberPayment || 0}_${item.disbursementAmount || 0}_${item.bankPayment || 0}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  } catch (err: any) {
    console.error('Error fetching bank rows from Firestore:', err?.message || err);
    return null;
  }
}

export async function saveBankRowToFirestore(bankRow: any) {
  const db = getFirebaseDb();
  if (!db || !bankRow) return false;

  try {
    const cleanDate = (bankRow.date || 'nodate').replace(/[^a-zA-Z0-9]/g, '_');
    const rawId = String(bankRow.id || '').trim();
    const docId = sanitizeFirestoreDocId(
      rawId && !rawId.startsWith('db-bank-') && !rawId.startsWith('bank-row-')
        ? rawId
        : `bank_${cleanDate}_${bankRow.memberPayment || 0}_${bankRow.disbursementAmount || 0}_${bankRow.bankPayment || 0}`,
      'bank'
    );
    const rowData = stripUndefinedDeep({
      ...bankRow,
      id: docId,
      createdAt: bankRow.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'bank_sheet', docId), rowData, { merge: true });
    console.log(`Saved bank row ${docId} to Firebase Firestore.`);
    return true;
  } catch (err: any) {
    console.error('Error saving bank row to Firestore:', err?.message || err);
    return false;
  }
}

export async function deleteBankRowFromFirestore(docId: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, 'bank_sheet', sanitizeFirestoreDocId(docId, 'bank')));
    console.log(`Deleted bank row ${docId} from Firebase Firestore.`);
    return true;
  } catch (err: any) {
    console.error('Error deleting bank row from Firestore:', err?.message || err);
    return false;
  }
}

// =====================================
// MEMBERS FIRESTORE OPERATIONS
// =====================================

export async function getMembersFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'members'));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } catch (err: any) {
    console.error('Error fetching members from Firestore:', err?.message || err);
    return null;
  }
}

export async function saveMemberToFirestore(member: any) {
  const db = getFirebaseDb();
  if (!db || !member) return false;

  try {
    const memberNo = String(member.memberNo || member.aClass || '').trim();
    if (!memberNo) return false;

    const docId = sanitizeFirestoreDocId(`mem_${memberNo}`, 'mem');
    const data = stripUndefinedDeep({
      ...member,
      memberNo,
      aClass: member.aClass || memberNo,
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'members', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving member to Firestore:', err?.message || err);
    return false;
  }
}

export async function deleteMemberFromFirestore(memberNo: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const cleanNo = String(memberNo).trim();
    if (!cleanNo) return false;
    await deleteDoc(doc(db, 'members', sanitizeFirestoreDocId(`mem_${cleanNo}`, 'mem')));
    return true;
  } catch (err: any) {
    console.error('Error deleting member from Firestore:', err?.message || err);
    return false;
  }
}

// =====================================
// PADUVADA FIRESTORE OPERATIONS
// =====================================

export async function getPaduvadaFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'paduvada'));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      const record = { id: docSnap.id, ...docSnap.data() };
      if (isValidPaduvadaRecord(record)) {
        items.push(record);
      }
    });
    return items;
  } catch (err: any) {
    console.error('Error fetching paduvada from Firestore:', err?.message || err);
    return null;
  }
}

export async function savePaduvadaToFirestore(paduvada: any) {
  const db = getFirebaseDb();
  if (!db || !isValidPaduvadaRecord(paduvada)) return false;

  try {
    const clean = (v: any) => String(v || '').trim().replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_');
    const targetAClass = clean(paduvada.aClass || paduvada.memberNo);
    const targetDisbNo = clean(paduvada.currentDisbNo);
    const targetCrop = clean(paduvada.crop);
    const targetSurvey = clean(paduvada.surveyNo);

    const existingId = String(paduvada.id || '');
    const docId = sanitizeFirestoreDocId(
      existingId && existingId.startsWith('pad_')
        ? existingId
        : (targetAClass && targetDisbNo
            ? `pad_${targetDisbNo}_${targetAClass}_${targetCrop || 'crop'}_${targetSurvey || '0'}`
            : `pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      'pad'
    );

    const data = stripUndefinedDeep({
      ...paduvada,
      id: docId,
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'paduvada', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving paduvada to Firestore:', err?.message || err);
    return false;
  }
}

export async function deletePaduvadaFromFirestore(aClass?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    let deletedAny = false;
    if (id && !String(id).startsWith('db-') && !String(id).startsWith('sheet-')) {
      await deleteDoc(doc(db, 'paduvada', sanitizeFirestoreDocId(String(id), 'pad')));
      deletedAny = true;
    }

    const targetAClass = String(aClass || '').trim().toLowerCase();
    const targetDisb = String(currentDisbNo || '').trim();
    const targetDisbNum = parseInt(targetDisb, 10);
    const targetCrop = String(crop || '').trim().toLowerCase();

    if (targetAClass || id) {
      const snapshot = await getDocs(collection(db, 'paduvada'));
      const batch = writeBatch(db);
      let count = 0;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const idMatches = Boolean(id && (docSnap.id === id || d.id === id));
        const rowAClass = String(d.aClass || d.memberNo || '').trim().toLowerCase();
        const rowDisb = String(d.currentDisbNo || '').trim();
        const rowDisbNum = parseInt(rowDisb, 10);
        const rowCrop = String(d.crop || '').trim().toLowerCase();

        const disbMatches = !targetDisb || rowDisb === targetDisb || (!isNaN(targetDisbNum) && !isNaN(rowDisbNum) && rowDisbNum === targetDisbNum);
        const cropMatches = !targetCrop || rowCrop === targetCrop;
        const keyMatches = Boolean(targetAClass && rowAClass === targetAClass && disbMatches && cropMatches);

        if (idMatches || keyMatches) {
          batch.delete(doc(db, 'paduvada', docSnap.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        deletedAny = true;
      }
    }

    return deletedAny;
  } catch (err: any) {
    console.error('Error deleting paduvada from Firestore:', err?.message || err);
    return false;
  }
}

export async function updateBatchResolutionInFirestore(currentDisbNo: string, resolutionDate?: string, resolutionNo?: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const targetDisb = String(currentDisbNo || '').trim();
    if (!targetDisb) return false;
    const snapshot = await getDocs(collection(db, 'paduvada'));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const itemDisb = String(d.currentDisbNo || '').trim();
      const targetNum = parseInt(targetDisb, 10);
      const itemNum = parseInt(itemDisb, 10);
      if (itemDisb === targetDisb || (!isNaN(targetNum) && !isNaN(itemNum) && itemNum === targetNum)) {
        const updateFields: any = { updatedAt: new Date().toISOString() };
        if (resolutionDate !== undefined) updateFields.resolutionDate = resolutionDate;
        if (resolutionNo !== undefined && resolutionNo !== '') updateFields.resolutionNo = resolutionNo;
        batch.set(doc(db, 'paduvada', docSnap.id), updateFields, { merge: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
    return true;
  } catch (err: any) {
    console.error('Error updating batch resolution in Firestore:', err?.message || err);
    return false;
  }
}

// =====================================
// AH PADUVADA FIRESTORE OPERATIONS
// =====================================

export async function getAhPaduvadaFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'ah_paduvada'));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      const record = { id: docSnap.id, ...docSnap.data() };
      if (isValidPaduvadaRecord(record)) {
        items.push(record);
      }
    });
    return items;
  } catch (err: any) {
    console.error('Error fetching AH paduvada from Firestore:', err?.message || err);
    return null;
  }
}

export async function saveAhPaduvadaToFirestore(paduvada: any) {
  const db = getFirebaseDb();
  if (!db || !isValidPaduvadaRecord(paduvada)) return false;

  try {
    const clean = (v: any) => String(v || '').trim().replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_');
    const targetAClass = clean(paduvada.aClass || paduvada.memberNo);
    const targetDisbNo = clean(paduvada.currentDisbNo);
    const targetLivestock = clean(paduvada.livestockType || paduvada.crop);
    const existingId = String(paduvada.id || '');
    const docId = sanitizeFirestoreDocId(
      existingId && existingId.startsWith('ah_pad_')
        ? existingId
        : (targetAClass && targetDisbNo
            ? `ah_pad_${targetDisbNo}_${targetAClass}_${targetLivestock || 'ah'}`
            : `ah_pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      'ah_pad'
    );

    const data = stripUndefinedDeep({
      ...paduvada,
      id: docId,
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'ah_paduvada', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving AH paduvada to Firestore:', err?.message || err);
    return false;
  }
}

export async function deleteAhPaduvadaFromFirestore(aClassOrDocId?: string, currentDisbNo?: string, crop?: string, id?: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    let deletedAny = false;
    const explicitId = id || (aClassOrDocId && String(aClassOrDocId).startsWith('ah_pad_') ? aClassOrDocId : '');
    if (explicitId && !String(explicitId).startsWith('db-ah-') && !String(explicitId).startsWith('sheet-ah-')) {
      await deleteDoc(doc(db, 'ah_paduvada', sanitizeFirestoreDocId(String(explicitId), 'ah_pad')));
      deletedAny = true;
    }

    const targetAClass = (!aClassOrDocId || String(aClassOrDocId).startsWith('ah_pad_') || String(aClassOrDocId).startsWith('db-ah-'))
      ? ''
      : String(aClassOrDocId).trim().toLowerCase();
    const targetDisb = String(currentDisbNo || '').trim();
    const targetDisbNum = parseInt(targetDisb, 10);
    const targetCrop = String(crop || '').trim().toLowerCase();

    if (targetAClass || explicitId || id) {
      const snapshot = await getDocs(collection(db, 'ah_paduvada'));
      const batch = writeBatch(db);
      let count = 0;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const idMatches = Boolean((explicitId && (docSnap.id === explicitId || d.id === explicitId)) || (id && (docSnap.id === id || d.id === id)));
        const rowAClass = String(d.aClass || d.memberNo || '').trim().toLowerCase();
        const rowDisb = String(d.currentDisbNo || '').trim();
        const rowDisbNum = parseInt(rowDisb, 10);
        const rowCrop = String(d.livestockType || d.crop || '').trim().toLowerCase();

        const disbMatches = !targetDisb || rowDisb === targetDisb || (!isNaN(targetDisbNum) && !isNaN(rowDisbNum) && rowDisbNum === targetDisbNum);
        const cropMatches = !targetCrop || rowCrop === targetCrop;
        const keyMatches = Boolean(targetAClass && rowAClass === targetAClass && disbMatches && cropMatches);

        if (idMatches || keyMatches) {
          batch.delete(doc(db, 'ah_paduvada', docSnap.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        deletedAny = true;
      }
    }

    return deletedAny;
  } catch (err: any) {
    console.error('Error deleting AH paduvada from Firestore:', err?.message || err);
    return false;
  }
}

export async function updateAhBatchResolutionInFirestore(currentDisbNo: string, resolutionDate?: string, resolutionNo?: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const targetDisb = String(currentDisbNo || '').trim();
    if (!targetDisb) return false;
    const snapshot = await getDocs(collection(db, 'ah_paduvada'));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const itemDisb = String(d.currentDisbNo || '').trim();
      const targetNum = parseInt(targetDisb, 10);
      const itemNum = parseInt(itemDisb, 10);
      if (itemDisb === targetDisb || (!isNaN(targetNum) && !isNaN(itemNum) && itemNum === targetNum)) {
        const updateFields: any = { updatedAt: new Date().toISOString() };
        if (resolutionDate !== undefined) updateFields.resolutionDate = resolutionDate;
        if (resolutionNo !== undefined && resolutionNo !== '') updateFields.resolutionNo = resolutionNo;
        batch.set(doc(db, 'ah_paduvada', docSnap.id), updateFields, { merge: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
    return true;
  } catch (err: any) {
    console.error('Error updating AH batch resolution in Firestore:', err?.message || err);
    return false;
  }
}

// =====================================
// AH BANK SHEET FIRESTORE OPERATIONS
// =====================================

export async function getAhBankRowsFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'ah_bank_sheet'));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    items.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeA - timeB;
    });

    const uniqueItems: any[] = [];
    const seenKeys = new Set<string>();
    for (const item of items) {
      const key = `${item.date || ''}_${item.memberPayment || 0}_${item.disbursementAmount || 0}_${item.bankPayment || 0}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  } catch (err: any) {
    console.error('Error fetching AH bank rows from Firestore:', err?.message || err);
    return null;
  }
}

export async function saveAhBankRowToFirestore(bankRow: any) {
  const db = getFirebaseDb();
  if (!db || !bankRow) return false;

  try {
    const cleanDate = (bankRow.date || 'nodate').replace(/[^a-zA-Z0-9]/g, '_');
    const rawId = String(bankRow.id || '').trim();
    const docId = sanitizeFirestoreDocId(
      rawId && !rawId.startsWith('db-ah-bank-') && !rawId.startsWith('bank-row-') && !rawId.startsWith('ah-bank-row-')
        ? rawId
        : `ah_bank_${cleanDate}_${bankRow.memberPayment || 0}_${bankRow.disbursementAmount || 0}_${bankRow.bankPayment || 0}`,
      'ah_bank'
    );
    const rowData = stripUndefinedDeep({
      ...bankRow,
      id: docId,
      createdAt: bankRow.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'ah_bank_sheet', docId), rowData, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving AH bank row to Firestore:', err?.message || err);
    return false;
  }
}

export async function deleteAhBankRowFromFirestore(docId: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, 'ah_bank_sheet', sanitizeFirestoreDocId(docId, 'ah_bank')));
    return true;
  } catch (err: any) {
    console.error('Error deleting AH bank row from Firestore:', err?.message || err);
    return false;
  }
}

// =====================================
// APP SETTINGS FIRESTORE OPERATIONS
// =====================================

export async function getAppSettingFromFirestore(key: string) {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docSnap = await getDoc(doc(db, 'settings', sanitizeFirestoreDocId(key, 'setting')));
    if (docSnap.exists()) {
      return docSnap.data().value ?? null;
    }
    return null;
  } catch (err: any) {
    console.error(`Error reading setting ${key} from Firestore:`, err?.message || err);
    return null;
  }
}

export async function saveAppSettingToFirestore(key: string, value: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const cleanKey = sanitizeFirestoreDocId(key, 'setting');
    await setDoc(doc(db, 'settings', cleanKey), stripUndefinedDeep({ key: cleanKey, value, updatedAt: new Date().toISOString() }), { merge: true });
    return true;
  } catch (err: any) {
    console.error(`Error saving setting ${key} to Firestore:`, err?.message || err);
    return false;
  }
}
