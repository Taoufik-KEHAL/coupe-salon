import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  photoUrl: string;
  price: number;
  durationMinutes?: number;
  onAdd: () => void;
  size?: 'large' | 'small';
};

export default function CatalogCard({ name, photoUrl, price, durationMinutes, onAdd, size = 'small' }: Props) {
  return (
    <View style={[styles.card, size === 'large' && styles.cardLarge]}>
      <Image source={{ uri: photoUrl }} style={styles.image} />
      <View style={styles.body}>
        {durationMinutes ? <Text style={styles.duration}>{durationMinutes}min</Text> : null}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{price} DHS</Text>
          <Pressable style={styles.addButton} onPress={onAdd} hitSlop={8}>
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLarge: { width: 220 },
  image: { width: '100%', height: 110, backgroundColor: colors.border },
  body: { padding: 10, gap: 4 },
  duration: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, minHeight: 34 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  addButton: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
