import { notFound } from "next/navigation";
import { getCampaignById, getAvailableSegments } from "../../lib/actions";
import { EditCampaignPageClient } from "./components";

// Force dynamic rendering since we use auth() in actions
export const dynamic = "force-dynamic";

interface EditCampaignPageProps {
  params: {
    id: string;
  };
}

export default async function EditCampaignPage({
  params,
}: EditCampaignPageProps) {
  const { id } = await params;
  const campaignId = id;

  // Fetch campaign and available segments in parallel
  const [campaignData, availableSegments] = await Promise.all([
    getCampaignById(campaignId),
    getAvailableSegments(),
  ]);

  if (!campaignData) {
    notFound();
  }

  // Transform campaign data to match the form structure
  const campaign = {
    id: campaignData.id,
    title: campaignData.title,
    description: campaignData.description || "",
    message: campaignData.message,
    destinationUrl: campaignData.destinationUrl || "",
    actionButtonText: campaignData.actionButtonText || "",
    category: campaignData.category,
    campaignType: campaignData.type.toLowerCase() as "regular" | "flash_sale",
    sendingOption: (campaignData.sendingOption || "schedule") as
      | "now"
      | "schedule",
    scheduleDate: campaignData.scheduledAt || undefined,
    smartDelivery: campaignData.smartDelivery,
    enableSound: campaignData.enableSound,
    enableVibration: campaignData.enableVibration,
    ttl: campaignData.ttl,
    heroImages: campaignData.heroImages.reduce(
      (acc: Record<string, string>, img) => {
        acc[img.platform] = img.imageUrl;
        return acc;
      },
      {}
    ),
    companyLogo:
      campaignData.companyLogos.find((logo) => logo.isActive)?.logoUrl || "",
    selectedSegments: campaignData.segments.map((s) => s.segment.id),
  };

  return (
    <EditCampaignPageClient
      initialCampaign={campaign}
      availableSegments={availableSegments}
    />
  );
}
