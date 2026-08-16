import '../models/models.dart';

int timeToMinutes(String time) {
  final parts = time.split(':');
  return int.parse(parts[0]) * 60 + int.parse(parts[1]);
}

String minutesToTime(int minutes) {
  final h = (minutes ~/ 60).toString().padLeft(2, '0');
  final m = (minutes % 60).toString().padLeft(2, '0');
  return '$h:$m';
}

String dateToKey(DateTime date) {
  final y = date.year.toString().padLeft(4, '0');
  final m = date.month.toString().padLeft(2, '0');
  final d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

/// Toutes les heures de début possibles dans la journée de travail, à la
/// granularité fixée (ex: 09:00, 09:15, 09:30, ...).
List<String> generateDayTimes(WorkingHours workingHours) {
  final start = timeToMinutes(workingHours.start);
  final end = timeToMinutes(workingHours.end);
  final times = <String>[];
  for (var t = start; t < end; t += slotGranularityMinutes) {
    times.add(minutesToTime(t));
  }
  return times;
}

/// Les créneaux consécutifs de granularité fixe nécessaires pour couvrir
/// [durationMinutes] à partir de [startTime].
List<String> slotTimesForDuration(String startTime, int durationMinutes) {
  final count = (durationMinutes / slotGranularityMinutes).ceil().clamp(1, 1000000);
  final startMinutes = timeToMinutes(startTime);
  return List.generate(count, (i) => minutesToTime(startMinutes + i * slotGranularityMinutes));
}

String slotId(String coiffeurId, String date, String time) => '${coiffeurId}_${date}_$time';

/// Un créneau document n'existe QUE quand il est réservé (son absence
/// signifie "libre") — donc "disponible" = tous les créneaux consécutifs
/// requis tombent dans les heures de travail et n'ont pas de document.
List<String> availableStartTimes(List<String> dayTimes, Set<String> reservedTimes, int durationMinutes) {
  final dayTimesSet = dayTimes.toSet();
  return dayTimes.where((start) {
    final required = slotTimesForDuration(start, durationMinutes);
    return required.every((t) => dayTimesSet.contains(t) && !reservedTimes.contains(t));
  }).toList();
}
