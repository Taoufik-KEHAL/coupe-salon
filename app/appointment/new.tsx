import { useAuth } from '@/hooks/useAuth';
import { createAppointment } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { colors } from '@/lib/theme';
import type { Client } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { clients } = useClients();
  const params = useLocalSearchParams<{ clientId?: string }>();

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    clients.find((c) => c.id === params.clientId) ?? null
  );
  const [clientQuery, setClientQuery] = useState('');
  const [service, setService] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientQuery]);

  const submit = async () => {
    if (!user) return;
    if (!selectedClient) {
      setError('Sélectionnez un client.');
      return;
    }
    if (!service.trim()) {
      setError('Indiquez la prestation.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createAppointment(user.uid, selectedClient.name, {
        clientId: selectedClient.id,
        service: service.trim(),
        date: date.toISOString(),
        durationMinutes: duration,
        notes: notes.trim() || undefined,
        status: 'scheduled',
      });
      router.back();
    } catch {
      setError("Impossible d'enregistrer le rendez-vous. Réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text style={styles.label}>Client *</Text>
        {selectedClient ? (
          <Pressable
            style={styles.selectedClient}
            onPress={() => setSelectedClient(null)}
          >
            <Text style={styles.selectedClientText}>{selectedClient.name}</Text>
            <Text style={styles.changeText}>Changer</Text>
          </Pressable>
        ) : (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Rechercher un client..."
              placeholderTextColor={colors.textMuted}
              value={clientQuery}
              onChangeText={setClientQuery}
            />
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id}
              style={styles.clientList}
              nestedScrollEnabled
              renderItem={({ item }) => (
                <Pressable
                  style={styles.clientOption}
                  onPress={() => {
                    setSelectedClient(item);
                    setClientQuery('');
                  }}
                >
                  <Text style={styles.clientOptionText}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>Aucun client. Ajoutez-en un d'abord.</Text>
              }
            />
          </View>
        )}
      </View>

      <View>
        <Text style={styles.label}>Prestation *</Text>
        <TextInput
          style={styles.input}
          placeholder="Coupe, coloration, brushing..."
          placeholderTextColor={colors.textMuted}
          value={service}
          onChangeText={setService}
        />
      </View>

      <View>
        <Text style={styles.label}>Date et heure *</Text>
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
      </View>

      <View>
        <Text style={styles.label}>Durée</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              style={[styles.durationChip, duration === d && styles.durationChipActive]}
              onPress={() => setDuration(d)}
            >
              <Text
                style={[
                  styles.durationChipText,
                  duration === d && styles.durationChipTextActive,
                ]}
              >
                {d} min
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Remarques..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enregistrer</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  selectedClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedClientText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  changeText: { fontSize: 13, color: colors.primary },
  clientList: { maxHeight: 200, marginTop: 8 },
  clientOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientOptionText: { fontSize: 15, color: colors.text },
  rowButtons: { flexDirection: 'row', gap: 10 },
  dateButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  durationChipTextActive: { color: '#fff' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, padding: 12, fontSize: 13 },
});
