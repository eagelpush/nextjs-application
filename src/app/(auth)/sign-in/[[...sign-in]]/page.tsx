"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
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
import { Badge } from "@/components/ui/badge";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shopifyContext, setShopifyContext] = useState<{
    shop: string;
    hmac?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    // Check for Shopify installation context from URL params first
    const shopFromUrl = searchParams.get("shop");
    const hmacFromUrl = searchParams.get("hmac");
    const timestampFromUrl = searchParams.get("timestamp");
    const shopifyInstall = searchParams.get("shopify_install");

    // Check sessionStorage for persistence
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

    // Prefer URL params, fallback to sessionStorage
    const shop = shopFromUrl || storedContext?.shop;
    const hmac = hmacFromUrl || storedContext?.hmac;
    const timestamp = timestampFromUrl || storedContext?.timestamp;

    // Only update state if it actually changed
    if (shop && (shopifyInstall === "true" || storedContext)) {
      // Store in sessionStorage if from URL (preserve all context for sign-up navigation)
      if (shopFromUrl) {
        try {
          const contextToStore: { shop: string; hmac?: string; timestamp?: string } = { shop };
          if (hmacFromUrl) contextToStore.hmac = hmacFromUrl;
          if (timestampFromUrl) contextToStore.timestamp = timestampFromUrl;
          
          sessionStorage.setItem(
            "shopify_install_context",
            JSON.stringify(contextToStore)
          );
        } catch (e) {
          console.error("Error writing to sessionStorage:", e);
        }
      }

      if (!shopifyContext || shopifyContext.shop !== shop) {
        console.log("🛍️ Sign-in with Shopify context:", { 
          shop, 
          hasHmac: !!hmac,
          hasTimestamp: !!timestamp,
          source: shopFromUrl ? "URL" : "SessionStorage" 
        });
        setShopifyContext({ shop, hmac, timestamp });
      }
    } else if (shopifyContext) {
      setShopifyContext(null);
      try {
        sessionStorage.removeItem("shopify_install_context");
      } catch (e) {
        console.error("Error clearing sessionStorage:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle successful sign-in completion
  const handleSignInComplete = () => {
    // Clear sessionStorage after completion
    try {
      sessionStorage.removeItem("shopify_install_context");
    } catch (e) {
      console.error("Error clearing sessionStorage:", e);
    }

    if (shopifyContext) {
      console.log("✅ Sign-in completed, redirecting to Shopify OAuth");
      // Redirect to Shopify OAuth completion after successful sign-in
      const oauthUrl = new URL("/api/shopify/login", window.location.origin);
      oauthUrl.searchParams.set("shop", shopifyContext.shop);
      oauthUrl.searchParams.set("post_signin", "true");

      console.log("🔄 Redirecting to OAuth with Shopify params:", {
        shop: shopifyContext.shop,
        origin: window.location.origin,
        fullUrl: oauthUrl.toString(),
      });

      // Small delay to ensure webhook processing
      setTimeout(() => {
        window.location.href = oauthUrl.toString();
      }, 1000);
    } else {
      // Regular sign-in, redirect to dashboard
      router.push("/dashboard");
    }
  };
  return (
    <div className="grid w-full grow items-center px-4 sm:justify-center">
      <SignIn.Root>
        <Clerk.Loading>
          {(isGlobalLoading) => (
            <>
              <SignIn.Step name="start">
                <Card className="w-full sm:w-96">
                  <CardHeader>
                    <CardTitle>Sign in to Push Eagle</CardTitle>
                    <CardDescription>
                      {shopifyContext ? (
                        <div className="flex flex-col gap-2">
                          <span>Complete your sign-in to connect with Shopify.</span>
                          <Badge variant="secondary" className="w-fit">
                            🛍️ Installing for: {shopifyContext.shop}
                          </Badge>
                        </div>
                      ) : (
                        "Welcome back! Please sign in to continue"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-y-4">
                    <Clerk.Field name="identifier" className="space-y-2">
                      <Clerk.Label asChild>
                        <Label>Email address</Label>
                      </Clerk.Label>
                      <Clerk.Input type="email" required asChild>
                        <Input />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-destructive block text-sm" />
                    </Clerk.Field>
                  </CardContent>
                  <CardFooter>
                    <div className="grid w-full gap-y-4">
                      <SignIn.Action submit asChild>
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
                      </SignIn.Action>

                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          // Preserve Shopify context when navigating to sign-up
                          const signUpUrl = new URL("/sign-up", window.location.origin);
                          
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
                          
                          // Add Shopify parameters to sign-up URL if available
                          // For Shopify OAuth, we need all three parameters
                          if (shop && hmac && timestamp) {
                            signUpUrl.searchParams.set("shop", shop);
                            signUpUrl.searchParams.set("hmac", hmac);
                            signUpUrl.searchParams.set("timestamp", timestamp);
                            signUpUrl.searchParams.set("shopify_install", "true");
                            
                            // Ensure sessionStorage has the full context
                            try {
                              sessionStorage.setItem(
                                "shopify_install_context",
                                JSON.stringify({ shop, hmac, timestamp })
                              );
                            } catch (e) {
                              console.error("Error writing to sessionStorage:", e);
                            }
                            
                            console.log("🔄 Navigating to sign-up with Shopify context:", {
                              shop,
                              hasHmac: !!hmac,
                              hasTimestamp: !!timestamp,
                              url: signUpUrl.toString(),
                            });
                            
                            router.push(signUpUrl.toString());
                          } else {
                            // If Shopify context is incomplete, still navigate but log warning
                            console.warn("⚠️ Incomplete Shopify context when navigating to sign-up:", {
                              shop: !!shop,
                              hmac: !!hmac,
                              timestamp: !!timestamp,
                            });
                            // Navigate without Shopify context (regular sign-up)
                            router.push("/sign-up");
                          }
                        }}
                      >
                        Don&apos;t have an account? Sign up
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </SignIn.Step>

              <SignIn.Step name="choose-strategy">
                <Card className="w-full sm:w-96">
                  <CardHeader>
                    <CardTitle>Use another method</CardTitle>
                    <CardDescription>
                      Facing issues? You can use any of these methods to sign in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-y-4">
                    <SignIn.SupportedStrategy name="email_code" asChild>
                      <Button type="button" variant="link" disabled={isGlobalLoading}>
                        Email code
                      </Button>
                    </SignIn.SupportedStrategy>
                    <SignIn.SupportedStrategy name="password" asChild>
                      <Button type="button" variant="link" disabled={isGlobalLoading}>
                        Password
                      </Button>
                    </SignIn.SupportedStrategy>
                  </CardContent>
                  <CardFooter>
                    <div className="grid w-full gap-y-4">
                      <SignIn.Action navigate="previous" asChild>
                        <Button disabled={isGlobalLoading}>
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                "Go back"
                              );
                            }}
                          </Clerk.Loading>
                        </Button>
                      </SignIn.Action>
                    </div>
                  </CardFooter>
                </Card>
              </SignIn.Step>

              <SignIn.Step name="verifications">
                <SignIn.Strategy name="password">
                  <Card className="w-full sm:w-96">
                    <CardHeader>
                      <CardTitle>Enter your password</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Welcome back <SignIn.SafeIdentifier />
                      </p>
                    </CardHeader>
                    <CardContent className="grid gap-y-4">
                      <Clerk.Field name="password" className="space-y-2">
                        <Clerk.Label asChild>
                          <Label>Password</Label>
                        </Clerk.Label>
                        <Clerk.Input type="password" asChild>
                          <Input />
                        </Clerk.Input>
                        <Clerk.FieldError className="text-destructive block text-sm" />
                      </Clerk.Field>
                    </CardContent>
                    <CardFooter>
                      <div className="grid w-full gap-y-4">
                        <SignIn.Action submit asChild>
                          <Button
                            disabled={isGlobalLoading}
                            onClick={() => {
                              // Handle completion after password verification
                              setTimeout(handleSignInComplete, 2000);
                            }}
                          >
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-4 animate-spin" />
                                ) : shopifyContext ? (
                                  "Sign In & Connect to Shopify"
                                ) : (
                                  "Continue"
                                );
                              }}
                            </Clerk.Loading>
                          </Button>
                        </SignIn.Action>
                        <SignIn.Action navigate="choose-strategy" asChild>
                          <Button type="button" size="sm" variant="link">
                            Use another method
                          </Button>
                        </SignIn.Action>
                      </div>
                    </CardFooter>
                  </Card>
                </SignIn.Strategy>

                <SignIn.Strategy name="email_code">
                  <Card className="w-full sm:w-96">
                    <CardHeader>
                      <CardTitle>Check your email</CardTitle>
                      <CardDescription>
                        Enter the verification code sent to your email
                      </CardDescription>
                      <p className="text-muted-foreground text-sm">
                        Welcome back <SignIn.SafeIdentifier />
                      </p>
                    </CardHeader>
                    <CardContent className="grid gap-y-4">
                      <Clerk.Field name="code">
                        <Clerk.Label className="sr-only">Email verification code</Clerk.Label>
                        <div className="grid items-center justify-center gap-y-2">
                          <div className="flex justify-center text-center">
                            <Clerk.Input
                              type="otp"
                              autoSubmit
                              className="flex justify-center has-disabled:opacity-50"
                              render={({ value, status }) => {
                                return (
                                  <div
                                    data-status={status}
                                    className="border-input data-[status=selected]:ring-ring data-[status=cursor]:ring-ring relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md data-[status=cursor]:ring-1 data-[status=selected]:ring-1"
                                  >
                                    {value}
                                  </div>
                                );
                              }}
                            />
                          </div>
                          <Clerk.FieldError className="text-destructive block text-center text-sm" />
                          <SignIn.Action
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
                            <Button variant="link" size="sm">
                              Didn&apos;t receive a code? Resend
                            </Button>
                          </SignIn.Action>
                        </div>
                      </Clerk.Field>
                    </CardContent>
                    <CardFooter>
                      <div className="grid w-full gap-y-4">
                        <SignIn.Action submit asChild>
                          <Button
                            disabled={isGlobalLoading}
                            onClick={() => {
                              // Handle completion after email code verification
                              setTimeout(handleSignInComplete, 2000);
                            }}
                          >
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-4 animate-spin" />
                                ) : shopifyContext ? (
                                  "Sign In & Connect to Shopify"
                                ) : (
                                  "Continue"
                                );
                              }}
                            </Clerk.Loading>
                          </Button>
                        </SignIn.Action>
                        <SignIn.Action navigate="choose-strategy" asChild>
                          <Button size="sm" variant="link">
                            Use another method
                          </Button>
                        </SignIn.Action>
                      </div>
                    </CardFooter>
                  </Card>
                </SignIn.Strategy>
              </SignIn.Step>
            </>
          )}
        </Clerk.Loading>
      </SignIn.Root>
    </div>
  );
}
