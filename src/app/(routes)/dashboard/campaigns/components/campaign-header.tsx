import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";

interface CampaignHeaderProps {
  isPending?: boolean;
}

export function CampaignHeader({ isPending = false }: CampaignHeaderProps) {
  return (
    <header className="bg-card border-y" role="banner">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2" aria-hidden="true">
                <Megaphone className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
            </div>
            <p className="text-muted-foreground">
              Create, manage, and analyze your push notification campaigns
            </p>
          </div>
          <div
            className="flex items-center space-x-2"
            role="group"
            aria-label="Campaign actions"
          >
            <Button
              asChild
              disabled={isPending}
              aria-label="Create new campaign"
            >
              <Link href="/dashboard/campaigns/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                New Campaign
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
