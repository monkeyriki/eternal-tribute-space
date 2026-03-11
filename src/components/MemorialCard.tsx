import { Link } from "react-router-dom";
import { MapPin, Heart, MessageSquare } from "lucide-react";
import { Memorial } from "@/types/memorial";

interface MemorialCardProps {
  memorial: Memorial;
}

const MemorialCard = ({ memorial }: MemorialCardProps) => {
  const lifespan = `${new Date(memorial.birthDate).getFullYear()} – ${new Date(memorial.deathDate).getFullYear()}`;
  const fullName = memorial.lastName
    ? `${memorial.firstName} ${memorial.lastName}`
    : memorial.firstName;

  return (
    <Link
      to={`/memorial/${memorial.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all duration-300 hover:shadow-card"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={memorial.photoUrl} alt={fullName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-1.5">
          {memorial.type === "pet" && <span className="text-sm">🐾</span>}
          <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{fullName}</h3>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">{lifespan}</p>
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /><span>{memorial.location}</span>
        </div>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{memorial.bio}</p>
        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-warm-gold" />{memorial.tributeCount} tributes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />{memorial.guestbookEntries} messages
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MemorialCard;
