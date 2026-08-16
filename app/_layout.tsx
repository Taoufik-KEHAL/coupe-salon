import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { colors } from '@/lib/theme';
import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

function RoleFallback() {
  const { setUserRole } = useAuth();
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>Qui es-tu ?</Text>
      <Text style={styles.fallbackSubtitle}>
        Ton compte n'a pas encore de profil. Choisis une option pour continuer.
      </Text>
      <Pressable style={styles.fallbackButton} onPress={() => setUserRole('client')}>
        <Text style={styles.fallbackButtonText}>Je suis client(e)</Text>
      </Pressable>
      <Pressable style={styles.fallbackButton} onPress={() => setUserRole('coiffeur')}>
        <Text style={styles.fallbackButtonText}>Je suis coiffeur(se)</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator() {
  const { user, role, initializing } = useAuth();
  const isStaff = role === 'coiffeur' || role === 'admin';

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8E5B3F" />
      </View>
    );
  }

  if (user && !role) {
    return <RoleFallback />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user && isStaff}>
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Client' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user && role === 'admin'}>
        <Stack.Screen name="admin/services" options={{ headerShown: true, title: 'Services & produits' }} />
        <Stack.Screen name="admin/coiffeurs" options={{ headerShown: true, title: 'Coiffeurs' }} />
        <Stack.Screen name="admin/utilisateurs" options={{ headerShown: true, title: 'Utilisateurs' }} />
        <Stack.Screen name="admin/statistiques" options={{ headerShown: true, title: 'Statistiques' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user && role === 'client'}>
        <Stack.Screen name="(client)" />
        <Stack.Screen name="reserver" options={{ headerShown: true, title: 'Réserver' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  fallbackTitle: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  fallbackSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  fallbackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
