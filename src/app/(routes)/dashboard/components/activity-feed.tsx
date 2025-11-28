"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconSpeakerphone,
  IconUserPlus,
  IconListDetails,
  IconCirclePlus,
  IconClock,
} from "@tabler/icons-react";
import type { ActivityItem } from "../../../../types/types";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  // Use state to prevent hydration mismatch - only calculate relative time on client
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set current time only on client to prevent hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTime(new Date());
  }, []);

  const getActivityIcon = (type: string) => {
    const icons = {
      campaign_sent: IconSpeakerphone,
      campaign_created: IconCirclePlus,
      subscriber_joined: IconUserPlus,
      segment_created: IconListDetails,
    };
    return icons[type as keyof typeof icons] || IconClock;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      campaign_sent:
        "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
      campaign_created:
        "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      subscriber_joined:
        "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      segment_created:
        "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    };
    return (
      colors[type as keyof typeof colors] ||
      "bg-gray-100 text-gray-600 dark:bg-gray-950/50 dark:text-gray-400"
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);

    // If currentTime is not set yet (during SSR), return absolute date to prevent hydration mismatch
    if (!currentTime) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    const diffInSeconds = Math.floor(
      (currentTime.getTime() - date.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (activities.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-center">
            <div>
              <IconClock className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div
                    className={`rounded-lg p-2 ${getActivityColor(activity.type)}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-none font-medium">
                        {activity.title}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {formatTime(activity.timestamp)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
