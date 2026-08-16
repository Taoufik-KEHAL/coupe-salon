import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/cart_provider.dart';
import '../../theme.dart';
import 'accueil_screen.dart';
import 'boutique_screen.dart';
import 'panier_screen.dart';
import 'profil_screen.dart';
import 'reservations_screen.dart';

class ClientShell extends StatefulWidget {
  const ClientShell({super.key});

  @override
  State<ClientShell> createState() => _ClientShellState();
}

class _ClientShellState extends State<ClientShell> {
  int _index = 0;

  static const _screens = [
    AccueilScreen(),
    BoutiqueScreen(),
    PanierScreen(),
    ReservationsScreen(),
    ProfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final itemCount = context.watch<CartProvider>().items.fold<int>(0, (sum, i) => sum + i.quantity);

    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Accueil'),
          const BottomNavigationBarItem(icon: Icon(Icons.sell_outlined), label: 'Boutique'),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text('$itemCount'),
              isLabelVisible: itemCount > 0,
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            label: 'Panier',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.schedule_outlined), label: 'Réservations'),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      ),
    );
  }
}
