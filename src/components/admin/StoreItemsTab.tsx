import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type StoreItem = Tables<"store_items">;

const emptyItem: Omit<StoreItem, "id" | "created_at"> = {
  name: "", price: 0, category: "tribute", icon_url: "", emoji: "🕯️",
  type: "emoji", tier: "standard", is_active: true,
};

const StoreItemsTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["store_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: typeof form & { id?: string }) => {
      if (item.id) {
        const { error } = await supabase.from("store_items").update(item).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_items").insert(item);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_items"] });
      setDialogOpen(false);
      toast({ title: editing ? "Item updated" : "Item created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_items"] });
      toast({ title: "Item deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("store_items").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store_items"] }),
  });

  const openCreate = () => { setEditing(null); setForm(emptyItem); setDialogOpen(true); };
  const openEdit = (item: StoreItem) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, category: item.category, icon_url: item.icon_url, emoji: item.emoji, type: item.type, tier: item.tier, is_active: item.is_active });
    setDialogOpen(true);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `icons/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("store-items").upload(path, file);
    if (error) {
      toast({ title: "Upload error", description: getFriendlyErrorMessage(error, "image_upload"), variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("store-items").getPublicUrl(path);
    setForm((f) => ({ ...f, icon_url: urlData.publicUrl, type: "image" }));
    setUploading(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-sans">
          <Package className="mr-2 inline h-5 w-5" />Store Items Management
        </CardTitle>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> New</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No items. Create one!</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.type === "image" && item.icon_url ? (
                        <img src={item.icon_url} alt={item.name} className="h-8 w-8 object-contain" />
                      ) : (<span className="text-2xl">{item.emoji}</span>)}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={item.tier === "premium" ? "default" : "outline"}>{item.tier}</Badge></TableCell>
                    <TableCell><Switch checked={item.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base (Free)</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icon Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emoji">Emoji</SelectItem>
                  <SelectItem value="image">Image (SVG/PNG)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "emoji" ? (
              <div><Label>Emoji</Label><Input value={form.emoji || ""} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} className="text-2xl" /></div>
            ) : (
              <div>
                <Label>Upload Icon (SVG/PNG)</Label>
                <Input type="file" accept=".svg,.png,.jpg,.webp" onChange={handleIconUpload} disabled={uploading} />
                {form.icon_url && <img src={form.icon_url} alt="Preview" className="mt-2 h-12 w-12 object-contain rounded border border-border" />}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StoreItemsTab;
