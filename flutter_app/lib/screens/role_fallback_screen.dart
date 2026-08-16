import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../theme.dart';

class RoleFallbackScreen extends StatelessWidget {
  const RoleFallbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AppAuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Qui es-tu ?',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.text),
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                const Text("Ton compte n'a pas encore de profil. Choisis une option pour continuer.",
                    style: TextStyle(fontSize: 14, color: AppColors.textMuted), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => auth.setUserRole(RegistrableRole.client),
                    child: const Text('Je suis client(e)'),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => auth.setUserRole(RegistrableRole.coiffeur),
                    child: const Text('Je suis coiffeur(se)'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
