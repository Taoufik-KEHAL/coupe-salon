# Salon Manager (Flutter)

Réécriture complète de l'application Salon Manager en Flutter/Dart, remplaçant la version React Native (`../app`, `../hooks`, etc. à la racine du repo). **Même projet Firebase, mêmes collections Firestore, mêmes règles de sécurité** (`../firestore.rules`) — les deux versions (si l'ancienne est encore présente) partagent les mêmes données.

## Stack

- **Flutter** (channel stable) + Dart
- **Firebase** : `firebase_core`, `firebase_auth`, `cloud_firestore` — configuré via FlutterFire CLI (`lib/firebase_options.dart`, `android/app/google-services.json`)
- **provider** pour la gestion d'état (auth, panier)
- Package Android : `com.coupesalon.app`

## Mise en route

### 1. Installer le SDK Flutter

Si ce n'est pas déjà fait : https://docs.flutter.dev/get-started/install

### 2. Installer les dépendances

```bash
cd flutter_app
flutter pub get
```

### 3. Firebase

Déjà configuré (`lib/firebase_options.dart` généré par `flutterfire configure` contre le projet `salon-97587`, même projet que l'app React Native). Si tu changes de projet Firebase, relance :

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=<ton-project-id> --platforms=android --android-package-name=com.coupesalon.app
```

⚠️ Le nom de package (`applicationId` dans `android/app/build.gradle.kts`, package de `MainActivity.kt`) doit correspondre exactement à celui déclaré dans `google-services.json`, sinon Firebase ne s'initialise pas au runtime.

### 4. Lancer l'application

```bash
flutter run
```

(nécessite un appareil/émulateur Android connecté, ou `flutter run -d chrome` pour un aperçu web pendant le développement — non supporté officiellement pour la prod ici).

### 5. Vérifier avant de committer

```bash
flutter analyze
```

## Générer un APK

### En local (nécessite le SDK Android)

```bash
flutter build apk --release
```

L'APK est généré dans `build/app/outputs/flutter-apk/app-release.apk`.

### Depuis GitHub Actions (recommandé si pas de SDK Android en local)

Onglet **Actions** du repo → **Flutter Build Android APK** → **Run workflow**. Le SDK Android est déjà présent sur les runners GitHub — pas besoin d'un service tiers (contrairement à EAS Build côté React Native, qui nécessite le plan payant Firebase Blaze pour les Cloud Functions ; ici on n'utilise pas non plus de Cloud Functions donc aucune contrainte de ce type).

## Structure

```
lib/
  main.dart                    # Point d'entrée, routage par rôle (client/coiffeur/admin)
  firebase_options.dart        # Généré par FlutterFire CLI
  theme.dart                   # Palette de couleurs
  models/models.dart           # Modèles de données (miroir de types/index.ts)
  providers/
    auth_provider.dart          # Auth Firebase + rôle (ChangeNotifier)
    cart_provider.dart           # Panier local
  services/                     # Accès Firestore (miroir de hooks/*.ts)
    catalog_service.dart, coiffeur_service.dart, slots_service.dart,
    reservation_service.dart, review_service.dart, user_service.dart,
    client_service.dart, stats_service.dart
  utils/
    slots.dart                   # Logique de créneaux (miroir de lib/slots.ts)
    catalog_seed.dart             # Catalogue de démarrage
    salon_info.dart                # Coordonnées du salon
  screens/
    auth/login_screen.dart
    role_fallback_screen.dart
    client/                        # Accueil, Boutique, Panier, Réservations, Profil, Réserver
    staff/                          # Planning (calendrier), Valider le panier, Clients, Profil
    admin/                           # Services & produits, Coiffeurs, Utilisateurs, Statistiques
  widgets/catalog_card.dart
```

## Concurrence sur les créneaux

Même logique que côté React Native (voir `../README.md`, section "Concurrence sur les créneaux") : `services/slots_service.dart` committe la réservation séparément puis lance une `runTransaction` sur les créneaux, car Firestore n'expose pas les écritures d'une transaction aux `get()` évalués par les règles de sécurité pendant cette même transaction.
