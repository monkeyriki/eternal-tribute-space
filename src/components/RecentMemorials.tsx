import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { value: "125,000+", label: "Families" },
  { value: "45,000,000+", label: "Visitors" },
  { value: "2,500,000+", label: "Tributes" },
];

const RecentMemorials = () => {
  const { data: recentMemorials = [], isLoading } = useQuery({
    queryKey: ["recent-memorials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorials")
        .select("id, first_name, last_name, birth_date, death_date, location, image_url, type")
        .eq("visibility", "public")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <section id="memorials" className="py-20 bg-background">
      <div className="container px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-12 uppercase tracking-wide">
          Recent Memorials
        </h2>

        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 place-items-stretch">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden shadow-soft animate-pulse flex flex-col">
                    <div className="aspect-[3/4] bg-muted shrink-0" />
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-center">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </div>
                  </div>
                ))
              : recentMemorials.map((m) => {
                  const fullName = `${m.first_name} ${m.last_name || ""}`.trim();
                  const lifespan =
                    m.birth_date && m.death_date
                      ? `${new Date(m.birth_date).getFullYear()} – ${new Date(m.death_date).getFullYear()}`
                      : "";

                  return (
                    <Link
                      key={m.id}
                      to={`/memorial/${m.id}`}
                      className="group bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-shadow flex flex-col h-full"
                    >
                      <div className="aspect-[3/4] bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                        {m.image_url ? (
                          <img
                            src={m.image_url}
                            alt={fullName}
                            className="max-h-full max-w-full w-auto h-auto object-contain object-center"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-5xl text-muted-foreground/30 font-display">
                            {m.first_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="p-4 text-center flex-1 flex flex-col justify-center min-h-[88px]">
                        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                          {fullName}
                        </h3>
                        {lifespan && (
                          <p className="text-sm text-muted-foreground mt-0.5">{lifespan}</p>
                        )}
                        {m.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">{m.location}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>

        {!isLoading && recentMemorials.length === 0 && (
          <p className="text-center text-muted-foreground mb-12">
            No memorials yet. Be the first to create one!
          </p>
        )}

        <div className="bg-card rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              Our Community
            </h3>
            <div className="flex gap-8 mt-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/directory/human"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Explore all memorials <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentMemorials;
