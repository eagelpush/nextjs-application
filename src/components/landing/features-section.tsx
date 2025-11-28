"use client";

import {
  Bell,
  Target,
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  Clock,
  Globe,
} from "lucide-react";

const features = [
  {
    name: "Targeted Campaigns",
    description:
      "Create personalized push notifications campaigns that resonate with your audience and drive conversions.",
    icon: Target,
  },
  {
    name: "Advanced Segmentation",
    description:
      "Segment your subscribers based on behavior, location, device, and custom attributes for laser-focused messaging.",
    icon: Users,
  },
  {
    name: "Real-time Analytics",
    description:
      "Track impressions, clicks, conversions, and revenue in real-time with comprehensive analytics dashboards.",
    icon: BarChart3,
  },
  {
    name: "Lightning Fast Delivery",
    description:
      "Send notifications instantly to thousands of subscribers with our high-performance infrastructure.",
    icon: Zap,
  },
  {
    name: "Smart Timing",
    description:
      "Schedule campaigns for optimal engagement or send immediately — you're in complete control.",
    icon: Clock,
  },
  {
    name: "Global Reach",
    description:
      "Reach customers worldwide with multi-language support and geo-targeted notifications.",
    icon: Globe,
  },
  {
    name: "Performance Tracking",
    description:
      "Monitor campaign performance with detailed metrics including CTR, conversion rates, and revenue attribution.",
    icon: TrendingUp,
  },
  {
    name: "Easy Integration",
    description: "Seamlessly integrate with your Shopify store in minutes — no coding required.",
    icon: Bell,
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Powerful features to <span className="text-primary">grow your business</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed">
            All the tools you need to engage customers, increase conversions, and boost your revenue
            with push notifications.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
          <dl className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="border-border group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div className="bg-primary/10 group-hover:bg-primary/20 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-colors">
                    <feature.icon className="text-primary h-7 w-7" />
                  </div>
                </div>

                {/* Content */}
                <dt className="text-foreground text-lg font-semibold">{feature.name}</dt>
                <dd className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
