import { CreditCard, DollarSign, Calendar, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Billing & Payments
        </h2>
        <p className="text-muted-foreground">
          Manage your subscription, billing information, and payment methods.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription and usage information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Free Plan</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Perfect for getting started with Push Eagle
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-muted-foreground text-sm">per month</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Plan Features</h4>
            <ul className="text-muted-foreground grid gap-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Up to 1,000 API calls per month
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Basic stock analysis features
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Email support
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                7-day data retention
              </li>
            </ul>
          </div>

          <Button className="w-full sm:w-auto">Upgrade to Pro</Button>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment methods and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-6 text-center">
            <CreditCard className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <h3 className="mb-1 font-medium">No payment method added</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Add a payment method to upgrade your plan and access premium
              features.
            </p>
            <Button variant="outline">Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Calendar className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <h3 className="mb-1 font-medium">No billing history</h3>
            <p className="text-muted-foreground text-sm">
              Your billing history will appear here once you start using paid
              features.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Information about payment security and data protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Secure Payments</h4>
              <p className="text-muted-foreground text-sm">
                All payments are processed securely using industry-standard
                encryption.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Data Protection</h4>
              <p className="text-muted-foreground text-sm">
                We never store your payment information on our servers.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Refund Policy</h4>
              <p className="text-muted-foreground text-sm">
                30-day money-back guarantee on all paid plans.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Cancel Anytime</h4>
              <p className="text-muted-foreground text-sm">
                No long-term commitments. Cancel your subscription at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
