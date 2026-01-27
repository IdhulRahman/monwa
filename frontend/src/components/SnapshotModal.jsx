import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SnapshotModal = ({ open, onClose, accountId, accountName }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let progressInterval;
    if (loading) {
      setLoadingProgress(0);
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 5;
        });
      }, 150);
    } else {
      setLoadingProgress(0);
    }
    return () => clearInterval(progressInterval);
  }, [loading]);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      const response = await axios.get(`${API}/accounts/${accountId}/snapshot`);
      setLoadingProgress(100);
      setTimeout(() => {
        setSnapshot(response.data.snapshot);
        setTimestamp(new Date(response.data.timestamp).toLocaleString());
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      const message = error.response?.data?.error || "Failed to load snapshot";
      toast.error(message);
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
        className="sm:max-w-[700px] rounded-xl border border-border bg-background shadow-2xl"
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
              <div className="relative w-full h-96 rounded-lg border border-border bg-card overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-accent animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-accent/20 rounded-full"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-foreground">
                      Capturing WhatsApp state...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taking screenshot from active session
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {loadingProgress}% complete
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 shimmer-effect"></div>
              </div>
            ) : snapshot ? (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20 snapshot-fade-in">
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Snapshot
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapshotModal;
