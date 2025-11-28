"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [shopifyContext, setShopifyContext] = useState<{
    shop: string;
    hmac: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    // Check for Shopify installation context from URL params first
    const shopFromUrl = searchParams.get("shop");
    const hmacFromUrl = searchParams.get("hmac");
    const timestampFromUrl = searchParams.get("timestamp");
    const shopifyInstall = searchParams.get("shopify_install");

    // Check sessionStorage for persistence across Clerk navigation
    const getStoredContext = () => {
      try {
        const stored = sessionStorage.getItem("shopify_install_context");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading sessionStorage:", e);
      }
      return null;
    };

    const storedContext = getStoredContext();

    // Prefer URL params (fresh), fallback to sessionStorage (persisted)
    const shop = shopFromUrl || storedContext?.shop;
    const hmac = hmacFromUrl || storedContext?.hmac;
    const timestamp = timestampFromUrl || storedContext?.timestamp;

    // Require all three parameters (shop, hmac, timestamp) for Shopify OAuth flow
    if (shop && hmac && timestamp && (shopifyInstall === "true" || storedContext)) {
      // Store in sessionStorage for persistence across Clerk navigation (ALWAYS store if we have context)
      if (shop && hmac && timestamp) {
        try {
          sessionStorage.setItem(
            "shopify_install_context",
            JSON.stringify({ shop, hmac, timestamp })
          );
          console.log("💾 Stored Shopify context in sessionStorage:", { shop });
        } catch (e) {
          console.error("Error writing to sessionStorage:", e);
        }
      }

      // Only update if context changed
      if (!shopifyContext || shopifyContext.shop !== shop) {
        setShopifyContext({ shop, hmac, timestamp });
        console.log("🛍️ Sign-up with Shopify context:", { 
          shop, 
          source: shopFromUrl ? "URL" : "SessionStorage" 
        });
      }
    } else if (shopifyContext) {
      // Clear context if no longer valid
      setShopifyContext(null);
      try {
        sessionStorage.removeItem("shopify_install_context");
      } catch (e) {
        console.error("Error clearing sessionStorage:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Check if user is already authenticated after verification
  // If so, redirect to Shopify OAuth immediately
  useEffect(() => {
    if (isLoaded && user && shopifyContext) {
      console.log("✅ User already authenticated after verification, redirecting to Shopify OAuth:", {
        userId: user.id,
        shop: shopifyContext.shop,
      });

      // Redirect to Shopify OAuth immediately (no delay to prevent form submission)
      const oauthUrl = new URL("/api/shopify/login", window.location.origin);
      oauthUrl.searchParams.set("shop", shopifyContext.shop);
      oauthUrl.searchParams.set("hmac", shopifyContext.hmac);
      oauthUrl.searchParams.set("timestamp", shopifyContext.timestamp);
      oauthUrl.searchParams.set("post_signup", "true");

      // Clear sessionStorage
      try {
        sessionStorage.removeItem("shopify_install_context");
      } catch (e) {
        console.error("Error clearing sessionStorage:", e);
      }

      // Immediate redirect - don't wait
      window.location.href = oauthUrl.toString();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, shopifyContext]);

  // Handle successful sign-up completion
  const handleSignUpComplete = () => {
    // Clear sessionStorage after completion
    try {
      sessionStorage.removeItem("shopify_install_context");
    } catch (e) {
      console.error("Error clearing sessionStorage:", e);
    }

    if (shopifyContext) {
      console.log("✅ Sign-up completed, redirecting to Shopify OAuth");
      // Redirect to Shopify OAuth after successful sign-up
      const oauthUrl = new URL("/api/shopify/login", window.location.origin);
      oauthUrl.searchParams.set("shop", shopifyContext.shop);
      oauthUrl.searchParams.set("hmac", shopifyContext.hmac);
      oauthUrl.searchParams.set("timestamp", shopifyContext.timestamp);
      oauthUrl.searchParams.set("post_signup", "true");

      console.log("🔄 Redirecting to OAuth with Shopify params:", {
        shop: shopifyContext.shop,
        hasHmac: !!shopifyContext.hmac,
        hasTimestamp: !!shopifyContext.timestamp,
        origin: window.location.origin,
        fullUrl: oauthUrl.toString(),
      });

      // Small delay to ensure webhook processing
      setTimeout(() => {
        window.location.href = oauthUrl.toString();
      }, 1000);
    } else {
      // Regular sign-up, redirect to dashboard
      router.push("/dashboard");
    }
  };
  // Build fallback redirect URL with Shopify context if available
  // This is used by Clerk to redirect after email verification
  const buildFallbackRedirectUrl = () => {
    // Try to get context from state first, then from sessionStorage
    let shop = shopifyContext?.shop;
    let hmac = shopifyContext?.hmac;
    let timestamp = shopifyContext?.timestamp;
    
    // If not in state, try sessionStorage
    if (!shop || !hmac || !timestamp) {
      try {
        const stored = sessionStorage.getItem("shopify_install_context");
        if (stored) {
          const context = JSON.parse(stored);
          shop = shop || context?.shop;
          hmac = hmac || context?.hmac;
          timestamp = timestamp || context?.timestamp;
        }
      } catch (e) {
        console.error("Error reading sessionStorage for fallback URL:", e);
      }
    }
    
    if (shop && hmac && timestamp) {
      const url = new URL("/sign-up", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
      url.searchParams.set("shop", shop);
      url.searchParams.set("hmac", hmac);
      url.searchParams.set("timestamp", timestamp);
      url.searchParams.set("shopify_install", "true");
      return url.toString();
    }
    return undefined;
  };

  // If user is authenticated and has Shopify context, show loading state while redirecting
  if (isLoaded && user && shopifyContext) {
    return (
      <div className="grid w-full grow items-center px-4 sm:justify-center">
        <Card className="w-full sm:w-96">
          <CardHeader>
            <CardTitle>Connecting to Shopify...</CardTitle>
            <CardDescription>
              Please wait while we redirect you to complete the Shopify OAuth flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Icons.spinner className="size-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid w-full grow items-center px-4 sm:justify-center">
      <SignUp.Root>
        <Clerk.Loading>
          {(isGlobalLoading) => (
            <>
              <SignUp.Step name="start">
                <Card className="w-full sm:w-96">
                  <CardHeader>
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>
                      {shopifyContext ? (
                        <div className="flex flex-col gap-2">
                          <span>Complete your account setup to connect with Shopify.</span>
                          <Badge variant="secondary" className="w-fit">
                            🛍️ Installing for: {shopifyContext.shop}
                          </Badge>
                        </div>
                      ) : (
                        "Welcome! Please fill in the details to get started."
                      )}
                    </CardDescription>
                  </CardHeader>
                          <CardContent className="grid gap-y-4">
                            <Clerk.Field name="emailAddress" className="space-y-2">
                              <Clerk.Label asChild>
                                <Label>Email address</Label>
                              </Clerk.Label>
                              <Clerk.Input type="email" required asChild>
                                <Input />
                              </Clerk.Input>
                              <Clerk.FieldError className="text-destructive block text-sm" />
                            </Clerk.Field>
                            <Clerk.Field name="password" className="space-y-2">
                              <Clerk.Label asChild>
                                <Label>Password</Label>
                              </Clerk.Label>
                              <Clerk.Input type="password" required asChild>
                                <Input />
                              </Clerk.Input>
                              <Clerk.FieldError className="text-destructive block text-sm" />
                            </Clerk.Field>
                          </CardContent>
                          <CardFooter>
                            <div className="grid w-full gap-y-4">
                              <SignUp.Captcha className="empty:hidden" />
                              <SignUp.Action 
                                submit 
                                asChild
                                onClick={() => {
                                  // Ensure Shopify context is stored before form submission
                                  if (shopifyContext?.shop && shopifyContext?.hmac && shopifyContext?.timestamp) {
                                    try {
                                      sessionStorage.setItem(
                                        "shopify_install_context",
                                        JSON.stringify({
                                          shop: shopifyContext.shop,
                                          hmac: shopifyContext.hmac,
                                          timestamp: shopifyContext.timestamp,
                                        })
                                      );
                                      console.log("💾 Stored Shopify context before form submission:", {
                                        shop: shopifyContext.shop,
                                      });
                                    } catch (e) {
                                      console.error("Error storing Shopify context before form submission:", e);
                                    }
                                  }
                                }}
                              >
                                <Button disabled={isGlobalLoading}>
                                  <Clerk.Loading>
                                    {(isLoading) => {
                                      return isLoading ? (
                                        <Icons.spinner className="size-4 animate-spin" />
                                      ) : (
                                        "Continue"
                                      );
                                    }}
                                  </Clerk.Loading>
                                </Button>
                              </SignUp.Action>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          // Preserve Shopify context when navigating to sign-in
                          const signInUrl = new URL("/sign-in", window.location.origin);
                          
                          // Get Shopify context from sessionStorage or current URL
                          let shop = shopifyContext?.shop;
                          let hmac = shopifyContext?.hmac;
                          let timestamp = shopifyContext?.timestamp;
                          
                          // If not in state, try to get from sessionStorage
                          if (!shop || !hmac || !timestamp) {
                            try {
                              const stored = sessionStorage.getItem("shopify_install_context");
                              if (stored) {
                                const context = JSON.parse(stored);
                                shop = shop || context?.shop;
                                hmac = hmac || context?.hmac;
                                timestamp = timestamp || context?.timestamp;
                              }
                            } catch (e) {
                              console.error("Error reading sessionStorage:", e);
                            }
                          }
                          
                          // If still not found, try URL params
                          if (!shop) shop = searchParams.get("shop") || undefined;
                          if (!hmac) hmac = searchParams.get("hmac") || undefined;
                          if (!timestamp) timestamp = searchParams.get("timestamp") || undefined;
                          
                          // Add Shopify parameters to sign-in URL if available
                          // For Shopify OAuth, we need at least shop (hmac/timestamp optional for sign-in)
                          if (shop) {
                            signInUrl.searchParams.set("shop", shop);
                            if (hmac) signInUrl.searchParams.set("hmac", hmac);
                            if (timestamp) signInUrl.searchParams.set("timestamp", timestamp);
                            signInUrl.searchParams.set("shopify_install", "true");
                            
                            // Ensure sessionStorage has the full context
                            try {
                              sessionStorage.setItem(
                                "shopify_install_context",
                                JSON.stringify({ shop, hmac, timestamp })
                              );
                            } catch (e) {
                              console.error("Error writing to sessionStorage:", e);
                            }
                            
                            console.log("🔄 Navigating to sign-in with Shopify context:", {
                              shop,
                              hasHmac: !!hmac,
                              hasTimestamp: !!timestamp,
                              url: signInUrl.toString(),
                            });
                            
                            router.push(signInUrl.toString());
                          } else {
                            // Navigate without Shopify context (regular sign-in)
                            router.push("/sign-in");
                          }
                        }}
                      >
                        Already have an account? Sign in
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </SignUp.Step>

              <SignUp.Step name="continue">
                <Card className="w-full sm:w-96">
                  <CardHeader>
                    <CardTitle>Continue registration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Clerk.Field name="username" className="space-y-2">
                      <Clerk.Label>
                        <Label>Username</Label>
                      </Clerk.Label>
                      <Clerk.Input type="text" required asChild>
                        <Input />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-destructive block text-sm" />
                    </Clerk.Field>
                  </CardContent>
                  <CardFooter>
                    <div className="grid w-full gap-y-4">
                      <SignUp.Action submit asChild>
                        <Button disabled={isGlobalLoading}>
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                "Continue"
                              );
                            }}
                          </Clerk.Loading>
                        </Button>
                      </SignUp.Action>
                    </div>
                  </CardFooter>
                </Card>
              </SignUp.Step>

              <SignUp.Step name="verifications">
                <SignUp.Strategy name="email_code">
                  <Card className="w-full sm:w-96">
                    <CardHeader>
                      <CardTitle>Verify your email</CardTitle>
                      <CardDescription>
                        Use the verification link sent to your email address
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-y-4">
                      <div className="grid items-center justify-center gap-y-2">
                        <Clerk.Field name="code" className="space-y-2">
                          <Clerk.Label className="sr-only">Email address</Clerk.Label>
                          <div className="flex justify-center text-center">
                            <Clerk.Input
                              type="otp"
                              className="flex justify-center has-[:disabled]:opacity-50"
                              autoSubmit
                              render={({ value, status }) => {
                                return (
                                  <div
                                    data-status={status}
                                    className={cn(
                                      "border-input relative flex size-10 items-center justify-center border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
                                      {
                                        "ring-ring ring-offset-background z-10 ring-2":
                                          status === "cursor" || status === "selected",
                                      }
                                    )}
                                  >
                                    {value}
                                    {status === "cursor" && (
                                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
                                      </div>
                                    )}
                                  </div>
                                );
                              }}
                            />
                          </div>
                          <Clerk.FieldError className="text-destructive block text-center text-sm" />
                        </Clerk.Field>
                        <SignUp.Action
                          asChild
                          resend
                          className="text-muted-foreground"
                          fallback={({ resendableAfter }: { resendableAfter: number }) => (
                            <Button variant="link" size="sm" disabled>
                              Didn&apos;t receive a code? Resend (
                              <span className="tabular-nums">{resendableAfter}</span>)
                            </Button>
                          )}
                        >
                          <Button type="button" variant="link" size="sm">
                            Didn&apos;t receive a code? Resend
                          </Button>
                        </SignUp.Action>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="grid w-full gap-y-4">
                        <SignUp.Action submit asChild>
                          <Button
                            disabled={isGlobalLoading}
                            onClick={() => {
                              // Handle completion after verification
                              setTimeout(handleSignUpComplete, 2000);
                            }}
                          >
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-4 animate-spin" />
                                ) : shopifyContext ? (
                                  "Complete & Connect to Shopify"
                                ) : (
                                  "Continue"
                                );
                              }}
                            </Clerk.Loading>
                          </Button>
                        </SignUp.Action>
                      </div>
                    </CardFooter>
                  </Card>
                </SignUp.Strategy>
              </SignUp.Step>
            </>
          )}
        </Clerk.Loading>
      </SignUp.Root>
    </div>
  );
}
