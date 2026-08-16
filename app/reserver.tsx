import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCoiffeurs } from '@/hooks/useCoiffeurs';
import { createProductOnlyOrder } from '@/hooks/useReservations';
import { SlotUnavailableError, reserveSlots, useReservedTimes } from '@/hooks/useSlots';
import { colors } from '@/lib/theme';
import { availableStartTimes, dateToKey, generateDayTimes } from '@/lib/slots';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Step = 'coiffeur' | 'date' | 'heure' | 'confirmation';

const DAYS_AHEAD = 14;

function dayLabel(date: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, today)) return "Aujourd'hui";
  if (isSameDay(date, tomorrow)) return 'Demain';
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ReserverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, totalDurationMinutes, clear } = useCart();
  const { coiffeurs, loading: loadingCoiffeurs } = useCoiffeurs();

  const [step, setStep] = useState<Step>('coiffeur');
  const [coiffeurId, setCoiffeurId] = useState<string | null>(null);
  const [coiffeurName, setCoiffeurName] = useState<string>('');
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCoiffeur = coiffeurs.find((c) => c.id === coiffeurId);
  const { reservedTimes, loading: loadingSlots } = useReservedTimes(coiffeurId, date);
  const dayTimes = useMemo(
    () => (selectedCoiffeur ? generateDayTimes(selectedCoiffeur.workingHours) : []),
    [selectedCoiffeur]
  );
  const available = useMemo(
    () => availableStartTimes(dayTimes, reservedTimes, totalDurationMinutes),
    [dayTimes, reservedTimes, totalDurationMinutes]
  );

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    []
  );

  const confirm = async () => {
    if (!user || !coiffeurId || !date || !startTime) return;
    setSubmitting(true);
    try {
      await reserveSlots({
        coiffeurId,
        coiffeurName,
        date,
        startTime,
        clientId: user.uid,
        clientName: user.email ?? '',
        items,
        totalDurationMinutes,
        total,
      });
      clear();
      Alert.alert('Réservation confirmée', 'Rendez-vous enregistré — à bientôt !', [
        { text: 'OK', onPress: () => router.replace('/(client)/reservations') },
      ]);
    } catch (e) {
      if (e instanceof SlotUnavailableError) {
        Alert.alert('Créneau indisponible', e.message);
        setStartTime(null);
        setStep('heure');
      } else {
        Alert.alert('Erreur', 'Impossible de confirmer la réservation. Réessaie.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmProductsOnly = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createProductOnlyOrder({
        clientId: user.uid,
        clientName: user.email ?? '',
        items: items.map((i) => ({
          id: i.id,
          kind: i.kind,
          name: i.name,
          price: i.price,
          durationMinutes: i.durationMinutes,
          quantity: i.quantity,
        })),
        total,
      });
      clear();
      Alert.alert('Commande enregistrée', 'Présente-toi au salon — réglée sur place.', [
        { text: 'OK', onPress: () => router.replace('/(client)/reservations') },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Ton panier est vide.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step === 'coiffeur' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Choisis un coiffeur</Text>
          {loadingCoiffeurs ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            coiffeurs.map((c) => (
              <Pressable
                key={c.id}
                style={styles.optionRow}
                onPress={() => {
                  setCoiffeurId(c.id);
                  setCoiffeurName(c.displayName);
                  setStep('date');
                }}
              >
                <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
                <Text style={styles.optionText}>{c.displayName}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {step === 'date' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Choisis une date</Text>
          {days.map((d) => (
            <Pressable
              key={d.toISOString()}
              style={styles.optionRow}
              onPress={() => {
                setDate(dateToKey(d));
                setStep('heure');
              }}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              <Text style={styles.optionText}>{dayLabel(d)}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {step === 'heure' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Choisis une heure</Text>
          <Text style={styles.subtitle}>Durée totale : {totalDurationMinutes} min</Text>
          {loadingSlots ? (
            <ActivityIndicator color={colors.primary} />
          ) : available.length === 0 ? (
            <Text style={styles.empty}>Aucun créneau disponible ce jour-là.</Text>
          ) : (
            <View style={styles.timeGrid}>
              {available.map((t) => (
                <Pressable
                  key={t}
                  style={styles.timeChip}
                  onPress={() => {
                    setStartTime(t);
                    setStep('confirmation');
                  }}
                >
                  <Text style={styles.timeChipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {step === 'confirmation' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Confirmer la réservation</Text>
          <View style={styles.recapCard}>
            <View style={styles.recapRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.recapText}>{coiffeurName}</Text>
            </View>
            <View style={styles.recapRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.recapText}>
                {date && dayLabel(new Date(date))} à {startTime}
              </Text>
            </View>
            {items.map((i) => (
              <View key={i.id} style={styles.recapRow}>
                <Text style={styles.recapItemQty}>{i.quantity}×</Text>
                <Text style={[styles.recapText, { flex: 1 }]}>{i.name}</Text>
                <Text style={styles.recapText}>{i.price * i.quantity} DHS</Text>
              </View>
            ))}
            <View style={[styles.recapRow, styles.recapTotalRow]}>
              <Text style={styles.recapTotalLabel}>Total</Text>
              <Text style={styles.recapTotalValue}>{total} DHS</Text>
            </View>
          </View>
          <Text style={styles.note}>Paiement sur place au salon — aucun paiement en ligne.</Text>
          <Pressable style={styles.confirmButton} onPress={confirm} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirmer</Text>}
          </Pressable>
        </ScrollView>
      )}

      {step === 'coiffeur' && (
        <View style={styles.skipContainer}>
          <Pressable onPress={confirmProductsOnly} disabled={submitting}>
            <Text style={styles.skipText}>Commander sans rendez-vous (produits uniquement)</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 12 },
  recapCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapText: { fontSize: 14, color: colors.text },
  recapItemQty: { fontSize: 14, color: colors.textMuted, width: 28 },
  recapTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  recapTotalLabel: { fontSize: 15, color: colors.textMuted, flex: 1 },
  recapTotalValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipContainer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  skipText: { textAlign: 'center', color: colors.primary, fontSize: 13, fontWeight: '600' },
});
