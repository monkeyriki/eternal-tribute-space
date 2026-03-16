import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export const useSiteSettings = () => {
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, string> = {};
      data?.forEach((row) => { map[row.key] = row.value || ""; });
      return map;
    },
    staleTime: 60_000,
  });

  return {
    adsEnabled: settings?.ads_enabled === "true",
    adsPremiumExempt: settings?.ads_premium_exempt === "true",
    adsenseCode: settings?.adsense_code || "",
    planFreeMaxPhotos: parseInt(settings?.plan_free_max_photos || "5", 10),
    planPremiumPrice: parseFloat(settings?.plan_premium_price || "49.99"),
    planPremiumLifetimePrice: parseFloat(settings?.plan_premium_lifetime_price || "99.99"),
    planBusinessPrice: parseFloat(settings?.plan_business_price || "199.99"),
    settings: settings || {},
  };
};
