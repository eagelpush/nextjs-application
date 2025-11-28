import { Plus } from "lucide-react";
import { CampaignStepHeader } from "./components";
import { NewCampaignForm } from "./components/new-campaign-form";
import { getAvailableSegments } from "./lib/actions";
import { CAMPAIGN_CREATION_STEPS } from "./constants";

// Force dynamic rendering since we use auth() in getAvailableSegments
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  // Fetch data on the server
  const segments = await getAvailableSegments();

  return (
    <div className="bg-background min-h-screen">
      <CampaignStepHeader
        icon={Plus}
        title="Create New Campaign"
        description="Set up your push notification campaign with targeting and scheduling options"
        currentStep={CAMPAIGN_CREATION_STEPS.SETUP}
        totalSteps={3}
      />

      <NewCampaignForm initialSegments={segments} />
    </div>
  );
}
