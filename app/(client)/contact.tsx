import { SALON_INFO } from '@/lib/salonInfo';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ContactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{SALON_INFO.name}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <Text style={styles.text}>{SALON_INFO.address}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.text}>{SALON_INFO.hours}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={styles.text}>{SALON_INFO.phone}</Text>
        </View>
      </View>

      <Pressable
        style={styles.callButton}
        onPress={() => Linking.openURL(`tel:${SALON_INFO.phone}`)}
      >
        <Ionicons name="call" size={18} color="#fff" />
        <Text style={styles.callButtonText}>Appeler le salon</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { fontSize: 15, color: colors.text, flex: 1 },
  callButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
