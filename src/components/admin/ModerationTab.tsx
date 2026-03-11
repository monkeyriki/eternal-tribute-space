import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckCircle, AlertTriangle, Plus, X, Flag } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Link } from "react-router-dom";

const ModerationTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newWord, setNewWord] = useState("");

  const { data: flaggedTributes = [] } = useQuery({
    queryKey: ["admin-flagged-tributes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tributes" as any).select("*, memorials(first_name, last_name)").eq("status", "flagged" as any).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allTributes = [] } = useQuery({
    queryKey: ["admin-all-tributes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tributes" as any).select("*, memorials(first_name, last_name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: profanityWords = [] } = useQuery({
    queryKey: ["profanity_words"],
    queryFn: async () => {
      const { data } = await supabase.from("profanity_words" as any).select("*");
      return (data as any[]) || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error }: any = await (supabase.rpc as any)("admin_approve_tribute", { tribute_id: id });
      if (error) throw new Error("An RPC function is needed to approve. For now, delete inappropriate tributes.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-tributes"] });
      qc.invalidateQueries({ queryKey: ["admin-all-tributes"] });
      toast({ title: "Tribute approved" });
    },
    onError: (e: any) => toast({ title: "Info", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tributes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-tributes"] });
      qc.invalidateQueries({ queryKey: ["admin-all-tributes"] });
      toast({ title: "Tribute deleted" });
    },
  });

  const addWordMutation = useMutation({
    mutationFn: async (word: string) => {
      const { error } = await supabase.from("profanity_words" as any).insert({ word: word.toLowerCase().trim() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profanity_words"] });
      setNewWord("");
      toast({ title: "Word added to filter" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeWordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profanity_words" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profanity_words"] });
      toast({ title: "Word removed" });
    },
  });

  // Memorial reports
  const { data: reports = [] } = useQuery({
    queryKey: ["admin-memorial-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorial_reports" as any)
        .select("*, memorials(first_name, last_name)")
        .eq("status", "pending" as any)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("memorial_reports" as any)
        .update({ status: "resolved" } as any)
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-memorial-reports"] });
      toast({ title: "Report dismissed" });
    },
  });

  const renderTributeTable = (tributes: any[], showApprove: boolean) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Memorial</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tributes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tributes found</TableCell>
            </TableRow>
          ) : (
            tributes.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Badge variant={t.status === "flagged" ? "destructive" : t.status === "approved" ? "default" : "outline"}>
                    {t.status === "flagged" ? "🚩 Flagged" : t.status === "approved" ? "✅ OK" : t.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{t.sender_name}</TableCell>
                <TableCell>{t.memorials ? `${t.memorials.first_name} ${t.memorials.last_name}` : "—"}</TableCell>
                <TableCell className="max-w-[250px] truncate">{t.message || "—"}</TableCell>
                <TableCell>{format(new Date(t.created_at), "dd MMM yyyy", { locale: enUS })}</TableCell>
                <TableCell className="text-right space-x-1">
                  {showApprove && t.status === "flagged" && (
                    <Button size="icon" variant="ghost" onClick={() => approveMutation.mutate(t.id)}>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            <AlertTriangle className="mr-2 inline h-5 w-5 text-destructive" />
            Flagged Queue ({flaggedTributes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTributeTable(flaggedTributes, true)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">All Recent Tributes</CardTitle>
        </CardHeader>
        <CardContent>{renderTributeTable(allTributes, true)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            <Flag className="mr-2 inline h-5 w-5 text-destructive" />
            Reported Memorials ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Memorial</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending reports</TableCell>
                  </TableRow>
                ) : (
                  reports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link to={`/memorial/${r.memorial_id}`} className="font-medium text-primary hover:underline">
                          {r.memorials ? `${r.memorials.first_name} ${r.memorials.last_name}` : r.memorial_id}
                        </Link>
                      </TableCell>
                      <TableCell>{r.reason}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{r.details || "—"}</TableCell>
                      <TableCell>{format(new Date(r.created_at), "dd MMM yyyy", { locale: enUS })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => dismissReportMutation.mutate(r.id)}>
                          Dismiss
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">Profanity Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Add word..." value={newWord} onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newWord.trim() && addWordMutation.mutate(newWord)} />
            <Button onClick={() => newWord.trim() && addWordMutation.mutate(newWord)} disabled={!newWord.trim()}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profanityWords.map((pw: any) => (
              <Badge key={pw.id} variant="secondary" className="gap-1 pr-1">
                {pw.word}
                <button onClick={() => removeWordMutation.mutate(pw.id)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {profanityWords.length === 0 && (
              <p className="text-sm text-muted-foreground">No custom words. The default filter is still active.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationTab;
