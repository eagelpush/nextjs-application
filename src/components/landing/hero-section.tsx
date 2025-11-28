"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { OptimizedImage } from "@/components/uploadcare";

export function HeroSection() {
  return (
    <section className="bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-32 sm:pb-40 lg:flex lg:items-center lg:gap-x-12 lg:px-8 lg:pt-32 lg:pb-48">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground text-xs font-medium tracking-wide">
              #1 Push Notification Platform for Shopify
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-foreground max-w-2xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Turn every store visitor into a{" "}
            <span className="text-primary">customer</span> with Push
            Notifications
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground mt-6 text-xl leading-8">
            Send targeted push notifications that drive sales and increase
            customer engagement. Recover abandoned carts, promote flash sales,
            and build lasting customer relationships — all without email
            addresses.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/sign-up" className="flex items-center gap-2">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border-background bg-muted h-9 w-9 rounded-full border-2 ring-2 ring-background"
                  />
                ))}
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">2,500+</p>
                <p className="text-muted-foreground text-xs">Active stores</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-chart-4 text-base">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-foreground mt-1 text-xs font-medium">
                4.9 out of 5 stars
              </p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <span className="text-foreground text-xs font-medium">
                No credit card required
              </span>
            </div>
          </div>
        </div>

        {/* Hero Image/Demo */}
        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
          <div className="relative mx-auto w-full max-w-2xl">
            {/* Dashboard Preview */}
            <div className="border-border relative rounded-xl border bg-card p-3 shadow-2xl">
              <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-lg">
                {/* Light theme dashboard */}
                <div className="relative h-full w-full dark:hidden">
                  <OptimizedImage
                    src="/light-dashboard.png"
                    alt="Push Eagle Dashboard - Light Theme"
                    fill
                    className="object-cover object-top"
                    loading="eager"
                    unoptimized
                  />
                </div>
                {/* Dark theme dashboard */}
                <div className="relative hidden h-full w-full dark:block">
                  <OptimizedImage
                    src="/dark-dashboard.png"
                    alt="Push Eagle Dashboard - Dark Theme"
                    fill
                    className="object-cover object-top"
                    loading="eager"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
