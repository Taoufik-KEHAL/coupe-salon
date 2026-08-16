import CatalogCard from '@/components/CatalogCard';
import { useCart } from '@/hooks/useCart';
import { useCatalog } from '@/hooks/useCatalog';
import { colors } from '@/lib/theme';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function BoutiqueScreen() {
  const { addItem } = useCart();
  const { produits, loading } = useCatalog();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.title}>Nos produits</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.grid}>
          {produits.map((p) => (
            <CatalogCard key={p.id} name={p.name} photoUrl={p.photoUrl} price={p.price} onAdd={() => addItem(p)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
