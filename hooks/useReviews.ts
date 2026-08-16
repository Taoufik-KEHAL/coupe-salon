import { db } from '@/lib/firebase';
import type { Review, ReviewInput } from '@/types';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { reviews, loading };
}

export async function createReview(input: ReviewInput) {
  return addDoc(collection(db, 'reviews'), { ...input, createdAt: Date.now() });
}
