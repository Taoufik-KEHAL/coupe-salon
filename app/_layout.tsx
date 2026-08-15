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
      <Pressable style={styles.fallbackButton} onPress={() => setUserRole('staff')}>
        <Text style={styles.fallbackButtonText}>Je suis coiffeur(se)</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator() {
  const { user, role, initializing } = useAuth();

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
      <Stack.Protected guard={!!user && role === 'staff'}>
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Client' }} />
        <Stack.Screen name="client/new" options={{ headerShown: true, title: 'Nouveau client', presentation: 'modal' }} />
        <Stack.Screen name="appointment/[id]" options={{ headerShown: true, title: 'Rendez-vous' }} />
        <Stack.Screen name="appointment/new" options={{ headerShown: true, title: 'Nouveau rendez-vous', presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user && role === 'client'}>
        <Stack.Screen name="(client)" />
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
