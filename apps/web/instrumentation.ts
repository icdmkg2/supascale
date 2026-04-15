export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getDb } = await import("@/lib/db");
    getDb();
    const { processTasksOnce } = await import("@/server/tasks/service");
    setInterval(() => {
      processTasksOnce().catch(() => {});
    }, 4000);
  }
}
