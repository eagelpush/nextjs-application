import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlatformAnalyticsProps } from "../types";
import { formatNumber, formatPercentage, getIconComponent } from "../utils";

export function PlatformAnalytics({ platformData }: PlatformAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Browser Breakdown */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Browser Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {platformData.browsers.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              <p>No browser data available yet</p>
            </div>
          ) : (
            platformData.browsers.map((browser) => {
              const IconComponent = getIconComponent(browser.icon);
              return (
                <div key={browser.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">
                        {browser.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(browser.users)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatPercentage(browser.percentage)}
                      </div>
                    </div>
                  </div>
                  <Progress value={browser.percentage} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Operating System Breakdown */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Operating System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {platformData.operatingSystems.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              <p>No operating system data available yet</p>
            </div>
          ) : (
            platformData.operatingSystems.map((os) => {
              const IconComponent = getIconComponent(os.icon);
              return (
                <div key={os.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">{os.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(os.users)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatPercentage(os.percentage)}
                      </div>
                    </div>
                  </div>
                  <Progress value={os.percentage} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
