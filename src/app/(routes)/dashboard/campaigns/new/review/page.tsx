import { Rocket } from "lucide-react";
import { CampaignStepHeader } from "../components";
import CampaignReviewClient from "./components/campaign-review-client";
import { CAMPAIGN_CREATION_STEPS } from "../constants";

export default function CampaignReviewPage() {
  return (
    <div className="bg-background min-h-screen">
      <CampaignStepHeader
        icon={Rocket}
        title="Review & Launch"
        description="Review your campaign details and launch when ready"
        currentStep={CAMPAIGN_CREATION_STEPS.REVIEW}
        totalSteps={3}
      />

      <CampaignReviewClient />
    </div>
  );
}
