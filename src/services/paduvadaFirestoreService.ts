import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export function isValidPaduvadaItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const aClass = String(item.aClass || item.memberNo || '').trim();
  const name = String(item.name || '').trim();
  return Boolean(aClass || name);
}

export function makePaduvadaCompositeKey(item: any, isAH = false): string {
  const a = String(item?.aClass || item?.memberNo || '').trim().toLowerCase();
  const dStr = String(item?.currentDisbNo || item?.disbNo || item?.disbursementNo || '').trim();
  const dNum = parseInt(dStr, 10);
  const d = !isNaN(dNum) ? String(dNum) : dStr.toLowerCase();
  const c = String(isAH ? (item?.livestockType || item?.crop || '') : (item?.crop || '')).trim().toLowerCase();
  const s = isAH ? '' : String(item?.surveyNo || '').trim().toLowerCase();
  return `${a}|${d}|${c}|${s}`;
}

export function mergePaduvadaCollections(existing: any[], incoming: any[], isAH = false): any[] {
  const map = new Map<string, any>();

  const applyList = (list: any[], preferIncomingId: boolean) => {
    for (const raw of list) {
      if (!isValidPaduvadaItem(raw)) continue;
      const key = makePaduvadaCompositeKey(raw, isAH);
      const prev = map.get(key);
      if (!prev) {
        map.set(key, raw);
      } else {
        const prefix = isAH ? 'ah_pad_' : 'pad_';
        const rawId = String(raw.id || '');
        const prevId = String(prev.id || '');
        const bestId = rawId.startsWith(prefix)
          ? rawId
          : (prevId.startsWith(prefix) ? prevId : (preferIncomingId ? (rawId || prevId) : (prevId || rawId)));
        map.set(key, {
          ...prev,
          ...raw,
          id: bestId || prevId || rawId,
          dbId: raw.dbId ?? prev.dbId
        });
      }
    }
  };

  applyList(existing || [], false);
  applyList(incoming || [], true);
  return Array.from(map.values());
}

