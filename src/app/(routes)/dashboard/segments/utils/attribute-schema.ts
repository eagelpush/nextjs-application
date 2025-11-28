import { z } from "zod";

export const newAttributeFormSchema = z.object({
  name: z
    .string()
    .min(2, "Attribute name must be at least 2 characters")
    .max(50, "Attribute name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s_-]+$/,
      "Attribute name can only contain letters, numbers, spaces, underscores, and hyphens"
    ),
  type: z
    .enum(["text", "number", "multiple_choice", "date", "category", "boolean", "email", "url"])
    .refine((val) => !!val, { message: "Attribute type is required" }),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  required: z.boolean(),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options are required for multiple choice")
    .max(10, "Maximum 10 options allowed")
    .optional(),
});

export type NewAttributeFormValues = z.infer<typeof newAttributeFormSchema>;
