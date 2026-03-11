import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Eye, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/SkeletonLoaders";

const MyMemorials = () => {
  const { user } = useAuth();

  const { data: memorials = [], isLoading } = useQuery({
    queryKey: ["my-memorials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorials" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const drafts = memorials.filter((m) => m.is_draft);
  const published = memorials.filter((m) => !m.is_draft);

  const MemorialRow = ({ m }: { m: any }) => {
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ");
    return (
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
        <img
          src={m.image_url || "/placeholder.svg"}
          alt={fullName}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">{fullName}</span>
            {m.is_draft && (
              <Badge variant="outline" className="border-amber-400 text-amber-600 text-[10px]">
                Draft
              </Badge>
            )}
            {m.visibility === "unlisted" && (
              <Badge variant="outline" className="text-[10px]">Unlisted</Badge>
            )}
            {m.visibility === "password" && (
              <Badge variant="outline" className="text-[10px]">🔒</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {m.type === "pet" ? "🐾 Pet" : "🕊️ Human"} · Created{" "}
            {new Date(m.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/memorial/${m.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/memorial/${m.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>My Memorials – Eternal Memory</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">My Memorials</h1>
              <p className="text-sm text-muted-foreground">
                {memorials.length} memorial{memorials.length !== 1 ? "s" : ""} · {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button asChild>
              <Link to="/create">
                <Plus className="mr-1.5 h-4 w-4" /> New Memorial
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : memorials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="mb-1 font-medium text-foreground">No memorials yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first memorial to honor a loved one.
              </p>
              <Button asChild>
                <Link to="/create">Create Memorial</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {drafts.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-600">
                    <FileText className="h-4 w-4" /> Drafts ({drafts.length})
                  </h2>
                  <div className="space-y-2">
                    {drafts.map((m) => (
                      <MemorialRow key={m.id} m={m} />
                    ))}
                  </div>
                </div>
              )}

              {published.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Published ({published.length})
                  </h2>
                  <div className="space-y-2">
                    {published.map((m) => (
                      <MemorialRow key={m.id} m={m} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default MyMemorials;
