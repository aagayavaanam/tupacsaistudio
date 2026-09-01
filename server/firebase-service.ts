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
  if (!db) return false;

  try {
    const cleanDate = (bankRow.date || 'nodate').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = bankRow.id && !bankRow.id.startsWith('db-bank-') && !bankRow.id.startsWith('bank-row-')
      ? bankRow.id 
      : `bank_${cleanDate}_${bankRow.memberPayment || 0}_${bankRow.disbursementAmount || 0}_${bankRow.bankPayment || 0}`;
    const rowData = {
      ...bankRow,
      id: docId,
      createdAt: bankRow.createdAt || new Date().toISOString()
    };

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
    await deleteDoc(doc(db, 'bank_sheet', docId));
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
  if (!db) return false;

  try {
    const memberNo = String(member.memberNo || member.aClass || '').trim();
    if (!memberNo) return false;

    const docId = `mem_${memberNo}`;
    const data = {
      ...member,
      memberNo,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'members', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving member to Firestore:', err?.message || err);
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
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } catch (err: any) {
    console.error('Error fetching paduvada from Firestore:', err?.message || err);
    return null;
  }
}

export async function savePaduvadaToFirestore(paduvada: any) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docId = paduvada.id || `pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const data = {
      ...paduvada,
      id: docId,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'paduvada', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving paduvada to Firestore:', err?.message || err);
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
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } catch (err: any) {
    console.error('Error fetching AH paduvada from Firestore:', err?.message || err);
    return null;
  }
}

export async function saveAhPaduvadaToFirestore(paduvada: any) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const targetAClass = paduvada.aClass || paduvada.memberNo || '';
    const targetDisbNo = paduvada.currentDisbNo || '';
    const targetLivestock = (paduvada.livestockType || paduvada.crop || '').replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_');
    const docId = paduvada.id && !paduvada.id.startsWith('db-ah-') 
      ? paduvada.id 
      : (targetAClass && targetDisbNo 
          ? `ah_pad_${targetDisbNo}_${targetAClass}_${targetLivestock}` 
          : `ah_pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    const data = {
      ...paduvada,
      id: docId,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'ah_paduvada', docId), data, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving AH paduvada to Firestore:', err?.message || err);
    return false;
  }
}

export async function deleteAhPaduvadaFromFirestore(docId: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, 'ah_paduvada', docId));
    return true;
  } catch (err: any) {
    console.error('Error deleting AH paduvada from Firestore:', err?.message || err);
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
  if (!db) return false;

  try {
    const cleanDate = (bankRow.date || 'nodate').replace(/[^a-zA-Z0-9]/g, '_');
    const docId = bankRow.id && !bankRow.id.startsWith('db-ah-bank-') && !bankRow.id.startsWith('bank-row-')
      ? bankRow.id 
      : `ah_bank_${cleanDate}_${bankRow.memberPayment || 0}_${bankRow.disbursementAmount || 0}_${bankRow.bankPayment || 0}`;
    const rowData = {
      ...bankRow,
      id: docId,
      createdAt: bankRow.createdAt || new Date().toISOString()
    };

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
    await deleteDoc(doc(db, 'ah_bank_sheet', docId));
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
    const docSnap = await getDoc(doc(db, 'settings', key));
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
    await setDoc(doc(db, 'settings', key), { key, value, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    console.error(`Error saving setting ${key} to Firestore:`, err?.message || err);
    return false;
  }
}
