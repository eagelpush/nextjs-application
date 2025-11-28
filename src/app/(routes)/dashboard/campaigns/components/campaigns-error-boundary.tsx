"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Home, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CampaignsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CampaignsErrorBoundary] Error caught:", error, errorInfo);
    // You can also log the error to an error reporting service here
    // Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally, re-fetch data or navigate
    // window.location.reload();
  };

  private handleGoHome = () => {
    // Navigate to dashboard home
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center justify-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Campaign Error
              </CardTitle>
              <CardDescription>
                Something went wrong while loading campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We&apos;re sorry, but an unexpected error occurred while loading
                your campaigns. This might be due to a network issue or a
                temporary service problem.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="bg-muted mt-4 rounded-md p-2 text-left text-sm whitespace-pre-wrap">
                  <summary className="mb-2 cursor-pointer font-medium">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useCampaignsErrorHandler() {
  // const router = useRouter();

  const handleCampaignsError = (error: Error, errorInfo?: unknown) => {
    console.error("[CampaignsErrorHandler] Error:", error, errorInfo);

    // You can add custom error handling logic here
    // For example, show a toast notification
    // toast.error("Failed to load campaigns. Please try again.");

    // Or redirect to an error page
    // router.push("/dashboard/campaigns/error");
  };

  return { handleCampaignsError };
}
