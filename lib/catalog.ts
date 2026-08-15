import type { Product, Service } from '@/types';

function unsplash(id: string) {
  return `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;
}

// Catalogue local (services et produits fixes pour cette version).
// Photos libres de droit (Unsplash). À ajuster librement selon les vraies
// prestations et tarifs du salon.
export const SERVICES: Service[] = [
  {
    id: 'coupe-enfant',
    name: 'Coupe Enfant -12 ans',
    photoUrl: unsplash('photo-1599351431202-1e0f0137899a'),
    durationMinutes: 15,
    price: 15,
    featured: true,
  },
  {
    id: 'coupe-homme',
    name: 'Coupe Homme',
    photoUrl: unsplash('photo-1503951914875-452162b0f3f1'),
    durationMinutes: 20,
    price: 25,
    featured: true,
  },
  {
    id: 'taille-barbe',
    name: 'Taille de barbe',
    photoUrl: unsplash('photo-1521590832167-7bcbfaa6381f'),
    durationMinutes: 15,
    price: 15,
  },
  {
    id: 'soins-visage',
    name: 'Soins visage',
    photoUrl: unsplash('photo-1512690459411-b9245aed614b'),
    durationMinutes: 30,
    price: 40,
  },
  {
    id: 'soins-cheveux',
    name: 'Soins cheveux',
    photoUrl: unsplash('photo-1522335789203-aabd1fc54bc9'),
    durationMinutes: 20,
    price: 20,
  },
  {
    id: 'coupe-jeunes',
    name: 'Coupe les jeunes -20 ans',
    photoUrl: unsplash('photo-1560066984-138dadb4c035'),
    durationMinutes: 20,
    price: 20,
  },
  {
    id: 'coupe-taille-barbe-plus',
    name: 'Coupe + taille de barbe PLUS',
    photoUrl: unsplash('photo-1633681926035-ec1ac984418a'),
    durationMinutes: 45,
    price: 50,
  },
  {
    id: 'coupe-taille-barbe',
    name: 'Coupe + taille de barbe',
    photoUrl: unsplash('photo-1526047932273-341f2a7631f9'),
    durationMinutes: 30,
    price: 30,
  },
  {
    id: 'shampoing',
    name: 'Shampoing',
    photoUrl: unsplash('photo-1605497788044-5a32c7078486'),
    durationMinutes: 10,
    price: 10,
  },
  {
    id: 'sechage',
    name: 'Séchage',
    photoUrl: unsplash('photo-1587909209111-5097ee578ec3'),
    durationMinutes: 15,
    price: 10,
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'shampoing-pro',
    name: 'Shampoing professionnel',
    photoUrl: unsplash('photo-1519415943484-9fa1873496d4'),
    price: 45,
  },
  {
    id: 'cire-coiffante',
    name: 'Cire coiffante',
    photoUrl: unsplash('photo-1522337660859-02fbefca4702'),
    price: 35,
  },
  {
    id: 'huile-barbe',
    name: 'Huile à barbe',
    photoUrl: unsplash('photo-1517832606299-7ae9b720a186'),
    price: 40,
  },
  {
    id: 'gel-coiffant',
    name: 'Gel coiffant',
    photoUrl: unsplash('photo-1470259078422-826894b933aa'),
    price: 30,
  },
];
