import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  StatsSection,
  BenefitsSection,
  CTASection,
  Footer,
} from "@/components/landing";
import { ShopifyContextHandler } from "@/components/shopify-context-handler";

/**
 * Root page handler
 *
 * Detects Shopify installation requests and redirects to the install handler.
 * Otherwise, shows the landing page with a client component to handle verification redirects.
 */
async function HomePageContent() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Check if this is a Shopify installation request
  const shop = params.shop as string | undefined;
  const hmac = params.hmac as string | undefined;
  const timestamp = params.timestamp as string | undefined;

  // If we have Shopify OAuth parameters, redirect to install handler
  if (shop && hmac && timestamp) {
    const installUrl = new URL(
      "/api/shopify/install",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    installUrl.searchParams.set("shop", shop);
    installUrl.searchParams.set("hmac", hmac);
    installUrl.searchParams.set("timestamp", timestamp);

    // Preserve any other query parameters
    Object.keys(params).forEach((key) => {
      if (!["shop", "hmac", "timestamp"].includes(key) && params[key]) {
        installUrl.searchParams.set(key, String(params[key]));
      }
    });

    console.log(
      "🔄 Redirecting Shopify installation request to install handler:",
      {
        shop,
        installUrl: installUrl.toString(),
      }
    );

    redirect(installUrl.toString());
  }

  // Otherwise, show the landing page with client component to handle verification redirects
  return (
    <Suspense fallback={<div className="bg-background min-h-screen" />}>
      <ShopifyContextHandler />
      <HomePageContent />
    </Suspense>
  );
}
