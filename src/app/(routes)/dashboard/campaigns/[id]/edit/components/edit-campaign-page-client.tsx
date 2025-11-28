"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CompleteCampaignData,
  type CampaignSegment,
} from "@/app/(routes)/dashboard/campaigns/types";
import { updateCampaign } from "@/app/(routes)/dashboard/campaigns/lib/actions";
import { EditCampaignForm } from "./";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface EditCampaignPageClientProps {
  initialCampaign: CompleteCampaignData & { id: string };
  availableSegments: CampaignSegment[];
}

export function EditCampaignPageClient({
  initialCampaign,
  availableSegments,
}: EditCampaignPageClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // Local storage for auto-save drafts
  const [draft, setDraft, clearDraft] = useLocalStorage<Partial<CompleteCampaignData>>(
    `campaign-draft-${initialCampaign.id}`,
    {}
  );

  // Merge initial campaign with draft on load
  const initialFormData: CompleteCampaignData = {
    ...initialCampaign,
    ...draft,
    // Ensure nested objects are merged correctly
    heroImages: { ...initialCampaign.heroImages, ...draft.heroImages },
    selectedSegments: draft.selectedSegments || initialCampaign.selectedSegments,
    // Ensure scheduleDate is a Date object if it exists
    scheduleDate: draft.scheduleDate
      ? new Date(draft.scheduleDate)
      : initialCampaign.scheduleDate
        ? new Date(initialCampaign.scheduleDate)
        : undefined,
  };

  // useOptimistic for real-time UI updates
  const [optimisticCampaign, addOptimisticCampaign] = useOptimistic(
    initialFormData,
    (state, newValues: Partial<CompleteCampaignData>) => ({
      ...state,
      ...newValues,
      // Special handling for nested objects/arrays
      heroImages: { ...state.heroImages, ...newValues.heroImages },
      selectedSegments: newValues.selectedSegments || state.selectedSegments,
      scheduleDate: newValues.scheduleDate || state.scheduleDate,
    })
  );

  // Use optimisticCampaign directly as formData to avoid circular dependency
  const formData = optimisticCampaign;

  // Auto-save to local storage every 5 seconds
  useEffect(() => {
    const handler = setTimeout(() => {
      if (JSON.stringify(formData) !== JSON.stringify(initialCampaign)) {
        console.log("Auto-saving draft...");
        setDraft(formData);
        toast.info("Campaign draft saved automatically.", {
          duration: 2000,
          id: "auto-save-toast",
        });
      }
    }, 5000);

    return () => clearTimeout(handler);
  }, [formData, initialCampaign, setDraft]);

  // Handle form field changes with optimistic updates
  const handleFormChange = useCallback(
    (newValues: Partial<CompleteCampaignData>) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      const hasChanges = Object.keys(newValues).some((key) => {
        const newValue = newValues[key as keyof CompleteCampaignData];
        const prevValue = formData[key as keyof CompleteCampaignData];
        return JSON.stringify(newValue) !== JSON.stringify(prevValue);
      });

      if (!hasChanges) return;

      startTransition(() => {
        // Apply optimistic update immediately for responsive UI
        addOptimisticCampaign(newValues);
      });
    },
    [addOptimisticCampaign, startTransition, formData]
  );

  // Handle form submission
  const handleSubmit = async (values: CompleteCampaignData) => {
    setIsSubmitting(true);
    setIsSaving(true);
    try {
      // Optimistic update for the submission
      addOptimisticCampaign({ ...values });

      await updateCampaign(initialCampaign.id, values);
      toast.success("Campaign updated successfully!");
      clearDraft(); // Clear draft on successful save
      router.push("/dashboard/campaigns");
      router.refresh(); // Revalidate server data
    } catch (error) {
      console.error("Failed to update campaign:", error);
      toast.error("Failed to update campaign.");
      // Note: useOptimistic will automatically revert on error
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Campaign</h1>
              <p className="text-muted-foreground text-sm">{initialCampaign.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form Section (2/3 width) */}
          <div className="lg:col-span-2">
            <EditCampaignForm
              initialData={formData}
              availableSegments={availableSegments}
              onSubmit={handleSubmit}
              onFormChange={handleFormChange}
              isSaving={isSaving}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Preview Section (1/3 width) */}
          {/* <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center gap-3 mb-3">
                        {formData.companyLogo &&
                          typeof formData.companyLogo === "string" && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              <Image
                                src={formData.companyLogo}
                                alt="Company Logo"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {formData.title || "Notification Title"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Just now
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {formData.message ||
                          "Notification message will appear here..."}
                      </div>
                      {formData.heroImages?.ios &&
                        typeof formData.heroImages.ios === "string" && (
                          <div className="mb-3">
                            <Image
                              src={formData.heroImages.ios}
                              alt="Hero"
                              width={400}
                              height={128}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      {formData.actionButtonText && (
                        <div className="text-xs text-blue-600 font-medium">
                          {formData.actionButtonText}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
