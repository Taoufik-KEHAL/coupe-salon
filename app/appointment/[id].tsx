import {
  deleteAppointment,
  updateAppointment,
  useAppointments,
} from '@/hooks/useAppointments';
import { colors } from '@/lib/theme';
import type { AppointmentStatus } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'Prévu' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appointments } = useAppointments();
  const appointment = useMemo(() => appointments.find((a) => a.id === id), [appointments, id]);

  const [editing, setEditing] = useState(false);
  const [service, setService] = useState(appointment?.service ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');
  const [date, setDate] = useState(appointment ? new Date(appointment.date) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Rendez-vous introuvable.</Text>
      </View>
    );
  }

  const startEditing = () => {
    setService(appointment.service);
    setNotes(appointment.notes ?? '');
    setDate(new Date(appointment.date));
    setEditing(true);
  };

  const save = async () => {
    if (!service.trim()) return;
    await updateAppointment(appointment.id, {
      service: service.trim(),
      notes: notes.trim() || undefined,
      date: date.toISOString(),
    });
    setEditing(false);
  };

  const setStatus = (status: AppointmentStatus) => {
    updateAppointment(appointment.id, { status });
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer le rendez-vous', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteAppointment(appointment.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.card}>
        {editing ? (
          <View style={{ gap: 10 }}>
            <TextInput style={styles.input} value={service} onChangeText={setService} placeholder="Prestation" />
            <View style={styles.rowButtons}>
              <Pressable style={styles.dateButton} onPress={() => setShowDate(true)}>
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                </Text>
              </Pressable>
              <Pressable style={styles.dateButton} onPress={() => setShowTime(true)}>
                <Text style={styles.dateButtonText}>
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>
            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  setShowDate(false);
                  if (selected) {
                    const next = new Date(date);
                    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                    setDate(next);
                  }
                }}
              />
            )}
            {showTime && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={(_, selected) => {
                  setShowTime(false);
                  if (selected) {
                    const next = new Date(date);
                    next.setHours(selected.getHours(), selected.getMinutes());
                    setDate(next);
                  }
                }}
              />
            )}
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              multiline
            />
            <View style={styles.rowButtons}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => setEditing(false)}>
                <Text style={styles.buttonGhostText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={save}>
                <Text style={styles.buttonText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <View style={styles.cardHeader}>
              <Text style={styles.service}>{appointment.service}</Text>
              <Pressable onPress={startEditing} hitSlop={8}>
                <Text style={styles.editLink}>Modifier</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/client/[id]', params: { id: appointment.clientId } })
              }
            >
              <Text style={styles.clientLink}>{appointment.clientName}</Text>
            </Pressable>
            <Text style={styles.detailLine}>
              {new Date(appointment.date).toLocaleString('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
            <Text style={styles.detailLine}>{appointment.durationMinutes} minutes</Text>
            {appointment.notes ? <Text style={styles.notes}>{appointment.notes}</Text> : null}
          </View>
        )}
      </View>

      <View>
        <Text style={styles.label}>Statut</Text>
        <View style={styles.rowButtons}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.value}
              style={[
                styles.statusChip,
                appointment.status === s.value && styles.statusChipActive,
              ]}
              onPress={() => setStatus(s.value)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  appointment.status === s.value && styles.statusChipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Supprimer le rendez-vous</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  service: { fontSize: 20, fontWeight: '700', color: colors.text },
  editLink: { color: colors.primary, fontWeight: '600' },
  clientLink: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  detailLine: { fontSize: 15, color: colors.textMuted },
  notes: { fontSize: 14, color: colors.text, marginTop: 6, fontStyle: 'italic' },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  rowButtons: { flexDirection: 'row', gap: 10 },
  dateButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonGhost: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  buttonGhostText: { color: colors.text, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  statusChipTextActive: { color: '#fff' },
  deleteButton: { alignItems: 'center', paddingVertical: 12 },
  deleteButtonText: { color: colors.danger, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
});
