import { updateCoiffeur, useCoiffeurs } from '@/hooks/useCoiffeurs';
import { colors } from '@/lib/theme';
import type { Coiffeur } from '@/types';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

function CoiffeurRow({ coiffeur }: { coiffeur: Coiffeur }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(coiffeur.displayName);
  const [start, setStart] = useState(coiffeur.workingHours.start);
  const [end, setEnd] = useState(coiffeur.workingHours.end);

  const save = async () => {
    await updateCoiffeur(coiffeur.id, {
      displayName: displayName.trim() || coiffeur.displayName,
      workingHours: { start, end },
    });
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      {editing ? (
        <View style={{ gap: 8 }}>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Nom" />
          <View style={styles.hoursRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={start} onChangeText={setStart} placeholder="09:00" />
            <Text style={styles.hoursSeparator}>—</Text>
            <TextInput style={[styles.input, { flex: 1 }]} value={end} onChangeText={setEnd} placeholder="19:00" />
          </View>
          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => setEditing(false)}>
              <Text style={styles.buttonGhostText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={save}>
              <Text style={styles.buttonText}>Enregistrer</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.rowHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{coiffeur.displayName}</Text>
            <Text style={styles.hours}>
              {coiffeur.workingHours.start} – {coiffeur.workingHours.end}
            </Text>
          </View>
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.editLink}>Modifier</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.activeRow}>
        <Text style={styles.activeLabel}>Actif (visible pour la réservation)</Text>
        <Switch
          value={coiffeur.active}
          onValueChange={(v) => updateCoiffeur(coiffeur.id, { active: v })}
        />
      </View>
    </View>
  );
}

export default function AdminCoiffeursScreen() {
  const { allCoiffeurs, loading } = useCoiffeurs();

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {allCoiffeurs.length === 0 ? (
            <Text style={styles.empty}>Aucun coiffeur inscrit pour l'instant.</Text>
          ) : (
            allCoiffeurs.map((c) => <CoiffeurRow key={c.id} coiffeur={c} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  hours: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  editLink: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursSeparator: { color: colors.textMuted },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  buttonGhost: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  buttonGhostText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  activeLabel: { fontSize: 12, color: colors.text, flex: 1, marginRight: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
});
