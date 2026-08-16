import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme.dart';

enum _Mode { login, register }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  _Mode _mode = _Mode.login;
  RegistrableRole _role = RegistrableRole.client;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _error;
  bool _submitting = false;

  String _friendlyError(String code) {
    switch (code) {
      case 'invalid-email':
        return 'Adresse e-mail invalide.';
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return 'E-mail ou mot de passe incorrect.';
      case 'email-already-in-use':
        return 'Un compte existe déjà avec cet e-mail.';
      case 'weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      default:
        return 'Une erreur est survenue. Réessaie.';
    }
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Merci de renseigner ton e-mail et mot de passe.');
      return;
    }
    setState(() => _submitting = true);
    final auth = context.read<AppAuthProvider>();
    try {
      if (_mode == _Mode.login) {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, _role);
      }
    } on FirebaseAuthException catch (e) {
      setState(() => _error = _friendlyError(e.code));
    } catch (_) {
      setState(() => _error = 'Une erreur est survenue. Réessaie.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Salon Manager',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.text)),
                const SizedBox(height: 6),
                const Text('Réservation de prestations et gestion du salon',
                    style: TextStyle(fontSize: 15, color: AppColors.textMuted), textAlign: TextAlign.center),
                const SizedBox(height: 40),
                if (_mode == _Mode.register)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Expanded(
                          child: _RoleChip(
                            label: 'Je suis client(e)',
                            active: _role == RegistrableRole.client,
                            onTap: () => setState(() => _role = RegistrableRole.client),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _RoleChip(
                            label: 'Je suis coiffeur(se)',
                            active: _role == RegistrableRole.coiffeur,
                            onTap: () => setState(() => _role = RegistrableRole.coiffeur),
                          ),
                        ),
                      ],
                    ),
                  ),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textCapitalization: TextCapitalization.none,
                  decoration: const InputDecoration(hintText: 'E-mail'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(hintText: 'Mot de passe'),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppColors.danger), textAlign: TextAlign.center),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(_mode == _Mode.login ? 'Se connecter' : 'Créer le compte'),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => setState(() {
                    _error = null;
                    _mode = _mode == _Mode.login ? _Mode.register : _Mode.login;
                  }),
                  child: Text(
                    _mode == _Mode.login ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter',
                    style: const TextStyle(color: AppColors.primary),
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

class _RoleChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _RoleChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppColors.text,
          ),
        ),
      ),
    );
  }
}
