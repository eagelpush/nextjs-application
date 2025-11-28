"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const features = [
  {
    title: "Push Campaigns",
    href: "#features",
    description:
      "Create and send targeted push notification campaigns to your subscribers.",
  },
  {
    title: "Analytics",
    href: "#features",
    description:
      "Track performance with real-time analytics and detailed reporting.",
  },
  {
    title: "Segmentation",
    href: "#features",
    description:
      "Target specific audiences with advanced subscriber segmentation.",
  },
  {
    title: "Automation",
    href: "#features",
    description: "Automate your campaigns with scheduled sends and triggers.",
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="text-foreground text-xl font-bold">Push Eagle</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Features Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {features.map((feature) => (
                      <li key={feature.title}>
                        <NavigationMenuLink asChild>
                          <a
                            href={feature.href}
                            className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                          >
                            <div className="text-sm leading-none font-medium">
                              {feature.title}
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                              {feature.description}
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Pricing Link */}
              <NavigationMenuItem>
                <Link href="#pricing" className={navigationMenuTriggerStyle()}>
                  Pricing
                </Link>
              </NavigationMenuItem>

              {/* Documentation Link */}
              <NavigationMenuItem>
                <Link href="#docs" className={navigationMenuTriggerStyle()}>
                  Docs
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="default">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                {isOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <div className="border-border flex items-center gap-2 border-b pb-4">
                  <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Bell className="text-primary-foreground h-5 w-5" />
                  </div>
                  <span className="text-foreground text-xl font-bold">
                    Push Eagle
                  </span>
                </div>

                {/* Mobile Features */}
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground px-2 text-sm font-semibold">
                    Features
                  </p>
                  {features.map((feature) => (
                    <a
                      key={feature.title}
                      href={feature.href}
                      onClick={() => setIsOpen(false)}
                      className="hover:bg-accent hover:text-accent-foreground rounded-md p-3 transition-colors"
                    >
                      <div className="text-sm font-medium">{feature.title}</div>
                      <p className="text-muted-foreground text-xs">
                        {feature.description}
                      </p>
                    </a>
                  ))}
                </div>

                {/* Mobile Links */}
                <div className="border-border flex flex-col gap-2 border-t pt-4">
                  <a
                    href="#pricing"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-accent hover:text-accent-foreground rounded-md p-3 text-sm font-medium transition-colors"
                  >
                    Pricing
                  </a>
                  <a
                    href="#docs"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-accent hover:text-accent-foreground rounded-md p-3 text-sm font-medium transition-colors"
                  >
                    Documentation
                  </a>
                </div>

                {/* Mobile Actions */}
                <div className="border-border flex flex-col gap-3 border-t pt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
