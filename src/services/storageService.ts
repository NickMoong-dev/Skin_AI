import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  limit,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Comparison, UserProfile, AttendanceRecord, Category } from '../types';
import { OperationType, handleFirestoreError } from '../utils';

export const storageService = {
  /**
   * Save a new comparison result
   */
  async saveComparison(comparison: Omit<Comparison, 'id' | 'createdAt'>) {
    const path = 'comparisons';
    try {
      // Ensure no undefined fields are passed to Firestore
      const sanitizedComparison = {
        ...comparison,
        zone: comparison.zone || 'Default',
        aiFeedback: comparison.aiFeedback || '',
        subject: comparison.subject || '',
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, path), sanitizedComparison);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Subscribe to comparisons for a specific staff member
   */
  subscribeToStaffComparisons(staffId: string, callback: (comparisons: Comparison[]) => void) {
    const path = 'comparisons';
    const q = query(
      collection(db, path),
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comparisons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comparison[];
      callback(comparisons);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Subscribe to all comparisons (Manager)
   */
  subscribeToAllComparisons(callback: (comparisons: Comparison[]) => void) {
    const path = 'comparisons';
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comparisons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comparison[];
      callback(comparisons);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Get user profile metadata
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },

  /**
   * Save attendance record
   */
  async saveAttendance(record: Omit<AttendanceRecord, 'id' | 'timestamp'>) {
    const path = 'attendance';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...record,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Fetch last attendance record for user
   */
  async fetchLastAttendance(uid: string): Promise<AttendanceRecord | null> {
    const path = 'attendance';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as AttendanceRecord;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },

  /**
   * Save user profile
   */
  async saveUserProfile(uid: string, profile: UserProfile) {
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), profile, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Subscribe to all personnel
   */
  subscribeToPersonnel(callback: (users: UserProfile[]) => void) {
    const path = 'users';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Subscribe to global attendance logs
   */
  subscribeToAttendance(callback: (records: AttendanceRecord[]) => void) {
    const path = 'attendance';
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
      callback(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Subscribe to categories
   */
  subscribeToCategories(callback: (categories: Category[]) => void) {
    const path = 'categories';
    const q = query(collection(db, path), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      callback(categories);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Admin category management
   */
  async addCategory(cat: Omit<Category, 'id'>) {
    const path = 'categories';
    try {
      return await addDoc(collection(db, path), cat);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async updateCategory(id: string, data: Partial<Category>) {
    const path = `categories/${id}`;
    try {
      await updateDoc(doc(db, 'categories', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  }
};
