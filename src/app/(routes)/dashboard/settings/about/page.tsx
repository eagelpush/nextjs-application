import Link from "next/link";

import { ExternalLink, Github, Globe, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">About</h2>
        <p className="text-muted-foreground">
          Learn more about Push Eagle and get support information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            About Push Eagle
          </CardTitle>
          <CardDescription>
            AI-powered stock analysis and recommendations platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Version</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">v1.0.0</Badge>
                <span className="text-muted-foreground text-sm">Latest</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Developer</h4>
              <p className="text-muted-foreground text-sm">GIZMOFACTS</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Description</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Push Eagle is a cutting-edge platform that provides AI-powered
              stock recommendations based on real-time market data and news
              analysis. Our sophisticated algorithms analyze market trends,
              company fundamentals, and sentiment data to deliver actionable
              insights for both novice and experienced investors.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Key Features</h4>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                AI-powered stock analysis and predictions
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Real-time market data and news integration
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Professional portfolio management tools
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                Risk assessment and confidence scoring
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support & Contact</CardTitle>
          <CardDescription>
            Need help or have questions? We&apos;re here to assist you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Our support team is available to help you with any questions or
            issues you may have. We&apos;re committed to providing the best
            possible experience for all our users.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/support">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href="https://github.com/gizmofacts"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
