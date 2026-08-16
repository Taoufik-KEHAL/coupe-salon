import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/models.dart';
import '../utils/catalog_seed.dart';

class CatalogService {
  static const _collection = 'services_produits';
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<ServiceProduct>> watchAll() {
    return _db.collection(_collection).snapshots().map(
          (snap) => snap.docs.map((d) => ServiceProduct.fromMap(d.id, d.data())).toList(),
        );
  }

  Future<void> create(ServiceProduct item) {
    return _db.collection(_collection).add(item.toMap());
  }

  Future<void> update(String id, Map<String, dynamic> data) {
    return _db.collection(_collection).doc(id).update(data);
  }

  Future<void> delete(String id) {
    return _db.collection(_collection).doc(id).delete();
  }

  /// Import manuel (admin) du catalogue de démarrage — l'auto-seed déclenché
  /// par n'importe quel client casserait les règles Firestore (write
  /// réservé à l'admin), donc c'est une action explicite depuis l'écran
  /// d'administration (miroir de hooks/useCatalog.ts).
  Future<void> seed() async {
    for (final item in seedCatalog) {
      await create(item);
    }
  }
}
