import { useSiteSettings } from "./useSiteSettings";

export const useMemorialPlan = (plan?: string) => {
  const { adsEnabled, adsPremiumExempt } = useSiteSettings();

  const currentPlan = plan || "free";
  const isFree = currentPlan === "free";
  const isPremium = currentPlan === "premium";
  const isBusiness = currentPlan === "business";

  const showAds = adsEnabled && isFree && !(isPremium && adsPremiumExempt);
  const maxPhotos = isFree ? 5 : Infinity;
  const canUploadVideo = isPremium || isBusiness;

  return { currentPlan, isFree, isPremium, isBusiness, showAds, maxPhotos, canUploadVideo };
};
