"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCampaign, duplicateCampaign } from "../lib/actions";

interface UseCampaignActionsReturn {
  handleEdit: (id: string) => void;
  handleDuplicate: (id: string) => void;
  handleDelete: (id: string) => void;
  handleExport: () => void;
  handleSend: (id: string, title: string, status?: string) => void;
  confirmSend: () => Promise<void>;
  cancelSend: () => void;
  sendDialogOpen: boolean;
  sendDialogData: { id: string; title: string; isResend: boolean } | null;
  isPending: boolean;
}

export function useCampaignActions(): UseCampaignActionsReturn {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogData, setSendDialogData] = useState<{
    id: string;
    title: string;
    isResend: boolean;
  } | null>(null);

  const handleEdit = useCallback(
    (campaignId: string) => {
      // Navigate to edit page
      router.push(`/dashboard/campaigns/${campaignId}/edit`);
    },
    [router]
  );

  const handleDuplicate = useCallback(
    async (campaignId: string) => {
      try {
        startTransition(async () => {
          await duplicateCampaign(campaignId);
          toast.success("Campaign duplicated successfully");
          router.refresh();
        });
      } catch (error) {
        console.error("Error duplicating campaign:", error);
        toast.error("Failed to duplicate campaign. Please try again.");
      }
    },
    [router]
  );

  const handleDelete = useCallback(
    async (campaignId: string) => {
      // Show confirmation dialog
      const confirmed = window.confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      );

      if (!confirmed) return;

      try {
        startTransition(async () => {
          await deleteCampaign(campaignId);
          toast.success("Campaign deleted successfully");
          router.refresh();
        });
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign. Please try again.");
      }
    },
    [router]
  );

  const handleExport = useCallback(() => {
    // CSV export functionality - planned for v2.0
    toast.info("Export functionality coming soon!");
  }, []);

  const handleSend = useCallback(
    (campaignId: string, campaignTitle: string, status: string = "draft") => {
      console.log("🚀 [handleSend] Called with:", {
        campaignId,
        campaignTitle,
        status,
      });

      // Open confirmation dialog
      setSendDialogData({
        id: campaignId,
        title: campaignTitle,
        isResend: status === "sent",
      });
      setSendDialogOpen(true);
    },
    []
  );

  const confirmSend = useCallback(async () => {
    if (!sendDialogData) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: campaignId, title: _campaignTitle } = sendDialogData;
    console.log("✅ [confirmSend] User confirmed, starting send...");

    try {
      console.log("📤 [confirmSend] Showing loading toast...");
      toast.loading("Sending campaign...", { id: campaignId });

      console.log(`📡 [confirmSend] Fetching: /api/campaigns/${campaignId}/send`);
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      console.log("📥 [confirmSend] Response status:", response.status);
      const result = await response.json();
      console.log("📥 [confirmSend] Response data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to send campaign");
      }

      console.log("✅ [confirmSend] Send successful!");
      toast.success(
        `Campaign sent successfully to ${result.sentCount.toLocaleString()} subscribers!`,
        {
          id: campaignId,
          description: result.failedCount > 0 ? `${result.failedCount} sends failed` : undefined,
          duration: 5000,
        }
      );

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 4000 });
        });
      }

      console.log("🔄 [confirmSend] Refreshing page...");
      router.refresh();
    } catch (error) {
      console.error("❌ [confirmSend] Campaign send error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send campaign", {
        id: campaignId,
        duration: 5000,
      });
    }
  }, [sendDialogData, router]);

  const cancelSend = useCallback(() => {
    console.log("❌ [cancelSend] User cancelled");
    setSendDialogOpen(false);
    setSendDialogData(null);
  }, []);

  return {
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleExport,
    handleSend,
    confirmSend,
    cancelSend,
    sendDialogOpen,
    sendDialogData,
    isPending,
  };
}
