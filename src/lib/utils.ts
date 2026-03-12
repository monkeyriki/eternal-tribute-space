import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a user-friendly, sensitive error message for UI (PRD 5.2).
 * Avoids technical jargon and suggests calm next steps.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  context: "memorial_save" | "image_upload" | "payment" | "tribute" = "memorial_save"
): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch") || lower.includes("connection")) {
    return "We're having trouble reaching our servers. Please check your connection and try again.";
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
  return "Something went wrong. Please try again in a moment.";
}
