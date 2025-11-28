"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  CreditCard,
  HelpCircle,
  Info,
  Palette,
  Settings,
  User,
  Shield,
  TrendingUp,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsNavigation = [
  {
    value: "general",
    href: "/dashboard/settings",
    label: "General",
    icon: User,
    description: "Manage your account settings and preferences",
  },
  {
    value: "privacy",
    href: "/dashboard/settings/privacy",
    label: "Privacy",
    icon: Shield,
    description: "Manage your privacy preferences and data settings",
  },
  {
    value: "attribution",
    href: "/dashboard/settings/attribution",
    label: "Attribution",
    icon: TrendingUp,
    description: "Configure conversion attribution models",
  },
  {
    value: "appearance",
    href: "/dashboard/settings/appearance",
    label: "Appearance",
    icon: Palette,
    description: "Customize your dashboard theme and display",
  },
  {
    value: "payments",
    href: "/dashboard/settings/payments",
    label: "Billing",
    icon: CreditCard,
    description: "Manage your subscription and payment methods",
  },
  {
    value: "support",
    href: "/dashboard/settings/support",
    label: "Support",
    icon: HelpCircle,
    description: "Get help and contact customer support",
  },
  {
    value: "about",
    href: "/dashboard/settings/about",
    label: "About",
    icon: Info,
    description: "Learn more about the application",
  },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current tab value from pathname
  const getCurrentTabValue = () => {
    if (pathname === "/dashboard/settings") return "general";
    const pathSegment = pathname.split("/dashboard/settings/")[1];
    return pathSegment || "general";
  };

  const handleTabChange = (value: string) => {
    const item = settingsNavigation.find((nav) => nav.value === value);
    if (item) {
      router.push(item.href);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <Settings className="text-primary h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={getCurrentTabValue()} onValueChange={handleTabChange} className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="mb-6 inline-flex w-max min-w-full justify-start p-1">
              {settingsNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="flex min-w-0 items-center gap-2 px-3 py-2 text-xs whitespace-nowrap sm:text-sm"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content - This will be handled by the children */}
          <div className="w-full">{children}</div>
        </Tabs>
      </div>
    </div>
  );
}
