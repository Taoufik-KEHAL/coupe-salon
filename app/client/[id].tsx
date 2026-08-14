import { useAppointments } from '@/hooks/useAppointments';
import { deleteClient, updateClient, useClients } from '@/hooks/useClients';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
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

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { clients } = useClients();
  const { appointments } = useAppointments();

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);
  const history = useMemo(
    () =>
      appointments
        .filter((a) => a.clientId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, id]
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client?.name ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [notes, setNotes] = useState(client?.notes ?? '');

  if (!client) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Client introuvable.</Text>
      </View>
    );
  }

  const startEditing = () => {
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email ?? '');
    setNotes(client.notes ?? '');
    setEditing(true);
  };

  const save = async () => {
    if (!name.trim() || !phone.trim()) return;
    await updateClient(client.id, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer le client',
      `Supprimer définitivement ${client.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(client.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.card}>
        {editing ? (
          <View style={{ gap: 10 }}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Téléphone" keyboardType="phone-pad" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" />
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
              <Text style={styles.clientName}>{client.name}</Text>
              <Pressable onPress={startEditing} hitSlop={8}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.detailLine}>📞 {client.phone}</Text>
            {client.email ? <Text style={styles.detailLine}>✉️ {client.email}</Text> : null}
            {client.notes ? <Text style={styles.notes}>{client.notes}</Text> : null}
          </View>
        )}
      </View>

      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique des rendez-vous</Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/appointment/new', params: { clientId: client.id } })
            }
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {history.length === 0 ? (
          <Text style={styles.empty}>Aucun rendez-vous pour ce client.</Text>
        ) : (
          history.map((a) => (
            <Pressable
              key={a.id}
              style={styles.appointmentRow}
              onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}
            >
              <View>
                <Text style={styles.appointmentService}>{a.service}</Text>
                <Text style={styles.appointmentDate}>
                  {new Date(a.date).toLocaleString('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
              <Text style={[styles.statusBadge, statusStyle(a.status)]}>
                {statusLabel(a.status)}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteButtonText}>Supprimer le client</Text>
      </Pressable>
    </ScrollView>
  );
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
  clientName: { fontSize: 20, fontWeight: '700', color: colors.text },
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
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointmentService: { fontSize: 15, fontWeight: '600', color: colors.text },
  appointmentDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 12, fontSize: 14 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  deleteButtonText: { color: colors.danger, fontWeight: '600' },
});
