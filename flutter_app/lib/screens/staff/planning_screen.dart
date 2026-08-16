import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/coiffeur_service.dart';
import '../../services/reservation_service.dart';
import '../../theme.dart';
import '../../utils/slots.dart';

const _statusLabels = {
  ReservationStatus.confirmee: 'Confirmée',
  ReservationStatus.enAttente: 'En attente',
  ReservationStatus.enCours: 'En cours',
  ReservationStatus.terminee: 'Terminée',
  ReservationStatus.annulee: 'Annulée',
};

const _statusColors = {
  ReservationStatus.confirmee: (bg: AppColors.primaryLight, border: AppColors.primary, fg: AppColors.primary),
  ReservationStatus.enAttente: (bg: AppColors.enAttenteBg, border: Color(0xFFD9A441), fg: AppColors.enAttenteFg),
  ReservationStatus.enCours: (bg: AppColors.enCoursBg, border: Color(0xFF5B9BD9), fg: AppColors.enCoursFg),
  ReservationStatus.terminee: (bg: AppColors.termineeBg, border: AppColors.success, fg: AppColors.success),
  ReservationStatus.annulee: (bg: AppColors.annuleeBg, border: AppColors.danger, fg: AppColors.danger),
};

const double _timeAxisWidth = 46;
const double _colWidth = 132;
const double _headerHeight = 40;
const double _hourHeight = 52;

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

bool _isToday(DateTime d) {
  final today = DateTime.now();
  return d.year == today.year && d.month == today.month && d.day == today.day;
}

class PlanningScreen extends StatefulWidget {
  const PlanningScreen({super.key});

  @override
  State<PlanningScreen> createState() => _PlanningScreenState();
}

class _PlanningScreenState extends State<PlanningScreen> {
  late DateTime _selectedDate;
  late List<DateTime> _days;

