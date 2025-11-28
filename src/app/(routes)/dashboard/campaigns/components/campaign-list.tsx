import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { CampaignCard } from "./campaign-card";
import { CampaignPagination } from "./campaign-pagination";
import type { Campaign } from "../types";

interface CampaignListProps {
  campaigns: Campaign[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSend?: (id: string, title: string, status?: string) => void | Promise<void>;
  activeTab: string;
  isPending?: boolean;
}

export function CampaignList({
  campaigns,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  onPageChange,
  onEdit,
  onDuplicate,
  onDelete,
  onSend,
  activeTab,
  isPending = false,
}: CampaignListProps) {
  // Empty state
  if (totalItems === 0) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-12 text-center">
          <Megaphone className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No campaigns found</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === "all"
              ? "You haven't created any campaigns yet."
              : `No ${activeTab} campaigns match your current filters.`}
          </p>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaign History
          </span>
          <Badge variant="secondary">{totalItems} campaigns</Badge>
        </CardTitle>
        <CardDescription>Manage and monitor your push notification campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-border/50 space-y-6 divide-y">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onSend={onSend}
              isPending={isPending}
            />
          ))}
        </div>

        <CampaignPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
