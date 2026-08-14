import { useAppointments } from '@/hooks/useAppointments';
import { colors } from '@/lib/theme';
import type { Appointment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function dayLabel(dateISO: string) {
  const date = new Date(dateISO);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Aujourd'hui";
  if (isSameDay(date, tomorrow)) return 'Demain';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function statusLabel(status: string) {
  if (status === 'completed') return 'Terminé';
  if (status === 'cancelled') return 'Annulé';
  return 'Prévu';
}

function statusStyle(status: string) {
  if (status === 'completed') return { backgroundColor: '#E3F1E8', color: colors.success };
  if (status === 'cancelled') return { backgroundColor: '#F8E6E3', color: colors.danger };
  return { backgroundColor: colors.primaryLight, color: colors.primary };
}

export default function AgendaScreen() {
  const { appointments, loading } = useAppointments();
  const router = useRouter();

  const sections = useMemo(() => {
    const byDay = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const dayKey = new Date(appt.date).toDateString();
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(appt);
    }
    return Array.from(byDay.entries()).map(([dayKey, items]) => ({
      title: dayLabel(items[0].date),
      data: items,
    }));
  }, [appointments]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: item.id } })}
            >
              <View style={styles.timeBlock}>
                <Text style={styles.time}>
                  {new Date(item.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.service}>{item.service}</Text>
                <Text style={styles.clientName}>{item.clientName}</Text>
              </View>
              <Text style={[styles.statusBadge, statusStyle(item.status)]}>
                {statusLabel(item.status)}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun rendez-vous programmé.</Text>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/appointment/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBlock: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  time: { fontSize: 13, fontWeight: '700', color: colors.primary },
  service: { fontSize: 15, fontWeight: '600', color: colors.text },
  clientName: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
