import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function LinkRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function StaffProfilScreen() {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 16 }}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={32} color={colors.primary} />
      </View>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.roleBadge}>{role === 'admin' ? 'Administrateur' : 'Coiffeur(se)'}</Text>

      {role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <LinkRow icon="cut-outline" label="Services & produits" onPress={() => router.push('/admin/services')} />
          <LinkRow icon="people-outline" label="Coiffeurs" onPress={() => router.push('/admin/coiffeurs')} />
          <LinkRow icon="person-circle-outline" label="Utilisateurs" onPress={() => router.push('/admin/utilisateurs')} />
        </View>
      )}

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
  roleBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  section: { width: '100%', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
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
