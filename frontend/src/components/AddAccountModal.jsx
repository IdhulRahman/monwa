import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AddAccountModal = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, webhookUrl);
    setName("");
    setWebhookUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        data-testid="add-account-modal"
        className="sm:max-w-[500px] rounded-xl border border-border bg-background shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Add WhatsApp Account
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new WhatsApp account to monitor. You'll receive a QR code to scan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Account Name
              </Label>
              <Input
                id="name"
                data-testid="account-name-input"
                placeholder="e.g., Customer Support Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook" className="text-sm font-medium">
                Webhook URL (Optional)
              </Label>
              <Input
                id="webhook"
                data-testid="webhook-url-input"
                type="url"
                placeholder="https://your-webhook.com/endpoint"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Receive real-time updates about messages and events
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="cancel-add-account"
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-add-account"
              type="submit"
              className="bg-accent hover:bg-accent/90 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountModal;
