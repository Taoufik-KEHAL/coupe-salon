import '../models/models.dart';

enum StatsPeriod { week, month, all }

class CoiffeurStat {
  final String coiffeurId;
  final String name;
  double revenue = 0;
  int count = 0;
  CoiffeurStat(this.coiffeurId, this.name);
}

class CatalogStat {
  final String name;
  int count = 0;
  double revenue = 0;
  CatalogStat(this.name);
}

class Stats {
  double totalRevenue = 0;
  int orderCount = 0;
  int serviceCount = 0;
  double serviceRevenue = 0;
  double produitRevenue = 0;
  List<CoiffeurStat> byCoiffeur = [];
  List<CatalogStat> topServices = [];
  List<CatalogStat> topProducts = [];
}

int _periodStartMillis(StatsPeriod period) {
  final now = DateTime.now();
  if (period == StatsPeriod.week) {
    return now.subtract(const Duration(days: 7)).millisecondsSinceEpoch;
  }
  if (period == StatsPeriod.month) {
    return DateTime(now.year, now.month - 1, now.day).millisecondsSinceEpoch;
  }
  return 0;
}

/// Statistiques calculées côté client à partir des réservations "terminée"
/// (business effectivement réalisé) — miroir de hooks/useStats.ts.
Stats computeStats(List<Reservation> terminees, StatsPeriod period) {
  final since = _periodStartMillis(period);
  final reservations =
      since == 0 ? terminees : terminees.where((r) => r.createdAt >= since).toList();

  final stats = Stats();
  final coiffeurMap = <String, CoiffeurStat>{};
  final serviceMap = <String, CatalogStat>{};
  final productMap = <String, CatalogStat>{};

  for (final r in reservations) {
    stats.totalRevenue += r.total;
    stats.orderCount += 1;

    if (r.coiffeurId != null) {
      final entry = coiffeurMap.putIfAbsent(
        r.coiffeurId!,
        () => CoiffeurStat(r.coiffeurId!, r.coiffeurName ?? 'Coiffeur'),
      );
      entry.revenue += r.total;
      entry.count += 1;
    }

    for (final item in r.items) {
      final amount = item.price * item.quantity;
      if (item.kind == ItemKind.service) {
        stats.serviceRevenue += amount;
        stats.serviceCount += item.quantity;
        final entry = serviceMap.putIfAbsent(item.name, () => CatalogStat(item.name));
        entry.count += item.quantity;
        entry.revenue += amount;
      } else {
        stats.produitRevenue += amount;
        final entry = productMap.putIfAbsent(item.name, () => CatalogStat(item.name));
        entry.count += item.quantity;
        entry.revenue += amount;
      }
    }
  }

  stats.byCoiffeur = coiffeurMap.values.toList()..sort((a, b) => b.revenue.compareTo(a.revenue));
  stats.topServices = serviceMap.values.toList()..sort((a, b) => b.count.compareTo(a.count));
  stats.topProducts = productMap.values.toList()..sort((a, b) => b.count.compareTo(a.count));

  return stats;
}
