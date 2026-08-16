// Seeds demo/test data (admin, coiffeurs, catalogue, client, réservations)
// into the live Firebase project via the same client SDK the app uses —
// respects firestore.rules exactly like a real device would. Safe to
// rerun: existing accounts/records are detected and skipped rather than
// duplicated. Usage: `node scripts/seed-test-data.mjs`.
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const envPath = '/home/taoufikkehal/Documents/coupe-salon/.env';
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      const key = l.slice(0, idx);
      const value = l.slice(idx + 1).replace(/^"|"$/g, '');
      return [key, value];
    })
);

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = 'TestSalon123!';

const SEED_CATALOG = [
  { type: 'service', name: 'Coupe Enfant -12 ans', photoUrl: unsplash('photo-1599351431202-1e0f0137899a'), durationMinutes: 15, price: 15, featured: true },
  { type: 'service', name: 'Coupe Homme', photoUrl: unsplash('photo-1503951914875-452162b0f3f1'), durationMinutes: 20, price: 25, featured: true },
  { type: 'service', name: 'Taille de barbe', photoUrl: unsplash('photo-1521590832167-7bcbfaa6381f'), durationMinutes: 15, price: 15 },
  { type: 'service', name: 'Soins visage', photoUrl: unsplash('photo-1512690459411-b9245aed614b'), durationMinutes: 30, price: 40 },
  { type: 'service', name: 'Soins cheveux', photoUrl: unsplash('photo-1522335789203-aabd1fc54bc9'), durationMinutes: 20, price: 20 },
  { type: 'service', name: 'Coupe les jeunes -20 ans', photoUrl: unsplash('photo-1560066984-138dadb4c035'), durationMinutes: 20, price: 20 },
  { type: 'service', name: 'Coupe + taille de barbe PLUS', photoUrl: unsplash('photo-1633681926035-ec1ac984418a'), durationMinutes: 45, price: 50 },
  { type: 'service', name: 'Coupe + taille de barbe', photoUrl: unsplash('photo-1526047932273-341f2a7631f9'), durationMinutes: 30, price: 30 },
  { type: 'service', name: 'Shampoing', photoUrl: unsplash('photo-1605497788044-5a32c7078486'), durationMinutes: 10, price: 10 },
  { type: 'service', name: 'Séchage', photoUrl: unsplash('photo-1587909209111-5097ee578ec3'), durationMinutes: 15, price: 10 },
  { type: 'produit', name: 'Shampoing professionnel', photoUrl: unsplash('photo-1519415943484-9fa1873496d4'), price: 45 },
  { type: 'produit', name: 'Cire coiffante', photoUrl: unsplash('photo-1522337660859-02fbefca4702'), price: 35 },
  { type: 'produit', name: 'Huile à barbe', photoUrl: unsplash('photo-1517832606299-7ae9b720a186'), price: 40 },
  { type: 'produit', name: 'Gel coiffant', photoUrl: unsplash('photo-1470259078422-826894b933aa'), price: 30 },
];

