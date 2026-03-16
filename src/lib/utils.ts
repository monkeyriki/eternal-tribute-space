import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isNetworkError, FRIENDLY_NETWORK_MESSAGE } from "@/lib/networkError";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a user-friendly, sensitive error message for UI (PRD 5.2, Bug #5).
 * Avoids technical jargon and suggests calm next steps. Network/offline errors first.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  context: "memorial_save" | "image_upload" | "payment" | "tribute" | "auth" | "report" | "export" | "password_reset" | "delete_account" = "memorial_save"
): string {
  if (isNetworkError(error)) return FRIENDLY_NETWORK_MESSAGE;

  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch") || lower.includes("connection")) {
    return FRIENDLY_NETWORK_MESSAGE;
  }
  if (lower.includes("storage") || lower.includes("upload") || lower.includes("bucket") || lower.includes("object")) {
    return context === "image_upload"
      ? "We couldn't upload that photo. Please try another image or try again in a moment."
      : "We couldn't save your photo. Please try again.";
  }
  if (context === "payment") {
    return "We couldn't complete the payment. Please try again or choose another way to leave a tribute.";
  }
  if (context === "tribute") {
    return "We couldn't send your message right now. Please try again in a moment.";
  }
  if (context === "memorial_save") {
    return "We couldn't save the memorial right now. Please check your connection and try again.";
  }
  if (context === "auth") {
    if (lower.includes("user already registered") || lower.includes("already been registered"))
      return "This email is already registered. Try signing in instead.";
    if (lower.includes("invalid login credentials") || lower.includes("invalid credentials"))
      return "Incorrect email or password. Please try again.";
    if (lower.includes("email not confirmed"))
      return "Please confirm your email before signing in. Check your inbox for a verification link.";
    if (lower.includes("password") && (lower.includes("short") || lower.includes("least")))
      return "Password is too short. Please use at least 6 characters.";
    if (lower.includes("rate limit") || lower.includes("too many"))
      return "Too many attempts. Please wait a moment and try again.";
    if (lower.includes("signup") && lower.includes("disabled"))
      return "Registration is currently disabled. Please try again later.";
    // Fallback: show the actual error so we can debug
    return msg || "We couldn't complete the request. Please try again.";
  }
  if (context === "report") {
    return "We couldn't submit your report. Please try again in a moment.";
  }
  if (context === "export") {
    return "We couldn't prepare your export. Please check your connection and try again.";
  }
  if (context === "password_reset") {
    return "We couldn't update your password. The link may have expired—request a new one from the sign-in page.";
  }
  if (context === "delete_account") {
    return "We couldn't delete your account right now. Please check your connection and try again, or contact support if it persists.";
  }
  return "Something went wrong. Please try again in a moment.";
}
