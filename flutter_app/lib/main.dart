import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'models/models.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/client/client_shell.dart';
import 'screens/role_fallback_screen.dart';
import 'screens/staff/staff_shell.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const SalonManagerApp());
}

class SalonManagerApp extends StatelessWidget {
  const SalonManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppAuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp(
        title: 'Salon Manager',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const RootNavigator(),
      ),
    );
  }
}

class RootNavigator extends StatelessWidget {
  const RootNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AppAuthProvider>();

    if (auth.initializing) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    }

    if (auth.user == null) {
      return const LoginScreen();
    }

    if (auth.role == null) {
      return const RoleFallbackScreen();
    }

    final isStaff = auth.role == UserRole.coiffeur || auth.role == UserRole.admin;
    return isStaff ? const StaffShell() : const ClientShell();
  }
}