export function computePaduvadaDocId(item: any, isAH = false): string {
  const prefix = isAH ? 'ah_pad_' : 'pad_';
  const existingId = String(item?.id || '');
  if (existingId.startsWith(prefix)) {
    return sanitizeFirestoreDocId(existingId, isAH ? 'ah_pad' : 'pad');
  }
  const clean = (v: any) => String(v || '').trim().replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_');
  const targetAClass = clean(item?.aClass || item?.memberNo);
  const targetDisbNo = clean(item?.currentDisbNo);
  if (isAH) {
    const targetLivestock = clean(item?.livestockType || item?.crop);
    return sanitizeFirestoreDocId(
      targetAClass && targetDisbNo
        ? `ah_pad_${targetDisbNo}_${targetAClass}_${targetLivestock || 'ah'}`
        : `ah_pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      'ah_pad'
    );
  }
  const targetCrop = clean(item?.crop);
  const targetSurvey = clean(item?.surveyNo);
  return sanitizeFirestoreDocId(
    targetAClass && targetDisbNo
      ? `pad_${targetDisbNo}_${targetAClass}_${targetCrop || 'crop'}_${targetSurvey || '0'}`
      : `pad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    'pad'
  );
}

export async function getPaduvadaListFirestore(isAH = false): Promise<any[]> {
  const colName = isAH ? 'ah_paduvada' : 'paduvada';
  try {
    const snapshot = await getDocs(collection(db, colName));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      const record = { id: docSnap.id, ...docSnap.data() };
      if (isValidPaduvadaItem(record)) {
        items.push(record);
      }
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
    return [];
  }
}

export async function savePaduvadaDocFirestore(item: any, isAH = false): Promise<any | null> {
  if (!isValidPaduvadaItem(item)) return null;
  const colName = isAH ? 'ah_paduvada' : 'paduvada';
  const docId = computePaduvadaDocId(item, isAH);
  const docPath = `${colName}/${docId}`;
  try {
    const data = stripUndefinedDeep({
      ...item,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, colName, docId), data, { merge: true });
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return null;
  }
}

export async function deletePaduvadaDocFirestore(
  params: { id?: string; aClass?: string; currentDisbNo?: string; crop?: string },
  isAH = false
): Promise<boolean> {
  const colName = isAH ? 'ah_paduvada' : 'paduvada';
  const { id, aClass, currentDisbNo, crop } = params || {};
  try {
    let deletedAny = false;
    const prefix = isAH ? 'ah_pad_' : 'pad_';
    if (id && String(id).startsWith(prefix)) {
      await deleteDoc(doc(db, colName, sanitizeFirestoreDocId(String(id), isAH ? 'ah_pad' : 'pad')));
      deletedAny = true;
    }

    const targetAClass = String(aClass || '').trim().toLowerCase();
    const targetDisb = String(currentDisbNo || '').trim();
    const targetDisbNum = parseInt(targetDisb, 10);
    const targetCrop = String(crop || '').trim().toLowerCase();

    if (targetAClass || id) {
      const snapshot = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      let count = 0;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const idMatches = Boolean(id && (docSnap.id === id || d.id === id));
        const rowAClass = String(d.aClass || d.memberNo || '').trim().toLowerCase();
        const rowDisb = String(d.currentDisbNo || '').trim();
        const rowDisbNum = parseInt(rowDisb, 10);
        const rowCrop = String(isAH ? (d.livestockType || d.crop || '') : (d.crop || '')).trim().toLowerCase();

        const disbMatches = !targetDisb || rowDisb === targetDisb || (!isNaN(targetDisbNum) && !isNaN(rowDisbNum) && rowDisbNum === targetDisbNum);
        const cropMatches = !targetCrop || rowCrop === targetCrop;
        const keyMatches = Boolean(targetAClass && rowAClass === targetAClass && disbMatches && cropMatches);

        if (idMatches || keyMatches) {
          batch.delete(doc(db, colName, docSnap.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        deletedAny = true;
      }
    }

    return deletedAny;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, colName);
    return false;
  }
}

export async function updateBatchResolutionFirestore(
  currentDisbNo: string,
  resolutionDate?: string,
  resolutionNo?: string,
  isAH = false
): Promise<boolean> {
  const targetDisb = String(currentDisbNo || '').trim();
  if (!targetDisb) return false;
  const colName = isAH ? 'ah_paduvada' : 'paduvada';
  try {
    const snapshot = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    let count = 0;
    const targetNum = parseInt(targetDisb, 10);
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const itemDisb = String(d.currentDisbNo || '').trim();
      const itemNum = parseInt(itemDisb, 10);
      if (itemDisb === targetDisb || (!isNaN(targetNum) && !isNaN(itemNum) && itemNum === targetNum)) {
        const updateFields: Record<string, any> = { updatedAt: new Date().toISOString() };
        if (resolutionDate !== undefined) updateFields.resolutionDate = resolutionDate;
        if (resolutionNo !== undefined && resolutionNo !== '') updateFields.resolutionNo = resolutionNo;
        batch.set(doc(db, colName, docSnap.id), updateFields, { merge: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, colName);
    return false;
  }
}

export async function getBankRowsFirestore(isAH = false): Promise<any[]> {
  const colName = isAH ? 'ah_bank_sheet' : 'bank_sheet';
  try {
    const snapshot = await getDocs(collection(db, colName));
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
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
    return [];
  }
}

export async function saveBankRowFirestore(bankRow: any, isAH = false): Promise<any | null> {
  if (!bankRow) return null;
  const colName = isAH ? 'ah_bank_sheet' : 'bank_sheet';
  const cleanDate = String(bankRow.date || 'nodate').replace(/[^a-zA-Z0-9]/g, '_');
  const rawId = String(bankRow.id || '').trim();
  const skipPrefixes = isAH
    ? ['db-ah-bank-', 'bank-row-', 'ah-bank-row-']
    : ['db-bank-', 'bank-row-'];
  const useRawId = Boolean(rawId && !skipPrefixes.some((p) => rawId.startsWith(p)));
  const prefix = isAH ? 'ah_bank' : 'bank';
  const docId = sanitizeFirestoreDocId(
    useRawId
      ? rawId
      : `${prefix}_${cleanDate}_${bankRow.memberPayment || 0}_${bankRow.disbursementAmount || 0}_${bankRow.bankPayment || 0}`,
    prefix
  );
  const docPath = `${colName}/${docId}`;
  try {
    const rowData = stripUndefinedDeep({
      ...bankRow,
      id: docId,
      createdAt: bankRow.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, colName, docId), rowData, { merge: true });
    return rowData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return null;
  }
}

export async function deleteBankRowFirestore(docId: string, isAH = false): Promise<boolean> {
  if (!docId) return false;
  const colName = isAH ? 'ah_bank_sheet' : 'bank_sheet';
  const cleanId = sanitizeFirestoreDocId(docId, isAH ? 'ah_bank' : 'bank');
  const docPath = `${colName}/${cleanId}`;
  try {
    await deleteDoc(doc(db, colName, cleanId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    return false;
  }
}

export async function getAppSettingFirestore(key: string): Promise<string | null> {
  const cleanKey = sanitizeFirestoreDocId(key, 'setting');
  const docPath = `settings/${cleanKey}`;
  try {
    const docSnap = await getDoc(doc(db, 'settings', cleanKey));
    if (docSnap.exists()) {
      return docSnap.data().value ?? null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

export async function saveAppSettingFirestore(key: string, value: string): Promise<boolean> {
  const cleanKey = sanitizeFirestoreDocId(key, 'setting');
  const docPath = `settings/${cleanKey}`;
  try {
    await setDoc(
      doc(db, 'settings', cleanKey),
      stripUndefinedDeep({ key: cleanKey, value, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}
