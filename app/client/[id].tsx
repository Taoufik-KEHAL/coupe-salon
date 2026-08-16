import { useClientsList } from '@/hooks/useClientsList';
import { useMyReservations } from '@/hooks/useReservations';
import { colors } from '@/lib/theme';
import type { ReservationStatus } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmee: 'Confirmée',
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients } = useClientsList();
  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);
  const { reservations, loading } = useMyReservations(id);

  if (!client) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.card}>
        <Text style={styles.name}>{client.name}</Text>
        {client.phone ? <Text style={styles.detail}>📞 {client.phone}</Text> : null}
        {client.notes ? <Text style={styles.notes}>{client.notes}</Text> : null}
      </View>

      <View>
        <Text style={styles.sectionTitle}>Historique</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : reservations.length === 0 ? (
          <Text style={styles.empty}>Aucune réservation.</Text>
        ) : (
          reservations.map((r) => (
            <View key={r.id} style={styles.reservationRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reservationTitle}>{r.coiffeurName ?? 'Produits'}</Text>
                {r.date && (
                  <Text style={styles.reservationDate}>
                    {new Date(r.date).toLocaleDateString('fr-FR', { dateStyle: 'medium' })} à {r.startTime}
                  </Text>
                )}
              </View>
              <Text style={styles.reservationStatus}>{STATUS_LABEL[r.status]}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  detail: { fontSize: 15, color: colors.textMuted },
  notes: { fontSize: 14, color: colors.text, marginTop: 6, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  empty: { color: colors.textMuted, fontSize: 14 },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reservationTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  reservationDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  reservationStatus: { fontSize: 12, fontWeight: '600', color: colors.primary },
});
