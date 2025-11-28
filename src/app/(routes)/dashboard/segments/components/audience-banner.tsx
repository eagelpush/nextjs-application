"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Target, TrendingUp, ListIcon } from "lucide-react";
import Link from "next/link";

interface AudienceBannerProps {
  onReadDocs: () => void;
}

export function AudienceBanner({ onReadDocs }: AudienceBannerProps) {
  return (
    <Card className="from-primary/5 via-background to-secondary/5 border bg-gradient-to-br shadow-sm">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Build your Audience</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                Create targeted segments to reach the right customers with personalized campaigns.
                Segment by behavior, demographics, or custom attributes to maximize engagement and
                conversion rates.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard/segments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Segment
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={onReadDocs}>
                <BookOpen className="mr-2 h-4 w-4" />
                Read Documentation
              </Button>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Background circles */}
              <div className="bg-primary/10 absolute inset-0 h-48 w-48 rounded-full blur-xl"></div>
              <div className="bg-secondary/20 absolute top-4 left-4 h-32 w-32 rounded-full blur-lg"></div>

              {/* Icon grid */}
              <div className="relative grid grid-cols-2 gap-4 p-8">
                <div className="bg-card border-border/50 rounded-2xl border p-6 shadow-sm">
                  <Users className="text-primary mb-2 h-8 w-8" />
                  <div className="space-y-1">
                    <div className="bg-primary/20 h-2 w-12 rounded"></div>
                    <div className="bg-primary/10 h-2 w-8 rounded"></div>
                  </div>
                </div>

                <div className="bg-card border-border/50 rounded-2xl border p-6 shadow-sm">
                  <Target className="mb-2 h-8 w-8 text-blue-500" />
                  <div className="space-y-1">
                    <div className="h-2 w-10 rounded bg-blue-500/20"></div>
                    <div className="h-2 w-14 rounded bg-blue-500/10"></div>
                  </div>
                </div>

                <div className="bg-card border-border/50 rounded-2xl border p-6 shadow-sm">
                  <TrendingUp className="mb-2 h-8 w-8 text-green-500" />
                  <div className="space-y-1">
                    <div className="h-2 w-16 rounded bg-green-500/20"></div>
                    <div className="h-2 w-6 rounded bg-green-500/10"></div>
                  </div>
                </div>

                <div className="bg-card border-border/50 rounded-2xl border p-6 shadow-sm">
                  <ListIcon className="mb-2 h-8 w-8 text-purple-500" />
                  <div className="space-y-1">
                    <div className="h-2 w-11 rounded bg-purple-500/20"></div>
                    <div className="h-2 w-9 rounded bg-purple-500/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
