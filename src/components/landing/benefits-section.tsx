"use client";

import { Check, Bell, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const benefits = [
  "No email required - reach customers instantly",
  "Higher engagement than email marketing",
  "Real-time delivery and analytics",
  "Easy setup - no coding needed",
  "Works on all devices and browsers",
  "GDPR compliant and secure",
];

export function BenefitsSection() {
  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
          {/* Content */}
          <div className="lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Every visitor leaves without a purchase in their first visit
              </h2>
              <p className="text-muted-foreground mt-6 text-lg leading-8">
                Don&apos;t let potential customers slip away. Push Eagle helps
                you stay connected and bring them back when they&apos;re ready
                to buy.
              </p>

              {/* Benefits List */}
              <dl className="mt-10 max-w-xl space-y-4 lg:max-w-none">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="relative flex items-start gap-x-4"
                  >
                    <div className="bg-primary flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg">
                      <Check className="text-primary-foreground h-4 w-4" />
                    </div>
                    <dd className="text-foreground text-base leading-7">
                      {benefit}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* CTA */}
              <div className="mt-10">
                <Button asChild size="lg" className="h-12 px-8 text-base">
                  <Link href="/sign-up">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            {/* Card Stack */}
            <div className="space-y-6">
              {/* Card 1 - Campaign */}
              <Card className="border-border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
                        <Target className="text-primary-foreground h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground text-lg font-semibold">
                        Targeted Campaigns
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        Send personalized notifications to the right audience at
                        the right time
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          <div className="bg-primary h-full w-3/4 rounded-full" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium">
                          75%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - Analytics */}
              <Card className="border-border ml-8 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
                        <TrendingUp className="text-primary-foreground h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground text-lg font-semibold">
                        Real-time Analytics
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        Track performance and ROI with comprehensive dashboards
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-foreground text-2xl font-bold">
                            12.5K
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Clicks
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-foreground text-2xl font-bold">
                            8.2%
                          </p>
                          <p className="text-muted-foreground text-xs">CTR</p>
                        </div>
                        <div className="text-center">
                          <p className="text-foreground text-2xl font-bold">
                            $2.5K
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Revenue
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Notification Preview */}
              <Card className="border-border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
                        <Bell className="text-primary-foreground h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-foreground text-lg font-semibold">
                          Flash Sale Alert!
                        </h3>
                        <Badge variant="destructive" className="rounded-full">
                          Live
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        50% off all products for the next 2 hours only!
                      </p>
                      <Button className="mt-4 w-full" size="sm">
                        Shop Now →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
