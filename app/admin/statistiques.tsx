import { useStats, type StatsPeriod } from '@/hooks/useStats';
import { colors } from '@/lib/theme';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'all', label: 'Depuis le début' },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BreakdownRow({ label, count, revenue, maxRevenue }: { label: string; count: number; revenue: number; maxRevenue: number }) {
  const width = maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 100, 4) : 0;
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.breakdownValue}>
          {revenue} DHS {count ? `· ${count}×` : ''}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%` }]} />
      </View>
    </View>
  );
}

export default function AdminStatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const { stats, loading } = useStats(period);

  const maxCoiffeur = Math.max(1, ...stats.byCoiffeur.map((c) => c.revenue));
  const maxService = Math.max(1, ...stats.topServices.map((s) => s.revenue));
  const maxProduct = Math.max(1, ...stats.topProducts.map((p) => p.revenue));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.periodChip, period === p.value && styles.periodChipActive]}
            onPress={() => setPeriod(p.value)}
          >
            <Text style={[styles.periodChipText, period === p.value && styles.periodChipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="Chiffre d'affaires" value={`${stats.totalRevenue} DHS`} />
            <StatCard label="Commandes terminées" value={String(stats.orderCount)} />
            <StatCard label="Services réalisés" value={String(stats.serviceCount)} />
          </View>

          <Text style={styles.sectionTitle}>CA par type</Text>
          <View style={styles.card}>
            <BreakdownRow
              label="Services"
              count={0}
              revenue={stats.revenueByType.service}
              maxRevenue={Math.max(1, stats.revenueByType.service, stats.revenueByType.produit)}
            />
            <BreakdownRow
              label="Produits"
              count={0}
              revenue={stats.revenueByType.produit}
              maxRevenue={Math.max(1, stats.revenueByType.service, stats.revenueByType.produit)}
            />
          </View>

          <Text style={styles.sectionTitle}>CA par coiffeur</Text>
          <View style={styles.card}>
            {stats.byCoiffeur.length === 0 ? (
              <Text style={styles.empty}>Aucune donnée sur cette période.</Text>
            ) : (
              stats.byCoiffeur.map((c) => (
                <BreakdownRow key={c.coiffeurId} label={c.name} count={c.count} revenue={c.revenue} maxRevenue={maxCoiffeur} />
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>Services les plus vendus</Text>
          <View style={styles.card}>
            {stats.topServices.length === 0 ? (
              <Text style={styles.empty}>Aucune donnée sur cette période.</Text>
            ) : (
              stats.topServices.map((s) => (
                <BreakdownRow key={s.name} label={s.name} count={s.count} revenue={s.revenue} maxRevenue={maxService} />
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>Produits les plus vendus</Text>
          <View style={styles.card}>
            {stats.topProducts.length === 0 ? (
              <Text style={styles.empty}>Aucune donnée sur cette période.</Text>
            ) : (
              stats.topProducts.map((p) => (
                <BreakdownRow key={p.name} label={p.name} count={p.count} revenue={p.revenue} maxRevenue={maxProduct} />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodChipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  periodChipTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  empty: { color: colors.textMuted, fontSize: 13 },
  breakdownRow: { gap: 6 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  breakdownLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  breakdownValue: { fontSize: 12, color: colors.textMuted },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.background, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
});
