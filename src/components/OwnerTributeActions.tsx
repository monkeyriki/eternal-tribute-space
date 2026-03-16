import { Check, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface OwnerTributeActionsProps {
  tributeId: string;
  status: string;
  onActionComplete: () => void;
}

const OwnerTributeActions = ({ tributeId, status, onActionComplete }: OwnerTributeActionsProps) => {
  const handleApprove = async () => {
    const { error } = await supabase
      .from("tributes")
      .update({ status: "approved" })
      .eq("id", tributeId);
    if (error) {
      toast.error("Failed to approve tribute");
    } else {
      toast.success("Tribute approved");
      onActionComplete();
    }
  };

  const handleFlag = async () => {
    const { error } = await supabase
      .from("tributes")
      .update({ status: "flagged" })
      .eq("id", tributeId);
    if (error) {
      toast.error("Failed to flag tribute");
    } else {
      toast.info("Tribute flagged for review");
      onActionComplete();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("tributes")
      .delete()
      .eq("id", tributeId);
    if (error) {
      toast.error("Failed to delete tribute");
    } else {
      toast.success("Tribute deleted");
      onActionComplete();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {(status === "flagged" || status === "pending") && (
        <Button size="icon" variant="ghost" onClick={handleApprove} title="Approve">
          <Check className="h-3.5 w-3.5 text-green-600" />
        </Button>
      )}
      {status === "approved" && (
        <Button size="icon" variant="ghost" onClick={handleFlag} title="Flag">
          <Flag className="h-3.5 w-3.5 text-yellow-600" />
        </Button>
      )}
      <Button size="icon" variant="ghost" onClick={handleDelete} title="Delete">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
};

export default OwnerTributeActions;
