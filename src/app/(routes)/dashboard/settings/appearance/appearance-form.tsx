"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const themes = [
  {
    value: "light",
    label: "Light",
    description: "Clean and bright interface",
    icon: Sun,
    preview: (
      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
      </div>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes in low light",
    icon: Moon,
    preview: (
      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
      </div>
    ),
  },
  {
    value: "system",
    label: "System",
    description: "Adapts to your device settings",
    icon: Monitor,
    preview: (
      <div className="space-y-2 rounded-sm bg-gradient-to-br from-slate-100 to-slate-950 p-2">
        <div className="space-y-2 rounded-md bg-white/80 p-2 shadow-sm">
          <div className="h-2 w-[80px] rounded-lg bg-slate-300" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-300" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800/80 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white/80 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-300" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-300" />
        </div>
      </div>
    ),
  },
];

export function AppearanceForm() {
  const { setTheme, theme } = useTheme();

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast.success(`Theme changed to ${value}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose how the dashboard appears to you. Select a single theme, or sync with your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={theme || "system"}
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <div key={themeOption.value} className="relative">
                <RadioGroupItem
                  value={themeOption.value}
                  id={themeOption.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={themeOption.value}
                  className={cn(
                    "border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer rounded-lg border-2 p-4",
                    "flex flex-col items-center justify-center gap-3 transition-all"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{themeOption.label}</span>
                  </div>
                  <div className="w-full overflow-hidden rounded-md border">
                    {themeOption.preview}
                  </div>
                  <p className="text-muted-foreground text-center text-xs">
                    {themeOption.description}
                  </p>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
