import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';

class ReservationService {
  static const _collection = 'reservations';
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Reservation>> watchByClient(String clientId) {
    return _db.collection(_collection).where('clientId', isEqualTo: clientId).snapshots().map(
          (snap) {
            final list = snap.docs.map((d) => Reservation.fromMap(d.id, d.data())).toList();
            list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
            return list;
          },
        );
  }

  /// Planning partagé : toutes les réservations d'un jour donné, tous
  /// coiffeurs confondus — visible par tout coiffeur/admin, mis à jour en
  /// temps réel.
  Stream<List<Reservation>> watchByDate(String date) {
    return _db.collection(_collection).where('date', isEqualTo: date).snapshots().map((snap) {
      final list = snap.docs.map((d) => Reservation.fromMap(d.id, d.data())).toList();
      list.sort((a, b) => (a.startTime ?? '').compareTo(b.startTime ?? ''));
      return list;
    });
  }

  Stream<List<Reservation>> watchByStatus(ReservationStatus status) {
    return _db
        .collection(_collection)
        .where('status', isEqualTo: reservationStatusToString(status))
        .snapshots()
        .map((snap) {
      final list = snap.docs.map((d) => Reservation.fromMap(d.id, d.data())).toList();
      list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      return list;
    });
  }

  Future<void> setStatus(String id, ReservationStatus status) {
    return _db.collection(_collection).doc(id).update({'status': reservationStatusToString(status)});
  }

  /// Annule une réservation et libère ses créneaux dans la même transaction
  /// (un créneau "libre" = absence de document, voir utils/slots.dart).
  Future<void> cancel(Reservation reservation) async {
    await _db.runTransaction((transaction) async {
      final ref = _db.collection(_collection).doc(reservation.id);
      transaction.update(ref, {'status': 'annulee'});
      for (final slotId in reservation.slotIds) {
        transaction.delete(_db.collection('creneaux').doc(slotId));
      }
    });
  }

  /// Commande produits seuls, sans créneau ni coiffeur.
  Future<String> createProductOnlyOrder({
    required String clientId,
    required String clientName,
    required List<CartItem> items,
    required double total,
  }) async {
    final ref = await _db.collection(_collection).add({
      'clientId': clientId,
      'clientName': clientName,
      'coiffeurId': null,
      'coiffeurName': null,
      'date': null,
      'startTime': null,
      'slotIds': <String>[],
      'items': items.map((i) => i.toReservationItemMap()).toList(),
      'total': total,
      'status': 'en_attente',
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
    return ref.id;
  }
}
