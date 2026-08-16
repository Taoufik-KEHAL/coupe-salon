import { useAuth } from '@/hooks/useAuth';
import { SALON_INFO } from '@/lib/salonInfo';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 16 }}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={32} color={colors.primary} />
      </View>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{SALON_INFO.name}</Text>
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
        <Pressable style={styles.callButton} onPress={() => Linking.openURL(`tel:${SALON_INFO.phone}`)}>
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.callButtonText}>Appeler le salon</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={() => logout()}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  email: { fontSize: 16, fontWeight: '600', color: colors.text },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { fontSize: 14, color: colors.text, flex: 1 },
  callButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  callButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
