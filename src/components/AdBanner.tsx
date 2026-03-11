import { useMemorialPlan } from "@/hooks/useMemorialPlan";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface AdBannerProps {
  position: "top" | "sidebar";
  memorialPlan?: string;
}

const AdBanner = ({ position, memorialPlan }: AdBannerProps) => {
  const { adsenseCode } = useSiteSettings();
  const { showAds } = useMemorialPlan(memorialPlan);

  if (!showAds) return null;

  return (
    <div
      className={`rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground ${
        position === "top" ? "w-full py-3 mb-4" : "w-full py-12"
      }`}
    >
      {adsenseCode ? (
        <div dangerouslySetInnerHTML={{ __html: adsenseCode }} />
      ) : (
        <span>📢 Ad space ({position === "top" ? "Banner" : "Sidebar"})</span>
      )}
    </div>
  );
};

export default AdBanner;
