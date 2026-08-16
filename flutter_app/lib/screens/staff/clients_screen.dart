import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/client_service.dart';
import '../../theme.dart';
import 'client_detail_screen.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clients')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: const InputDecoration(
                hintText: 'Rechercher un client...',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<ClientProfile>>(
              stream: ClientService().watchAll(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                final query = _search.trim().toLowerCase();
                final clients = query.isEmpty
                    ? snapshot.data!
                    : snapshot.data!
                        .where((c) => c.name.toLowerCase().contains(query) || c.phone.contains(query))
                        .toList();
                if (clients.isEmpty) {
                  return const Center(child: Text('Aucun client.', style: TextStyle(color: AppColors.textMuted)));
                }
                return ListView.builder(
                  itemCount: clients.length,
                  itemBuilder: (context, i) {
                    final c = clients[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primaryLight,
                        child: Text(c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: c.phone.isNotEmpty ? Text(c.phone) : null,
                      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                      onTap: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => ClientDetailScreen(client: c))),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
