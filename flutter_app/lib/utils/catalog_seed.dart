import '../models/models.dart';

String _unsplash(String id) => 'https://images.unsplash.com/$id?w=600&q=80&auto=format&fit=crop';

/// Catalogue de démarrage : utilisé une seule fois pour pré-remplir Firestore
/// (services_produits) si la collection est vide. Modifiable ensuite par
/// l'admin depuis l'app. Miroir de lib/catalog.ts côté app React Native.
final List<ServiceProduct> seedCatalog = [
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Coupe Enfant -12 ans',
    photoUrl: _unsplash('photo-1599351431202-1e0f0137899a'),
    durationMinutes: 15,
    price: 15,
    featured: true,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Coupe Homme',
    photoUrl: _unsplash('photo-1503951914875-452162b0f3f1'),
    durationMinutes: 20,
    price: 25,
    featured: true,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Taille de barbe',
    photoUrl: _unsplash('photo-1521590832167-7bcbfaa6381f'),
    durationMinutes: 15,
    price: 15,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Soins visage',
    photoUrl: _unsplash('photo-1512690459411-b9245aed614b'),
    durationMinutes: 30,
    price: 40,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Soins cheveux',
    photoUrl: _unsplash('photo-1522335789203-aabd1fc54bc9'),
    durationMinutes: 20,
    price: 20,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Coupe les jeunes -20 ans',
    photoUrl: _unsplash('photo-1560066984-138dadb4c035'),
    durationMinutes: 20,
    price: 20,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Coupe + taille de barbe PLUS',
    photoUrl: _unsplash('photo-1633681926035-ec1ac984418a'),
    durationMinutes: 45,
    price: 50,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Coupe + taille de barbe',
    photoUrl: _unsplash('photo-1526047932273-341f2a7631f9'),
    durationMinutes: 30,
    price: 30,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Shampoing',
    photoUrl: _unsplash('photo-1605497788044-5a32c7078486'),
    durationMinutes: 10,
    price: 10,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.service,
    name: 'Séchage',
    photoUrl: _unsplash('photo-1587909209111-5097ee578ec3'),
    durationMinutes: 15,
    price: 10,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.produit,
    name: 'Shampoing professionnel',
    photoUrl: _unsplash('photo-1519415943484-9fa1873496d4'),
    price: 45,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.produit,
    name: 'Cire coiffante',
    photoUrl: _unsplash('photo-1522337660859-02fbefca4702'),
    price: 35,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.produit,
    name: 'Huile à barbe',
    photoUrl: _unsplash('photo-1517832606299-7ae9b720a186'),
    price: 40,
  ),
  ServiceProduct(
    id: '',
    type: ItemKind.produit,
    name: 'Gel coiffant',
    photoUrl: _unsplash('photo-1470259078422-826894b933aa'),
    price: 30,
  ),
];
