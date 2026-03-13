import { useEffect, useRef, useState } from "react";
import { useMemorialPlan } from "@/hooks/useMemorialPlan";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getCookieConsent } from "@/components/CookieConsentBanner";

interface AdBannerProps {
  position: "top" | "sidebar";
  memorialPlan?: string;
}

const AdBanner = ({ position, memorialPlan }: AdBannerProps) => {
  const { adsenseCode } = useSiteSettings();
  const { showAds } = useMemorialPlan(memorialPlan);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adConsent, setAdConsent] = useState(() => {
    const consent = getCookieConsent();
    return consent?.advertising ?? false;
  });

  // Listen for consent updates
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAdConsent(detail?.advertising ?? false);
    };
    window.addEventListener("cookie_consent_update", handler);
    return () => window.removeEventListener("cookie_consent_update", handler);
  }, []);

  // Inject AdSense script properly (dangerouslySetInnerHTML doesn't execute <script>)
  useEffect(() => {
    if (!showAds || !adsenseCode || !adConsent || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    // Parse the adsense snippet and handle script tags separately
    const temp = document.createElement("div");
    temp.innerHTML = adsenseCode;

    const scripts: HTMLScriptElement[] = [];
    temp.querySelectorAll("script").forEach((s) => {
      const newScript = document.createElement("script");
      // Copy attributes
      Array.from(s.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      if (s.textContent) newScript.textContent = s.textContent;
      scripts.push(newScript);
      s.remove();
    });

    // Append non-script HTML
    container.innerHTML = temp.innerHTML;

    // Append scripts so they execute
    scripts.forEach((script) => container.appendChild(script));

    return () => {
      container.innerHTML = "";
    };
  }, [showAds, adsenseCode, adConsent]);

  if (!showAds) return null;

  // No consent for advertising cookies → show placeholder
  if (!adConsent || !adsenseCode) {
    return (
      <div
        className={`rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground ${
          position === "top" ? "w-full py-3 mb-4" : "w-full py-12"
        }`}
      >
        <span>📢 Ad space ({position === "top" ? "Banner" : "Sidebar"})</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${position === "top" ? "w-full mb-4" : "w-full"}`}
    />
  );
};

export default AdBanner;
