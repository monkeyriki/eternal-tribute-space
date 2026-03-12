import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, Heart, Plus, Upload, Trash2, AlertTriangle, Image, Settings, Loader2 } from "lucide-react";
import { STRIPE_PLANS } from "@/data/stripePlans";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

const B2B_FREE_LIMIT = 5;
/** Max rows per CSV import to avoid DB/timeout overload. */
const B2B_IMPORT_MAX_ROWS = 200;

const B2BDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: memorials = [], isLoading } = useQuery({
    queryKey: ["b2b-memorials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("memorials").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Load partner's branding logo from their first memorial or stored preference
  useQuery({
    queryKey: ["b2b-logo", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("memorials").select("b2b_logo_url").eq("user_id", user!.id).neq("b2b_logo_url", "").limit(1);
      if (data?.[0]?.b2b_logo_url) setLogoUrl(data[0].b2b_logo_url);
      return data;
    },
    enabled: !!user,
  });

  const { data: tributeCounts = {} } = useQuery({
    queryKey: ["b2b-tribute-counts", user?.id],
    queryFn: async () => {
      const ids = memorials.map((m) => m.id);
      if (ids.length === 0) return {};
      const { data, error } = await supabase.from("tributes").select("memorial_id").in("memorial_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((t) => { counts[t.memorial_id] = (counts[t.memorial_id] || 0) + 1; });
      return counts;
    },
    enabled: memorials.length > 0,
  });

  const { data: viewCounts = {} } = useQuery({
    queryKey: ["b2b-view-counts", user?.id],
    queryFn: async () => {
      const ids = memorials.map((m) => m.id);
      if (ids.length === 0) return {};
      const { data, error } = await supabase.from("memorial_views").select("memorial_id").in("memorial_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((v) => { counts[v.memorial_id] = (counts[v.memorial_id] || 0) + 1; });
      return counts;
    },
    enabled: memorials.length > 0,
  });

  const totalMemorials = memorials.length;
  const totalTributes = Object.values(tributeCounts).reduce((sum, c) => sum + c, 0);
  const totalViews = Object.values(viewCounts).reduce((sum, c) => sum + c, 0);
  const publishedCount = memorials.filter((m) => !m.is_draft).length;
  const { subscribed: hasSubscription, plan, subscriptionEnd } = useSubscription();
  const isAtLimit = !hasSubscription && totalMemorials >= B2B_FREE_LIMIT;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("memorials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b-memorials"] });
      toast({ title: "Memorial deleted" });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `b2b-logos/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("memorial-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("memorial-images").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    setLogoUrl(newUrl);

    // Update all existing memorials with new logo
    await supabase.from("memorials" as any).update({ b2b_logo_url: newUrl } as any).eq("user_id", user.id);
    toast({ title: "Agency logo updated on all memorials" });
    queryClient.invalidateQueries({ queryKey: ["b2b-memorials"] });
  };

  const handleImport = async () => {
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      toast({ title: "Empty or invalid CSV format", variant: "destructive" });
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const allRows = lines.slice(1);
    const rows = allRows.slice(0, B2B_IMPORT_MAX_ROWS);
    if (allRows.length > B2B_IMPORT_MAX_ROWS) {
      toast({
        title: "Import capped",
        description: `Only the first ${B2B_IMPORT_MAX_ROWS} rows are imported per request. Import the rest in another run.`,
        variant: "default",
      });
    }

    if (!hasSubscription && totalMemorials + rows.length > B2B_FREE_LIMIT) {
      toast({
        title: "Subscription required",
        description: `Free plan allows ${B2B_FREE_LIMIT} memorials. Upgrade to import more.`,
        variant: "destructive",
      });
      return;
    }

    let imported = 0;
    for (const row of rows) {
      const cols = row.split(",").map((c) => c.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, i) => (record[h] = cols[i] || ""));
      const { error } = await supabase.from("memorials" as any).insert({
        user_id: user!.id,
        first_name: record["first_name"] || record["nome"] || "",
        last_name: record["last_name"] || record["cognome"] || "",
        birth_date: record["birth_date"] || record["data_nascita"] || null,
        death_date: record["death_date"] || record["data_morte"] || null,
        bio: record["bio"] || "",
        type: record["type"] || record["tipo"] || "human",
        is_draft: true,
        visibility: "public",
        b2b_logo_url: logoUrl,
      } as any);
      if (!error) imported++;
    }
    toast({ title: `${imported} memorials imported as drafts` });
    setCsvData("");
    setImportDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["b2b-memorials"] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvData(ev.target?.result as string); };
    reader.readAsText(file);
  };

  const handleNewMemorial = () => {
    if (isAtLimit) {
      toast({
        title: "Memorial limit reached",
        description: `Free plan allows ${B2B_FREE_LIMIT} memorials. Upgrade your subscription to create more.`,
        variant: "destructive",
      });
      return;
    }
    window.location.href = "/create";
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Not authenticated", variant: "destructive" }); return; }
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || !data?.url) throw new Error(data?.error || "Failed to open portal");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <Helmet><title>B2B Dashboard — Eternal Memory</title></Helmet>
      <div className="container mx-auto py-10 px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Partner Dashboard</h1>
            <p className="text-muted-foreground font-sans">Manage your agency's memorials</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {hasSubscription ? (
              <Button variant="outline" onClick={handleManageSubscription}>
                <Settings className="mr-2 h-4 w-4" />Manage Subscription
              </Button>
            ) : (
              <Button variant="outline" onClick={() => (window.location.href = "/pricing")}>
                <Settings className="mr-2 h-4 w-4" />Upgrade Plan
              </Button>
            )}
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Import CSV
            </Button>
            <Button onClick={handleNewMemorial}>
              <Plus className="mr-2 h-4 w-4" />New Memorial
            </Button>
          </div>
        </div>

        {/* Subscription gate banner */}
        {isAtLimit && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Free plan limit reached ({B2B_FREE_LIMIT} memorials)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to a B2B subscription to create unlimited memorials.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={upgradeLoading}
                onClick={async () => {
                  setUpgradeLoading(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error("Not authenticated");
                    const { data, error } = await supabase.functions.invoke("create-plan-checkout", {
                      headers: { Authorization: `Bearer ${session.access_token}` },
                      body: { price_id: "price_1T8nf5BA2gyBJFRKmWSl8tnh", mode: "subscription" },
                    });
                    if (error) throw error;
                    if (data?.url) { window.location.href = data.url; return; }
                    throw new Error("No checkout URL");
                  } catch (err: any) {
                    sonnerToast.error("Failed to start checkout", { description: err.message });
                  } finally {
                    setUpgradeLoading(false);
                  }
                }}
              >
                {upgradeLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Total Memorials</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalMemorials}</div>
              <p className="text-xs text-muted-foreground mt-1">{publishedCount} published</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalViews}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time page views</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Tributes Received</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalTributes}</div>
            </CardContent>
          </Card>
        </div>

        {/* B2B Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Agency Branding</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Agency logo" className="h-12 max-w-[160px] rounded border border-border object-contain p-1" />
            ) : (
              <div className="flex h-12 w-32 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <div>
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                <Image className="mr-2 h-3.5 w-3.5" />
                {logoUrl ? "Change Logo" : "Upload Logo"}
              </Button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <p className="mt-1 text-xs text-muted-foreground">Displayed on all your memorials</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Your Memorials</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : memorials.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No memorials created. Use the "New Memorial" button or import a CSV.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tributes</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memorials.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                        <TableCell><Badge variant="secondary">{m.type}</Badge></TableCell>
                        <TableCell>
                          {m.is_draft ? (
                            <Badge variant="outline">Draft</Badge>
                          ) : (
                            <Badge className="bg-primary text-primary-foreground">Published</Badge>
                          )}
                        </TableCell>
                        <TableCell>{tributeCounts[m.id] || 0}</TableCell>
                        <TableCell>{viewCounts[m.id] || 0}</TableCell>
                        <TableCell>{format(new Date(m.created_at), "dd MMM yyyy", { locale: enUS })}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => (window.location.href = `/memorial/${m.id}`)} aria-label={`View ${m.first_name} ${m.last_name}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" aria-label={`Delete ${m.first_name} ${m.last_name}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete memorial?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {m.first_name} {m.last_name}'s memorial and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(m.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Memorials from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: first_name, last_name, birth_date (YYYY-MM-DD), death_date, bio, type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>CSV File</Label>
              <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} />
            </div>
            <div>
              <Label>Or paste CSV content</Label>
              <Textarea value={csvData} onChange={(e) => setCsvData(e.target.value)}
                placeholder="first_name,last_name,birth_date,death_date,bio,type" rows={6} />
            </div>
            <Button onClick={handleImport} disabled={!csvData.trim()}>Import</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default B2BDashboard;
