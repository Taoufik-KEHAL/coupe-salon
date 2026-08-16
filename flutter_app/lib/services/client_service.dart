import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';

class ClientService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<ClientProfile>> watchAll() {
    return _db.collection('clients').snapshots().map((snap) {
      final list = snap.docs.map((d) => ClientProfile.fromMap(d.id, d.data())).toList();
      list.sort((a, b) => a.name.compareTo(b.name));
      return list;
    });
  }
}
