import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface CampaignStepHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export function CampaignStepHeader({
  icon: Icon,
  title,
  description,
  currentStep,
  totalSteps,
  stepLabel,
}: CampaignStepHeaderProps) {
  return (
    <div className="bg-card border-y">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Icon className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </div>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stepLabel || `Step ${currentStep} of ${totalSteps}`}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
