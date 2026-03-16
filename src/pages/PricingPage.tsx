import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Check, Crown, Building2, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabaseClient";
import { STRIPE_PLANS, PlanKey } from "@/data/stripePlans";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const plans = [
  {
    key: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    icon: "🕯️",
    features: [
      "1 memorial page",
      "Up to 5 photos",
      "Text condolences",
      "Basic QR code",
    ],
    limitations: ["Ads displayed", "No video support"],
  },
  {
    key: "premium_annual" as const,
    name: "Premium",
    price: "$49.99",
    period: "/year",
    icon: "⭐",
    features: [
      "Unlimited memorial pages",
      "Unlimited photos",
      "Video support",
      "No ads",
      "Priority in directory",
      "Custom QR code",
    ],
    popular: true,
  },
  {
    key: "premium_lifetime" as const,
    name: "Premium Lifetime",
    price: "$99.99",
    period: "one-time",
    icon: "💎",
    features: [
      "All Premium features",
      "Pay once, keep forever",
      "No recurring charges",
      "Lifetime updates",
    ],
  },
  {
    key: "business_monthly" as const,
    name: "Business Monthly",
    price: "$19.99",
    period: "/month",
    icon: "🏢",
    features: [
      "All Premium features",
      "Bulk memorial management",
      "Custom branding / logo",
      "CSV import",
      "Priority support",
    ],
  },
  {
    key: "business_annual" as const,
    name: "Business Annual",
    price: "$199.99",
    period: "/year",
    icon: "🏢",
    badge: "Save 17%",
    features: [
      "All Premium features",
      "Bulk memorial management",
      "Custom branding / logo",
      "CSV import",
      "Priority support",
      "Revenue dashboard",
    ],
  },
];

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { plan: currentPlan, subscribed, lifetime, isLoading: subLoading, refetch } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      toast.success("Plan upgraded successfully!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      refetch();
      searchParams.delete("upgrade");
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get("upgrade") === "cancelled") {
      toast.info("Upgrade cancelled.");
      searchParams.delete("upgrade");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleUpgrade = async (planKey: PlanKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const plan = STRIPE_PLANS[planKey];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-plan-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          price_id: plan.price_id,
          mode: plan.mode,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, "payment"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (planKey: string) => {
    if (planKey === "free") return currentPlan === "free";
    if (planKey === "premium_annual" || planKey === "premium_lifetime") return currentPlan === "premium";
    if (planKey === "business_annual" || planKey === "business_monthly") return currentPlan === "business";
    return false;
  };

  return (
    <>
      <Helmet>
        <title>Plans & Pricing – Eternal Memory</title>
        <meta name="description" content="Choose the right plan for your digital memorial. Free, Premium, and Business plans available." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-12 text-center">
            <h1 className="mb-3 font-serif text-3xl font-semibold text-foreground md:text-4xl">
              Plans & Pricing
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Choose the plan that best honors your loved ones. Upgrade anytime.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.key);
              const isUpgradeable = plan.key !== "free" && !isCurrent;

              return (
                <Card
                  key={plan.key}
                  className={`relative flex flex-col ${plan.popular ? "border-2 border-primary shadow-lg" : "border-border"}`}
                >
                  {(plan as any).badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      {(plan as any).badge}
                    </Badge>
                  )}
                  {plan.popular && !(plan as any).badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-3 right-3 bg-accent text-accent-foreground">
                      Your Plan
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <span className="mb-2 inline-block text-3xl">{plan.icon}</span>
                    <CardTitle className="font-serif text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground"> {plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="mb-6 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                      {plan.limitations?.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                          {f}
                        </li>
                      ))}
                    </ul>

                    {plan.key === "free" ? (
                      <Button variant="outline" disabled className="w-full">
                        {isCurrent ? "Current Plan" : "Free"}
                      </Button>
                    ) : isCurrent ? (
                      <Button variant="outline" disabled className="w-full">
                        <Check className="mr-1 h-4 w-4" /> Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(plan.key as PlanKey)}
                        disabled={!!loadingPlan || (lifetime && plan.key.startsWith("premium"))}
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {loadingPlan === plan.key ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : plan.key === "business_annual" ? (
                          <Building2 className="mr-1 h-4 w-4" />
                        ) : (
                          <Crown className="mr-1 h-4 w-4" />
                        )}
                        Upgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PricingPage;
