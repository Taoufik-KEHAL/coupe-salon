import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/reservation_service.dart';
import '../../theme.dart';

class ValiderPanierScreen extends StatelessWidget {
  const ValiderPanierScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AppAuthProvider>();

    // Seul le coiffeur assigné à la réservation (ou l'admin) peut confirmer
    // qu'elle est terminée — une commande produits seuls (sans coiffeur)
    // reste ouverte à tout le staff.
    bool canComplete(Reservation r) =>
        r.coiffeurId == null || r.coiffeurId == auth.user?.uid || auth.role == UserRole.admin;

    return Scaffold(
      appBar: AppBar(title: const Text('Valider le panier')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          StreamBuilder<List<Reservation>>(
            stream: ReservationService().watchByStatus(ReservationStatus.enAttente),
            builder: (context, snapshot) {
              final list = snapshot.data ?? [];
              return _Section(
                title: 'À valider (${list.length})',
                emptyText: 'Rien en attente.',
                children: list
                    .map((r) => _ReservationRow(
                          reservation: r,
                          actionLabel: 'Valider le panier',
                          actionColor: AppColors.primary,
                          onAction: () => ReservationService().setStatus(r.id, ReservationStatus.enCours),
                        ))
                    .toList(),
              );
            },
          ),
          const SizedBox(height: 20),
          StreamBuilder<List<Reservation>>(
            stream: ReservationService().watchByStatus(ReservationStatus.enCours),
            builder: (context, snapshot) {
              final list = snapshot.data ?? [];
              return _Section(
                title: 'En cours (${list.length})',
                emptyText: 'Rien en cours.',
                children: list
                    .map((r) => _ReservationRow(
                          reservation: r,
                          actionLabel: canComplete(r) ? "Confirmer l'accomplissement" : null,
                          waitingText: canComplete(r) ? null : "En attente de confirmation par ${r.coiffeurName ?? 'le coiffeur assigné'}",
                          actionColor: AppColors.success,
                          onAction: () => ReservationService().setStatus(r.id, ReservationStatus.terminee),
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

class _Section extends StatelessWidget {
  final String title;
  final String emptyText;
  final List<Widget> children;

  const _Section({required this.title, required this.emptyText, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        if (children.isEmpty)
          Text(emptyText, style: const TextStyle(color: AppColors.textMuted, fontSize: 13))
        else
          ...children,
      ],
    );
  }
}

class _ReservationRow extends StatelessWidget {
  final Reservation reservation;
  final String? actionLabel;
  final String? waitingText;
  final Color actionColor;
  final VoidCallback onAction;

  const _ReservationRow({
    required this.reservation,
    this.actionLabel,
    this.waitingText,
    required this.actionColor,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
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
          Text(reservation.clientName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          if (reservation.coiffeurName != null)
            Text(reservation.coiffeurName!,
                style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
          if (reservation.date != null)
            Text('${reservation.date} à ${reservation.startTime}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(height: 4),
          ...reservation.items.map(
              (i) => Text('${i.quantity}× ${i.name} — ${(i.price * i.quantity).toStringAsFixed(0)} DHS', style: const TextStyle(fontSize: 13))),
          Text('Total : ${reservation.total.toStringAsFixed(0)} DHS',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary)),
          if (actionLabel != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onAction,
                  style: ElevatedButton.styleFrom(backgroundColor: actionColor),
                  child: Text(actionLabel!),
                ),
              ),
            ),
          if (waitingText != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(waitingText!,
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontStyle: FontStyle.italic)),
            ),
        ],
      ),
    );
  }
}
