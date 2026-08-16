import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/reservation_service.dart';
import '../../theme.dart';
import 'reserver_screen.dart';

class PanierScreen extends StatefulWidget {
  const PanierScreen({super.key});

  @override
  State<PanierScreen> createState() => _PanierScreenState();
}

class _PanierScreenState extends State<PanierScreen> {
  bool _submitting = false;

  Future<void> _validate() async {
    final cart = context.read<CartProvider>();
    if (cart.hasServices) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReserverScreen()));
      return;
    }
    final auth = context.read<AppAuthProvider>();
    if (auth.user == null) return;
    setState(() => _submitting = true);
    try {
      await ReservationService().createProductOnlyOrder(
        clientId: auth.user!.uid,
        clientName: auth.user!.email ?? '',
        items: cart.items,
        total: cart.total,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Commande enregistrée'),
          content: const Text('Présente-toi au salon avec ce récapitulatif — le règlement se fait sur place.'),
          actions: [
            TextButton(
              onPressed: () {
                cart.clear();
                Navigator.of(context).pop();
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    if (cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Panier')),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.shopping_cart_outlined, size: 48, color: AppColors.textMuted),
              SizedBox(height: 10),
              Text('Ton panier est vide.', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Panier')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: cart.items.length,
              itemBuilder: (context, index) {
                final item = cart.items[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(item.photoUrl, width: 52, height: 52, fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(width: 52, height: 52, color: AppColors.border)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text('${item.price.toStringAsFixed(0)} DHS',
                                style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 22),
                        onPressed: () => cart.decrement(item.id),
                      ),
                      Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 22),
                        onPressed: () => cart.increment(item.id),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.danger),
                        onPressed: () => cart.remove(item.id),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total', style: TextStyle(fontSize: 16, color: AppColors.textMuted)),
                    Text('${cart.total.toStringAsFixed(0)} DHS',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _validate,
                    child: _submitting
                        ? const SizedBox(
                            height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(cart.hasServices ? 'Choisir un créneau' : 'Valider la commande'),
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Paiement sur place au salon — aucun paiement en ligne.',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted), textAlign: TextAlign.center),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
