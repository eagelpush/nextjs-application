"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { formatNumber } from "../utils";

interface EstimatedCountProps {
  count: number;
  isLoading?: boolean;
}

export function EstimatedCount({ count, isLoading = false }: EstimatedCountProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 border">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 rounded-lg p-3">
            <Users className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">Estimated Audience Size</h3>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="mt-2">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="bg-muted h-8 w-24 rounded"></div>
                </div>
              ) : (
                <div className="text-primary text-3xl font-bold">{formatNumber(count)}</div>
              )}
              <p className="text-muted-foreground mt-1 text-sm">subscribers match your criteria</p>
            </div>
          </div>
        </div>

        {!isLoading && (
          <div className="bg-muted/50 mt-4 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">
              <strong>Note:</strong> This is an estimated count based on your current segment
              criteria. The actual count may vary when the segment is saved and processed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
