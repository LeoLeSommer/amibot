/**
 * Client API contract version embedded in the JS bundle. Bump it in the same
 * change that starts depending on a new backend contract: an OTA update
 * carries the new constant automatically. Keep it greater than or equal to the
 * backend `MIN_CLIENT_API_VERSION`.
 */
export const CLIENT_API_VERSION = 1;

export const CLIENT_API_VERSION_HEADER = "X-Client-Api-Version";
