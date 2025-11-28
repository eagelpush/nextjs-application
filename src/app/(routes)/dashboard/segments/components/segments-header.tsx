"use client";

import { Button } from "@/components/ui/button";
import { ListIcon, Plus, Upload } from "lucide-react";
import Link from "next/link";

interface SegmentsHeaderProps {
  onImportCSV: () => void;
}

export function SegmentsHeader({ onImportCSV }: SegmentsHeaderProps) {
  return (
    <div className="bg-card border-y">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <ListIcon className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
            </div>
            <p className="text-muted-foreground">
              Create and manage audience segments for targeted campaigns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onImportCSV}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button asChild>
              <Link href="/dashboard/segments/new">
                <Plus className="mr-2 h-4 w-4" />
                New Segment
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
