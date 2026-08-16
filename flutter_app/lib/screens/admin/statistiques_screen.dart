import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/reservation_service.dart';
import '../../services/stats_service.dart';
import '../../theme.dart';

const _periods = [
  (value: StatsPeriod.week, label: '7 derniers jours'),
  (value: StatsPeriod.month, label: '30 derniers jours'),
  (value: StatsPeriod.all, label: 'Depuis le début'),
];

class AdminStatsScreen extends StatefulWidget {
  const AdminStatsScreen({super.key});

  @override
  State<AdminStatsScreen> createState() => _AdminStatsScreenState();
}

class _AdminStatsScreenState extends State<AdminStatsScreen> {
  StatsPeriod _period = StatsPeriod.month;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Statistiques')),
      body: StreamBuilder<List<Reservation>>(
        stream: ReservationService().watchByStatus(ReservationStatus.terminee),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final stats = computeStats(snapshot.data!, _period);
          final maxCoiffeur = stats.byCoiffeur.fold<double>(1, (m, c) => c.revenue > m ? c.revenue : m);
          final maxService = stats.topServices.fold<double>(1, (m, s) => s.revenue > m ? s.revenue : m);
          final maxProduct = stats.topProducts.fold<double>(1, (m, p) => p.revenue > m ? p.revenue : m);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: _periods
                    .map((p) => Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _PeriodChip(
                              label: p.label,
                              active: _period == p.value,
                              onTap: () => setState(() => _period = p.value),
                            ),
                          ),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _StatCard(label: "Chiffre d'affaires", value: '${stats.totalRevenue.toStringAsFixed(0)} DHS')),
                  const SizedBox(width: 10),
                  Expanded(child: _StatCard(label: 'Commandes terminées', value: '${stats.orderCount}')),
                  const SizedBox(width: 10),
                  Expanded(child: _StatCard(label: 'Services réalisés', value: '${stats.serviceCount}')),
                ],
              ),
              const SizedBox(height: 20),
              const Text('CA par type', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _Card(children: [
                _BreakdownRow(
                  label: 'Services',
                  revenue: stats.serviceRevenue,
                  maxRevenue: stats.serviceRevenue > stats.produitRevenue ? stats.serviceRevenue : stats.produitRevenue,
                ),
                _BreakdownRow(
                  label: 'Produits',
                  revenue: stats.produitRevenue,
                  maxRevenue: stats.serviceRevenue > stats.produitRevenue ? stats.serviceRevenue : stats.produitRevenue,
                ),
              ]),
              const SizedBox(height: 16),
              const Text('CA par coiffeur', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _Card(
                children: stats.byCoiffeur.isEmpty
                    ? [const Text('Aucune donnée sur cette période.', style: TextStyle(color: AppColors.textMuted))]
                    : stats.byCoiffeur
                        .map((c) => _BreakdownRow(label: c.name, revenue: c.revenue, count: c.count, maxRevenue: maxCoiffeur))
                        .toList(),
              ),
              const SizedBox(height: 16),
              const Text('Services les plus vendus', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _Card(
                children: stats.topServices.isEmpty
                    ? [const Text('Aucune donnée sur cette période.', style: TextStyle(color: AppColors.textMuted))]
                    : stats.topServices
                        .map((s) => _BreakdownRow(label: s.name, revenue: s.revenue, count: s.count, maxRevenue: maxService))
                        .toList(),
              ),
              const SizedBox(height: 16),
              const Text('Produits les plus vendus', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _Card(
                children: stats.topProducts.isEmpty
                    ? [const Text('Aucune donnée sur cette période.', style: TextStyle(color: AppColors.textMuted))]
                    : stats.topProducts
                        .map((p) => _BreakdownRow(label: p.name, revenue: p.revenue, count: p.count, maxRevenue: maxProduct))
                        .toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _PeriodChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: active ? Colors.white : AppColors.text)),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  final String label;
  final double revenue;
  final int count;
  final double maxRevenue;
  const _BreakdownRow({required this.label, required this.revenue, this.count = 0, required this.maxRevenue});

  @override
  Widget build(BuildContext context) {
    final width = maxRevenue > 0 ? (revenue / maxRevenue).clamp(0.02, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ),
            Text('${revenue.toStringAsFixed(0)} DHS${count > 0 ? ' · $count×' : ''}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ],
        ),
        const SizedBox(height: 6),
        LayoutBuilder(
          builder: (context, constraints) => Stack(
            children: [
              Container(height: 6, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(3))),
              Container(
                height: 6,
                width: constraints.maxWidth * width,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(3)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
