# Salon Manager

Application Android (React Native / Expo) pour un salon de coiffure, avec trois rôles :
- **Client** : parcourt les services/produits, réserve un créneau, gère son panier (paiement sur place), consulte ses réservations, laisse un avis.
- **Coiffeur** : consulte le planning partagé (tous les coiffeurs, temps réel), valide les paniers des clients, consulte la liste des clients.
- **Administrateur** : hérite de tout ce que peut faire un coiffeur, plus la gestion des services/produits, des coiffeurs et des rôles utilisateurs.

Backend Firebase : Authentication (e-mail/mot de passe) + Firestore (temps réel).

## Stack

- **React Native + Expo** (SDK 57, Expo Router, TypeScript)
- **Firebase** : Authentication + Firestore. Pas de Cloud Functions (voir plus bas) — la garantie "premier arrivé, premier servi" sur les créneaux est assurée par une **transaction Firestore côté client** (`runTransaction`), sécurisée par les règles Firestore.

## Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Firebase

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com), active **Authentication** (e-mail/mot de passe) et **Firestore**.
2. Ajoute une application **Web** (icône `</>`) — c'est le SDK web qui est utilisé ici, y compris depuis l'app Android.
3. Copie `.env.example` vers `.env` et renseigne les valeurs de la config Firebase.
4. Déploie les règles de sécurité :
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <ton-project-id>
   ```

### 3. Créer le premier administrateur

Aucun rôle `admin` n'est auto-attribuable depuis l'app (par sécurité) — un admin ne s'obtient que par promotion depuis l'écran "Gestion des utilisateurs" d'un admin existant. Pour le tout premier admin :
1. Crée un compte normalement dans l'app (rôle "coiffeur" par exemple).
2. Dans la console Firebase → Firestore → collection `users` → trouve le document de ce compte (son UID) → modifie le champ `role` à `admin`.
3. Reconnecte-toi dans l'app : tu as maintenant accès à Profil → Administration.

### 4. (Optionnel) Générer des données de démonstration

```bash
node scripts/seed-test-data.mjs
```

Crée des comptes de test (admin, 2 coiffeurs, 1 client), importe le catalogue de démarrage, et place 2-3 réservations réelles (via la même transaction que l'app) pour avoir tout de suite quelque chose à voir dans le Planning. Tous les comptes utilisent le mot de passe `TestSalon123!`. Script idempotent (relançable sans dupliquer les données) ; ne fonctionne pour l'étape admin que sur un projet tout neuf, sans admin existant (voir commentaires dans le script).

### 5. Lancer l'application

```bash
npx expo start
```

Scanne le QR code avec **Expo Go** (Android) pour tester sur ton téléphone.

## Modèle de données Firestore

| Collection | Clé | Contenu |
|---|---|---|
| `users` | uid | `email`, `role` (`client`\|`coiffeur`\|`admin`), `createdAt` |
| `clients` | uid | `name`, `phone`, `notes`, `createdAt` — profil étendu d'un compte client |
| `coiffeurs` | uid | `displayName`, `email`, `workingHours` (`{start,end}`), `active` |
| `services_produits` | auto | `type` (`service`\|`produit`), `name`, `photoUrl`, `price`, `durationMinutes?`, `featured?` |
| `creneaux` | `{coiffeurId}_{date}_{HH:mm}` | `coiffeurId`, `date`, `time`, `status: 'reserve'`, `reservationId` — **un créneau libre n'a pas de document** (voir [lib/slots.ts](lib/slots.ts)) |
| `reservations` | auto | `clientId`, `coiffeurId`, `date`, `startTime`, `slotIds[]`, `items[]`, `total`, `status`, `createdAt` |
| `reviews` | auto | `reservationId`, `clientId`, `coiffeurId`, `rating`, `comment`, `createdAt` |

### Statuts d'une réservation

`confirmee` (créée) → `en_attente` (client arrivé au salon, marqué par le coiffeur) → `en_cours` (panier validé, service en cours) → `terminee`. `annulee` possible depuis `confirmee`/`en_attente` (par le client ou le staff).

## Concurrence sur les créneaux — sans Cloud Functions

Le cahier des charges demandait une Cloud Function callable avec `runTransaction` pour garantir qu'un créneau ne soit jamais réservé deux fois. **Ce projet n'utilise pas de Cloud Functions** (elles nécessitent le plan payant Firebase "Blaze" — carte bancaire requise même si l'usage reste gratuit — ce qui a été explicitement écarté).

À la place, [hooks/useSlots.ts](hooks/useSlots.ts) procède en deux temps :
1. La réservation est créée par une écriture séparée (`status: 'confirmee'`).
2. Une transaction Firestore (`runTransaction`) relit ensuite tous les créneaux nécessaires et, seulement s'ils sont tous encore libres, les crée en les référençant à cette réservation. Si un créneau est déjà pris, la transaction échoue, la réservation orpheline est annulée, et le client reçoit une erreur `SlotUnavailableError` propre — jamais de double réservation.

Ces deux étapes ne peuvent **pas** être fusionnées en une seule transaction : [firestore.rules](firestore.rules) valide chaque création de `creneaux/{id}` via `get()` sur la réservation référencée (elle doit exister et appartenir à l'auteur de la requête) — or Firestore n'expose pas les écritures d'une transaction aux `get()` évalués par les règles pendant cette même transaction (vérifié empiriquement, contrairement à l'hypothèse initiale). Un `creneaux/{id}` ne peut par ailleurs jamais être **mis à jour** (seulement créé ou supprimé) — impossible donc de "voler" un créneau déjà pris en le réécrivant.

C'est une garantie plus faible qu'une Cloud Function (un client qui modifierait l'app pourrait théoriquement contourner certaines vérifications, et une réservation peut rester brièvement orpheline si l'appareil perd la connexion entre les deux étapes), mais suffisante pour ce contexte et sans coût d'infrastructure.

## Structure du projet

```
app/
  (auth)/login.tsx           # Connexion / inscription (+ choix client/coiffeur)
  (client)/                   # Espace client (5 onglets)
    index.tsx                   # Accueil — vitrine des services
    boutique.tsx                 # Produits
    panier.tsx                    # Panier local (avant réservation)
    reservations.tsx               # Mes réservations + avis
    profil.tsx                      # Compte + contact salon + déconnexion
  reserver.tsx                # Flow de réservation (coiffeur → date → heure → confirmation)
  (staff)/                     # Espace coiffeur/admin (4 onglets)
    index.tsx                    # Planning partagé, temps réel
    panier.tsx                     # Valider le panier (en_attente → en_cours → terminee)
    clients.tsx                     # Liste des clients
    profil.tsx                       # Compte + liens Administration (si admin)
  client/[id].tsx              # Fiche client (staff) — historique de réservations
  admin/                        # Écrans réservés au rôle admin
    services.tsx                    # CRUD services & produits
    coiffeurs.tsx                     # Horaires, activer/désactiver un coiffeur
    utilisateurs.tsx                   # Changer le rôle d'un compte
