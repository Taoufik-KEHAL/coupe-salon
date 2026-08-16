// Modèle de données — reflète exactement types/index.ts et firestore.rules
// côté app React Native, pour rester compatible avec le même projet
// Firebase (mêmes collections, mêmes champs, mêmes règles de sécurité).

const int slotGranularityMinutes = 15;

enum UserRole { client, coiffeur, admin }

UserRole? userRoleFromString(String? value) {
  switch (value) {
    case 'client':
      return UserRole.client;
    case 'coiffeur':
      return UserRole.coiffeur;
    case 'admin':
      return UserRole.admin;
    default:
      return null;
  }
}

String userRoleToString(UserRole role) => role.name;

class AppUser {
  final String uid;
  final String email;
  final UserRole role;

  AppUser({required this.uid, required this.email, required this.role});

  factory AppUser.fromMap(String uid, Map<String, dynamic> data) {
    return AppUser(
      uid: uid,
      email: (data['email'] as String?) ?? '',
      role: userRoleFromString(data['role'] as String?) ?? UserRole.client,
    );
  }
}

enum ItemKind { service, produit }

ItemKind itemKindFromString(String value) => value == 'service' ? ItemKind.service : ItemKind.produit;

class ServiceProduct {
  final String id;
  final ItemKind type;
  final String name;
  final String photoUrl;
  final double price;
  final int? durationMinutes;
  final bool featured;

  ServiceProduct({
    required this.id,
    required this.type,
    required this.name,
    required this.photoUrl,
    required this.price,
    this.durationMinutes,
    this.featured = false,
  });

  factory ServiceProduct.fromMap(String id, Map<String, dynamic> data) {
    return ServiceProduct(
      id: id,
      type: itemKindFromString(data['type'] as String? ?? 'service'),
      name: (data['name'] as String?) ?? '',
      photoUrl: (data['photoUrl'] as String?) ?? '',
      price: (data['price'] as num?)?.toDouble() ?? 0,
      durationMinutes: (data['durationMinutes'] as num?)?.toInt(),
      featured: (data['featured'] as bool?) ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'type': type == ItemKind.service ? 'service' : 'produit',
        'name': name,
        'photoUrl': photoUrl,
        'price': price,
        if (durationMinutes != null) 'durationMinutes': durationMinutes,
        'featured': featured,
      };
}

class WorkingHours {
  final String start; // "09:00"
  final String end; // "19:00"

  WorkingHours({required this.start, required this.end});

  factory WorkingHours.fromMap(Map<String, dynamic>? data) {
    if (data == null) return WorkingHours(start: '09:00', end: '19:00');
    return WorkingHours(
      start: (data['start'] as String?) ?? '09:00',
      end: (data['end'] as String?) ?? '19:00',
    );
  }

  Map<String, dynamic> toMap() => {'start': start, 'end': end};
}

class Coiffeur {
  final String id;
  final String displayName;
  final String email;
  final WorkingHours workingHours;
  final bool active;

  Coiffeur({
    required this.id,
    required this.displayName,
    required this.email,
    required this.workingHours,
    required this.active,
  });

