import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={32} color={colors.primary} />
      </View>
      <Text style={styles.email}>{user?.email}</Text>

      <Pressable style={styles.logoutButton} onPress={() => logout()}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 48, gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: { fontSize: 16, fontWeight: '600', color: colors.text },
  logoutButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
