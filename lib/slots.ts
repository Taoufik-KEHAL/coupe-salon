import { SLOT_GRANULARITY_MINUTES, type WorkingHours } from '@/types';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function dateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Toutes les heures de début possibles dans la journée de travail, à la
// granularité fixée (ex: 09:00, 09:15, 09:30, ...).
export function generateDayTimes(workingHours: WorkingHours): string[] {
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);
  const times: string[] = [];
  for (let t = start; t < end; t += SLOT_GRANULARITY_MINUTES) {
    times.push(minutesToTime(t));
  }
  return times;
}

// Les `count` créneaux consécutifs de granularité fixe nécessaires pour
// couvrir `durationMinutes` à partir de `startTime`.
export function slotTimesForDuration(startTime: string, durationMinutes: number): string[] {
  const count = Math.max(1, Math.ceil(durationMinutes / SLOT_GRANULARITY_MINUTES));
  const startMinutes = timeToMinutes(startTime);
  return Array.from({ length: count }, (_, i) => minutesToTime(startMinutes + i * SLOT_GRANULARITY_MINUTES));
}

export function slotId(coiffeurId: string, date: string, time: string): string {
  return `${coiffeurId}_${date}_${time}`;
}

// Un créneau document n'existe QUE quand il est réservé (son absence
// signifie "libre") — donc "disponible" = tous les créneaux consécutifs
// requis tombent dans les heures de travail et n'ont pas de document.
export function availableStartTimes(
  dayTimes: string[],
  reservedTimes: Set<string>,
  durationMinutes: number
): string[] {
  const dayTimesSet = new Set(dayTimes);
  return dayTimes.filter((start) => {
    const required = slotTimesForDuration(start, durationMinutes);
    return required.every((t) => dayTimesSet.has(t) && !reservedTimes.has(t));
  });
}
