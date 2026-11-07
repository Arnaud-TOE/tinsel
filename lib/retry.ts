/** Tries `work` up to `attempts` times, waiting a little longer each time. The last failure is passed on. */
export async function withRetries<T>(work: () => Promise<T>, attempts: number, waitMs: number): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (cause) {
      if (attempt >= attempts) throw cause;
      await new Promise((resolve) => setTimeout(resolve, waitMs * attempt));
    }
  }
}
