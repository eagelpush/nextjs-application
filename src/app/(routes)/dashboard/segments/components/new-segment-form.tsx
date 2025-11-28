"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { ConditionBuilder } from "./condition-builder";
import { EstimatedCount } from "./estimated-count";
import { newSegmentFormSchema, type NewSegmentFormValues } from "../utils/form-schema";
import type { SegmentCondition, Segment } from "../types";
import { SEGMENT_TYPE_OPTIONS } from "../constants";

interface NewSegmentFormProps {
  onSave: (data: NewSegmentFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Segment;
}

export function NewSegmentForm({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
}: NewSegmentFormProps) {
  const router = useRouter();
  const [estimatedCount, setEstimatedCount] = useState(initialData?.subscriberCount || 0);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<NewSegmentFormValues>({
    resolver: zodResolver(newSegmentFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          type: initialData.type,
          conditions:
            initialData.conditions && initialData.conditions.length > 0
              ? initialData.conditions
              : [
                  {
                    id: crypto.randomUUID(),
                    type: "property",
                    category: "",
                    operator: "",
                    logicalOperator: "AND",
                  },
                ],
        }
      : {
          name: "",
          description: "",
          type: "dynamic",
          conditions: [
            {
              id: crypto.randomUUID(),
              type: "property",
              category: "",
              operator: "",
              logicalOperator: "OR",
            },
          ],
        },
  });

  const { watch, setValue } = form;
  const conditions = watch("conditions");

  // Helper function to recalculate estimate
  const recalculateEstimate = async (newConditions: SegmentCondition[]) => {
    setIsCalculating(true);
    try {
      const response = await fetch("/api/segments/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions: newConditions }),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimatedCount(data.estimatedCount || 0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to estimate segment count:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || "Unknown error",
        });
        setEstimatedCount(0);
      }
    } catch (error) {
      console.error("Error estimating segment count:", error);
      setEstimatedCount(0);
    } finally {
      setIsCalculating(false);
    }
  };

  const addCondition = async () => {
    try {
      const newCondition: SegmentCondition = {
        id: crypto.randomUUID(),
        type: "property",
        category: "",
        operator: "",
        logicalOperator: "AND",
      };

      const newConditions = [...conditions, newCondition];
      setValue("conditions", newConditions);

      // Recalculate estimate with new condition
      await recalculateEstimate(newConditions);
    } catch (error) {
      console.error("Error adding condition:", error);
      // Don't break the UI, just log the error
    }
  };

  const updateCondition = async (index: number, updatedCondition: SegmentCondition) => {
    try {
      const newConditions = [...conditions];
      newConditions[index] = updatedCondition;
      setValue("conditions", newConditions); // For React Hook Form

      // Recalculate estimated count using real data
      await recalculateEstimate(newConditions);
    } catch (error) {
      console.error("Error updating condition:", error);
      // Don't break the UI, just log the error
    }
  };

  const deleteCondition = async (index: number) => {
    if (conditions.length > 1) {
      const newConditions = conditions.filter((_, i) => i !== index);
      setValue("conditions", newConditions);

      // Recalculate estimate after deletion
      await recalculateEstimate(newConditions);
    }
  };

  const onSubmit = (data: NewSegmentFormValues) => {
    onSave(data);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {initialData ? "Edit Segment" : "Create New Segment"}
                </h1>
                <p className="text-muted-foreground">
                  {initialData
                    ? "Modify your segment's details"
                    : "Build targeted audience segments for your campaigns"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Form */}
              <div className="space-y-6 lg:col-span-2">
                {/* Basic Information */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-xl">Basic Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., High-Value Customers" {...field} />
                          </FormControl>
                          <FormDescription>Give your segment a descriptive name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what this segment represents..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Add a description to help others understand this segment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select segment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SEGMENT_TYPE_OPTIONS.filter((opt) => opt.value !== "all").map(
                                (option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Dynamic segments update automatically, static segments are fixed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Segment Definition */}
                <Card className="border-primary/10 from-background via-background to-primary/5 border-2 bg-gradient-to-br">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      {/* <div className="p-2 bg-primary/10 rounded-lg">
                        <div className="w-5 h-5 bg-primary rounded opacity-80"></div>
                      </div> */}
                      <div>
                        <CardTitle className="text-xl">Build your segment</CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Define the criteria that subscribers must meet to be included in this
                          segment
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <FormField
                      control={form.control}
                      name="conditions"
                      render={() => (
                        <FormItem>
                          <div className="space-y-6">
                            {conditions.length === 0 && (
                              <div className="text-muted-foreground py-8 text-center">
                                <div className="mb-4">
                                  <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                                    <Plus className="h-6 w-6" />
                                  </div>
                                </div>
                                <p>No conditions added yet</p>
                                <p className="text-xs">
                                  Add your first condition to start building your segment
                                </p>
                              </div>
                            )}

                            {conditions.map((condition, index) => (
                              <div key={condition.id} className="relative">
                                <ConditionBuilder
                                  condition={condition}
                                  onUpdate={(updatedCondition) =>
                                    updateCondition(index, updatedCondition)
                                  }
                                  onDelete={() => deleteCondition(index)}
                                  showLogicalOperator={index > 0}
                                  onLogicalOperatorChange={(operator) => {
                                    const updatedCondition = {
                                      ...condition,
                                      logicalOperator: operator,
                                    };
                                    updateCondition(index, updatedCondition);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add Condition Buttons */}
                    <div className="bg-muted/30 border-border/60 mt-8 rounded-xl border border-dashed p-4">
                      <div className="mb-4 text-center">
                        <div className="text-muted-foreground mb-2 text-sm font-medium">
                          Add another condition
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Use &quot;AND&quot; to narrow your audience, &quot;OR&quot; to broaden it
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCondition}
                          className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 h-11 flex-1"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add &quot;OR&quot; condition
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCondition}
                          className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 h-11 flex-1"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add &quot;AND&quot; condition
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Estimated Count */}
                <EstimatedCount count={estimatedCount} isLoading={isCalculating} />

                {/* Actions */}
                <Card className="border-primary/20 from-primary/5 to-background bg-gradient-to-br shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <Button
                      type="submit"
                      className="h-11 w-full text-sm font-medium"
                      disabled={isLoading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading
                        ? initialData
                          ? "Updating..."
                          : "Creating..."
                        : initialData
                          ? "Update Segment"
                          : "Create Segment"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full text-sm font-medium"
                      onClick={onCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="border-border/60 from-muted/30 to-background bg-gradient-to-br shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <span className="text-sm text-amber-600 dark:text-amber-400">💡</span>
                      </div>
                      <h3 className="text-foreground font-semibold">Pro Tips</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"></div>
                        <p className="text-muted-foreground">
                          Use &quot;AND&quot; conditions to narrow your audience
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"></div>
                        <p className="text-muted-foreground">
                          Use &quot;OR&quot; conditions to broaden your audience
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"></div>
                        <p className="text-muted-foreground">
                          Dynamic segments update automatically as new data comes in
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"></div>
                        <p className="text-muted-foreground">
                          Static segments remain fixed once created
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
