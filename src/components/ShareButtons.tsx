import { Facebook, Mail, MessageCircle, Twitter } from "lucide-react";

// Fallback for og-memorial base URL when VITE_SUPABASE_URL is not set (Bug #7). Must match your Supabase project URL.
const DEFAULT_SUPABASE_URL = "https://mfzufzajsybdgdlhjkie.supabase.co";

interface ShareButtonsProps {
  url: string;
  title: string;
  memorialId?: string;
}

const ShareButtons = ({ url, title, memorialId }: ShareButtonsProps) => {
  // Bug #7: Facebook (and social) must get the og-memorial URL so the preview shows the memorial, not generic site.
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL || "";
  const ogUrl =
    memorialId && supabaseUrl
      ? `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/og-memorial?id=${memorialId}`
      : url;

  // Bug #6: Email must use the app URL so the recipient opens the web app, not the OG HTML page.
  const appUrl =
    memorialId && typeof window !== "undefined"
      ? `${window.location.origin.replace(/\/+$/, "")}/memorial/${memorialId}`
      : url;
  const encodedOgUrl = encodeURIComponent(ogUrl);
  const encodedAppUrl = encodeURIComponent(appUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedOgUrl}`, color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]" },
    { label: "X", icon: Twitter, href: `https://x.com/intent/tweet?url=${encodedOgUrl}&text=${encodedTitle}`, color: "hover:bg-foreground/10 hover:text-foreground" },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodedTitle}%20${encodedOgUrl}`, color: "hover:bg-[#25D366]/10 hover:text-[#25D366]" },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedAppUrl}`, color: "hover:bg-primary/10 hover:text-primary" },
  ];

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
          title={`Share on ${link.label}`}
          className={`flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors ${link.color}`}
        >
          <link.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{link.label}</span>
        </a>
      ))}
    </div>
  );
};

export default ShareButtons;
