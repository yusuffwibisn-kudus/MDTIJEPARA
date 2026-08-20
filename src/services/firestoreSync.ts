import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, JariyahSetoran, CategoryItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import {
  saveMembers as saveLocalMembers,
  saveSetoran as saveLocalSetoran,
  saveCategories as saveLocalCategories,
  saveAdminPassword as saveLocalAdminPassword,
  getStoredAdminPassword,
} from '../utils/storage';

const MEMBERS_COLLECTION = 'members';
const SETORAN_COLLECTION = 'setoran';
const CATEGORIES_COLLECTION = 'categories';
const SETTINGS_COLLECTION = 'settings';
const ADMIN_CONFIG_DOC = 'adminConfig';

/**
 * Real-time Listener for Members Collection
 */
export function subscribeToMembers(
  onUpdate: (members: Member[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const membersRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    membersRef,
    (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Member);
      });
      // Sort by createdAt descending (newest first)
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      saveLocalMembers(list);
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore members listener error, fallback to local', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time Listener for Setoran Collection
 */
export function subscribeToSetoran(
  onUpdate: (setoran: JariyahSetoran[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const setoranRef = collection(db, SETORAN_COLLECTION);
  return onSnapshot(
    setoranRef,
    (snapshot) => {
      const list: JariyahSetoran[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as JariyahSetoran);
      });
      // Sort by dateSubmitted / id descending
      list.sort((a, b) => (b.dateSubmitted || b.id || '').localeCompare(a.dateSubmitted || a.id || ''));
      saveLocalSetoran(list);
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore setoran listener error, fallback to local', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time Listener for Categories Collection
 */
export function subscribeToCategories(
  onUpdate: (categories: CategoryItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    categoriesRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default categories if collection is completely fresh and empty
        console.log('Categories empty in Firestore, seeding initial standard categories...');
        try {
          const batch = writeBatch(db);
          INITIAL_CATEGORIES.forEach((cat) => {
            const catDocRef = doc(db, CATEGORIES_COLLECTION, cat.id);
            batch.set(catDocRef, cat);
          });
          await batch.commit();
          return;
        } catch (e) {
          console.error('Error seeding categories:', e);
        }
      }

      const list: CategoryItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CategoryItem);
      });
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      saveLocalCategories(list);
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore categories listener error, fallback to local', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time Listener for Admin Settings (Password Sync across devices)
 */
export function subscribeToAdminConfig(
  onUpdate: (password: string) => void
): Unsubscribe {
  const configDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_CONFIG_DOC);
  return onSnapshot(
    configDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.password) {
          saveLocalAdminPassword(data.password);
          onUpdate(data.password);
        }
      } else {
        // Seed initial password
        const currentLocal = getStoredAdminPassword();
        setDoc(configDocRef, { password: currentLocal || 'admin123', updatedAt: new Date().toISOString() }, { merge: true });
      }
    },
    (error) => {
      console.warn('Firestore admin config listener error:', error);
    }
  );
}

// ----------------------------------------------------
// Cloud CRUD Sync Operations
// ----------------------------------------------------

export async function syncAddMember(member: Member): Promise<void> {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, member.id);
    await setDoc(docRef, member);
  } catch (err) {
    console.error('Failed to sync add member to Firestore', err);
  }
}

export async function syncAddBulkMembers(members: Member[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    members.forEach((m) => {
      const docRef = doc(db, MEMBERS_COLLECTION, m.id);
      batch.set(docRef, m);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to sync bulk members to Firestore', err);
  }
}

export async function syncUpdateMember(member: Member): Promise<void> {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, member.id);
    await setDoc(docRef, member, { merge: true });
  } catch (err) {
    console.error('Failed to sync update member to Firestore', err);
  }
}

