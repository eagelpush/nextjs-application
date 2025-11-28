"use client";

import { TrendingUp, Users, Zap, DollarSign } from "lucide-react";

const stats = [
  {
    id: 1,
    name: "Active Stores",
    value: "2,500+",
    icon: Users,
    description: "Trusted by growing businesses worldwide",
  },
  {
    id: 2,
    name: "Notifications Sent",
    value: "50M+",
    icon: Zap,
    description: "Delivered every month",
  },
  {
    id: 3,
    name: "Average CTR",
    value: "12.5%",
    icon: TrendingUp,
    description: "Higher than industry standard",
  },
  {
    id: 4,
    name: "Revenue Generated",
    value: "$25M+",
    icon: DollarSign,
    description: "For our customers this year",
  },
];

export function StatsSection() {
  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            Trusted by thousands of <span className="text-primary">growing businesses</span>
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Join the merchants who are already driving more sales with Push Eagle
          </p>
        </div>

        {/* Stats Grid */}
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="border-border group relative overflow-hidden rounded-xl border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-14 w-14 items-center justify-center rounded-xl transition-colors">
                  <stat.icon className="text-primary h-7 w-7" />
                </div>
              </div>

              {/* Value */}
              <dd className="text-foreground text-5xl font-bold tracking-tight">
                {stat.value}
              </dd>

              {/* Name */}
              <dt className="text-foreground mt-3 text-lg font-semibold">{stat.name}</dt>

              {/* Description */}
              <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {stat.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
