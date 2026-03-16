import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Ban, Shield, Users } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useState } from "react";

const UsersTab = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [banDialog, setBanDialog] = useState<{ open: boolean; email: string }>({ open: false, email: "" });
  const [banReason, setBanReason] = useState("");
  const [banIpAddress, setBanIpAddress] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bannedUsers = [], isError: bannedUsersError } = useQuery({
    queryKey: ["banned_users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banned_users").select("*").order("banned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Role updated" });
    },
    onError: (err: unknown) => toast({ title: "Error", description: getFriendlyErrorMessage(err), variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async ({ email, reason, ip_address }: { email: string; reason: string; ip_address?: string }) => {
      const { error } = await supabase.from("banned_users").insert({ email, reason, ip_address: ip_address || null });
      if (error) throw error;
    },
    onSuccess: () => {
      try {
        setBanDialog({ open: false, email: "" });
        setBanReason("");
        setBanIpAddress("");
        toast({ title: "User banned" });
        qc.invalidateQueries({ queryKey: ["banned_users"] });
      } catch (e) {
        toast({ title: "Error", description: "Something went wrong after banning.", variant: "destructive" });
      }
    },
    onError: (e: unknown) => toast({ title: "Error", description: getFriendlyErrorMessage(e), variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banned_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banned_users"] });
      toast({ title: "Ban removed" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans"><Users className="mr-2 inline h-5 w-5" />User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.role === "admin" ? "default" : p.role === "b2b_partner" ? "secondary" : "outline"}>{p.role}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(p.created_at), "dd MMM yyyy", { locale: enUS })}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Select defaultValue={p.role} onValueChange={(val) => changeRoleMutation.mutate({ userId: p.id, newRole: val })}>
                          <SelectTrigger className="w-[140px] inline-flex"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="b2b_partner">B2B Partner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setBanDialog({ open: true, email: p.email || "" })}
                          >
                            <Ban className="mr-1 h-3 w-3" /> Ban
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            <Shield className="mr-2 inline h-5 w-5 text-destructive" />Banned Users ({bannedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bannedUsersError ? (
            <p className="text-center text-muted-foreground py-4">Unable to load banned users list.</p>
          ) : bannedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No banned users</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Email</TableHead>
                     <TableHead>IP Address</TableHead>
                     <TableHead>Reason</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedUsers.map((b) => (
                     <TableRow key={b.id}>
                       <TableCell className="font-medium">{b.email || "—"}</TableCell>
                       <TableCell>{b.ip_address || "—"}</TableCell>
                       <TableCell>{b.reason || "—"}</TableCell>
                       <TableCell>{format(new Date(b.banned_at ?? Date.now()), "dd MMM yyyy", { locale: enUS })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => unbanMutation.mutate(b.id)}>Remove Ban</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={banDialog.open} onOpenChange={(o) => setBanDialog({ ...banDialog, open: o })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ban User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Email to ban</label>
              <Input value={banDialog.email} onChange={(e) => setBanDialog((d) => ({ ...d, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for ban..." />
            </div>
            <div>
              <label className="text-sm font-medium">IP Address (optional)</label>
              <Input value={banIpAddress} onChange={(e) => setBanIpAddress(e.target.value)} placeholder="e.g. 192.168.1.1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ open: false, email: "" })}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!banDialog.email?.trim()) return;
                const emailToBan = banDialog.email.trim().toLowerCase();
                if (currentUser?.email && emailToBan === currentUser.email.toLowerCase()) {
                  toast({ title: "Cannot ban yourself", description: "You cannot ban your own account.", variant: "destructive" });
                  return;
                }
                banMutation.mutate({ email: banDialog.email.trim(), reason: banReason, ip_address: banIpAddress });
              }}
            >
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;
