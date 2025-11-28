"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NewSegmentForm } from "../components/new-segment-form";
import { createSegment } from "../lib/actions";
import type { NewSegmentFormValues } from "../utils/form-schema";

export default function NewSegmentPage() {
  const router = useRouter();

  const handleSave = async (data: NewSegmentFormValues) => {
    try {
      await createSegment(data);
      toast.success("Segment created successfully!");
      router.push("/dashboard/segments");
    } catch (error) {
      console.error("Error creating segment:", error);
      toast.error("Failed to create segment. Please try again.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return <NewSegmentForm onSave={handleSave} onCancel={handleCancel} />;
}
