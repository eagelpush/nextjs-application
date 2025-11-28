"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get merchant account data using Clerk authentication
const getUserAccountData = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: "[AUTH_ERROR] - getUserAccountData: Unauthorized",
        data: null,
      };
    }

    // Get merchant data from database using clerkId
    const merchant = await prisma.merchant.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        emailVerified: true,
        storeName: true,
        storeUrl: true,
        subdomain: true,
        storeImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!merchant) {
      return {
        error: "[NOT_FOUND] - getUserAccountData: Merchant not found",
        data: null,
      };
    }

    // Map Merchant to expected format
    const merchantData = {
      id: merchant.id,
      email: merchant.email,
      firstName: merchant.firstName,
      lastName: merchant.lastName,
      storeName: merchant.storeName,
      storeImageUrl: merchant.storeImageUrl || merchant.image,
      emailVerified: merchant.emailVerified,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
    };

    return {
      data: merchantData,
      error: null,
    };
  } catch (error) {
    return {
      error: `[PRISMA_ACTION_ERROR] - getUserAccountData: ${error}`,
      data: null,
    };
  }
};

const updateUserAccountData = async (
  data: {
    firstName?: string;
    lastName?: string;
    storeName?: string;
    storeImageUrl?: string | null;
  }
) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: "[AUTH_ERROR] - updateUserAccountData: Unauthorized",
        data: null,
      };
    }

    const { firstName, lastName, storeName, storeImageUrl } = data;

    // Build update data for database
    const updateData: {
      firstName?: string;
      lastName?: string;
      storeName?: string;
      storeImageUrl?: string | null;
      image?: string | null;
    } = {};

    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }

    if (storeName !== undefined) {
      updateData.storeName = storeName;
    }

    if (storeImageUrl !== undefined) {
      updateData.storeImageUrl = storeImageUrl;
      updateData.image = storeImageUrl; // Also update image field for consistency
    }

    // Only proceed with update if there's data to update
    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    // Update merchant in database
    const updatedMerchant = await prisma.merchant.update({
      where: {
        clerkId: userId,
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        storeName: true,
        storeImageUrl: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!updatedMerchant) {
      throw new Error("Merchant not found after update");
    }

    // Sync with Clerk dashboard using clerkClient
    // Note: Profile image should be updated via client-side user.setProfileImage()
    // This syncs name data to Clerk dashboard
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        firstName: updatedMerchant.firstName || undefined,
        lastName: updatedMerchant.lastName || undefined,
        // Store image URL in metadata for reference
        unsafeMetadata: {
          storeImageUrl: updatedMerchant.storeImageUrl || updatedMerchant.image || null,
        },
      });
    } catch (clerkError) {
      // Log error but don't fail the request since database update succeeded
      console.error("[CLERK_SYNC_ERROR] - Failed to sync with Clerk:", clerkError);
    }

    // Return in expected format
    const result = {
      id: updatedMerchant.id,
      email: updatedMerchant.email,
      firstName: updatedMerchant.firstName,
      lastName: updatedMerchant.lastName,
      storeName: updatedMerchant.storeName,
      storeImageUrl: updatedMerchant.storeImageUrl || updatedMerchant.image,
      emailVerified: updatedMerchant.emailVerified,
      createdAt: updatedMerchant.createdAt,
      updatedAt: updatedMerchant.updatedAt,
    };

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    return {
      error: `[PRISMA_ACTION_ERROR] - updateUserAccountData: ${error}`,
      data: null,
    };
  }
};

const deleteUserAccountData = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: "[AUTH_ERROR] - deleteUserAccountData: Unauthorized",
        data: null,
      };
    }

    // Get merchant before deletion for return value
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!merchant) {
      return {
        error: "[NOT_FOUND] - deleteUserAccountData: Merchant not found",
        data: null,
      };
    }

    // Soft delete: set deletedAt timestamp instead of hard delete
    const result = await prisma.merchant.update({
      where: {
        clerkId: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Note: Clerk user deletion should be handled separately via webhook or admin action
    // We don't delete from Clerk here to allow for account recovery

    return {
      error: null,
      data: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
    };
  } catch (error) {
    return {
      error: `[PRISMA_ACTION_ERROR] - deleteUserAccountData: ${error}`,
      data: null,
    };
  }
};

// Get user settings from UserSettings model
const getUserSettings = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: "[AUTH_ERROR] - getUserSettings: Unauthorized",
        data: null,
      };
    }

    // Get merchant first to get merchantId
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return {
        error: "[NOT_FOUND] - getUserSettings: Merchant not found",
        data: null,
      };
    }

    // Get or create user settings
    let userSettings = await prisma.userSettings.findUnique({
      where: { merchantId: merchant.id },
    });

    // Create default settings if they don't exist
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          merchantId: merchant.id,
          // Default values are set in schema
        },
      });
    }

    return {
      data: userSettings,
      error: null,
    };
  } catch (error) {
    return {
      error: `[PRISMA_ACTION_ERROR] - getUserSettings: ${error}`,
      data: null,
    };
  }
};

// Update user settings
const updateUserSettings = async (updates: {
  allowSupport?: boolean;
  ipAddressOption?: "anonymized" | "no-ip";
  enableGeo?: boolean;
  enablePreferences?: boolean;
  emailStoreOption?: "full-email" | "hash-email" | "no-email";
  locationStoreOption?: "yes" | "no";
  nameStoreOption?: "yes" | "no";
  attributionModel?: "impression" | "click";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationPreferences?: any;
}) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: "[AUTH_ERROR] - updateUserSettings: Unauthorized",
        data: null,
      };
    }

    // Get merchant first to get merchantId
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return {
        error: "[NOT_FOUND] - updateUserSettings: Merchant not found",
        data: null,
      };
    }

    // Update or create user settings
    const userSettings = await prisma.userSettings.upsert({
      where: { merchantId: merchant.id },
      update: updates,
      create: {
        merchantId: merchant.id,
        ...updates,
      },
    });

    return {
      data: userSettings,
      error: null,
    };
  } catch (error) {
    console.error("[PRISMA_ACTION_ERROR] - updateUserSettings:", error);
    return {
      error: `[PRISMA_ACTION_ERROR] - updateUserSettings: ${error}`,
      data: null,
    };
  }
};

// Aliases for backward compatibility
const getMerchantData = getUserAccountData;
const updateMerchantData = updateUserAccountData;
const deleteMerchantData = deleteUserAccountData;

export {
  getUserAccountData,
  updateUserAccountData,
  deleteUserAccountData,
  getUserSettings,
  updateUserSettings,
  getMerchantData,
  updateMerchantData,
  deleteMerchantData,
};
