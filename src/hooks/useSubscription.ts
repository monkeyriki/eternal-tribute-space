import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  subscription_end?: string;
  subscription_id?: string;
  lifetime?: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { subscribed: false, plan: "free" };

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error("check-subscription error:", error);
        return { subscribed: false, plan: "free" };
      }

      return data as SubscriptionStatus;
    },
    enabled: !!user,
    staleTime: 300_000,
    refetchInterval: 300_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    isLoading,
    plan: data?.plan || "free",
    subscribed: data?.subscribed || false,
    subscriptionEnd: data?.subscription_end,
    lifetime: data?.lifetime || false,
    refetch,
  };
};
