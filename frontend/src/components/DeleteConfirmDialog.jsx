import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const DeleteConfirmDialog = ({ open, onClose, onConfirm, accountName }) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        data-testid="delete-confirm-dialog"
        className="rounded-xl border border-border bg-background shadow-2xl"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight">
              Delete Account
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-base">
            Are you sure you want to delete <span className="font-semibold text-foreground">{accountName}</span>?
            This action cannot be undone and all associated data will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-delete"
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
