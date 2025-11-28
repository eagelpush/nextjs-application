"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { SegmentCondition } from "../types";
import {
  SEGMENT_CRITERIA,
  COUNT_OPTIONS,
  ACTION_DATE_OPTIONS,
  SUBSCRIBE_DATE_OPTIONS,
  LOCATION_OPERATOR_OPTIONS,
  DEVICE_OPERATOR_OPTIONS,
  TIME_UNITS,
  COUNTRIES,
  REGIONS,
  CITIES,
  DEVICE_TYPES,
  SUBSCRIPTION_PLANS,
} from "../constants";
import React from "react";

interface ConditionBuilderProps {
  condition: SegmentCondition;
  onUpdate: (condition: SegmentCondition) => void;
  onDelete: () => void;
  showLogicalOperator?: boolean;
  onLogicalOperatorChange?: (operator: "AND" | "OR") => void;
}

export function ConditionBuilder({
  condition,
  onUpdate,
  onDelete,
  showLogicalOperator = false,
  onLogicalOperatorChange,
}: ConditionBuilderProps) {
  const handleFieldUpdate = (
    field: keyof SegmentCondition,
    value: string | number | Date | undefined
  ) => {
    onUpdate({
      ...condition,
      [field]: value,
    });
  };

  const getCategoryOptions = () => {
    return condition.type === "action"
      ? SEGMENT_CRITERIA.actions
      : SEGMENT_CRITERIA.properties;
  };

  const getOperatorOptions = () => {
    if (condition.category === "subscribed") {
      return SUBSCRIBE_DATE_OPTIONS;
    }
    if (condition.category === "location") {
      return LOCATION_OPERATOR_OPTIONS;
    }
    if (condition.category === "device_type") {
      return DEVICE_OPERATOR_OPTIONS;
    }
    if (condition.type === "action") {
      return COUNT_OPTIONS;
    }
    return ACTION_DATE_OPTIONS;
  };

  const renderAdditionalFields = () => {
    // Location fields
    if (condition.category === "location") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select
            value={condition.locationCountry || ""}
            onValueChange={(value) =>
              handleFieldUpdate("locationCountry", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.locationRegion || ""}
            onValueChange={(value) =>
              handleFieldUpdate("locationRegion", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.locationCity || ""}
            onValueChange={(value) => handleFieldUpdate("locationCity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Device type selection
    if (condition.category === "device_type") {
      return (
        <Select
          value={condition.value || ""}
          onValueChange={(value) => handleFieldUpdate("value", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select device type" />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_TYPES.map((device) => (
              <SelectItem key={device.value} value={device.value}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Subscription plan selection
    if (condition.category === "subscription_plan") {
      return (
        <Select
          value={condition.value || ""}
          onValueChange={(value) => handleFieldUpdate("value", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <SelectItem key={plan.value} value={plan.value}>
                {plan.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Number input for count-based operators
    if (["more_than", "less_than", "exactly"].includes(condition.operator)) {
      return (
        <Input
          type="number"
          placeholder="Enter number"
          value={condition.numberValue || ""}
          onChange={(e) =>
            handleFieldUpdate("numberValue", Number(e.target.value))
          }
          className="bg-background/60 h-10"
        />
      );
    }

    // Date and time unit inputs
    if (
      ["in_last", "more_than_ago", "less_than_ago"].includes(condition.operator)
    ) {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Number"
            value={condition.numberValue || ""}
            onChange={(e) =>
              handleFieldUpdate("numberValue", Number(e.target.value))
            }
          />
          <Select
            value={condition.dateUnit || ""}
            onValueChange={(value) => handleFieldUpdate("dateUnit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Time unit" />
            </SelectTrigger>
            <SelectContent>
              {TIME_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Date input for before/after operators
    if (["before", "after"].includes(condition.operator)) {
      return (
        <Input
          type="date"
          value={condition.dateValue || ""}
          onChange={(e) => handleFieldUpdate("dateValue", e.target.value)}
        />
      );
    }

    // Text input for custom values
    if (condition.category === "customer_tag") {
      return (
        <Input
          placeholder="Enter tag name"
          value={condition.value || ""}
          onChange={(e) => handleFieldUpdate("value", e.target.value)}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative">
      {/* Logical Operator */}
      {showLogicalOperator && (
        <div className="-mt-3 mb-4 flex items-center justify-center">
          <div className="bg-background border-border rounded-full border px-1 py-1 shadow-sm">
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant={
                  condition.logicalOperator === "AND" ? "default" : "ghost"
                }
                size="sm"
                className="h-7 rounded-xl px-3 text-xs font-medium"
                onClick={() => {
                  handleFieldUpdate("logicalOperator", "AND");
                  onLogicalOperatorChange?.("AND");
                }}
              >
                AND
              </Button>
              <div className="bg-border h-4 w-px"></div>
              <Button
                type="button"
                variant={
                  condition.logicalOperator === "OR" ? "default" : "ghost"
                }
                size="sm"
                className="h-7 rounded-xl px-4 text-xs font-medium"
                onClick={() => {
                  handleFieldUpdate("logicalOperator", "OR");
                  onLogicalOperatorChange?.("OR");
                }}
              >
                OR
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="border-border/60 from-background to-muted/20 border bg-gradient-to-br shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-6">
          <div className="space-y-5">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-primary h-2 w-2 rounded-full"></div>
                <span className="text-muted-foreground text-sm font-medium">
                  Condition {condition.id.slice(-4)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Content */}
            <div className="space-y-5">
              {/* Type and Category Selection */}
              <div className="space-y-3">
                <div className="text-foreground text-sm font-medium">
                  Subscriber has
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Type
                    </label>
                    <Select
                      value={condition.type}
                      onValueChange={(value: "action" | "property") => {
                        handleFieldUpdate("type", value);
                        handleFieldUpdate("category", ""); // Reset category when type changes
                      }}
                      disabled
                    >
                      <SelectTrigger className="bg-background/50 h-10">
                        <SelectValue placeholder="Property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property">Property</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      Action conditions require behavior tracking (coming soon)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Category
                    </label>
                    <Select
                      value={condition.category}
                      onValueChange={(value) =>
                        handleFieldUpdate("category", value)
                      }
                      disabled={!condition.type}
                    >
                      <SelectTrigger className="bg-background/50 h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Operator Selection */}
              {condition.category && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-border h-px w-8"></div>
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Condition
                    </span>
                    <div className="bg-border h-px flex-1"></div>
                  </div>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) =>
                      handleFieldUpdate("operator", value)
                    }
                  >
                    <SelectTrigger className="bg-background/50 h-10">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Additional Fields */}
              {condition.operator && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-border h-px w-8"></div>
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Value
                    </span>
                    <div className="bg-border h-px flex-1"></div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    {renderAdditionalFields()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
