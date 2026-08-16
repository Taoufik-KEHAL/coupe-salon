import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../models/models.dart';

/// Rôle choisissable librement à l'inscription. 'admin' n'est jamais
/// auto-attribuable — il ne s'obtient que par promotion depuis l'espace
/// "Gestion des utilisateurs" d'un admin existant (miroir de
/// hooks/useAuth.tsx côté app React Native).
enum RegistrableRole { client, coiffeur }

class AppAuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  User? user;
  UserRole? role;
  bool initializing = true;

  // Utilisé pendant register()/setUserRole() pour éviter qu'une lecture de
  // rôle concurrente (déclenchée par authStateChanges dès la création du
  // compte, potentiellement avant que le document Firestore ne soit
  // visible) n'écrase le rôle qu'on est en train de définir.
  UserRole? _pendingRole;

  AppAuthProvider() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? nextUser) async {
    user = nextUser;
    if (nextUser != null) {
      try {
        final snap = await _db.collection('users').doc(nextUser.uid).get();
        final fetched = userRoleFromString(snap.data()?['role'] as String?);
        role = fetched ?? _pendingRole;
      } catch (e) {
        debugPrint('Failed to fetch user role: $e');
        role = _pendingRole;
      }
    } else {
      role = null;
    }
    initializing = false;
    notifyListeners();
  }

  Future<void> _createRoleProfile(String uid, String email, UserRole role) async {
    await _db.collection('users').doc(uid).set({
      'email': email,
      'role': userRoleToString(role),
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
    if (role == UserRole.client) {
      await _db.collection('clients').doc(uid).set({
        'name': email,
        'phone': '',
        'notes': '',
        'createdAt': DateTime.now().millisecondsSinceEpoch,
      });
    } else if (role == UserRole.coiffeur) {
      await _db.collection('coiffeurs').doc(uid).set({
        'displayName': email,
        'email': email,
        'workingHours': {'start': '09:00', 'end': '19:00'},
        'active': true,
      });
    }
  }

  Future<void> login(String email, String password) async {
    await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<void> register(String email, String password, RegistrableRole registrableRole) async {
    final role = registrableRole == RegistrableRole.client ? UserRole.client : UserRole.coiffeur;
    _pendingRole = role;
    try {
      final credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      await _createRoleProfile(credential.user!.uid, email, role);
      this.role = role;
      notifyListeners();
    } finally {
      _pendingRole = null;
    }
  }

  Future<void> logout() async {
    await _auth.signOut();
  }

  Future<void> setUserRole(RegistrableRole registrableRole) async {
    if (user == null) return;
    final role = registrableRole == RegistrableRole.client ? UserRole.client : UserRole.coiffeur;
    _pendingRole = role;
    try {
      await _createRoleProfile(user!.uid, user!.email ?? '', role);
      this.role = role;
      notifyListeners();
    } finally {
      _pendingRole = null;
    }
  }
}
