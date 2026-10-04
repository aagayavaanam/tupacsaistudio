import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LoanMember } from '../types';

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

const COLLECTION_NAME = 'members';

/**
 * Fetch all members from Firebase Firestore
 */
export async function getMembersFromFirestore(): Promise<LoanMember[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: LoanMember[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as LoanMember);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

/**
 * Save or update a member in Firebase Firestore
 */
export async function saveMemberToFirestore(member: LoanMember): Promise<void> {
  const memberNo = String(member.aClass || member.memberNo || '').trim();
  if (!memberNo) return;
  const docPath = `${COLLECTION_NAME}/mem_${memberNo}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, `mem_${memberNo}`);
    await setDoc(docRef, {
      ...member,
      memberNo,
      aClass: member.aClass || memberNo,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a member permanently from Firebase Firestore
 */
export async function deleteMemberFromFirestore(memberNo: string): Promise<void> {
  const cleanNo = String(memberNo).trim();
  if (!cleanNo) return;
  const docPath = `${COLLECTION_NAME}/mem_${cleanNo}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, `mem_${cleanNo}`);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Real-time listener for Firestore members collection
 */
export function subscribeToFirestoreMembers(
  onUpdate: (members: LoanMember[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      const list: LoanMember[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as LoanMember);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(error);
    }
  );
}
