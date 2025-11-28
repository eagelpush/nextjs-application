"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CampaignEditorForm } from "@/app/(routes)/dashboard/campaigns/new/editor/components/campaign-editor-form";
import { updateCampaign } from "@/app/(routes)/dashboard/campaigns/lib/actions";
import {
  CompleteCampaignData,
  CampaignSegment,
} from "@/app/(routes)/dashboard/campaigns/types";

interface SimpleEditPageClientProps {
  initialCampaign: CompleteCampaignData & { id: string };
  availableSegments: CampaignSegment[];
}

export function SimpleEditPageClient({
  initialCampaign,
  availableSegments,
}: SimpleEditPageClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [formData, setFormData] =
    useState<CompleteCampaignData>(initialCampaign);

  const handleFormChange = (newValues: Partial<CompleteCampaignData>) => {
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        ...newValues,
      }));
    });
  };

  const handleSubmit = async (values: CompleteCampaignData) => {
    try {
      await updateCampaign(initialCampaign.id, values);
      router.push("/dashboard/campaigns");
      router.refresh();
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  // Transform the campaign data to match the form's expected structure
  const step1Data = {
    sendingOption: formData.sendingOption || "schedule",
    scheduleDate: formData.scheduleDate,
    campaignType: formData.campaignType || "regular",
    selectedSegments: formData.selectedSegments || [],
    smartDelivery: formData.smartDelivery || false,
  };

  return (
    <CampaignEditorForm
      step1Data={step1Data}
      isEditMode={true}
      initialData={formData}
      availableSegments={availableSegments}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
    />
  );
}
