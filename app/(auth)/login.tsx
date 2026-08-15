import { colors } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return "Adresse e-mail invalide.";
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "E-mail ou mot de passe incorrect.";
    case 'auth/email-already-in-use':
      return "Un compte existe déjà avec cet e-mail.";
    case 'auth/weak-password':
      return "Le mot de passe doit contenir au moins 6 caractères.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Merci de renseigner votre e-mail et mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, role);
      }
    } catch (e: any) {
      setError(friendlyError(e?.code ?? ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Salon Manager</Text>
        <Text style={styles.subtitle}>Gestion des clients et rendez-vous</Text>
      </View>

      <View style={styles.form}>
        {mode === 'register' && (
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleChip, role === 'client' && styles.roleChipActive]}
              onPress={() => setRole('client')}
            >
              <Text style={[styles.roleChipText, role === 'client' && styles.roleChipTextActive]}>
                Je suis client(e)
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleChip, role === 'staff' && styles.roleChipActive]}
              onPress={() => setRole('staff')}
            >
              <Text style={[styles.roleChipText, role === 'staff' && styles.roleChipTextActive]}>
                Je suis coiffeur(se)
              </Text>
            </Pressable>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'login' ? 'Se connecter' : "Créer le compte"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? "Pas encore de compte ? Créer un compte"
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 6,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  roleChipTextActive: { color: '#fff' },
});
