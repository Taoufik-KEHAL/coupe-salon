import type { Reservation } from '@/types';
import { useMemo } from 'react';
import { useReservationsByStatus } from './useReservations';

export type StatsPeriod = 'week' | 'month' | 'all';

export type CoiffeurStat = { coiffeurId: string; name: string; revenue: number; count: number };
export type CatalogStat = { name: string; count: number; revenue: number };

export type Stats = {
  totalRevenue: number;
  orderCount: number;
  serviceCount: number;
  revenueByType: { service: number; produit: number };
  byCoiffeur: CoiffeurStat[];
  topServices: CatalogStat[];
  topProducts: CatalogStat[];
};

function periodStart(period: StatsPeriod): number {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.getTime();
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.getTime();
  }
  return 0;
}

function computeStats(reservations: Reservation[]): Stats {
  let totalRevenue = 0;
  let serviceRevenue = 0;
  let produitRevenue = 0;
  let serviceCount = 0;
  const coiffeurMap = new Map<string, CoiffeurStat>();
  const serviceMap = new Map<string, CatalogStat>();
  const productMap = new Map<string, CatalogStat>();

  for (const r of reservations) {
    totalRevenue += r.total;

    if (r.coiffeurId) {
      const entry = coiffeurMap.get(r.coiffeurId) ?? {
        coiffeurId: r.coiffeurId,
        name: r.coiffeurName ?? 'Coiffeur',
        revenue: 0,
        count: 0,
      };
      entry.revenue += r.total;
      entry.count += 1;
      coiffeurMap.set(r.coiffeurId, entry);
    }

    for (const item of r.items) {
      const amount = item.price * item.quantity;
      if (item.kind === 'service') {
        serviceRevenue += amount;
        serviceCount += item.quantity;
        const entry = serviceMap.get(item.name) ?? { name: item.name, count: 0, revenue: 0 };
        entry.count += item.quantity;
        entry.revenue += amount;
        serviceMap.set(item.name, entry);
      } else {
        produitRevenue += amount;
        const entry = productMap.get(item.name) ?? { name: item.name, count: 0, revenue: 0 };
        entry.count += item.quantity;
        entry.revenue += amount;
        productMap.set(item.name, entry);
      }
    }
  }

  return {
    totalRevenue,
    orderCount: reservations.length,
    serviceCount,
    revenueByType: { service: serviceRevenue, produit: produitRevenue },
    byCoiffeur: [...coiffeurMap.values()].sort((a, b) => b.revenue - a.revenue),
    topServices: [...serviceMap.values()].sort((a, b) => b.count - a.count),
    topProducts: [...productMap.values()].sort((a, b) => b.count - a.count),
  };
}

// Statistiques calculées côté client à partir des réservations "terminée"
// (business effectivement réalisé) — le volume attendu pour un seul salon
// reste largement gérable sans agrégation côté serveur.
export function useStats(period: StatsPeriod) {
  const { reservations, loading } = useReservationsByStatus('terminee');

  const stats = useMemo(() => {
    const since = periodStart(period);
    const filtered = since === 0 ? reservations : reservations.filter((r) => r.createdAt >= since);
    return computeStats(filtered);
  }, [reservations, period]);

  return { stats, loading };
}
