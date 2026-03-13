import { Facebook, Mail, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  memorialId?: string;
}

const ShareButtons = ({ url, title, memorialId }: ShareButtonsProps) => {
  // Use OG edge function URL for social sharing so crawlers get proper meta tags.
  // Build the base from the Supabase URL env so it survives project migrations.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const ogUrl =
    memorialId && supabaseUrl
      ? `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/og-memorial?id=${memorialId}`
      : url;
  const encodedOgUrl = encodeURIComponent(ogUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedOgUrl}`, color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]" },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodedTitle}%20${encodedOgUrl}`, color: "hover:bg-[#25D366]/10 hover:text-[#25D366]" },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(url)}`, color: "hover:bg-primary/10 hover:text-primary" },
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
