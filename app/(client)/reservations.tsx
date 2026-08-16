import { useAuth } from '@/hooks/useAuth';
import { cancelReservation, useMyReservations } from '@/hooks/useReservations';
import { createReview } from '@/hooks/useReviews';
import { colors } from '@/lib/theme';
import type { Reservation, ReservationStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmee: 'Confirmée',
  en_attente: 'En attente de passage',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const STATUS_COLOR: Record<ReservationStatus, { bg: string; fg: string }> = {
  confirmee: { bg: colors.primaryLight, fg: colors.primary },
  en_attente: { bg: '#FCEFD8', fg: '#B4770B' },
  en_cours: { bg: '#DDEBFB', fg: '#2E6DA4' },
  terminee: { bg: '#E3F1E8', fg: colors.success },
  annulee: { bg: '#F8E6E3', fg: colors.danger },
};

function ReviewModal({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createReview({
        reservationId: reservation.id,
        clientId: user.uid,
        clientName: user.email ?? '',
        coiffeurId: reservation.coiffeurId,
        rating,
        comment: comment.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Laisser un avis</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={30} color={colors.primary} />
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Ton commentaire (optionnel)"
            placeholderTextColor={colors.textMuted}
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.modalButtonGhost]} onPress={onClose}>
              <Text style={styles.modalButtonGhostText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Envoyer</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ReservationsScreen() {
  const { user } = useAuth();
  const { reservations, loading } = useMyReservations(user?.uid);
  const [reviewTarget, setReviewTarget] = useState<Reservation | null>(null);

  const confirmCancel = (reservation: Reservation) => {
    Alert.alert('Annuler la réservation', 'Confirmer l\'annulation ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: () => cancelReservation(reservation),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune réservation pour le moment.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {item.coiffeurName ?? 'Commande produits'}
              </Text>
              <Text style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status].bg, color: STATUS_COLOR[item.status].fg }]}>
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
            {item.date && (
              <Text style={styles.cardDate}>
                {new Date(item.date).toLocaleDateString('fr-FR', { dateStyle: 'medium' })} à {item.startTime}
              </Text>
            )}
            {item.items.map((i) => (
              <Text key={i.id} style={styles.itemLine}>
                {i.quantity}× {i.name}
              </Text>
            ))}
            <Text style={styles.total}>{item.total} DHS</Text>

            <View style={styles.actionsRow}>
              {(item.status === 'confirmee' || item.status === 'en_attente') && (
                <Pressable onPress={() => confirmCancel(item)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
              )}
              {item.status === 'terminee' && (
                <Pressable onPress={() => setReviewTarget(item)}>
                  <Text style={styles.reviewText}>Laisser un avis</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      {reviewTarget && (
        <ReviewModal reservation={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  cardDate: { fontSize: 13, color: colors.textMuted },
  itemLine: { fontSize: 13, color: colors.text },
  total: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  cancelText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  reviewText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '100%', gap: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  commentInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '600' },
  modalButtonGhost: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalButtonGhostText: { color: colors.text, fontWeight: '600' },
});
