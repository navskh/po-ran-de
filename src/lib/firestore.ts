import {
  doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface ILeaderboardEntry {
  uid: string;
  bestWave: number;
  displayName: string | null;
  photoURL: string | null;
}

export async function saveProfile(bestWave: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const ref = doc(db, 'profiles', user.uid);
    const existing = await getDoc(ref);
    const prev = existing.exists() ? Number(existing.data().bestWave ?? 0) : 0;
    if (bestWave <= prev) return;
    await setDoc(ref, {
      bestWave,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('saveProfile failed', err);
  }
}

export async function getLeaderboard(topN = 10): Promise<ILeaderboardEntry[]> {
  try {
    const q = query(collection(db, 'profiles'), orderBy('bestWave', 'desc'), limit(topN));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      uid: d.id,
      bestWave: Number(d.data().bestWave ?? 0),
      displayName: (d.data().displayName as string | null) ?? null,
      photoURL: (d.data().photoURL as string | null) ?? null,
    }));
  } catch (err) {
    console.error('getLeaderboard failed', err);
    return [];
  }
}
