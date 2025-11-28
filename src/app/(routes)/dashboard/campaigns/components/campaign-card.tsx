import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Copy, Trash, Send } from "lucide-react";
import type { Campaign } from "../types";
import { getStatusConfig, formatNumber, formatCurrency, formatPercentage } from "../utils";

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSend?: (id: string, title: string, status?: string) => void | Promise<void>;
  isPending?: boolean;
}

export function CampaignCard({
  campaign,
  onEdit,
  onDuplicate,
  onDelete,
  onSend,
  isPending = false,
}: CampaignCardProps) {
  const statusConfig = getStatusConfig(campaign.status);

  // Determine if campaign can be sent or resent
  const canSend =
    (campaign.status === "draft" ||
      campaign.status === "scheduled" ||
      campaign.status === "sent") &&
    onSend;

  // Determine button text based on status
  const sendButtonText = campaign.status === "sent" ? "Send Again" : "Send Now";

  return (
    <Card
      className="bg-card/50 border-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
      role="article"
      aria-labelledby={`campaign-title-${campaign.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Campaign Image */}
          <div className="shrink-0">
            <Avatar className="ring-primary/10 h-16 w-16 rounded-xl shadow-sm ring-2 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
              <AvatarImage
                src={campaign.image}
                alt={`Campaign image for ${campaign.title}`}
                className="rounded-xl object-cover"
              />
              <AvatarFallback
                className="from-primary/20 to-primary/10 text-primary rounded-xl bg-linear-to-br text-lg font-bold"
                aria-hidden="true"
              >
                {campaign.title.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Campaign Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-3">
                  <h3
                    id={`campaign-title-${campaign.id}`}
                    className="truncate text-base font-semibold"
                  >
                    {campaign.title}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-2 truncate text-sm">
                  {campaign.description}
                </p>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 opacity-70 transition-all duration-200 hover:opacity-100"
                    disabled={isPending}
                    aria-label={`More actions for campaign ${campaign.title}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Send Now/Again option - for draft, scheduled, and sent campaigns */}
                  {canSend && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onSend!(campaign.id, campaign.title, campaign.status)}
                        className="font-medium text-green-600 dark:text-green-400"
                        disabled={isPending}
                      >
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                        {sendButtonText}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(campaign.id)} disabled={isPending}>
                    <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(campaign.id)} disabled={isPending}>
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(campaign.id)}
                    className="text-destructive"
                    disabled={isPending}
                  >
                    <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div
                className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-6"
                role="group"
                aria-label="Campaign metrics"
              >
                <div className="text-center">
                  <div className="text-muted-foreground text-xs font-medium">Impressions</div>
                  <div
                    className="font-semibold"
                    aria-label={`${formatNumber(campaign.impressions)} impressions`}
                  >
                    {formatNumber(campaign.impressions)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs font-medium">Clicks</div>
                  <div
                    className="font-semibold"
                    aria-label={`${formatNumber(campaign.clicks)} clicks`}
                  >
                    {formatNumber(campaign.clicks)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs font-medium">CTR</div>
                  <div
                    className="font-semibold"
                    aria-label={`${formatPercentage(campaign.ctr)} click-through rate`}
                  >
                    {formatPercentage(campaign.ctr)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs font-medium">Revenue</div>
                  <div
                    className="font-semibold"
                    aria-label={`${formatCurrency(campaign.revenue)} revenue`}
                  >
                    {formatCurrency(campaign.revenue)}
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig?.variant || "default"} className={statusConfig?.className || ""}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                    {campaign.segment}
                  </Badge>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono text-xs break-all">ID: {campaign.id}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
