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

### Mode démo (sans Firebase)

Si `.env` est absent ou que `EXPO_PUBLIC_FIREBASE_API_KEY` n'est pas renseignée, l'app bascule automatiquement sur un backend local (`lib/mockBackend.ts`) : connexion avec n'importe quel e-mail/mot de passe (6 caractères min.), clients et rendez-vous de démonstration stockés dans `AsyncStorage`. Pratique pour valider l'interface sans créer de projet Firebase :

```bash
npx expo start --web
```

## Générer un APK

Ce projet est en workflow managé Expo (pas de dossier `android/`) : la génération d'APK passe par [EAS Build](https://docs.expo.dev/build/introduction/) (build cloud) — pas besoin d'Android Studio.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # profil "preview" = APK installable directement
```

`eas.json` est déjà configuré avec un profil `preview` qui produit un `.apk` (au lieu du `.aab` de `production`, destiné au Play Store). Le lien de téléchargement de l'APK s'affiche à la fin du build.

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

## Notes

- Les données sont scopées par utilisateur (`ownerId`) : si plusieurs employés doivent partager les mêmes clients/rendez-vous, il faudra faire évoluer le modèle de données (ex. `salonId` partagé).
- L'icône et le splash screen sont ceux par défaut d'Expo — à remplacer dans `assets/` selon l'identité visuelle du salon.
