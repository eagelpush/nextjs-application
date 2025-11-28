"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SegmentsHeader } from "./segments-header";
import { AudienceBanner } from "./audience-banner";
import { SegmentsTable } from "./segments-table";
import { AttributesTable } from "./attributes-table";
import { AddAttributeDialog } from "./add-attribute-dialog";
import { SegmentsErrorBoundary } from "./segments-error-boundary";
import type { SegmentsDashboardData, Segment, CustomAttribute } from "../types";
import type { NewAttributeFormValues } from "../utils/attribute-schema";
import {
  deleteSegment,
  duplicateSegment,
  toggleSegmentStatus,
  createCustomAttribute,
  deleteCustomAttribute,
} from "../lib/actions";

interface SegmentsPageClientProps {
  initialData: SegmentsDashboardData;
}

export function SegmentsPageClient({ initialData }: SegmentsPageClientProps) {
  const router = useRouter();
  const [segments, setSegments] = useState<Segment[]>(initialData.segments);
  const [attributes, setAttributes] = useState<CustomAttribute[]>(initialData.attributes);
  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImportCSV = () => {
    // Implement CSV import functionality
    console.log("Import CSV clicked");
  };

  const handleReadDocs = () => {
    // Open documentation
    window.open("https://docs.pusheagle.com/segments", "_blank");
  };

  const handleEditSegment = (segment: Segment) => {
    // Navigate to edit page or open edit modal
    router.push(`/dashboard/segments/edit/${segment.id}`);
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteSegment(segmentId);
      setSegments((prev) => prev.filter((s) => s.id !== segmentId));
      toast.success("Segment deleted successfully!");
    } catch (error) {
      console.error("Error deleting segment:", error);
      toast.error("Failed to delete segment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateSegment = async (segment: Segment) => {
    setIsLoading(true);
    try {
      const duplicatedSegment = await duplicateSegment(segment.id);
      setSegments((prev) => [duplicatedSegment, ...prev]);
      toast.success("Segment duplicated successfully!");
    } catch (error) {
      console.error("Error duplicating segment:", error);
      toast.error("Failed to duplicate segment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSegmentStatus = async (segmentId: string) => {
    setIsLoading(true);
    try {
      const updatedSegment = await toggleSegmentStatus(segmentId);
      setSegments((prev) => prev.map((s) => (s.id === segmentId ? updatedSegment : s)));
      toast.success(
        `Segment ${updatedSegment.isActive ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      console.error("Error toggling segment status:", error);
      toast.error("Failed to toggle segment status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAttribute = (attribute: CustomAttribute) => {
    // Edit attribute functionality - planned for v2.0
    toast.info(`Editing "${attribute.name}" - Feature coming soon!`);
  };

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteCustomAttribute(attributeId);
      setAttributes((prev) => prev.filter((a) => a.id !== attributeId));
      toast.success("Attribute deleted successfully!");
    } catch (error) {
      console.error("Error deleting attribute:", error);
      toast.error("Failed to delete attribute. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAttribute = () => {
    setIsAddAttributeDialogOpen(true);
  };

  const handleSaveAttribute = async (data: NewAttributeFormValues) => {
    setIsLoading(true);
    try {
      const newAttribute = await createCustomAttribute(data);
      setAttributes((prev) => [...prev, newAttribute]);
      toast.success(`Custom attribute "${data.name}" created successfully!`);
      setIsAddAttributeDialogOpen(false);
    } catch (error) {
      console.error("Error creating attribute:", error);
      toast.error("Failed to create attribute. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SegmentsErrorBoundary>
      <div className="bg-background min-h-screen">
        <SegmentsHeader onImportCSV={handleImportCSV} />

        <div className="container mx-auto px-6 py-8">
          {/* Audience Banner */}
          <div className="mb-8">
            <AudienceBanner onReadDocs={handleReadDocs} />
          </div>

          {/* Segments Table */}
          <div className="mb-8">
            <SegmentsTable
              segments={segments}
              onEdit={handleEditSegment}
              onDelete={handleDeleteSegment}
              onDuplicate={handleDuplicateSegment}
              onToggleStatus={handleToggleSegmentStatus}
              isLoading={isLoading}
            />
          </div>

          {/* Custom Attributes Table */}
          <div>
            <AttributesTable
              attributes={attributes}
              onEdit={handleEditAttribute}
              onDelete={handleDeleteAttribute}
              onNewAttribute={handleNewAttribute}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Add Attribute Dialog */}
        <AddAttributeDialog
          open={isAddAttributeDialogOpen}
          onOpenChange={setIsAddAttributeDialogOpen}
          onSave={handleSaveAttribute}
          isLoading={isLoading}
        />
      </div>
    </SegmentsErrorBoundary>
  );
}
