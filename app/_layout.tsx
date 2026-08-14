import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8E5B3F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Client' }} />
        <Stack.Screen name="client/new" options={{ headerShown: true, title: 'Nouveau client', presentation: 'modal' }} />
        <Stack.Screen name="appointment/[id]" options={{ headerShown: true, title: 'Rendez-vous' }} />
        <Stack.Screen name="appointment/new" options={{ headerShown: true, title: 'Nouveau rendez-vous', presentation: 'modal' }} />
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
      <RootNavigator />
    </AuthProvider>
  );
}
