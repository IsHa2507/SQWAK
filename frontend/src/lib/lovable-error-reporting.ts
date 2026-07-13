/**
 * Stub error reporter — replace with your actual reporting service (Sentry, etc.).
 */
export function reportLovableError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.error("[ErrorReporter]", error, context);
  }
}
