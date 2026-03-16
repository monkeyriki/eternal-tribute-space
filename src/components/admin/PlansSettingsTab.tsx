import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { CheckCircle, CreditCard, Megaphone } from "lucide-react";

const PlansSettingsTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { settings } = useSiteSettings();

  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsPremiumExempt, setAdsPremiumExempt] = useState(true);
  const [adsenseCode, setAdsenseCode] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("49.99");
  const [lifetimePrice, setLifetimePrice] = useState("99.99");
  const [businessPrice, setBusinessPrice] = useState("199.99");
  const [freeMaxPhotos, setFreeMaxPhotos] = useState("5");

  useEffect(() => {
    if (settings) {
      setAdsEnabled(settings.ads_enabled === "true");
      setAdsPremiumExempt(settings.ads_premium_exempt === "true");
      setAdsenseCode(settings.adsense_code || "");
      setPremiumPrice(settings.plan_premium_price || "49.99");
      setLifetimePrice(settings.plan_premium_lifetime_price || "99.99");
      setBusinessPrice(settings.plan_business_price || "199.99");
      setFreeMaxPhotos(settings.plan_free_max_photos || "5");
    }
  }, [settings]);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value });
    }
  };

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting("ads_enabled", String(adsEnabled)),
        saveSetting("ads_premium_exempt", String(adsPremiumExempt)),
        saveSetting("adsense_code", adsenseCode),
        saveSetting("plan_premium_price", premiumPrice),
        saveSetting("plan_premium_lifetime_price", lifetimePrice),
        saveSetting("plan_business_price", businessPrice),
        saveSetting("plan_free_max_photos", freeMaxPhotos),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            <CreditCard className="mr-2 inline h-5 w-5" />
            Subscription Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="font-serif text-lg font-semibold text-foreground">🆓 Free</h3>
              <p className="text-sm text-muted-foreground">With ads, limited features</p>
              <div>
                <Label>Max photos</Label>
                <Input type="number" value={freeMaxPhotos} onChange={(e) => setFreeMaxPhotos(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Price: Free</p>
            </div>
            <div className="rounded-lg border-2 border-primary p-4 space-y-3">
              <h3 className="font-serif text-lg font-semibold text-foreground">⭐ Premium</h3>
              <p className="text-sm text-muted-foreground">No ads, unlimited photos, video</p>
              <div>
                <Label>Annual price ($)</Label>
                <Input type="number" step="0.01" value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} />
              </div>
              <div>
                <Label>Lifetime price ($)</Label>
                <Input type="number" step="0.01" value={lifetimePrice} onChange={(e) => setLifetimePrice(e.target.value)} />
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="font-serif text-lg font-semibold text-foreground">🏢 Business</h3>
              <p className="text-sm text-muted-foreground">For funeral agencies / B2B</p>
              <div>
                <Label>Annual price ($)</Label>
                <Input type="number" step="0.01" value={businessPrice} onChange={(e) => setBusinessPrice(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            <Megaphone className="mr-2 inline h-5 w-5" />
            Ad Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Ads enabled globally</p>
              <p className="text-xs text-muted-foreground">Enable/disable all ads on the site</p>
            </div>
            <Switch checked={adsEnabled} onCheckedChange={setAdsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Premium Exemption</p>
              <p className="text-xs text-muted-foreground">Premium memorials don't show ads</p>
            </div>
            <Switch checked={adsPremiumExempt} onCheckedChange={setAdsPremiumExempt} />
          </div>
          <div>
            <Label>Google AdSense Code</Label>
            <Textarea value={adsenseCode} onChange={(e) => setAdsenseCode(e.target.value)}
              placeholder='<script async src="https://pagead2.googlesyndication.com/..."></script>'
              className="font-mono text-xs h-24" />
            <p className="text-xs text-muted-foreground mt-1">Paste the code provided by Google AdSense.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveAllMutation.mutate()} disabled={saveAllMutation.isPending} className="w-full md:w-auto">
        <CheckCircle className="mr-2 h-4 w-4" />
        Save All Settings
      </Button>
    </div>
  );
};

export default PlansSettingsTab;
