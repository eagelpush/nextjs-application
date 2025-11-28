"use client";

import { useState, useEffect } from "react";
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
import { Send, AlertTriangle } from "lucide-react";

interface SendCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  isResend?: boolean;
  estimatedSubscribers?: number;
  onConfirm: () => Promise<void>;
}

export function SendCampaignDialog({
  open,
  onOpenChange,
  campaignTitle,
  isResend = false,
  estimatedSubscribers,
  onConfirm,
}: SendCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            {isResend ? "Send Campaign Again?" : "Send Campaign Now?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;re about to send:{" "}
            <span className="text-foreground font-semibold">
              &quot;{campaignTitle}&quot;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="bg-muted/50 space-y-2 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-green-600">✓</span>
              <span>
                Push notifications will be sent to all subscribers in the
                selected segments
              </span>
            </div>

            {estimatedSubscribers !== undefined && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-blue-600">📊</span>
                <span>
                  Estimated reach:{" "}
                  <strong>
                    {estimatedSubscribers.toLocaleString()} subscribers
                  </strong>
                </span>
              </div>
            )}

            {isResend && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="text-amber-600">
                  This campaign was already sent. Subscribers will receive it
                  again.
                </span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground text-sm">
            {isResend
              ? "Subscribers will receive a new notification, even if they received the previous one."
              : "This action cannot be undone. Make sure your campaign is ready to send."}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {isResend ? "Send Again" : "Send Now"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
