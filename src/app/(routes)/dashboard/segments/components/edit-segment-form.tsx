"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NewSegmentForm } from "./new-segment-form";
import type { Segment } from "../types";
import type { NewSegmentFormValues } from "../utils/form-schema";
import { updateSegment } from "../lib/actions";

interface EditSegmentFormProps {
  segment: Segment;
}

export function EditSegmentForm({ segment }: EditSegmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: NewSegmentFormValues) => {
    setIsLoading(true);
    try {
      await updateSegment(segment.id, data);
      toast.success("Segment updated successfully!");
      router.push("/dashboard/segments");
    } catch (error) {
      console.error("Error updating segment:", error);
      toast.error("Failed to update segment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <NewSegmentForm
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={isLoading}
      initialData={segment}
    />
  );
}
