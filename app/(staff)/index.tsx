import { useCoiffeurs } from '@/hooks/useCoiffeurs';
import { setReservationStatus, usePlanning } from '@/hooks/useReservations';
import { dateToKey, generateDayTimes, slotTimesForDuration, timeToMinutes } from '@/lib/slots';
import { colors } from '@/lib/theme';
import { SLOT_GRANULARITY_MINUTES } from '@/types';
import type { Reservation, ReservationStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

const TIME_COL_WIDTH = 56;
const COIFFEUR_COL_WIDTH = 120;
const ROW_HEIGHT = 44;

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

type Cell = { reservation: Reservation; isStart: boolean };

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
  const { reservations, loading: loadingReservations } = usePlanning(dateKey);
  const { coiffeurs, loading: loadingCoiffeurs } = useCoiffeurs();
  const [selected, setSelected] = useState<Reservation | null>(null);

  const dayTimes = useMemo(() => {
    if (coiffeurs.length === 0) return generateDayTimes({ start: '09:00', end: '19:00' });
    const start = coiffeurs.reduce(
      (min, c) => Math.min(min, timeToMinutes(c.workingHours.start)),
      timeToMinutes(coiffeurs[0].workingHours.start)
    );
    const end = coiffeurs.reduce(
      (max, c) => Math.max(max, timeToMinutes(c.workingHours.end)),
      timeToMinutes(coiffeurs[0].workingHours.end)
    );
    return generateDayTimes({
      start: `${Math.floor(start / 60).toString().padStart(2, '0')}:${(start % 60).toString().padStart(2, '0')}`,
      end: `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`,
    });
  }, [coiffeurs]);

  // grid[coiffeurId][time] -> cellule occupée (avec son statut "début" ou "suite")
  const grid = useMemo(() => {
    const map = new Map<string, Cell>();
    for (const r of reservations) {
      if (!r.coiffeurId || !r.startTime) continue;
      const totalMinutes = Math.max(r.slotIds.length, 1) * SLOT_GRANULARITY_MINUTES;
      const times = slotTimesForDuration(r.startTime, totalMinutes);
      times.forEach((t, i) => map.set(`${r.coiffeurId}|${t}`, { reservation: r, isStart: i === 0 }));
    }
    return map;
  }, [reservations]);

  const loading = loadingReservations || loadingCoiffeurs;

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
      ) : coiffeurs.length === 0 ? (
        <Text style={styles.empty}>Aucun coiffeur actif.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: 16 }}>
          <View>
            <View style={styles.headerRow}>
              <View style={[styles.cornerCell, { width: TIME_COL_WIDTH }]} />
              {coiffeurs.map((c) => (
                <View key={c.id} style={[styles.headerCell, { width: COIFFEUR_COL_WIDTH }]}>
                  <Text style={styles.headerCellText} numberOfLines={1}>
                    {c.displayName}
                  </Text>
                </View>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 520 }}>
              {dayTimes.map((time) => (
                <View key={time} style={styles.row}>
                  <View style={[styles.timeCell, { width: TIME_COL_WIDTH }]}>
                    <Text style={styles.timeCellText}>{time}</Text>
                  </View>
                  {coiffeurs.map((c) => {
                    const cell = grid.get(`${c.id}|${time}`);
                    if (!cell) {
                      return <View key={c.id} style={[styles.freeCell, { width: COIFFEUR_COL_WIDTH }]} />;
                    }
                    const { bg, fg } = STATUS_COLOR[cell.reservation.status];
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.busyCell, { width: COIFFEUR_COL_WIDTH, backgroundColor: bg }]}
                        onPress={() => setSelected(cell.reservation)}
                      >
                        {cell.isStart && (
                          <Text style={[styles.busyCellText, { color: fg }]} numberOfLines={1}>
                            {cell.reservation.clientName}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {selected && (
        <ReservationDetailModal reservation={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function ReservationDetailModal({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  return (
    <Modal transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{reservation.clientName}</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: STATUS_COLOR[reservation.status].bg, color: STATUS_COLOR[reservation.status].fg },
              ]}
            >
              {STATUS_LABEL[reservation.status]}
            </Text>
          </View>
          <Text style={styles.modalMeta}>
            {reservation.coiffeurName} · {reservation.startTime}
          </Text>
          {reservation.items.map((i) => (
            <Text key={i.id} style={styles.itemLine}>
              {i.quantity}× {i.name}
            </Text>
          ))}
          {reservation.status === 'confirmee' && (
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setReservationStatus(reservation.id, 'en_attente');
                onClose();
              }}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Client arrivé</Text>
            </Pressable>
          )}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  headerRow: { flexDirection: 'row', paddingLeft: 16 },
  cornerCell: { height: 36 },
  headerCell: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCellText: { fontSize: 12, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', paddingLeft: 16 },
  timeCell: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  timeCellText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  freeCell: { height: ROW_HEIGHT, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  busyCell: {
    height: ROW_HEIGHT,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  busyCellText: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalMeta: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  itemLine: { fontSize: 13, color: colors.text },
  actionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  closeButton: { alignItems: 'center', paddingVertical: 8 },
  closeButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});
