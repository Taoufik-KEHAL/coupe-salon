import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/user_service.dart';
import '../../theme.dart';

const _roleLabels = {UserRole.client: 'Client', UserRole.coiffeur: 'Coiffeur', UserRole.admin: 'Admin'};

class AdminUsersScreen extends StatelessWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Utilisateurs')),
      body: StreamBuilder<List<AppUser>>(
        stream: UserService().watchAll(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final users = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: users.length,
            itemBuilder: (context, i) {
              final u = users[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(u.email, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 10),
                    Row(
                      children: UserRole.values
                          .map((r) => Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: _RoleChip(
                                    label: _roleLabels[r]!,
                                    active: u.role == r,
                                    onTap: () => UserService().changeRole(u.uid, r),
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _RoleChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: active ? Colors.white : AppColors.text)),
      ),
    );
  }
}
