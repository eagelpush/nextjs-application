"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { getMerchantData } from "@/actions/user-account";
import { MerchantData } from "@/types/dashboard/settings";
import { SignOutButton } from "@clerk/nextjs";

export function NavUser() {
  const { isMobile } = useSidebar();
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const data = await getMerchantData();
        setMerchantData(data.data as unknown as MerchantData);
      } catch (error) {
        console.error("Failed to fetch merchant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage
                  src={merchantData?.storeImageUrl || ""}
                  alt={`${merchantData?.firstName || ""} ${merchantData?.lastName || ""}`}
                />
                <AvatarFallback className="rounded-lg">
                  {loading
                    ? "..."
                    : `${merchantData?.firstName?.[0] || ""}${merchantData?.lastName?.[0] || ""}`}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {loading
                    ? "Loading..."
                    : `${merchantData?.firstName || ""} ${merchantData?.lastName || ""}`}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {loading ? "..." : merchantData?.email || ""}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={merchantData?.storeImageUrl || ""}
                    alt={`${merchantData?.firstName || ""} ${merchantData?.lastName || ""}`}
                  />
                  <AvatarFallback className="rounded-lg">
                    {loading
                      ? "..."
                      : `${merchantData?.firstName?.[0] || ""}${merchantData?.lastName?.[0] || ""}`}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {loading
                      ? "Loading..."
                      : `${merchantData?.firstName || ""} ${merchantData?.lastName || ""}`}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {loading ? "..." : merchantData?.email || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/settings">
                <DropdownMenuItem>
                  <IconUserCircle />
                  Account
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings/billing">
                <DropdownMenuItem>
                  <IconCreditCard />
                  Billing
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings/privacy">
                <DropdownMenuItem>
                  <IconNotification />
                  privacy
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem>
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