function unsplash(id) {
  return `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;
}

async function ensureAccount(email, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    return { uid: cred.user.uid, created: true };
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, PASSWORD);
      return { uid: cred.user.uid, created: false };
    }
    throw e;
  }
}

async function main() {
  console.log('--- Admin ---');
  const admin = await ensureAccount('admin.test@salon.demo', 'Admin Test');
  // Self-promotion to 'admin' is blocked by firestore.rules (by design — an
  // account can never grant itself admin), so this only works the very
  // first time this script runs against a fresh project, before any admin
  // exists — the account is created as 'client' then immediately promoted
  // while that gap is still open at t=0. On reruns (account already
  // exists) we leave its role untouched rather than risk demoting a real
  // admin. On a truly fresh project where this still fails, promote this
  // account to admin manually once via the Firebase console (Firestore >
  // users > this doc > role: "admin").
  if (admin.created) {
    await setDoc(doc(db, 'users', admin.uid), { email: 'admin.test@salon.demo', role: 'client', createdAt: Date.now() });
    try {
      await setDoc(doc(db, 'users', admin.uid), { role: 'admin' }, { merge: true });
      console.log('admin.test@salon.demo ->', admin.uid, '(role: admin)');
    } catch {
      console.log(
        'admin.test@salon.demo ->',
        admin.uid,
        "(role encore 'client' — promeus-le manuellement en 'admin' dans la console Firebase)"
      );
    }
  } else {
    console.log('admin.test@salon.demo ->', admin.uid, '(compte déjà existant, rôle inchangé)');
  }

  console.log('--- Catalogue (as admin) ---');
  if (admin.created) {
    for (const item of SEED_CATALOG) {
      await addDoc(collection(db, 'services_produits'), item);
    }
    console.log(`${SEED_CATALOG.length} articles ajoutés.`);
  } else {
    console.log('Compte admin déjà existant, catalogue non re-importé.');
  }
  await signOut(auth);

  console.log('--- Coiffeurs ---');
  const coiffeurs = [
    { email: 'coiffeur1.test@salon.demo', name: 'Amine Benali' },
    { email: 'coiffeur2.test@salon.demo', name: 'Sara El Amrani' },
  ];
  const coiffeurIds = [];
  for (const c of coiffeurs) {
    const acc = await ensureAccount(c.email, c.name);
    await setDoc(doc(db, 'users', acc.uid), { email: c.email, role: 'coiffeur', createdAt: Date.now() });
    await setDoc(doc(db, 'coiffeurs', acc.uid), {
      displayName: c.name,
      email: c.email,
      workingHours: { start: '09:00', end: '19:00' },
      active: true,
    });
    coiffeurIds.push({ id: acc.uid, name: c.name });
    console.log(c.email, '->', acc.uid);
    await signOut(auth);
  }

  console.log('--- Client + réservations ---');
  const client = await ensureAccount('client.test@salon.demo', 'Yasmine Idrissi');
  console.log('client account ok', client.uid, 'created=', client.created);
  await setDoc(doc(db, 'users', client.uid), { email: 'client.test@salon.demo', role: 'client', createdAt: Date.now() });
  console.log('client users/ doc ok');
  await setDoc(doc(db, 'clients', client.uid), { name: 'Yasmine Idrissi', phone: '+212600112233', notes: '', createdAt: Date.now() });
  console.log('client clients/ doc ok');

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  async function reserve(coiffeur, date, startTime, items) {
    const slotTimes = [];
    let cursor = timeToMinutes(startTime);
    const totalMinutes = items.reduce((s, i) => s + (i.durationMinutes ?? 0) * i.quantity, 0);
    for (let t = 0; t < totalMinutes; t += 15) slotTimes.push(minutesToTime(cursor + t));

    const reservationRef = doc(collection(db, 'reservations'));
    const slotRefs = slotTimes.map((t) => doc(db, 'creneaux', `${coiffeur.id}_${date}_${t}`));

    // La réservation doit être committée avant la transaction sur les
    // créneaux : les règles de sécurité de `creneaux` vérifient la
    // réservation via get(), qui ne voit pas les écritures d'une même
    // transaction (voir hooks/useSlots.ts côté app).
    await setDoc(reservationRef, {
      clientId: client.uid,
      clientName: 'Yasmine Idrissi',
      coiffeurId: coiffeur.id,
      coiffeurName: coiffeur.name,
      date,
      startTime,
      slotIds: slotRefs.map((r) => r.id),
      items,
      total: items.reduce((s, i) => s + i.price * i.quantity, 0),
      status: 'confirmee',
      createdAt: Date.now(),
    });

    try {
      await runTransaction(db, async (tx) => {
        const snaps = await Promise.all(slotRefs.map((r) => tx.get(r)));
        if (snaps.some((s) => s.exists())) throw new Error('slot taken');
        slotRefs.forEach((ref, i) => {
          tx.set(ref, { coiffeurId: coiffeur.id, date, time: slotTimes[i], status: 'reserve', reservationId: reservationRef.id });
        });
      });
      console.log(`Réservé: ${coiffeur.name} ${date} ${startTime}`);
    } catch (e) {
      // Rerun of this script (or a genuinely taken slot) — roll back the
      // orphaned reservation, matching hooks/useSlots.ts's real behavior.
      await updateDoc(reservationRef, { status: 'annulee' }).catch(() => {});
      console.log(`Déjà réservé (ignoré): ${coiffeur.name} ${date} ${startTime}`);
    }
  }

  function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  function minutesToTime(m) {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  await reserve(coiffeurIds[0], dateKey(today), '11:00', [
    { id: 'coupe-homme', kind: 'service', name: 'Coupe Homme', price: 25, durationMinutes: 20, quantity: 1 },
    { id: 'taille-barbe', kind: 'service', name: 'Taille de barbe', price: 15, durationMinutes: 15, quantity: 1 },
  ]);
  await reserve(coiffeurIds[1], dateKey(today), '15:00', [
    { id: 'coupe-taille-barbe', kind: 'service', name: 'Coupe + taille de barbe', price: 30, durationMinutes: 30, quantity: 1 },
  ]);
  await reserve(coiffeurIds[0], dateKey(tomorrow), '10:00', [
    { id: 'soins-visage', kind: 'service', name: 'Soins visage', price: 40, durationMinutes: 30, quantity: 1 },
  ]);

  // Commande produits seuls (en attente de validation).
  await addDoc(collection(db, 'reservations'), {
    clientId: client.uid,
    clientName: 'Yasmine Idrissi',
    coiffeurId: null,
    coiffeurName: null,
    date: null,
    startTime: null,
    slotIds: [],
    items: [{ id: 'gel-coiffant', kind: 'produit', name: 'Gel coiffant', price: 30, quantity: 2 }],
    total: 60,
    status: 'en_attente',
    createdAt: Date.now(),
  });
  console.log('Commande produits créée (en_attente).');

  await signOut(auth);
  console.log('\nTerminé.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERREUR:', e);
    process.exit(1);
  });