  factory Coiffeur.fromMap(String id, Map<String, dynamic> data) {
    return Coiffeur(
      id: id,
      displayName: (data['displayName'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
      workingHours: WorkingHours.fromMap(data['workingHours'] as Map<String, dynamic>?),
      active: (data['active'] as bool?) ?? true,
    );
  }
}

class CartItem {
  final String id;
  final ItemKind kind;
  final String name;
  final double price;
  final String photoUrl;
  final int? durationMinutes;
  final int quantity;

  CartItem({
    required this.id,
    required this.kind,
    required this.name,
    required this.price,
    required this.photoUrl,
    this.durationMinutes,
    required this.quantity,
  });

  CartItem copyWith({int? quantity}) => CartItem(
        id: id,
        kind: kind,
        name: name,
        price: price,
        photoUrl: photoUrl,
        durationMinutes: durationMinutes,
        quantity: quantity ?? this.quantity,
      );

  Map<String, dynamic> toReservationItemMap() => {
        'id': id,
        'kind': kind == ItemKind.service ? 'service' : 'produit',
        'name': name,
        'price': price,
        if (durationMinutes != null) 'durationMinutes': durationMinutes,
        'quantity': quantity,
      };
}

enum ReservationStatus { confirmee, enAttente, enCours, terminee, annulee }

ReservationStatus reservationStatusFromString(String? value) {
  switch (value) {
    case 'confirmee':
      return ReservationStatus.confirmee;
    case 'en_attente':
      return ReservationStatus.enAttente;
    case 'en_cours':
      return ReservationStatus.enCours;
    case 'terminee':
      return ReservationStatus.terminee;
    case 'annulee':
      return ReservationStatus.annulee;
    default:
      return ReservationStatus.confirmee;
  }
}

String reservationStatusToString(ReservationStatus status) {
  switch (status) {
    case ReservationStatus.confirmee:
      return 'confirmee';
    case ReservationStatus.enAttente:
      return 'en_attente';
    case ReservationStatus.enCours:
      return 'en_cours';
    case ReservationStatus.terminee:
      return 'terminee';
    case ReservationStatus.annulee:
      return 'annulee';
  }
}

class ReservationItem {
  final String id;
  final ItemKind kind;
  final String name;
  final double price;
  final int? durationMinutes;
  final int quantity;

  ReservationItem({
    required this.id,
    required this.kind,
    required this.name,
    required this.price,
    this.durationMinutes,
    required this.quantity,
  });

  factory ReservationItem.fromMap(Map<String, dynamic> data) {
    return ReservationItem(
      id: (data['id'] as String?) ?? '',
      kind: itemKindFromString(data['kind'] as String? ?? 'service'),
      name: (data['name'] as String?) ?? '',
      price: (data['price'] as num?)?.toDouble() ?? 0,
      durationMinutes: (data['durationMinutes'] as num?)?.toInt(),
      quantity: (data['quantity'] as num?)?.toInt() ?? 1,
    );
  }
}

class Reservation {
  final String id;
  final String clientId;
  final String clientName;
  final String? coiffeurId;
  final String? coiffeurName;
  final String? date; // "2026-08-20"
  final String? startTime; // "09:15"
  final List<String> slotIds;
  final List<ReservationItem> items;
  final double total;
  final ReservationStatus status;
  final int createdAt;

  Reservation({
    required this.id,
    required this.clientId,
    required this.clientName,
    this.coiffeurId,
    this.coiffeurName,
    this.date,
    this.startTime,
    required this.slotIds,
    required this.items,
    required this.total,
    required this.status,
    required this.createdAt,
  });

  factory Reservation.fromMap(String id, Map<String, dynamic> data) {
    return Reservation(
      id: id,
      clientId: (data['clientId'] as String?) ?? '',
      clientName: (data['clientName'] as String?) ?? '',
      coiffeurId: data['coiffeurId'] as String?,
      coiffeurName: data['coiffeurName'] as String?,
      date: data['date'] as String?,
      startTime: data['startTime'] as String?,
      slotIds: (data['slotIds'] as List?)?.map((e) => e as String).toList() ?? [],
      items: (data['items'] as List?)
              ?.map((e) => ReservationItem.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      total: (data['total'] as num?)?.toDouble() ?? 0,
      status: reservationStatusFromString(data['status'] as String?),
      createdAt: (data['createdAt'] as num?)?.toInt() ?? 0,
    );
  }
}

class Review {
  final String id;
  final String reservationId;
  final String clientId;
  final String clientName;
  final String? coiffeurId;
  final int rating;
  final String comment;
  final int createdAt;

  Review({
    required this.id,
    required this.reservationId,
    required this.clientId,
    required this.clientName,
    this.coiffeurId,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  factory Review.fromMap(String id, Map<String, dynamic> data) {
    return Review(
      id: id,
      reservationId: (data['reservationId'] as String?) ?? '',
      clientId: (data['clientId'] as String?) ?? '',
      clientName: (data['clientName'] as String?) ?? '',
      coiffeurId: data['coiffeurId'] as String?,
      rating: (data['rating'] as num?)?.toInt() ?? 5,
      comment: (data['comment'] as String?) ?? '',
      createdAt: (data['createdAt'] as num?)?.toInt() ?? 0,
    );
  }
}

class ClientProfile {
  final String id;
  final String name;
  final String phone;
  final String notes;

  ClientProfile({required this.id, required this.name, required this.phone, required this.notes});

  factory ClientProfile.fromMap(String id, Map<String, dynamic> data) {
    return ClientProfile(
      id: id,
      name: (data['name'] as String?) ?? '',
      phone: (data['phone'] as String?) ?? '',
      notes: (data['notes'] as String?) ?? '',
    );
  }
}
