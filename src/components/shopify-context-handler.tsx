"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Client component to handle Shopify context preservation after Clerk verification
 * 
 * When Clerk redirects to / after email verification, this component checks
 * sessionStorage for Shopify context and redirects back to sign-up with the context.
 */
export function ShopifyContextHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run on the root page
    if (pathname !== "/") {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // Check if we're coming back from Clerk verification with Shopify context in sessionStorage
    // This happens when Clerk redirects to / after email verification
    try {
      const stored = sessionStorage.getItem("shopify_install_context");
      if (stored) {
        const context = JSON.parse(stored);
        if (context?.shop && context?.hmac && context?.timestamp) {
          console.log("🔄 Detected Shopify context after verification, redirecting back to sign-up:", {
            shop: context.shop,
          });

          hasRedirected.current = true;

          // Redirect back to sign-up with Shopify context
          const signUpUrl = new URL("/sign-up", window.location.origin);
          signUpUrl.searchParams.set("shop", context.shop);
          signUpUrl.searchParams.set("hmac", context.hmac);
          signUpUrl.searchParams.set("timestamp", context.timestamp);
          signUpUrl.searchParams.set("shopify_install", "true");

          // Use window.location for a hard redirect to ensure the page reloads
          window.location.href = signUpUrl.toString();
        }
      }
    } catch (e) {
      console.error("Error checking sessionStorage for Shopify context:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null; // This component doesn't render anything
}

