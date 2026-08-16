import { setReservationStatus, usePlanning } from '@/hooks/useReservations';
import { dateToKey } from '@/lib/slots';
import { colors } from '@/lib/theme';
import type { Reservation, ReservationStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmee: 'Confirmée',
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const STATUS_COLOR: Record<ReservationStatus, { bg: string; fg: string }> = {
  confirmee: { bg: colors.primaryLight, fg: colors.primary },
  en_attente: { bg: '#FCEFD8', fg: '#B4770B' },
  en_cours: { bg: '#DDEBFB', fg: '#2E6DA4' },
  terminee: { bg: '#E3F1E8', fg: colors.success },
  annulee: { bg: '#F8E6E3', fg: colors.danger },
};

function dayLabel(date: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, today)) return "Aujourd'hui";
  if (isSameDay(date, tomorrow)) return 'Demain';
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function PlanningScreen() {
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    []
  );
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const dateKey = dateToKey(selectedDate);
  const { reservations, loading } = usePlanning(dateKey);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {days.map((d) => {
          const active = dateToKey(d) === dateKey;
          return (
            <Pressable
              key={d.toISOString()}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{dayLabel(d)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun rendez-vous ce jour-là.</Text>}
          renderItem={({ item }) => <PlanningRow reservation={item} />}
        />
      )}
    </View>
  );
}

function PlanningRow({ reservation }: { reservation: Reservation }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.time}>{reservation.startTime}</Text>
        <Text
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLOR[reservation.status].bg, color: STATUS_COLOR[reservation.status].fg },
          ]}
        >
          {STATUS_LABEL[reservation.status]}
        </Text>
      </View>
      <Text style={styles.coiffeur}>{reservation.coiffeurName}</Text>
      <Text style={styles.client}>{reservation.clientName}</Text>
      {reservation.items.map((i) => (
        <Text key={i.id} style={styles.itemLine}>
          {i.quantity}× {i.name}
        </Text>
      ))}
      {reservation.status === 'confirmee' && (
        <Pressable
          style={styles.actionButton}
          onPress={() => setReservationStatus(reservation.id, 'en_attente')}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Client arrivé</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  dayChipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  coiffeur: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  client: { fontSize: 14, color: colors.text, fontWeight: '600' },
  itemLine: { fontSize: 13, color: colors.textMuted },
  actionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
