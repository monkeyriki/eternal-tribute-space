/**
 * Detect if an error is likely due to network (offline, DNS, connection refused, etc.)
 */
export function isNetworkError(error: unknown): boolean {
  if (error == null) return false;
  const err = error as { message?: string; name?: string; code?: string };
  const msg = (err.message ?? "").toLowerCase();
  const name = (err.name ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  return (
    name === "typeerror" && (msg.includes("failed to fetch") || msg.includes("network request failed")) ||
    msg.includes("network error") ||
    msg.includes("networkrequestfailed") ||
    code === "network_error" ||
    code === "econnrefused" ||
    code === "enotfound" ||
    code === "etimedout" ||
    code === "econnreset"
  );
}

/** Bug #5: Single friendly message for all network/offline errors. */
export const FRIENDLY_NETWORK_MESSAGE =
  "We're having trouble reaching our servers. Please check your internet connection and try again.";
