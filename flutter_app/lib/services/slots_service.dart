import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';
import '../utils/slots.dart';

class SlotUnavailableException implements Exception {
  final String message;
  SlotUnavailableException([this.message = "Ce créneau vient d'être pris. Choisis-en un autre."]);

  @override
  String toString() => message;
}

class SlotsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Écoute en temps réel les créneaux réservés d'un coiffeur pour un jour
  /// donné (l'absence de document = créneau libre, voir utils/slots.dart).
  Stream<Set<String>> watchReservedTimes(String coiffeurId, String date) {
    return _db
        .collection('creneaux')
        .where('coiffeurId', isEqualTo: coiffeurId)
        .where('date', isEqualTo: date)
        .snapshots()
        .map((snap) => snap.docs.map((d) => d.data()['time'] as String).toSet());
  }

  /// Réserve les créneaux nécessaires pour la durée totale du panier.
  ///
  /// Implémentation en deux temps :
  ///  1. La réservation est créée par une écriture séparée (committée),
  ///     status 'confirmee'.
  ///  2. Une transaction Firestore vérifie ensuite atomiquement que tous les
  ///     créneaux nécessaires sont encore libres et, seulement dans ce cas,
  ///     les crée en les référençant à cette réservation.
  ///
  /// Ces deux étapes ne peuvent PAS être fusionnées en une seule
  /// transaction : les règles de sécurité des créneaux valident la
  /// réservation via get(), et Firestore n'expose pas les écritures d'une
  /// transaction aux get() évalués par les règles pendant cette même
  /// transaction (vérifié empiriquement contre le projet en prod — voir
  /// firestore.rules et le README de l'app React Native pour le détail).
  /// Si le créneau n'est plus libre, la réservation orpheline est annulée
  /// et SlotUnavailableException est levée — sans double-réservation.
  Future<String> reserveSlots({
    required String coiffeurId,
    required String coiffeurName,
    required String date,
    required String startTime,
    required String clientId,
    required String clientName,
    required List<CartItem> items,
    required int totalDurationMinutes,
    required double total,
  }) async {
    final times = slotTimesForDuration(startTime, totalDurationMinutes);
    final slotRefs =
        times.map((t) => _db.collection('creneaux').doc(slotId(coiffeurId, date, t))).toList();
    final reservationRef = _db.collection('reservations').doc();

    await reservationRef.set({
      'clientId': clientId,
      'clientName': clientName,
      'coiffeurId': coiffeurId,
      'coiffeurName': coiffeurName,
      'date': date,
      'startTime': startTime,
      'slotIds': slotRefs.map((r) => r.id).toList(),
      'items': items.map((i) => i.toReservationItemMap()).toList(),
      'total': total,
      'status': 'confirmee',
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });

    try {
      await _db.runTransaction((transaction) async {
        final snaps = await Future.wait(slotRefs.map((r) => transaction.get(r)));
        if (snaps.any((s) => s.exists)) {
          throw SlotUnavailableException();
        }
        for (var i = 0; i < slotRefs.length; i++) {
          transaction.set(slotRefs[i], {
            'coiffeurId': coiffeurId,
            'date': date,
            'time': times[i],
            'status': 'reserve',
            'reservationId': reservationRef.id,
          });
        }
      });
    } catch (e) {
      await reservationRef.update({'status': 'annulee'}).catchError((_) {});
      rethrow;
    }

    return reservationRef.id;
  }
}
