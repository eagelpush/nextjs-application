"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { ChevronRight, Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const breadcrumbNameMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/predictions": "AI Predictions",
  "/dashboard/recommendations": "Recommendations",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/payments": "Billing",
  "/dashboard/settings/appearance": "Appearance",
  "/dashboard/settings/support": "Support",
  "/dashboard/settings/about": "About",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on main dashboard page
  if (pathname === "/dashboard") {
    return null;
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = [];

  // Always start with dashboard
  breadcrumbItems.push({
    href: "/dashboard",
    label: "Dashboard",
    isHome: true,
  });

  // Build breadcrumb path
  let currentPath = "";
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;

    // Skip the first 'dashboard' segment as we already added it
    if (segment === "dashboard") continue;

    const label = breadcrumbNameMap[currentPath] || segment;
    breadcrumbItems.push({
      href: currentPath,
      label,
      isHome: false,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      {item.isHome && <Home className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
