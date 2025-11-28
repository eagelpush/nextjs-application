import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin } from "lucide-react";
import type { LocationAnalyticsProps } from "../types";
import { formatNumber, formatPercentage } from "../utils";

export function LocationAnalytics({ locationData }: LocationAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Top Cities */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            Top Cities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationData.cities.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              <p>No city data available yet</p>
            </div>
          ) : (
            locationData.cities.map((city) => (
              <div key={city.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{city.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {city.country}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatNumber(city.users)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatPercentage(city.percentage)}
                    </div>
                  </div>
                </div>
                <Progress value={city.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationData.countries.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              <p>No country data available yet</p>
            </div>
          ) : (
            locationData.countries.map((country) => (
              <div key={country.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatNumber(country.users)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatPercentage(country.percentage)}
                    </div>
                  </div>
                </div>
                <Progress value={country.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
