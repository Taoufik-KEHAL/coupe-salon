import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/cart_provider.dart';
import '../../services/catalog_service.dart';
import '../../theme.dart';
import '../../widgets/catalog_card.dart';

class BoutiqueScreen extends StatelessWidget {
  const BoutiqueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final catalogService = CatalogService();
    final cart = context.read<CartProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Boutique')),
      body: StreamBuilder<List<ServiceProduct>>(
        stream: catalogService.watchAll(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final produits = snapshot.data!.where((i) => i.type == ItemKind.produit).toList();
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: produits
                  .map((p) => CatalogCard(
                        name: p.name,
                        photoUrl: p.photoUrl,
                        price: p.price,
                        onAdd: () => cart.addItem(p),
                      ))
                  .toList(),
            ),
          );
        },
      ),
    );
  }
}
