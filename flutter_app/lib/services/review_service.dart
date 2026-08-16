import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';

class ReviewService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Review>> watchAll() {
    return _db.collection('reviews').orderBy('createdAt', descending: true).snapshots().map(
          (snap) => snap.docs.map((d) => Review.fromMap(d.id, d.data())).toList(),
        );
  }

  Future<void> create({
    required String reservationId,
    required String clientId,
    required String clientName,
    String? coiffeurId,
    required int rating,
    required String comment,
  }) {
    return _db.collection('reviews').add({
      'reservationId': reservationId,
      'clientId': clientId,
      'clientName': clientName,
      'coiffeurId': coiffeurId,
      'rating': rating,
      'comment': comment,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
  }
}
