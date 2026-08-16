import CatalogCard from '@/components/CatalogCard';
import { useCart } from '@/hooks/useCart';
import { useCatalog } from '@/hooks/useCatalog';
import { colors } from '@/lib/theme';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AccueilScreen() {
  const { addItem } = useCart();
  const { services, loading } = useCatalog();
  const featured = services.filter((s) => s.featured);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Cher(e)s client(e)s</Text>
        <Text style={styles.title}>Salon Manager</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <>
          {featured.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offres du moment</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
                {featured.map((s) => (
                  <CatalogCard
                    key={s.id}
                    name={s.name}
                    photoUrl={s.photoUrl}
                    price={s.price}
                    durationMinutes={s.durationMinutes}
                    size="large"
                    onAdd={() => addItem(s)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nos services</Text>
            <View style={styles.grid}>
              {services.map((s) => (
                <CatalogCard
                  key={s.id}
                  name={s.name}
                  photoUrl={s.photoUrl}
                  price={s.price}
                  durationMinutes={s.durationMinutes}
                  onAdd={() => addItem(s)}
                />
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, paddingTop: 8 },
  greeting: { fontSize: 14, color: colors.textMuted },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 2 },
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 },
  hList: { gap: 12, paddingBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