hooks/
  useAuth.tsx                 # Auth Firebase + rôle (users/{uid})
  useCatalog.ts                # services_produits (+ seed initial)
  useCoiffeurs.ts               # coiffeurs
  useSlots.ts                    # Disponibilité + transaction de réservation atomique
  useReservations.ts               # Planning, mes réservations, annulation
  useReviews.ts                      # Avis
  useUsers.ts                          # Gestion des rôles (admin)
  useCart.tsx                            # Panier local (React Context)
lib/
  firebase.ts, theme.ts, salonInfo.ts, catalog.ts (seed), slots.ts (logique créneaux)
```

## Générer un APK (EAS Build)

```bash
npx eas-cli build --platform android --profile preview
```

Ou depuis GitHub Actions : onglet **Actions** → **EAS Build Android APK** → **Run workflow** (nécessite le secret `EXPO_TOKEN`, voir la configuration existante).

## Ambiguïtés tranchées par défaut (à ajuster si besoin)

- **Fenêtre de réservation** : le client ne peut choisir une date que dans les 14 prochains jours (constante `DAYS_AHEAD` dans [app/reserver.tsx](app/reserver.tsx)).
- **Granularité des créneaux** : 15 minutes (`SLOT_GRANULARITY_MINUTES` dans [types/index.ts](types/index.ts)) ; la durée d'une réservation occupe autant de créneaux consécutifs que nécessaire selon la durée totale des services choisis.
- **Avis** : un client peut en laisser un uniquement depuis une réservation `terminee`, une seule fois affiché par réservation dans l'UI (pas de blocage strict côté règles contre les doublons).
- **FCM (notifications push)** : hors scope pour cette version — nécessiterait un contexte serveur (Cloud Functions) pour envoyer les notifications en toute sécurité.
