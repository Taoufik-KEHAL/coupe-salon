import { useCart } from '@/hooks/useCart';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function PanierScreen() {
  const { items, total, increment, decrement, remove, clear } = useCart();

  const validate = () => {
    Alert.alert(
      'Commande enregistrée',
      'Présente-toi au salon avec ce récapitulatif — le règlement se fait sur place.',
      [{ text: 'OK', onPress: clear }]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>Ton panier est vide.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} DHS</Text>
            </View>
            <View style={styles.quantityRow}>
              <Pressable style={styles.qtyButton} onPress={() => decrement(item.id)} hitSlop={8}>
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => increment(item.id)} hitSlop={8}>
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => remove(item.id)} hitSlop={8} style={{ marginLeft: 8 }}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total} DHS</Text>
        </View>
        <Pressable style={styles.validateButton} onPress={validate}>
          <Text style={styles.validateButtonText}>Valider la commande</Text>
        </Pressable>
        <Text style={styles.note}>Paiement sur place au salon — aucun paiement en ligne.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  emptyText: { color: colors.textMuted, fontSize: 15 },
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
  image: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.border },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  price: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 16, textAlign: 'center' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 16, color: colors.textMuted },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  validateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
