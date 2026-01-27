import { useState } from "react";
import { Trash2, ExternalLink, Camera, QrCode as QrCodeIcon, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import QRCodeModal from "@/components/QRCodeModal";
import SnapshotModal from "@/components/SnapshotModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const STATUS_CONFIG = {
  READY: {
    label: "Ready",
    variant: "default",
    className: "border-transparent bg-green-500/15 text-green-500 hover:bg-green-500/25",
  },
  QR: {
    label: "QR",
    variant: "default",
    className: "border-transparent bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
  },
  DISCONNECTED: {
    label: "Disconnected",
    variant: "destructive",
    className: "border-transparent bg-red-500/15 text-red-500 hover:bg-red-500/25",
  },
  INIT: {
    label: "Initializing",
    variant: "secondary",
    className: "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25",
  },
  AUTH: {
    label: "Authenticating",
    variant: "secondary",
    className: "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25",
  },
};

export const AccountCard = ({ account, onDelete, onUpdateWebhook, onConnect }) => {
  const [showQR, setShowQR] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [webhookValue, setWebhookValue] = useState(account.webhook_url || "");

  const statusConfig = STATUS_CONFIG[account.status] || STATUS_CONFIG.INIT;

  const handleSaveWebhook = () => {
    onUpdateWebhook(account.id, webhookValue);
    setEditingWebhook(false);
  };

  const handleCancelEdit = () => {
    setWebhookValue(account.webhook_url || "");
    setEditingWebhook(false);
  };

  return (
    <>
      <Card
        data-testid={`account-card-${account.id}`}
        className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-md hover:border-accent/50 transition-all duration-300"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Badge
              data-testid={`account-status-${account.id}`}
              className={`${statusConfig.className} font-semibold`}
            >
              {statusConfig.label}
            </Badge>
            <Button
              data-testid={`delete-account-${account.id}`}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <h3 className="text-xl font-bold mt-3 text-foreground tracking-tight">
            {account.name}
          </h3>
          {account.phone_number && (
            <p className="text-sm text-muted-foreground mt-1">
              {account.phone_number}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
              Webhook URL
            </label>
            {editingWebhook ? (
              <div className="flex gap-2">
                <Input
                  data-testid={`webhook-input-${account.id}`}
                  value={webhookValue}
                  onChange={(e) => setWebhookValue(e.target.value)}
                  placeholder="https://your-webhook.com"
                  className="text-sm"
                />
                <Button
                  data-testid={`save-webhook-${account.id}`}
                  size="icon"
                  className="h-10 w-10 bg-accent hover:bg-accent/90"
                  onClick={handleSaveWebhook}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  data-testid={`cancel-webhook-${account.id}`}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 border border-border">
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {account.webhook_url || "Not configured"}
                </span>
                <Button
                  data-testid={`edit-webhook-${account.id}`}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingWebhook(true)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {account.status === "QR" && account.qr_code && (
              <Button
                data-testid={`show-qr-${account.id}`}
                variant="secondary"
                size="sm"
                className="flex-1 font-medium"
                onClick={() => setShowQR(true)}
              >
                <QrCodeIcon className="w-4 h-4 mr-2" />
                Show QR
              </Button>
            )}
            {account.status === "READY" && (
              <Button
                data-testid={`view-snapshot-${account.id}`}
                variant="secondary"
                size="sm"
                className="w-full font-medium"
                onClick={() => setShowSnapshot(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                View Snapshot
              </Button>
            )}
            {account.webhook_url && (
              <Button
                data-testid={`open-webhook-${account.id}`}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => window.open(account.webhook_url, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        qrCode={account.qr_code}
        accountName={account.name}
      />

      <SnapshotModal
        open={showSnapshot}
        onClose={() => setShowSnapshot(false)}
        accountId={account.id}
        accountName={account.name}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(account.id);
          setShowDeleteDialog(false);
        }}
        accountName={account.name}
      />
    </>
  );
};

export default AccountCard;
