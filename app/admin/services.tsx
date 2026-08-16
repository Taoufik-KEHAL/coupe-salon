import {
  createServiceProduct,
  deleteServiceProduct,
  seedCatalog,
  updateServiceProduct,
  useCatalog,
} from '@/hooks/useCatalog';
import { colors } from '@/lib/theme';
import type { ServiceProduct } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type FormState = {
  id?: string;
  type: 'service' | 'produit';
  name: string;
  photoUrl: string;
  price: string;
  durationMinutes: string;
  featured: boolean;
};

const EMPTY_FORM: FormState = {
  type: 'service',
  name: '',
  photoUrl: '',
  price: '',
  durationMinutes: '',
  featured: false,
};

function ItemForm({ initial, onClose }: { initial: FormState; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.photoUrl.trim() || !form.price.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        photoUrl: form.photoUrl.trim(),
        price: Number(form.price),
        durationMinutes: form.type === 'service' ? Number(form.durationMinutes) || 0 : undefined,
        featured: form.featured,
      };
      if (form.id) {
        await updateServiceProduct(form.id, payload);
      } else {
        await createServiceProduct(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.modalCard} contentContainerStyle={{ gap: 10 }}>
          <Text style={styles.modalTitle}>{form.id ? 'Modifier' : 'Ajouter'}</Text>

          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeChip, form.type === 'service' && styles.typeChipActive]}
              onPress={() => setForm({ ...form, type: 'service' })}
            >
              <Text style={[styles.typeChipText, form.type === 'service' && styles.typeChipTextActive]}>Service</Text>
            </Pressable>
            <Pressable
              style={[styles.typeChip, form.type === 'produit' && styles.typeChipActive]}
              onPress={() => setForm({ ...form, type: 'produit' })}
            >
              <Text style={[styles.typeChipText, form.type === 'produit' && styles.typeChipTextActive]}>Produit</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor={colors.textMuted}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="URL de la photo"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            value={form.photoUrl}
            onChangeText={(v) => setForm({ ...form, photoUrl: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Prix (DHS)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={form.price}
            onChangeText={(v) => setForm({ ...form, price: v })}
          />
          {form.type === 'service' && (
            <TextInput
              style={styles.input}
              placeholder="Durée (minutes)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={form.durationMinutes}
              onChangeText={(v) => setForm({ ...form, durationMinutes: v })}
            />
          )}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mettre en avant (Offres du moment)</Text>
            <Switch value={form.featured} onValueChange={(v) => setForm({ ...form, featured: v })} />
          </View>

          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.modalButtonGhost]} onPress={onClose}>
              <Text style={styles.modalButtonGhostText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Enregistrer</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminServicesScreen() {
  const { items, loading } = useCatalog();
  const [formState, setFormState] = useState<FormState | null>(null);

  const confirmDelete = (item: ServiceProduct) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteServiceProduct(item.id) },
    ]);
  };

  const editItem = (item: ServiceProduct) =>
    setFormState({
      id: item.id,
      type: item.type,
      name: item.name,
      photoUrl: item.photoUrl,
      price: String(item.price),
      durationMinutes: item.durationMinutes ? String(item.durationMinutes) : '',
      featured: !!item.featured,
    });

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun service ni produit pour l'instant.</Text>
          <Pressable style={styles.seedButton} onPress={() => seedCatalog()}>
            <Text style={styles.seedButtonText}>Importer un catalogue de démarrage</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.type === 'service' ? `${item.durationMinutes} min · ` : ''}
                  {item.price} DHS
                </Text>
              </View>
              <Pressable onPress={() => editItem(item)} hitSlop={8}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.fab} onPress={() => setFormState(EMPTY_FORM)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {formState && <ItemForm initial={formState} onClose={() => setFormState(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  seedButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
  seedButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.border },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  typeChipTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 13, color: colors.text, flex: 1, marginRight: 8 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '600' },
  modalButtonGhost: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalButtonGhostText: { color: colors.text, fontWeight: '600' },
});
