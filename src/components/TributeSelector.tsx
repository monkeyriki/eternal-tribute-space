import { useState, useEffect } from "react";
import { Send, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadProfanityWords, checkProfanity } from "@/lib/profanityFilter";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { tributeTiers as fallbackTiers, TributeTier } from "@/data/tributeTiers";
import { getFriendlyErrorMessage } from "@/lib/utils";

interface TributeSelectorProps {
  memorialId: string;
  firstName: string;
  onTributeAdded: () => void;
  requireApproval?: boolean;
}

const tierColors: Record<string, string> = {
  base: "border-border bg-background hover:border-muted-foreground/40",
  standard: "border-border bg-background hover:border-primary/40",
  premium: "border-border bg-background hover:border-accent/40",
};

const tierSelectedColors: Record<string, string> = {
  base: "border-muted-foreground bg-muted/30 shadow-soft",
  standard: "border-primary bg-primary/5 shadow-soft",
  premium: "border-accent bg-accent/5 shadow-soft ring-1 ring-accent/20",
};

const TributeSelector = ({ memorialId, firstName, onTributeAdded, requireApproval = false }: TributeSelectorProps) => {
  const [selected, setSelected] = useState<TributeTier | null>(null);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [profanityWords, setProfanityWords] = useState<string[]>([]);

  // Fetch store_items from DB, fallback to hardcoded tiers
  const { data: tiers = fallbackTiers } = useQuery({
    queryKey: ["store_items_tribute"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_items" as any)
        .select("*")
        .eq("category", "tribute")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error || !data || (data as any[]).length === 0) {
        return fallbackTiers;
      }

      // Always include a free "Message" option first
      const freeOption: TributeTier = {
        id: "base-message",
        tier: "base",
        name: "Message",
        icon: "✉️",
        price: 0,
        description: "Leave a condolence message",
        animated: false,
      };

      const dbItems: TributeTier[] = (data as any[]).map((item: any) => ({
        id: item.id,
        tier: item.tier as "base" | "standard" | "premium",
        name: item.name,
        icon: item.type === "image" && item.icon_url ? item.icon_url : (item.emoji || "🕯️"),
        price: Number(item.price),
        description: item.name,
        animated: item.tier === "premium",
        duration: item.tier === "premium" ? "30 days" : undefined,
        iconUrl: item.type === "image" ? item.icon_url : undefined,
        iconType: item.type as "emoji" | "image",
      }));

      return [freeOption, ...dbItems];
    },
    staleTime: 60_000,
  });

  // Set default selection when tiers load
  useEffect(() => {
    if (tiers.length > 0 && !selected) {
      setSelected(tiers[0]);
    }
  }, [tiers, selected]);

  useEffect(() => {
    loadProfanityWords(async () => {
      const { data } = await supabase.from("profanity_words" as any).select("word");
      return ((data as any[]) || []).map((r: any) => r.word);
    }).then(setProfanityWords);
  }, []);

  // Check for payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment successful! Your tribute has been added.");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("tribute_id");
      window.history.replaceState({}, "", url.toString());
      onTributeAdded();
    } else if (params.get("payment") === "cancelled") {
      toast.info("Payment cancelled.");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
  }, [onTributeAdded]);

  if (!selected) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);

    // Check if user is banned
    try {
      const { data: banData } = await supabase.functions.invoke("check-ban", {
        body: {
          email: senderEmail.trim() || null,
          ip_address: window.location.hostname,
        },
      });
      if (banData?.banned) {
        toast.error("You are not allowed to submit tributes");
        setSending(false);
        return;
      }
    } catch (err) {
      console.error("Ban check failed:", err);
    }

    // For paid tributes, redirect to Stripe Checkout
    if (selected.tier !== "base") {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            memorial_id: memorialId,
            sender_name: senderName.trim() || "Anonymous",
            sender_email: senderEmail.trim() || null,
            message,
            item_type: selected.name,
            tier: selected.tier,
            return_url: window.location.href.split("?")[0],
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("No checkout URL returned");
      } catch (err: any) {
        console.error("Checkout error:", err);
        toast.error(getFriendlyErrorMessage(err, "payment"));
        setSending(false);
        return;
      }
    }

    // Free tribute — insert directly
    try {
      const isFlagged = checkProfanity(message, profanityWords);
      const tributeStatus = isFlagged ? "flagged" : requireApproval ? "pending" : "approved";

      const { error } = await supabase.from("tributes" as any).insert({
        memorial_id: memorialId,
        sender_name: senderName.trim() || "Anonymous",
        message,
        item_type: selected.name,
        tier: selected.tier,
        is_paid: false,
        status: tributeStatus,
        sender_email: senderEmail.trim() || null,
      } as any);

      if (error) {
        if (error.message?.includes("Rate limit exceeded")) {
          toast.error("You have reached the limit of 3 free tributes per memorial per day.");
        } else {
          toast.error(getFriendlyErrorMessage(error, "tribute"));
        }
        return;
      }

      if (isFlagged) {
        toast.info("Your tribute is pending review by a moderator.");
      } else if (requireApproval) {
        toast.info("Your tribute is awaiting approval by the memorial owner.");
      } else {
        toast.success("Tribute sent!");
      }

      supabase.functions.invoke("notify-tribute", {
        body: {
          tribute_id: null,
          memorial_id: memorialId,
          sender_name: senderName.trim() || "Anonymous",
          message,
          tier: selected.tier,
          is_flagged: isFlagged,
          is_pending_approval: !isFlagged && requireApproval,
        },
      }).catch((err) => console.error("notify-tribute error:", err));

      if (senderEmail.trim()) {
        supabase.functions.invoke("send-receipt", {
          body: {
            sender_email: senderEmail.trim(),
            sender_name: senderName.trim() || "Anonymous",
            memorial_name: firstName,
            item_type: selected.name,
            tier: selected.tier,
            price: selected.price,
            message,
          },
        }).catch((err) => console.error("send-receipt error:", err));
      }

      setMessage("");
      setSenderName("");
      setSenderEmail("");
      setSelected(tiers[0]);
      onTributeAdded();
    } catch (err: any) {
      console.error("Tribute submit error:", err);
      toast.error(getFriendlyErrorMessage(err, "tribute"));
    } finally {
      setSending(false);
    }
  };

  const renderIcon = (tier: TributeTier & { iconUrl?: string; iconType?: string }) => {
    if (tier.iconType === "image" && tier.iconUrl) {
      return <img src={tier.iconUrl} alt={tier.name} className="mb-1 mx-auto h-8 w-8 object-contain" />;
    }
    return (
      <span className={`mb-1 inline-block text-2xl ${tier.animated ? "animate-candle-flicker" : ""}`}>
        {tier.icon}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
        Leave a tribute for {firstName}
      </h3>
      <p className="mb-5 text-xs text-muted-foreground">Choose the type of tribute — no account required</p>

      <div className={`mb-5 grid grid-cols-2 gap-3 ${tiers.length <= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-4"}`}>
        {tiers.map((tier) => {
          const isSelected = selected.id === tier.id;
          return (
            <button
              key={tier.id} type="button" onClick={() => setSelected(tier)}
              className={`relative rounded-lg border p-3.5 text-center transition-all ${isSelected ? tierSelectedColors[tier.tier] || tierSelectedColors.standard : tierColors[tier.tier] || tierColors.standard}`}
            >
              {tier.tier === "premium" && (
                <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">TOP</span>
              )}
              {renderIcon(tier as any)}
              <p className="text-xs font-medium text-foreground">{tier.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)}`}
              </p>
              {tier.duration && <p className="mt-0.5 text-[10px] text-accent">{tier.duration}</p>}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your name (optional)"
          className="text-sm"
        />
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="Your email for receipt (optional)"
            className="pl-9 text-sm"
          />
        </div>
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a condolence message..." rows={3}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.tier !== "base" && (
              <><span className="mr-1">{typeof selected.icon === "string" && !selected.icon.startsWith("http") ? selected.icon : "🎁"}</span>{selected.name} – ${selected.price.toFixed(2)}</>
            )}
          </p>
          <button
            type="submit" disabled={sending || !message.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {selected.tier === "base" ? "Send" : `Pay $${selected.price.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TributeSelector;
