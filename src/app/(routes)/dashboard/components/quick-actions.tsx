"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconSpeakerphone,
  IconUsers,
  IconListDetails,
  IconChartBar,
  IconSettings,
  IconUpload,
} from "@tabler/icons-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      title: "Create Campaign",
      description: "Send push notifications to your subscribers",
      href: "/dashboard/campaigns/new",
      icon: IconSpeakerphone,
      color: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/70",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Create Segment",
      description: "Target specific subscriber groups",
      href: "/dashboard/segments/new",
      icon: IconListDetails,
      color: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-950/70",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "View Subscribers",
      description: "Manage your subscriber list",
      href: "/dashboard/subscriber",
      icon: IconUsers,
      color: "bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/70",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Analytics",
      description: "View detailed performance metrics",
      href: "/dashboard/analytics",
      icon: IconChartBar,
      color: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950/70",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Import Subscribers",
      description: "Bulk import from CSV or API",
      href: "/dashboard/subscriber?action=import",
      icon: IconUpload,
      color: "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950/70",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Settings",
      description: "Configure your account & integrations",
      href: "/dashboard/settings",
      icon: IconSettings,
      color: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-950/50 dark:hover:bg-gray-950/70",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
  ];

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="ghost"
                  className={`h-auto w-full justify-start p-4 transition-colors ${action.color}`}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className={`rounded-lg p-2 ${action.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-muted-foreground text-xs">{action.description}</div>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
