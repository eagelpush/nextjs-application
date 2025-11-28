import { z } from "zod";

export const segmentConditionSchema = z
  .object({
    id: z.string(),
    type: z.enum(["action", "property"]),
    category: z.string().min(1, "Please select a category"),
    operator: z.string().min(1, "Please select an operator"),
    value: z.string().optional(),
    dateValue: z.string().optional(),
    dateUnit: z.string().optional(),
    numberValue: z.number().optional(),
    locationCountry: z.string().optional(),
    locationRegion: z.string().optional(),
    locationCity: z.string().optional(),
    logicalOperator: z.enum(["AND", "OR"]).optional(),
  })
  .refine(
    (data) => {
      // ✅ Validate that conditions have required values based on their type

      // Location conditions must have at least one location field
      if (data.category === "location") {
        return !!(
          data.locationCountry ||
          data.locationCity ||
          data.locationRegion
        );
      }

      // Device conditions with specific values must have value
      if (
        data.category === "device_type" &&
        (data.operator === "is" || data.operator === "is_not")
      ) {
        return !!data.value;
      }

      // Number-based operators must have numberValue
      if (["more_than", "less_than", "exactly"].includes(data.operator)) {
        return typeof data.numberValue === "number" && data.numberValue >= 0;
      }

      // Date-based operators must have appropriate values
      if (
        ["in_last", "more_than_ago", "less_than_ago"].includes(data.operator)
      ) {
        return typeof data.numberValue === "number" && !!data.dateUnit;
      }

      if (["before", "after"].includes(data.operator)) {
        return !!data.dateValue;
      }

      return true;
    },
    {
      message: "Please complete all required fields for this condition",
    }
  );

export const newSegmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Segment name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  type: z.enum(["dynamic", "static", "behavior"]),
  conditions: z
    .array(segmentConditionSchema)
    .min(1, "At least one condition is required"),
});

export type NewSegmentFormValues = z.infer<typeof newSegmentFormSchema>;
export type SegmentConditionValues = z.infer<typeof segmentConditionSchema>;
