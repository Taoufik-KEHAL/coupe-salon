import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/reservation_service.dart';
import '../../theme.dart';

const _statusLabels = {
  ReservationStatus.confirmee: 'Confirmée',
  ReservationStatus.enAttente: 'En attente',
  ReservationStatus.enCours: 'En cours',
  ReservationStatus.terminee: 'Terminée',
  ReservationStatus.annulee: 'Annulée',
};

class ClientDetailScreen extends StatelessWidget {
  final ClientProfile client;
  const ClientDetailScreen({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(client.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(client.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                if (client.phone.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text('📞 ${client.phone}', style: const TextStyle(fontSize: 15, color: AppColors.textMuted)),
                  ),
                if (client.notes.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(client.notes, style: const TextStyle(fontStyle: FontStyle.italic)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Historique', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          StreamBuilder<List<Reservation>>(
            stream: ReservationService().watchByClient(client.id),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator(color: AppColors.primary));
              }
              if (snapshot.data!.isEmpty) {
                return const Text('Aucune réservation.', style: TextStyle(color: AppColors.textMuted));
              }
              return Column(
                children: snapshot.data!
                    .map((r) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(r.coiffeurName ?? 'Produits',
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                    if (r.date != null)
                                      Text('${r.date} à ${r.startTime}',
                                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                                  ],
                                ),
                              ),
                              Text(_statusLabels[r.status]!,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                            ],
                          ),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
