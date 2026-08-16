import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/coiffeur_service.dart';
import '../../services/reservation_service.dart';
import '../../services/slots_service.dart';
import '../../theme.dart';
import '../../utils/slots.dart';

enum _Step { coiffeur, date, heure, confirmation }

const int _daysAhead = 14;

String _dayLabel(DateTime date) {
  final today = DateTime.now();
  final tomorrow = today.add(const Duration(days: 1));
  bool sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;
  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, tomorrow)) return 'Demain';
  const weekdays = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  const months = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
  return '${weekdays[date.weekday - 1]} ${date.day} ${months[date.month - 1]}';
}

class ReserverScreen extends StatefulWidget {
  const ReserverScreen({super.key});

  @override
  State<ReserverScreen> createState() => _ReserverScreenState();
}

class _ReserverScreenState extends State<ReserverScreen> {
  _Step _step = _Step.coiffeur;
  Coiffeur? _selectedCoiffeur;
  DateTime? _selectedDate;
  String? _startTime;
  bool _submitting = false;

  Future<void> _confirm() async {
    final auth = context.read<AppAuthProvider>();
    final cart = context.read<CartProvider>();
    if (auth.user == null || _selectedCoiffeur == null || _selectedDate == null || _startTime == null) return;

    setState(() => _submitting = true);
    try {
      await SlotsService().reserveSlots(
        coiffeurId: _selectedCoiffeur!.id,
        coiffeurName: _selectedCoiffeur!.displayName,
        date: dateToKey(_selectedDate!),
        startTime: _startTime!,
        clientId: auth.user!.uid,
        clientName: auth.user!.email ?? '',
        items: cart.items,
        totalDurationMinutes: cart.totalDurationMinutes,
        total: cart.total,
      );
      cart.clear();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Réservation confirmée'),
          content: const Text('Rendez-vous enregistré — à bientôt !'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } on SlotUnavailableException catch (e) {
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Créneau indisponible'),
          content: Text(e.message),
          actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK'))],
        ),
      );
      setState(() {
        _startTime = null;
        _step = _Step.heure;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible de confirmer la réservation. Réessaie.')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmProductsOnly() async {
    final auth = context.read<AppAuthProvider>();
    final cart = context.read<CartProvider>();
    if (auth.user == null) return;
    setState(() => _submitting = true);
    try {
      await ReservationService().createProductOnlyOrder(
        clientId: auth.user!.uid,
        clientName: auth.user!.email ?? '',
        items: cart.items,
        total: cart.total,
      );
      cart.clear();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Commande enregistrée'),
          content: const Text('Présente-toi au salon — réglée sur place.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    if (cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Réserver')),
        body: const Center(child: Text('Ton panier est vide.', style: TextStyle(color: AppColors.textMuted))),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Réserver')),
      body: Column(
        children: [
          Expanded(child: _buildStep(cart)),
          if (_step == _Step.coiffeur)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
              child: TextButton(
                onPressed: _submitting ? null : _confirmProductsOnly,
                child: const Text('Commander sans rendez-vous (produits uniquement)',
                    style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStep(CartProvider cart) {
    switch (_step) {
      case _Step.coiffeur:
        return StreamBuilder<List<Coiffeur>>(
          stream: CoiffeurService().watchAll(),
          builder: (context, snapshot) {
            final coiffeurs = (snapshot.data ?? []).where((c) => c.active).toList();
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator(color: AppColors.primary));
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Choisis un coiffeur',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.text)),
                const SizedBox(height: 10),
                ...coiffeurs.map((c) => _OptionRow(
                      icon: Icons.account_circle_outlined,
                      label: c.displayName,
                      onTap: () => setState(() {
                        _selectedCoiffeur = c;
                        _step = _Step.date;
                      }),
                    )),
              ],
            );
          },
        );

      case _Step.date:
        final days = List.generate(_daysAhead, (i) => DateTime.now().add(Duration(days: i)));
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Choisis une date',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.text)),
            const SizedBox(height: 10),
            ...days.map((d) => _OptionRow(
                  icon: Icons.calendar_today_outlined,
                  label: _dayLabel(d),
                  onTap: () => setState(() {
                    _selectedDate = d;
                    _step = _Step.heure;
                  }),
                )),
          ],
        );

      case _Step.heure:
        return StreamBuilder<Set<String>>(
          stream: SlotsService().watchReservedTimes(_selectedCoiffeur!.id, dateToKey(_selectedDate!)),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator(color: AppColors.primary));
            }
            final dayTimes = generateDayTimes(_selectedCoiffeur!.workingHours);
            final available = availableStartTimes(dayTimes, snapshot.data!, cart.totalDurationMinutes);
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Choisis une heure',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.text)),
                Text('Durée totale : ${cart.totalDurationMinutes} min',
                    style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                const SizedBox(height: 10),
                if (available.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text('Aucun créneau disponible ce jour-là.', style: TextStyle(color: AppColors.textMuted)),
                  )
                else
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: available
                        .map((t) => InkWell(
                              onTap: () => setState(() {
                                _startTime = t;
                                _step = _Step.confirmation;
                              }),
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Text(t, style: const TextStyle(fontWeight: FontWeight.w600)),
                              ),
                            ))
                        .toList(),
                  ),
              ],
            );
          },
        );

      case _Step.confirmation:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Confirmer la réservation',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.text)),
            const SizedBox(height: 12),
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
                  Row(children: [
                    const Icon(Icons.person_outline, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(_selectedCoiffeur!.displayName),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text('${_dayLabel(_selectedDate!)} à $_startTime'),
                  ]),
                  const Divider(height: 24),
                  ...cart.items.map((i) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            SizedBox(width: 28, child: Text('${i.quantity}×', style: const TextStyle(color: AppColors.textMuted))),
                            Expanded(child: Text(i.name)),
                            Text('${(i.price * i.quantity).toStringAsFixed(0)} DHS'),
                          ],
                        ),
                      )),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total', style: TextStyle(color: AppColors.textMuted)),
                      Text('${cart.total.toStringAsFixed(0)} DHS',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text('Paiement sur place au salon — aucun paiement en ligne.',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _confirm,
              child: _submitting
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Confirmer'),
            ),
          ],
        );
    }
  }
}

class _OptionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _OptionRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
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
              Icon(icon, color: AppColors.primary),
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
