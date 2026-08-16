import { useCoiffeurs } from '@/hooks/useCoiffeurs';
import { setReservationStatus, usePlanning } from '@/hooks/useReservations';
import { dateToKey, timeToMinutes } from '@/lib/slots';
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

const STATUS_COLOR: Record<ReservationStatus, { bg: string; border: string; fg: string }> = {
  confirmee: { bg: colors.primaryLight, border: colors.primary, fg: colors.primary },
  en_attente: { bg: '#FCEFD8', border: '#D9A441', fg: '#8A5A05' },
  en_cours: { bg: '#DDEBFB', border: '#5B9BD9', fg: '#1F5C99' },
  terminee: { bg: '#E3F1E8', border: colors.success, fg: colors.success },
  annulee: { bg: '#F8E6E3', border: colors.danger, fg: colors.danger },
};

const TIME_AXIS_WIDTH = 46;
const COL_WIDTH = 132;
const HEADER_HEIGHT = 40;
const HOUR_HEIGHT = 52;

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

function isToday(d: Date) {
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
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
  const { reservations, loading: loadingReservations } = usePlanning(dateKey);
  const { coiffeurs, loading: loadingCoiffeurs } = useCoiffeurs();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [now, setNow] = useState(() => new Date());

  const { dayStartMinutes, dayEndMinutes } = useMemo(() => {
    if (coiffeurs.length === 0) return { dayStartMinutes: 9 * 60, dayEndMinutes: 19 * 60 };
    const start = Math.min(...coiffeurs.map((c) => timeToMinutes(c.workingHours.start)));
    const end = Math.max(...coiffeurs.map((c) => timeToMinutes(c.workingHours.end)));
    return { dayStartMinutes: start, dayEndMinutes: end };
  }, [coiffeurs]);

  const totalHours = Math.max(1, Math.ceil((dayEndMinutes - dayStartMinutes) / 60));
  const gridHeight = totalHours * HOUR_HEIGHT;

  const hourMarks = useMemo(
    () => Array.from({ length: totalHours + 1 }, (_, i) => dayStartMinutes + i * 60),
    [totalHours, dayStartMinutes]
  );

  const byCoiffeur = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      if (!r.coiffeurId) continue;
      if (!map.has(r.coiffeurId)) map.set(r.coiffeurId, []);
      map.get(r.coiffeurId)!.push(r);
    }
    return map;
  }, [reservations]);

  const nowOffset = ((now.getHours() * 60 + now.getMinutes() - dayStartMinutes) / 60) * HOUR_HEIGHT;
  const showNowLine = isToday(selectedDate) && nowOffset >= 0 && nowOffset <= gridHeight;

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
              onPress={() => {
                setSelectedDate(d);
                setNow(new Date());
              }}
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
        <View style={styles.gridRow}>
          <View style={{ width: TIME_AXIS_WIDTH }}>
            <View style={{ height: HEADER_HEIGHT }} />
            <View style={{ height: gridHeight }}>
              {hourMarks.map((m) => (
                <Text
                  key={m}
                  style={[styles.hourLabel, { top: ((m - dayStartMinutes) / 60) * HOUR_HEIGHT - 7 }]}
                >
                  {`${Math.floor(m / 60)
                    .toString()
                    .padStart(2, '0')}h`}
                </Text>
              ))}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ flexDirection: 'row' }}>
              {coiffeurs.map((c) => {
                const items = byCoiffeur.get(c.id) ?? [];
                return (
                  <View key={c.id} style={{ width: COL_WIDTH }}>
                    <View style={styles.colHeader}>
                      <Text style={styles.colHeaderText} numberOfLines={1}>
                        {c.displayName}
                      </Text>
                    </View>
                    <View style={[styles.colBody, { height: gridHeight }]}>
                      {hourMarks.slice(0, -1).map((m) => (
                        <View
                          key={m}
                          style={[styles.hourLine, { top: ((m - dayStartMinutes) / 60) * HOUR_HEIGHT }]}
                        />
                      ))}
                      {showNowLine && <View style={[styles.nowLine, { top: nowOffset }]} />}
                      {items.map((r) => {
                        if (!r.startTime) return null;
                        const startMin = timeToMinutes(r.startTime) - dayStartMinutes;
                        const durationMin = Math.max(r.slotIds.length, 1) * SLOT_GRANULARITY_MINUTES;
                        const top = (startMin / 60) * HOUR_HEIGHT;
                        const height = Math.max((durationMin / 60) * HOUR_HEIGHT - 2, 20);
                        const palette = STATUS_COLOR[r.status];
                        return (
                          <Pressable
                            key={r.id}
                            style={[
                              styles.block,
                              { top, height, backgroundColor: palette.bg, borderColor: palette.border },
                            ]}
                            onPress={() => setSelected(r)}
                          >
                            <Text style={[styles.blockTime, { color: palette.fg }]}>{r.startTime}</Text>
                            <Text style={[styles.blockName, { color: palette.fg }]} numberOfLines={1}>
                              {r.clientName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {selected && <ReservationDetailModal reservation={selected} onClose={() => setSelected(null)} />}
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
  gridRow: { flexDirection: 'row', paddingLeft: 12, flex: 1 },
  hourLabel: { position: 'absolute', right: 8, fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  colHeader: {
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
    marginRight: -1,
  },
  colHeaderText: { fontSize: 12, fontWeight: '700', color: colors.text, paddingHorizontal: 6 },
  colBody: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderColor: colors.border,
    marginRight: -1,
  },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.danger, zIndex: 2 },
  block: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  blockTime: { fontSize: 10, fontWeight: '700' },
  blockName: { fontSize: 11, fontWeight: '600' },
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
