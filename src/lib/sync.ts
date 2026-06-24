// Firebase generic sync service
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { AppState, ChildProfile, Therapy, DiaryEntry, RoutineItem, AppDocument, Medication, Crisis } from '../types';
import { useAppStore } from '../store';

export const saveToCloud = async (uid: string, path: string, id: string, data: any) => {
  if (!uid || !db) return;
  if (useAppStore.getState().isDemoActive) return;
  useAppStore.getState().setSyncStatus('Salvando...');
  try {
    await setDoc(doc(db, `users/${uid}/${path}`, id), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    useAppStore.getState().setSyncStatus('Sincronizado');
  } catch(e) {
    useAppStore.getState().setSyncStatus('Erro');
  }
};

export const deleteFromCloud = async (uid: string, path: string, id: string) => {
  if (!uid || !db) return;
  if (useAppStore.getState().isDemoActive) return;
  useAppStore.getState().setSyncStatus('Salvando...');
  try {
    await deleteDoc(doc(db, `users/${uid}/${path}`, id));
    useAppStore.getState().setSyncStatus('Sincronizado');
  } catch(e) {
    useAppStore.getState().setSyncStatus('Erro');
  }
};

export const uploadFileBase64 = async (uid: string, childId: string, docId: string, fileName: string, base64: string) => {
  if (!storage) throw new Error('Storage não configurado');
  const fileRef = ref(storage, `users/${uid}/children/${childId}/documents/${docId}/${fileName}`);
  await uploadString(fileRef, base64, 'data_url');
  return await getDownloadURL(fileRef);
};

export const deleteFile = async (uid: string, childId: string, docId: string, fileName: string) => {
  if (!storage) return;
  const fileRef = ref(storage, `users/${uid}/children/${childId}/documents/${docId}/${fileName}`);
  try {
    await deleteObject(fileRef);
  } catch (e) {
    console.error('File not found', e);
  }
};

export const fetchCloudState = async (uid: string): Promise<AppState | null> => {
   if (!uid || !db) return null;
   
      const state: Partial<AppState> = {
        profiles: [], therapies: [], therapySessions: [], appointments: [], medications: [], crises: [], diaryEntries: [], routineItems: [], documents: []
      };

      try {
        const profSnap = await getDocs(collection(db, `users/${uid}/children`));
        state.profiles = profSnap.docs.map(d => d.data() as ChildProfile);
        
        if (state.profiles.length > 0) {
          state.activeProfileId = state.profiles[0].id;
          
          for (const child of state.profiles) {
            const childId = child.id;
            
            const thSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/therapies`));
            state.therapies = [...state.therapies!, ...thSnap.docs.map(d => d.data() as Therapy)];

            const tsSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/therapy_sessions`));
            state.therapySessions = [...state.therapySessions!, ...tsSnap.docs.map(d => d.data() as any)];

            const apSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/appointments`));
            state.appointments = [...state.appointments!, ...apSnap.docs.map(d => d.data() as any)];

            const medSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/medications`));
         state.medications = [...state.medications!, ...medSnap.docs.map(d => d.data() as Medication)];

         const crSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/crises`));
         state.crises = [...state.crises!, ...crSnap.docs.map(d => d.data() as Crisis)];

         const diSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/diary`));
         state.diaryEntries = [...state.diaryEntries!, ...diSnap.docs.map(d => d.data() as DiaryEntry)];

         const rouSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/routines`));
         state.routineItems = [...state.routineItems!, ...rouSnap.docs.map(d => d.data() as RoutineItem)];

         const docSnap = await getDocs(collection(db, `users/${uid}/children/${childId}/documents`));
         state.documents = [...state.documents!, ...docSnap.docs.map(d => d.data() as AppDocument)];
       }
       
       return state as AppState;
     }
     return null;
   } catch(e) {
     console.error("Failed to fetch state", e);
     return null;
   }
};

export const uploadLocalStateToCloud = async (uid: string, state: AppState) => {
   if (!db) return;
   const batch = writeBatch(db);
   
   for (const p of state.profiles) {
     const pRef = doc(db, `users/${uid}/children`, p.id);
     batch.set(pRef, p, { merge: true });
   }

   for (const t of state.therapies) {
     const tRef = doc(db, `users/${uid}/children/${t.childId}/therapies`, t.id);
     batch.set(tRef, t, { merge: true });
   }
   
   if (state.therapySessions) {
     for (const ts of state.therapySessions) {
       const tsRef = doc(db, `users/${uid}/children/${ts.childId}/therapy_sessions`, ts.id);
       batch.set(tsRef, ts, { merge: true });
     }
   }
   
   for (const m of state.medications) {
     const mRef = doc(db, `users/${uid}/children/${m.childId}/medications`, m.id);
     batch.set(mRef, m, { merge: true });
   }

   for (const c of state.crises) {
     const cRef = doc(db, `users/${uid}/children/${c.childId}/crises`, c.id);
     batch.set(cRef, c, { merge: true });
   }

   for (const d of state.diaryEntries) {
     const dRef = doc(db, `users/${uid}/children/${d.childId}/diary`, d.id);
     batch.set(dRef, d, { merge: true });
   }

   for (const r of state.routineItems) {
     const rRef = doc(db, `users/${uid}/children/${r.childId}/routines`, r.id);
     batch.set(rRef, r, { merge: true });
   }

   for (const d of state.documents) {
     const dRef = doc(db, `users/${uid}/children/${d.childId}/documents`, d.id);
     batch.set(dRef, d, { merge: true });
   }

   try {
     await batch.commit();
     return true;
   } catch (e) {
     console.error("Failed to upload local state to cloud", e);
     useAppStore.getState().setSyncStatus('Erro');
     return false;
   }
};
