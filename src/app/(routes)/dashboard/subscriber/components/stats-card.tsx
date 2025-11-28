import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatsCardProps } from "../types";
import { formatNumber, getIconComponent } from "../utils";

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
}: StatsCardProps) {
  const formattedValue =
    typeof value === "number" ? formatNumber(value) : value;

  const Icon = getIconComponent(icon);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 rounded-lg p-2">
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon className="text-primary h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formattedValue}</div>
        {trend && (
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-foreground font-semibold">
              {trend.value > 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>{" "}
            {trend.label}
          </p>
        )}
        {description && !trend && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
