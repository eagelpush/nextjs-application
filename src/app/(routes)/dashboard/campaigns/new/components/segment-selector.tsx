"use client";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import type { Segment } from "../types";
import { getSegmentBadgeVariant, formatSegmentCount } from "../utils";
import { ChevronRight } from "lucide-react";

interface SegmentSelectorProps {
  segments: Segment[];
  selectedSegments: string[];
  onSegmentToggle: (segmentId: string) => void;
}

export function SegmentSelector({
  segments,
  selectedSegments,
  onSegmentToggle,
}: SegmentSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {selectedSegments.length} segment(s) selected
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={cn(
              "relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
              selectedSegments.includes(segment.id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onSegmentToggle(segment.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="truncate text-sm font-medium">{segment.name}</h4>
                  <Badge variant={getSegmentBadgeVariant(segment.type)} className="text-xs">
                    {formatSegmentCount(segment.count)}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">{segment.description}</p>
              </div>
              {selectedSegments.includes(segment.id) && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                    <ChevronRight className="text-primary-foreground h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
