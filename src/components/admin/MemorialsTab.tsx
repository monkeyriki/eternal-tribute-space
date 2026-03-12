import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookOpen, Trash2, Eye, EyeOff, Pencil, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MemorialsTab = () => {
  const queryClient = useQueryClient();

  const { data: memorials = [], isLoading } = useQuery({
    queryKey: ["admin-memorials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorials")
        .select("id, first_name, last_name, type, plan, visibility, is_draft, created_at, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("tributes").delete().eq("memorial_id", id);
      await supabase.from("memorial_images").delete().eq("memorial_id", id);
      const { error } = await supabase.from("memorials").delete().eq("id", id);
      if (error) throw error;
      toast.success("Memorial deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-memorials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-memorial-count"] });
    } catch {
      toast.error("Failed to delete memorial");
    }
  };

  const handleToggleDraft = async (id: string, currentDraft: boolean) => {
    const { error } = await supabase
      .from("memorials")
      .update({ is_draft: !currentDraft })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(currentDraft ? "Published" : "Unpublished");
      queryClient.invalidateQueries({ queryKey: ["admin-memorials"] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-sans">
          <BookOpen className="mr-2 inline h-5 w-5" />
          All Memorials ({memorials.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : memorials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No memorials yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memorials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link to={`/memorial/${m.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                        {m.first_name} {m.last_name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.plan === "free" ? "secondary" : "default"}>
                        {m.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.is_draft ? "secondary" : "default"} className={!m.is_draft ? "bg-green-600 text-white" : ""}>
                        {m.is_draft ? "Draft" : "Published"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.visibility}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Edit memorial">
                          <Link to={`/memorial/${m.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="View memorial">
                          <Link to={`/memorial/${m.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={m.is_draft ? "Publish" : "Unpublish"}
                          onClick={() => handleToggleDraft(m.id, m.is_draft)}
                        >
                          {m.is_draft ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                                onClick={() => handleDelete(m.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemorialsTab;
