import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, Send, Clock, FileText } from "lucide-react";

interface CampaignTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export function CampaignTabs({
  activeTab,
  onTabChange,
  children,
}: CampaignTabsProps) {
  const tabs = [
    {
      value: "all",
      label: "All",
      icon: Megaphone,
    },
    {
      value: "sent",
      label: "Sent",
      icon: Send,
    },
    {
      value: "scheduled",
      label: "Scheduled",
      icon: Clock,
    },
    {
      value: "draft",
      label: "Drafts",
      icon: FileText,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-4">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent value={activeTab} className="space-y-6">
        {children}
      </TabsContent>
    </Tabs>
  );
}
