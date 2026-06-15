// Retourne le numéro de semaine ISO 8601 (1–53) et l'année ISO pour une date donnée.
// Accepte une date optionnelle — par défaut aujourd'hui, mais closeWeek() passe la semaine précédente.
export function getIsoWeek(date: Date = new Date()): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}
