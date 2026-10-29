/**
 * How long a customer stays signed in. Must match the API's Sanctum settings
 * (SANCTUM_EXPIRATION and SANCTUM_IDLE_TIMEOUT in the API .env, in minutes), which
 * refuse the token on their own if the browser outlives them.
 */

/** Signed out this long after signing in, however active. */
export const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;

/** Signed out after this long without any activity. */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/** Warn this long before the idle sign-out. */
export const IDLE_WARNING_MS = 2 * 60 * 1000;

/**
 * While the user is active, ping the API at most this often so its idle
 * timer, which only sees API requests, does not lapse before ours.
 */
export const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

export function sessionHasExpired(loginAt: unknown): boolean {
  return typeof loginAt !== "number" || Date.now() - loginAt >= SESSION_MAX_AGE_SECONDS * 1000;
}
