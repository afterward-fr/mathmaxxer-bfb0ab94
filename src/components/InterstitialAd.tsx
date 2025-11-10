import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  autoCloseDelay?: number; // milliseconds before showing close button
}

const InterstitialAd = ({ isOpen, onClose, autoCloseDelay = 5000 }: InterstitialAdProps) => {
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowCloseButton(false);
      
      // Initialize ad when dialog opens with a delay
      const adTimer = setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Ad initialization error:", error);
          }
        }
      }, 100);

      // Show close button after delay
      const closeTimer = setTimeout(() => {
        setShowCloseButton(true);
      }, autoCloseDelay);

      return () => {
        clearTimeout(adTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isOpen, autoCloseDelay]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <div className="relative min-h-[400px] flex flex-col items-center justify-center bg-background/95 backdrop-blur">
          {/* Close button - only shows after delay */}
          {showCloseButton && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50"
            >
              <X className="w-5 h-5" />
            </Button>
          )}

          {/* Ad container */}
          <div className="w-full flex flex-col items-center justify-center p-8">
            <ins
              className="adsbygoogle"
              style={{ 
                display: "block",
                minWidth: "300px",
                minHeight: "250px",
                maxWidth: "728px",
                width: "100%"
              }}
              data-ad-client="ca-pub-4537661693233495"
              data-ad-slot="4851115421"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            
            {/* Countdown text before close button appears */}
            {!showCloseButton && (
              <p className="text-sm text-muted-foreground mt-4">
                Ad will be closeable in {Math.ceil(autoCloseDelay / 1000)} seconds...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterstitialAd;
