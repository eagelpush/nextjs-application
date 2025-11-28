import { z } from "zod";

export const formSchema = z.object({
  firstname: z
    .string()
    .min(2, {
      message: "First name must be at least 2 characters long",
    })
    .max(50, {
      message: "First name must be no more than 50 characters long",
    }),
  lastname: z
    .string()
    .min(2, {
      message: "Last name must be at least 2 characters long",
    })
    .max(50, {
      message: "Last name must be no more than 50 characters long",
    }),
  storeName: z
    .string()
    .min(2, {
      message: "Store name must be at least 2 characters long",
    })
    .max(100, {
      message: "Store name must be no more than 100 characters long",
    }),
});

export const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required",
  }),
  newPassword: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(128, {
      message: "Password must be no more than 128 characters long",
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
});

export const supportformSchema = z.object({
  firstname: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastname: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  message: z.string().min(2, {
    message: "Please enter a message.",
  }),
});

// Add schema for user settings
export const userSettingsSchema = z.object({
  allowSupport: z.boolean(),
  ipAddressOption: z.enum(["anonymized", "no-ip"]),
  enableGeo: z.boolean(),
  enablePreferences: z.boolean(),
  emailStoreOption: z.enum(["full-email", "hash-email", "no-email"]),
  locationStoreOption: z.enum(["yes", "no"]),
  nameStoreOption: z.enum(["yes", "no"]),
  attributionModel: z.enum(["impression", "click"]),
  notificationPreferences: z.any().optional(),
});
