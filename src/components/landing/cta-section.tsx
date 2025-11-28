"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h2 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Ready to boost your sales?
          </h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-8">
            Join thousands of Shopify stores using Push Eagle to increase
            customer engagement and drive more revenue. No credit card required.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/sign-up" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-primary h-5 w-5" />
              <span className="text-muted-foreground">
                No credit card required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-primary h-5 w-5" />
              <span className="text-muted-foreground">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-primary h-5 w-5" />
              <span className="text-muted-foreground">Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