export async function syncDeleteMember(memberId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    // Delete member document
    const memberDocRef = doc(db, MEMBERS_COLLECTION, memberId);
    batch.delete(memberDocRef);

    // Also delete any setoran belonging to this member
    const setoranSnapshot = await getDocs(collection(db, SETORAN_COLLECTION));
    setoranSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as JariyahSetoran;
      if (data.memberId === memberId) {
        batch.delete(docSnap.ref);
      }
    });

    await batch.commit();
  } catch (err) {
    console.error('Failed to sync delete member to Firestore', err);
  }
}

export async function syncSaveSetoran(setoran: JariyahSetoran): Promise<void> {
  try {
    const docRef = doc(db, SETORAN_COLLECTION, setoran.id);
    await setDoc(docRef, setoran);
  } catch (err) {
    console.error('Failed to sync save setoran to Firestore', err);
  }
}

export async function syncDeleteSetoran(setoranId: string): Promise<void> {
  try {
    const docRef = doc(db, SETORAN_COLLECTION, setoranId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to sync delete setoran to Firestore', err);
  }
}

export async function syncAddCategory(category: CategoryItem): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, category.id);
    await setDoc(docRef, category);
  } catch (err) {
    console.error('Failed to sync add category to Firestore', err);
  }
}

export async function syncUpdateCategory(oldName: string, updatedCat: CategoryItem, members: Member[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    const catDocRef = doc(db, CATEGORIES_COLLECTION, updatedCat.id);
    batch.set(catDocRef, updatedCat, { merge: true });

    if (oldName !== updatedCat.name) {
      members.forEach((m) => {
        if (m.category === oldName) {
          const mDocRef = doc(db, MEMBERS_COLLECTION, m.id);
          batch.update(mDocRef, { category: updatedCat.name });
        }
      });
    }

    await batch.commit();
  } catch (err) {
    console.error('Failed to sync update category to Firestore', err);
  }
}

export async function syncDeleteCategory(
  catId: string,
  catName: string,
  fallbackName?: string,
  members?: Member[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const catDocRef = doc(db, CATEGORIES_COLLECTION, catId);
    batch.delete(catDocRef);

    if (fallbackName && members) {
      members.forEach((m) => {
        if (m.category === catName) {
          const mDocRef = doc(db, MEMBERS_COLLECTION, m.id);
          batch.update(mDocRef, { category: fallbackName });
        }
      });
    }

    await batch.commit();
  } catch (err) {
    console.error('Failed to sync delete category to Firestore', err);
  }
}

export async function syncClearTransactions(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, SETORAN_COLLECTION));
    const batch = writeBatch(db);
    snapshot.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear transactions from Firestore', err);
  }
}

export async function syncClearAllDatabase(): Promise<void> {
  try {
    const membersSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
    const setoranSnap = await getDocs(collection(db, SETORAN_COLLECTION));

    const batch = writeBatch(db);
    membersSnap.forEach((d) => batch.delete(d.ref));
    setoranSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear entire database from Firestore', err);
  }
}

export async function syncSaveAdminPassword(newPassword: string): Promise<void> {
  try {
    saveLocalAdminPassword(newPassword);
    const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_CONFIG_DOC);
    await setDoc(docRef, { password: newPassword, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Failed to sync admin password to Firestore', err);
  }
}

export async function syncRestoreDatabase(backupData: {
  members: Member[];
  setoran: JariyahSetoran[];
  categories: CategoryItem[];
}): Promise<void> {
  try {
    // 1. Clear existing
    await syncClearAllDatabase();

    // 2. Insert new members
    const batch = writeBatch(db);
    backupData.members.forEach((m) => {
      const ref = doc(db, MEMBERS_COLLECTION, m.id);
      batch.set(ref, m);
    });

    // 3. Insert setoran
    backupData.setoran.forEach((s) => {
      const ref = doc(db, SETORAN_COLLECTION, s.id);
      batch.set(ref, s);
    });

    // 4. Insert categories
    backupData.categories.forEach((c) => {
      const ref = doc(db, CATEGORIES_COLLECTION, c.id);
      batch.set(ref, c);
    });

    await batch.commit();
  } catch (err) {
    console.error('Failed to sync restore database to Firestore', err);
    throw err;
  }
}
