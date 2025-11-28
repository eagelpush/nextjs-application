import { Edit3 } from "lucide-react";
import { CampaignStepHeader } from "../components";
import { CAMPAIGN_CREATION_STEPS } from "../constants";
import CampaignEditorClientComponent from "./campaign-editor-client";

export default async function CampaignEditorPage() {
  return (
    <div className="bg-background min-h-screen">
      <CampaignStepHeader
        icon={Edit3}
        title="Campaign Editor"
        description="Design your push notification content and preview how it will look"
        currentStep={CAMPAIGN_CREATION_STEPS.EDITOR}
        totalSteps={3}
      />

      <CampaignEditorClientComponent />
    </div>
  );
}
