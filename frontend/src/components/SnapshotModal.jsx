import { useState } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SnapshotModal = ({ open, onClose, accountId, accountName }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/accounts/${accountId}/snapshot`);
      setSnapshot(response.data.snapshot);
      setTimestamp(new Date(response.data.timestamp).toLocaleString());
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      toast.error("Failed to load snapshot");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen) => {
    if (isOpen && !snapshot) {
      fetchSnapshot();
    }
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        data-testid="snapshot-modal"
        className="sm:max-w-[600px] rounded-xl border border-border bg-background shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            WhatsApp Snapshot
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Current state of {accountName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex flex-col gap-4">
            {loading ? (
              <Skeleton className="w-full h-96 rounded-lg" />
            ) : snapshot ? (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                  <img
                    src={snapshot}
                    alt="WhatsApp Snapshot"
                    className="w-full h-auto"
                    data-testid="snapshot-image"
                  />
                </div>
                {timestamp && (
                  <p className="text-xs text-muted-foreground text-center">
                    Captured at: {timestamp}
                  </p>
                )}
              </>
            ) : (
              <div className="h-96 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                No snapshot available
              </div>
            )}
            <Button
              data-testid="refresh-snapshot"
              variant="secondary"
              onClick={fetchSnapshot}
              disabled={loading}
              className="w-full font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Snapshot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapshotModal;
