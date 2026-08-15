# Salon Manager

Application Android (React Native / Expo) de gestion d'un salon de coiffure : fiches clients et agenda des rendez-vous, avec synchronisation cloud via Firebase.

## Stack

- **React Native + Expo** (SDK 57, Expo Router, TypeScript)
- **Firebase** : Authentication (e-mail/mot de passe) + Firestore (base de données temps réel)

## Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un nouveau projet.
2. Dans **Build > Authentication**, active le fournisseur **E-mail/Mot de passe**.
3. Dans **Build > Firestore Database**, crée une base (mode production).
4. Ajoute les règles de sécurité du fichier [`firestore.rules`](./firestore.rules) (chaque utilisateur ne voit que ses propres données).
5. Dans **Paramètres du projet > Général**, ajoute une application **Web** (icône `</>`) — c'est le SDK web qui est utilisé ici, y compris depuis l'app Android. Copie la config générée.

### 3. Configurer les variables d'environnement

Copie `.env.example` vers `.env` et renseigne les valeurs récupérées à l'étape précédente :

```bash
cp .env.example .env
```

### 4. Lancer l'application

```bash
npx expo start
```

Scanne le QR code avec l'app **Expo Go** (Android) pour tester directement sur ton téléphone — aucune installation d'Android Studio n'est nécessaire pour le développement.

## Structure du projet

```
app/
  (auth)/login.tsx        # Connexion / création de compte
  (tabs)/index.tsx         # Agenda des rendez-vous
  (tabs)/clients.tsx       # Liste des clients
  client/[id].tsx          # Fiche client + historique
  client/new.tsx           # Ajout d'un client
  appointment/[id].tsx     # Détail / édition d'un rendez-vous
  appointment/new.tsx      # Ajout d'un rendez-vous
hooks/
  useAuth.tsx               # Contexte d'authentification Firebase
  useClients.ts             # CRUD + écoute temps réel des clients
  useAppointments.ts        # CRUD + écoute temps réel des rendez-vous
lib/
  firebase.ts                # Initialisation Firebase (Auth + Firestore)
  theme.ts                   # Palette de couleurs de l'app
```

## Générer un APK (EAS Build)

L'APK est compilé dans le cloud via [EAS Build](https://expo.dev/eas), sans besoin d'Android Studio local.

### En local

```bash
npx eas-cli build --platform android --profile preview
```

Le lien de téléchargement de l'APK s'affiche à la fin du build (aussi visible sur [expo.dev](https://expo.dev/accounts/tfkkehal/projects/coupe-salon/builds)).

### Depuis GitHub Actions

Le workflow [`.github/workflows/eas-build.yml`](.github/workflows/eas-build.yml) permet de lancer un build depuis l'onglet **Actions** du repo (bouton **Run workflow**), sans rien installer localement.

Configuration requise (une seule fois) :
1. Crée un token d'accès Expo : [expo.dev/accounts/tfkkehal/settings/access-tokens](https://expo.dev/accounts/tfkkehal/settings/access-tokens) → **Create token** (donne-lui un nom du type `github-actions`)
2. Ajoute-le comme secret du repo GitHub : **Settings > Secrets and variables > Actions > New repository secret**, nom `EXPO_TOKEN`, colle le token
3. Les variables Firebase (`EXPO_PUBLIC_FIREBASE_*`) sont déjà configurées côté EAS (environnements `preview`/`production`, visibles sur `eas env:list preview`) — pas besoin de les redéfinir dans GitHub.

Ensuite : onglet **Actions** → **EAS Build Android APK** → **Run workflow**.

## Notes

- Les données sont scopées par utilisateur (`ownerId`) : si plusieurs employés doivent partager les mêmes clients/rendez-vous, il faudra faire évoluer le modèle de données (ex. `salonId` partagé).
- L'icône et le splash screen sont ceux par défaut d'Expo — à remplacer dans `assets/` selon l'identité visuelle du salon.
