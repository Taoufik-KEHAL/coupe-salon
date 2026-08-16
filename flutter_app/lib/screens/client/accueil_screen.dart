import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/cart_provider.dart';
import '../../services/catalog_service.dart';
import '../../theme.dart';
import '../../widgets/catalog_card.dart';

class AccueilScreen extends StatelessWidget {
  const AccueilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final catalogService = CatalogService();
    final cart = context.read<CartProvider>();

    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false, title: const SizedBox.shrink(), toolbarHeight: 0),
      body: StreamBuilder<List<ServiceProduct>>(
        stream: catalogService.watchAll(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final services = snapshot.data!.where((i) => i.type == ItemKind.service).toList();
          final featured = services.where((s) => s.featured).toList();

          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Cher(e)s client(e)s', style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
                    SizedBox(height: 2),
                    Text('Salon Manager',
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.text)),
                  ],
                ),
              ),
              if (featured.isNotEmpty) ...[
                const _SectionTitle('Offres du moment'),
                SizedBox(
                  height: 190,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: featured.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, i) {
                      final s = featured[i];
                      return CatalogCard(
                        name: s.name,
                        photoUrl: s.photoUrl,
                        price: s.price,
                        durationMinutes: s.durationMinutes,
                        large: true,
                        onAdd: () => cart.addItem(s),
                      );
                    },
                  ),
                ),
              ],
              const _SectionTitle('Nos services'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: services
                      .map((s) => CatalogCard(
                            name: s.name,
                            photoUrl: s.photoUrl,
                            price: s.price,
                            durationMinutes: s.durationMinutes,
                            onAdd: () => cart.addItem(s),
                          ))
                      .toList(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
      child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text)),
    );
  }
}
