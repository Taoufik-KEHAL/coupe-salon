import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/reservation_service.dart';
import '../../services/review_service.dart';
import '../../theme.dart';

const _statusLabels = {
  ReservationStatus.confirmee: 'Confirmée',
  ReservationStatus.enAttente: 'En attente de passage',
  ReservationStatus.enCours: 'En cours',
  ReservationStatus.terminee: 'Terminée',
  ReservationStatus.annulee: 'Annulée',
};

const _statusColors = {
  ReservationStatus.confirmee: (bg: AppColors.primaryLight, fg: AppColors.primary),
  ReservationStatus.enAttente: (bg: AppColors.enAttenteBg, fg: AppColors.enAttenteFg),
  ReservationStatus.enCours: (bg: AppColors.enCoursBg, fg: AppColors.enCoursFg),
  ReservationStatus.terminee: (bg: AppColors.termineeBg, fg: AppColors.success),
  ReservationStatus.annulee: (bg: AppColors.annuleeBg, fg: AppColors.danger),
};

class ReservationsScreen extends StatelessWidget {
  const ReservationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = context.watch<AppAuthProvider>().user?.uid;

    return Scaffold(
      appBar: AppBar(title: const Text('Mes réservations')),
      body: uid == null
          ? const SizedBox.shrink()
          : StreamBuilder<List<Reservation>>(
              stream: ReservationService().watchByClient(uid),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                final reservations = snapshot.data!;
                if (reservations.isEmpty) {
                  return const Center(
                    child: Text('Aucune réservation pour le moment.', style: TextStyle(color: AppColors.textMuted)),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reservations.length,
                  itemBuilder: (context, i) => _ReservationCard(reservation: reservations[i]),
                );
              },
            ),
    );
  }
}

class _ReservationCard extends StatelessWidget {
  final Reservation reservation;
  const _ReservationCard({required this.reservation});

  void _confirmCancel(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler la réservation'),
        content: const Text("Confirmer l'annulation ?"),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Non')),
          TextButton(
            onPressed: () {
              ReservationService().cancel(reservation);
              Navigator.of(context).pop();
            },
            child: const Text('Oui, annuler', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }

  void _openReview(BuildContext context) {
    showDialog<void>(context: context, builder: (_) => _ReviewDialog(reservation: reservation));
  }

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors[reservation.status]!;
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(reservation.coiffeurName ?? 'Commande produits',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: colors.bg, borderRadius: BorderRadius.circular(20)),
                child: Text(_statusLabels[reservation.status]!,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: colors.fg)),
              ),
            ],
          ),
          if (reservation.date != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('${reservation.date} à ${reservation.startTime}',
                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
            ),
          const SizedBox(height: 4),
          ...reservation.items.map((i) => Text('${i.quantity}× ${i.name}', style: const TextStyle(fontSize: 13))),
          const SizedBox(height: 4),
          Text('${reservation.total.toStringAsFixed(0)} DHS',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary)),
          if (reservation.status == ReservationStatus.confirmee || reservation.status == ReservationStatus.enAttente)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: TextButton(
                onPressed: () => _confirmCancel(context),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                child: const Text('Annuler', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600)),
              ),
            ),
          if (reservation.status == ReservationStatus.terminee)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: TextButton(
                onPressed: () => _openReview(context),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                child: const Text('Laisser un avis', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
              ),
            ),
        ],
      ),
    );
  }
}

class _ReviewDialog extends StatefulWidget {
  final Reservation reservation;
  const _ReviewDialog({required this.reservation});

  @override
  State<_ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<_ReviewDialog> {
  int _rating = 5;
  final _commentController = TextEditingController();
  bool _submitting = false;

  Future<void> _submit() async {
    final auth = context.read<AppAuthProvider>();
    if (auth.user == null) return;
    setState(() => _submitting = true);
    try {
      await ReviewService().create(
        reservationId: widget.reservation.id,
        clientId: auth.user!.uid,
        clientName: auth.user!.email ?? '',
        coiffeurId: widget.reservation.coiffeurId,
        rating: _rating,
        comment: _commentController.text.trim(),
      );
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Laisser un avis'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final n = i + 1;
              return IconButton(
                onPressed: () => setState(() => _rating = n),
                icon: Icon(n <= _rating ? Icons.star : Icons.star_border, color: AppColors.primary),
              );
            }),
          ),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Ton commentaire (optionnel)'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Annuler')),
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Envoyer'),
        ),
      ],
    );
  }
}
