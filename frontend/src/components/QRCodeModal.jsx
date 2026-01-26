import { Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const QRCodeModal = ({ open, onClose, qrCode, accountName }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        data-testid="qr-code-modal"
        className="sm:max-w-[500px] rounded-xl border border-border bg-background shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Scan QR Code
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Connect {accountName} to WhatsApp
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="flex flex-col items-center gap-6">
            {qrCode ? (
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64"
                  data-testid="qr-code-image"
                />
              </div>
            ) : (
              <div className="w-72 h-72 bg-muted/20 rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground">Loading QR code...</span>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm text-muted-foreground max-w-md">
              <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0 text-accent" />
              <div>
                <p className="font-medium text-foreground mb-1">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open WhatsApp on your phone</li>
                  <li>Tap Menu or Settings and select Linked Devices</li>
                  <li>Tap Link a Device</li>
                  <li>Point your phone at this screen to scan the code</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
