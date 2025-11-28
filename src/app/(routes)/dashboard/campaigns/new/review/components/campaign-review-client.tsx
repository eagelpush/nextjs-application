"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignReviewContent } from "./campaign-review-content";
import { STORAGE_KEYS, CAMPAIGN_ROUTES } from "../../constants";
import type { CompleteCampaignData } from "../../types";

export default function CampaignReviewClient() {
  const router = useRouter();
  const [campaignData, setCampaignData] = useState<CompleteCampaignData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only accessing localStorage after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const savedData = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_COMPLETE);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as CompleteCampaignData;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCampaignData(parsedData);
      } catch (error) {
        console.error("Failed to parse campaign data:", error);
        router.push(CAMPAIGN_ROUTES.NEW);
        return;
      }
    } else {
      // Redirect back if no complete data found
      router.push(CAMPAIGN_ROUTES.NEW);
      return;
    }
    setIsLoading(false);
  }, [router, isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div className="container mx-auto flex min-h-64 items-center justify-center px-6 py-8">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return null; // This should not happen due to redirect above
  }

  return <CampaignReviewContent campaignData={campaignData} />;
}
