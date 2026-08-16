import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';

class CoiffeurService {
  static const _collection = 'coiffeurs';
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Coiffeur>> watchAll() {
    return _db.collection(_collection).snapshots().map(
          (snap) => snap.docs.map((d) => Coiffeur.fromMap(d.id, d.data())).toList(),
        );
  }

  Future<void> update(String id, Map<String, dynamic> data) {
    return _db.collection(_collection).doc(id).update(data);
  }
}