  @override
  void initState() {
    super.initState();
    _days = List.generate(7, (i) => DateTime.now().add(Duration(days: i)));
    _selectedDate = _days.first;
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Scaffold(
      appBar: AppBar(title: const Text('Planning')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _days.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final d = _days[i];
                final active = dateToKey(d) == dateToKey(_selectedDate);
                return InkWell(
                  onTap: () => setState(() => _selectedDate = d),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: active ? AppColors.primary : AppColors.border),
                    ),
                    child: Text(_dayLabel(d),
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600, color: active ? Colors.white : AppColors.text)),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: StreamBuilder<List<Coiffeur>>(
              stream: CoiffeurService().watchAll(),
              builder: (context, coiffeurSnapshot) {
                if (!coiffeurSnapshot.hasData) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                final coiffeurs = coiffeurSnapshot.data!.where((c) => c.active).toList();
                if (coiffeurs.isEmpty) {
                  return const Center(child: Text('Aucun coiffeur actif.', style: TextStyle(color: AppColors.textMuted)));
                }

                var dayStart = timeToMinutes(coiffeurs.first.workingHours.start);
                var dayEnd = timeToMinutes(coiffeurs.first.workingHours.end);
                for (final c in coiffeurs) {
                  dayStart = dayStart < timeToMinutes(c.workingHours.start) ? dayStart : timeToMinutes(c.workingHours.start);
                  dayEnd = dayEnd > timeToMinutes(c.workingHours.end) ? dayEnd : timeToMinutes(c.workingHours.end);
                }
                final totalHours = (((dayEnd - dayStart) / 60).ceil()).clamp(1, 48);
                final gridHeight = totalHours * _hourHeight;
                final hourMarks = List.generate(totalHours + 1, (i) => dayStart + i * 60);

                return StreamBuilder<List<Reservation>>(
                  stream: ReservationService().watchByDate(dateToKey(_selectedDate)),
                  builder: (context, resSnapshot) {
                    if (!resSnapshot.hasData) {
                      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                    }
                    final byCoiffeur = <String, List<Reservation>>{};
                    for (final r in resSnapshot.data!) {
                      if (r.coiffeurId == null) continue;
                      byCoiffeur.putIfAbsent(r.coiffeurId!, () => []).add(r);
                    }

                    final showNowLine = _isToday(_selectedDate);
                    final nowOffset = ((now.hour * 60 + now.minute) - dayStart) / 60 * _hourHeight;

                    return Padding(
                      padding: const EdgeInsets.only(left: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: _timeAxisWidth,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: _headerHeight),
                                SizedBox(
                                  height: gridHeight,
                                  child: Stack(
                                    children: hourMarks
                                        .map((m) => Positioned(
                                              top: (m - dayStart) / 60 * _hourHeight - 7,
                                              right: 8,
                                              child: Text('${m ~/ 60}h',
                                                  style: const TextStyle(
                                                      fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                                            ))
                                        .toList(),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: coiffeurs.map((c) {
                                  final items = byCoiffeur[c.id] ?? [];
                                  return SizedBox(
                                    width: _colWidth,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          height: _headerHeight,
                                          width: _colWidth,
                                          alignment: Alignment.center,
                                          decoration: BoxDecoration(
                                            color: AppColors.surface,
                                            border: Border(
                                              top: const BorderSide(color: AppColors.border),
                                              left: const BorderSide(color: AppColors.border),
                                              right: BorderSide(color: AppColors.border),
                                            ),
                                          ),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 6),
                                            child: Text(c.displayName,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                          ),
                                        ),
                                        SizedBox(
                                          height: gridHeight,
                                          width: _colWidth,
                                          child: Stack(
                                            children: [
                                              Container(
                                                decoration: BoxDecoration(
                                                  color: AppColors.surface,
                                                  border: Border(
                                                    left: const BorderSide(color: AppColors.border),
                                                    right: BorderSide(color: AppColors.border),
                                                  ),
                                                ),
                                              ),
                                              ...hourMarks.take(hourMarks.length - 1).map((m) => Positioned(
                                                    top: (m - dayStart) / 60 * _hourHeight,
                                                    left: 0,
                                                    right: 0,
                                                    child: Container(height: 1, color: AppColors.border),
                                                  )),
                                              if (showNowLine && nowOffset >= 0 && nowOffset <= gridHeight)
                                                Positioned(
                                                  top: nowOffset,
                                                  left: 0,
                                                  right: 0,
                                                  child: Container(height: 2, color: AppColors.danger),
                                                ),
                                              ...items.where((r) => r.startTime != null).map((r) {
                                                final startMin = timeToMinutes(r.startTime!) - dayStart;
                                                final durationMin =
                                                    (r.slotIds.isEmpty ? 1 : r.slotIds.length) * slotGranularityMinutes;
                                                final top = startMin / 60 * _hourHeight;
                                                final height = (durationMin / 60 * _hourHeight - 2).clamp(20, gridHeight);
                                                final palette = _statusColors[r.status]!;
                                                return Positioned(
                                                  top: top,
                                                  left: 4,
                                                  right: 4,
                                                  height: height.toDouble(),
                                                  child: InkWell(
                                                    onTap: () => showDialog<void>(
                                                      context: context,
                                                      builder: (_) => _ReservationDetailDialog(reservation: r),
                                                    ),
                                                    child: Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                      decoration: BoxDecoration(
                                                        color: palette.bg,
                                                        borderRadius: BorderRadius.circular(8),
                                                        border: Border(
                                                          left: BorderSide(color: palette.border, width: 3),
                                                          top: BorderSide(color: palette.border),
                                                          right: BorderSide(color: palette.border),
                                                          bottom: BorderSide(color: palette.border),
                                                        ),
                                                      ),
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          Text(r.startTime!,
                                                              style: TextStyle(
                                                                  fontSize: 10, fontWeight: FontWeight.bold, color: palette.fg)),
                                                          Text(r.clientName,
                                                              maxLines: 1,
                                                              overflow: TextOverflow.ellipsis,
                                                              style: TextStyle(
                                                                  fontSize: 11, fontWeight: FontWeight.w600, color: palette.fg)),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              }),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
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

class _ReservationDetailDialog extends StatelessWidget {
  final Reservation reservation;
  const _ReservationDetailDialog({required this.reservation});

  @override
  Widget build(BuildContext context) {
    final palette = _statusColors[reservation.status]!;
    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(reservation.clientName)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: palette.bg, borderRadius: BorderRadius.circular(20)),
            child: Text(_statusLabels[reservation.status]!,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: palette.fg)),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${reservation.coiffeurName} · ${reservation.startTime}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 8),
          ...reservation.items.map((i) => Text('${i.quantity}× ${i.name}')),
          if (reservation.status == ReservationStatus.confirmee) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  ReservationService().setStatus(reservation.id, ReservationStatus.enAttente);
                  Navigator.of(context).pop();
                },
                icon: const Icon(Icons.check, size: 16),
                label: const Text('Client arrivé'),
              ),
            ),
          ],
        ],
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Fermer'))],
    );
  }
}
