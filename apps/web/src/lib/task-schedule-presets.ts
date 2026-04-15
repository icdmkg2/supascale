/** Five-field cron (minute hour day month weekday), UTC-oriented presets. */
export const SCHEDULE_PRESETS = [
  { id: "every_5m", label: "Every 5 min", cron: "*/5 * * * *" },
  { id: "every_15m", label: "Every 15 min", cron: "*/15 * * * *" },
  { id: "daily_midnight", label: "Daily at midnight", cron: "0 0 * * *" },
  { id: "daily_4am", label: "Daily at 4 AM", cron: "0 4 * * *" },
  { id: "daily_8am", label: "Daily at 8 AM", cron: "0 8 * * *" },
  { id: "weekly_sun", label: "Weekly on Sunday", cron: "0 0 * * 0" },
  { id: "weekly_mon", label: "Weekly on Monday", cron: "0 0 * * 1" },
  { id: "monthly", label: "Monthly", cron: "0 0 1 * *" },
] as const;

export type SchedulePresetId = (typeof SCHEDULE_PRESETS)[number]["id"];

export function presetByCron(cron: string) {
  return SCHEDULE_PRESETS.find((p) => p.cron === cron) ?? null;
}
