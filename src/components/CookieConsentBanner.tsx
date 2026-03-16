import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
};

const STORAGE_KEY = "cookie_consent";

export const getCookieConsent = (): CookieConsent | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
    // Dispatch event so AdBanner can react
    window.dispatchEvent(new CustomEvent("cookie_consent_update", { detail: consent }));
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, advertising: true });
  };

  const rejectOptional = () => {
    saveConsent({ necessary: true, analytics: false, advertising: false });
  };

  const saveCustom = () => {
    saveConsent({ ...preferences, necessary: true });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-2xl shadow-black/20">
            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">
                    This site uses cookies
                  </h3>
                </div>
                <button
                  onClick={rejectOptional}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                We use technical cookies necessary for the site to function. With your consent,
                we may also use analytics and advertising cookies.{" "}
                <Link to="/cookie-policy" className="underline text-primary hover:text-primary/80" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Cookie Policy
                </Link>
              </p>

              {/* Detail toggles */}
              {showDetails && (
                <div className="mb-4 space-y-2.5 rounded-lg border border-border bg-muted/30 p-3">
                  <label className="flex items-center justify-between text-xs">
                     <span className="text-foreground font-medium">
                      Necessary
                      <span className="ml-1.5 text-muted-foreground font-normal">(always active)</span>
                    </span>
                    <input type="checkbox" checked disabled className="accent-primary h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="text-foreground font-medium">Analytics</span>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="text-foreground font-medium">Advertising</span>
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences((p) => ({ ...p, advertising: e.target.checked }))}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={acceptAll} className="text-xs">
                  Accept All
                </Button>
                <Button size="sm" variant="outline" onClick={rejectOptional} className="text-xs">
                  Necessary Only
                </Button>
                {!showDetails ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDetails(true)}
                    className="text-xs text-muted-foreground"
                  >
                    Customize
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={saveCustom} className="text-xs">
                    Save Preferences
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
