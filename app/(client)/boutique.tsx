import CatalogCard from '@/components/CatalogCard';
import { useCart } from '@/hooks/useCart';
import { PRODUCTS } from '@/lib/catalog';
import { colors } from '@/lib/theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function BoutiqueScreen() {
  const { addProduct } = useCart();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.title}>Nos produits</Text>
      <View style={styles.grid}>
        {PRODUCTS.map((p) => (
          <CatalogCard
            key={p.id}
            name={p.name}
            photoUrl={p.photoUrl}
            price={p.price}
            onAdd={() => addProduct(p)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
