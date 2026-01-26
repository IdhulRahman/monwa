import { Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyState = ({ onAddAccount }) => {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Smartphone className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3">
        No Accounts Yet
      </h2>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        Get started by adding your first WhatsApp account to monitor.
        You'll be able to track messages, receive webhooks, and capture snapshots.
      </p>
      <Button
        data-testid="empty-state-add-button"
        onClick={onAddAccount}
        size="lg"
        className="bg-accent hover:bg-accent/90 text-white font-medium h-12 px-8"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Account
      </Button>
    </div>
  );
};

export default EmptyState;
