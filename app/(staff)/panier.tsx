import { useAuth } from '@/hooks/useAuth';
import { setReservationStatus, useReservationsByStatus } from '@/hooks/useReservations';
import { colors } from '@/lib/theme';
import type { Reservation } from '@/types';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function ReservationCard({ reservation, action }: { reservation: Reservation; action: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.client}>{reservation.clientName}</Text>
      {reservation.coiffeurName && <Text style={styles.coiffeur}>{reservation.coiffeurName}</Text>}
      {reservation.date && (
        <Text style={styles.meta}>
          {new Date(reservation.date).toLocaleDateString('fr-FR', { dateStyle: 'medium' })} à {reservation.startTime}
        </Text>
      )}
      {reservation.items.map((i) => (
        <Text key={i.id} style={styles.itemLine}>
          {i.quantity}× {i.name} — {i.price * i.quantity} DHS
        </Text>
      ))}
      <Text style={styles.total}>Total : {reservation.total} DHS</Text>
      {action}
    </View>
  );
}

export default function ValiderPanierScreen() {
  const { user, role } = useAuth();
  const { reservations: enAttente, loading: loadingAttente } = useReservationsByStatus('en_attente');
  const { reservations: enCours, loading: loadingCours } = useReservationsByStatus('en_cours');

  if (loadingAttente || loadingCours) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Seul le coiffeur assigné à la réservation (ou l'admin) peut confirmer
  // qu'elle est terminée — une commande produits seuls (sans coiffeur) reste
  // ouverte à tout le staff.
  const canComplete = (r: Reservation) =>
    r.coiffeurId === null || r.coiffeurId === user?.uid || role === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.sectionTitle}>À valider ({enAttente.length})</Text>
      {enAttente.length === 0 ? (
        <Text style={styles.empty}>Rien en attente.</Text>
      ) : (
        enAttente.map((r) => (
          <ReservationCard
            key={r.id}
            reservation={r}
            action={
              <Pressable
                style={styles.actionButton}
                onPress={() => setReservationStatus(r.id, 'en_cours')}
              >
                <Text style={styles.actionButtonText}>Valider le panier</Text>
              </Pressable>
            }
          />
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>En cours ({enCours.length})</Text>
      {enCours.length === 0 ? (
        <Text style={styles.empty}>Rien en cours.</Text>
      ) : (
        enCours.map((r) => (
          <ReservationCard
            key={r.id}
            reservation={r}
            action={
              canComplete(r) ? (
                <Pressable
                  style={[styles.actionButton, styles.actionButtonSuccess]}
                  onPress={() => setReservationStatus(r.id, 'terminee')}
                >
                  <Text style={styles.actionButtonText}>Confirmer l'accomplissement</Text>
                </Pressable>
              ) : (
                <Text style={styles.waitingText}>En attente de confirmation par {reservationCoiffeurLabel(r)}</Text>
              )
            }
          />
        ))
      )}
    </ScrollView>
  );
}

function reservationCoiffeurLabel(r: Reservation) {
  return r.coiffeurName ?? 'le coiffeur assigné';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  empty: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  client: { fontSize: 15, fontWeight: '700', color: colors.text },
  coiffeur: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.textMuted },
  itemLine: { fontSize: 13, color: colors.text },
  total: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 2 },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonSuccess: { backgroundColor: colors.success },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  waitingText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
});
