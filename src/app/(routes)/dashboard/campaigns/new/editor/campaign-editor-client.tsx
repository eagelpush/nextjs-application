"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignEditorForm } from "./components";
import { STORAGE_KEYS, CAMPAIGN_ROUTES } from "../constants";
import type { CampaignStep1FormData } from "../types";

export default function CampaignEditorClient() {
  const router = useRouter();
  const [step1Data, setStep1Data] = useState<CampaignStep1FormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only accessing localStorage after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const savedData = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_STEP1);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as CampaignStep1FormData;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStep1Data(parsedData);
      } catch (error) {
        console.error("Failed to parse step 1 data:", error);
        router.push(CAMPAIGN_ROUTES.NEW);
        return;
      }
    } else {
      // Redirect back if no step 1 data found
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

  if (!step1Data) {
    return null; // This should not happen due to redirect above
  }

  return <CampaignEditorForm step1Data={step1Data} />;
}
