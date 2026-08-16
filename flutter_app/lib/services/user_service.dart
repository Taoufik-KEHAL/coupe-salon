import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';

class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<AppUser>> watchAll() {
    return _db.collection('users').snapshots().map(
          (snap) => snap.docs.map((d) => AppUser.fromMap(d.id, d.data())).toList(),
        );
  }

  Future<void> changeRole(String uid, UserRole role) async {
    await _db.collection('users').doc(uid).update({'role': userRoleToString(role)});
    // Promouvoir en coiffeur nécessite un profil coiffeurs/{uid} (horaires
    // de travail) pour que la réservation de créneaux fonctionne — on le
    // crée s'il n'existe pas encore.
    if (role == UserRole.coiffeur) {
      final existing = await _db.collection('coiffeurs').doc(uid).get();
      if (!existing.exists) {
        final userSnap = await _db.collection('users').doc(uid).get();
        final email = (userSnap.data()?['email'] as String?) ?? '';
        await _db.collection('coiffeurs').doc(uid).set({
          'displayName': email,
          'email': email,
          'workingHours': {'start': '09:00', 'end': '19:00'},
          'active': true,
        });
      }
    }
  }
}
