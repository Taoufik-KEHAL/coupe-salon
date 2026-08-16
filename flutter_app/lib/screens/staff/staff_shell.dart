import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/reservation_service.dart';
import 'clients_screen.dart';
import 'panier_screen.dart';
import 'planning_screen.dart';
import 'profil_screen.dart';

class StaffShell extends StatefulWidget {
  const StaffShell({super.key});

  @override
  State<StaffShell> createState() => _StaffShellState();
}

class _StaffShellState extends State<StaffShell> {
  int _index = 0;

  static const _screens = [
    PlanningScreen(),
    ValiderPanierScreen(),
    ClientsScreen(),
    StaffProfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: StreamBuilder<List<Reservation>>(
        stream: ReservationService().watchByStatus(ReservationStatus.enAttente),
        builder: (context, snapshot) {
          final count = snapshot.data?.length ?? 0;
          return BottomNavigationBar(
            currentIndex: _index,
            onTap: (i) => setState(() => _index = i),
            selectedFontSize: 11,
            unselectedFontSize: 11,
            items: [
              const BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), label: 'Planning'),
              BottomNavigationBarItem(
                icon: Badge(label: Text('$count'), isLabelVisible: count > 0, child: const Icon(Icons.checklist_outlined)),
                label: 'Valider',
              ),
              const BottomNavigationBarItem(icon: Icon(Icons.people_outline), label: 'Clients'),
              const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profil'),
            ],
          );
        },
      ),
    );
  }
}
