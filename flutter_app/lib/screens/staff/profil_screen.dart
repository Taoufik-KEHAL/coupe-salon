import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../theme.dart';
import '../admin/coiffeurs_screen.dart';
import '../admin/services_screen.dart';
import '../admin/statistiques_screen.dart';
import '../admin/utilisateurs_screen.dart';

class StaffProfilScreen extends StatelessWidget {
  const StaffProfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AppAuthProvider>();
    final isAdmin = auth.role == UserRole.admin;

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
              child: const Icon(Icons.person, size: 32, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(auth.user?.email ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 8),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(20)),
              child: Text(isAdmin ? 'Administrateur' : 'Coiffeur(se)',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
            ),
          ),
          if (isAdmin) ...[
            const SizedBox(height: 20),
            const Text('Administration', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
            const SizedBox(height: 8),
            _LinkRow(
              icon: Icons.content_cut,
              label: 'Services & produits',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminServicesScreen())),
            ),
            _LinkRow(
              icon: Icons.people_outline,
              label: 'Coiffeurs',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminCoiffeursScreen())),
            ),
            _LinkRow(
              icon: Icons.manage_accounts_outlined,
              label: 'Utilisateurs',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminUsersScreen())),
            ),
            _LinkRow(
              icon: Icons.bar_chart_outlined,
              label: 'Statistiques',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminStatsScreen())),
            ),
          ],
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => auth.logout(),
            icon: const Icon(Icons.logout, size: 18, color: AppColors.danger),
            label: const Text('Se déconnecter', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600)),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.border)),
          ),
        ],
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _LinkRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
