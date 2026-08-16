import { changeUserRole, useUsers } from '@/hooks/useUsers';
import { colors } from '@/lib/theme';
import type { UserRole } from '@/types';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

const ROLES: UserRole[] = ['client', 'coiffeur', 'admin'];

const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Client',
  coiffeur: 'Coiffeur',
  admin: 'Admin',
};

export default function AdminUsersScreen() {
  const { users, loading } = useUsers();

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {users.map((u) => (
            <View key={u.uid} style={styles.card}>
              <Text style={styles.email}>{u.email}</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.roleChip, u.role === r && styles.roleChipActive]}
                    onPress={() => changeUserRole(u.uid, r)}
                  >
                    <Text style={[styles.roleChipText, u.role === r && styles.roleChipTextActive]}>
                      {ROLE_LABEL[r]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  email: { fontSize: 14, fontWeight: '600', color: colors.text },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  roleChipTextActive: { color: '#fff' },
});
