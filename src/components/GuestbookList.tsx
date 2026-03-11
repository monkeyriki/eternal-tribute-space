import { motion } from "framer-motion";
import { tributeTiers } from "@/data/tributeTiers";
import { Badge } from "@/components/ui/badge";
import OwnerTributeActions from "@/components/OwnerTributeActions";

interface TributeEntry {
  id: string;
  sender_name: string;
  message: string | null;
  item_type: string | null;
  tier: string;
  is_paid: boolean;
  created_at: string;
  expires_at: string | null;
  status?: string;
}

interface GuestbookListProps {
  tributes: TributeEntry[];
  isOwner?: boolean;
  onTributeModerated?: () => void;
}

const tierIcon = (itemType: string | null): string | null => {
  if (!itemType || itemType === "message" || itemType === "Message") return null;
  const found = tributeTiers.find((t) => t.name === itemType);
  return found?.icon || null;
};

const tierOrder = (tier: string): number => {
  if (tier === "premium") return 0;
  if (tier === "standard") return 1;
  return 2;
};

const getPremiumDaysLeft = (createdAt: string): number => {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const GuestbookList = ({ tributes, isOwner = false, onTributeModerated }: GuestbookListProps) => {
  // Owners see all tributes; guests don't see flagged or pending
  const visible = isOwner ? tributes : tributes.filter((t) => t.status !== "flagged" && t.status !== "pending");

  const pendingTributes = isOwner ? tributes.filter((t) => t.status === "pending") : [];
  const nonPending = visible.filter((t) => t.status !== "pending");

  const sorted = [...nonPending].sort((a, b) => {
    const aOrder = tierOrder(a.tier);
    const bOrder = tierOrder(b.tier);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const flaggedCount = tributes.filter((t) => t.status === "flagged").length;

  if (sorted.length === 0 && pendingTributes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No messages yet. Be the first to leave a tribute.
      </p>
    );
  }

  const renderTribute = (entry: TributeEntry, i: number) => {
    const icon = tierIcon(entry.item_type);
    const isFlagged = entry.status === "flagged";
    const isPending = entry.status === "pending";

    const isPremium = entry.tier === "premium" && entry.is_paid;
    const premiumDaysLeft = isPremium ? getPremiumDaysLeft(entry.created_at) : 0;
    const isPremiumActive = isPremium && premiumDaysLeft > 0;

    const isStandard = entry.tier === "standard";

    let cardClasses = "rounded-lg border p-4 shadow-soft";
    if (isFlagged) {
      cardClasses += " border-yellow-300 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-950/20";
    } else if (isPending) {
      cardClasses += " border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20";
    } else if (isPremiumActive) {
      cardClasses += " border-amber-400 bg-amber-50/30 dark:bg-amber-950/10";
    } else {
      cardClasses += " border-border bg-card";
    }

    return (
      <motion.div
        key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className={cardClasses}
        style={isPremiumActive ? { boxShadow: "0 0 16px 2px rgba(251, 191, 36, 0.18)" } : undefined}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {icon && <span className={isPremiumActive ? "animate-candle-flicker text-lg" : "text-lg"}>{icon}</span>}
            {entry.sender_name}
            {isPremiumActive && (
              <Badge variant="outline" className="ml-1 border-amber-400 bg-amber-50 text-amber-700 text-[10px] dark:bg-amber-950/30 dark:text-amber-300">
                🕯️ Lit Candle
              </Badge>
            )}
            {isStandard && icon && (
              <Badge variant="outline" className="ml-1 text-[10px]">
                {icon} {entry.item_type}
              </Badge>
            )}
            {isFlagged && isOwner && (
              <Badge variant="outline" className="ml-1 border-yellow-400 text-yellow-700 text-[10px]">Flagged</Badge>
            )}
            {isPending && isOwner && (
              <Badge variant="outline" className="ml-1 border-blue-400 text-blue-700 text-[10px]">Pending</Badge>
            )}
          </span>
          <div className="flex items-center gap-2">
            {isPremiumActive && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                🔥 Lit for {premiumDaysLeft} more day{premiumDaysLeft !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(entry.created_at).toLocaleDateString("en-US")}
            </span>
            {isOwner && onTributeModerated && (
              <OwnerTributeActions
                tributeId={entry.id}
                status={entry.status || "approved"}
                onActionComplete={onTributeModerated}
              />
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{entry.message}</p>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {isOwner && flaggedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 dark:border-yellow-700 dark:bg-yellow-950/30">
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ {flaggedCount} tribute{flaggedCount > 1 ? "s" : ""} pending review
          </span>
        </div>
      )}
      {isOwner && pendingTributes.length > 0 && (
        <>
          <div className="flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 dark:border-blue-700 dark:bg-blue-950/30">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🕐 {pendingTributes.length} tribute{pendingTributes.length > 1 ? "s" : ""} awaiting your approval
            </span>
          </div>
          {pendingTributes.map((entry, i) => renderTribute(entry, i))}
        </>
      )}
      {sorted.map((entry, i) => renderTribute(entry, i))}
    </div>
  );
};

export default GuestbookList;
