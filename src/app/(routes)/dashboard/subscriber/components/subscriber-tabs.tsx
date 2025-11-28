"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { SubscriberTab } from "../types";
import { SUBSCRIBER_TABS } from "../constants";

interface SubscriberTabsProps {
  activeTab: SubscriberTab;
  onTabChange: (tab: SubscriberTab) => void;
  children: React.ReactNode;
}

export function SubscriberTabs({
  activeTab,
  onTabChange,
  children,
}: SubscriberTabsProps) {
  const handleValueChange = (value: string) => {
    onTabChange(value as SubscriberTab);
  };

  return (
    <div className="mb-8">
      <Tabs
        value={activeTab}
        onValueChange={handleValueChange}
        className="w-full"
      >
        <TabsList className="mb-2 grid w-full grid-cols-3 gap-x-1">
          {SUBSCRIBER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="bg-background"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
