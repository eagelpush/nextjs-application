/**
 * Uploadcare Configuration and Utilities
 * 
 * This file provides Uploadcare configuration and helper functions
 * for uploading and managing images in the application.
 */

// Uploadcare Public Key - should be set in environment variables
export const UPLOADCARE_PUBLIC_KEY = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || "";

// Uploadcare transformation parameters for optimization
// See: https://uploadcare.com/docs/transformations/image/
export const UPLOADCARE_TRANSFORMATION_PARAMS = 
  process.env.NEXT_PUBLIC_UPLOADCARE_TRANSFORMATION_PARAMETERS || 
  "format/auto,stretch/off,progressive/yes,quality/lightest";

/**
 * Validate that Uploadcare is properly configured
 */
export function isUploadcareConfigured(): boolean {
  return !!UPLOADCARE_PUBLIC_KEY;
}

/**
 * Get Uploadcare CDN URL from file UUID
 * @param fileUuid - Uploadcare file UUID
 * @returns CDN URL for the file
 */
export function getUploadcareUrl(fileUuid: string): string {
  if (!fileUuid) return "";
  
  // If it's already a full URL, return it
  if (fileUuid.startsWith("http")) {
    return fileUuid;
  }
  
  // Otherwise, construct the CDN URL
  return `https://ucarecdn.com/${fileUuid}/`;
}

/**
 * Get optimized Uploadcare URL with transformations
 * @param fileUuid - Uploadcare file UUID or CDN URL
 * @param transformations - Optional transformation parameters
 * @returns Optimized CDN URL
 */
export function getOptimizedUploadcareUrl(
  fileUuid: string,
  transformations?: string
): string {
  const baseUrl = getUploadcareUrl(fileUuid);
  
  if (!baseUrl || !baseUrl.includes("ucarecdn.com")) {
    return baseUrl; // Return as-is if not an Uploadcare URL
  }
  
  const transformParams = transformations || UPLOADCARE_TRANSFORMATION_PARAMS;
  
  // Extract UUID from URL if it's a full URL
  const uuid = baseUrl.includes("/") 
    ? baseUrl.split("/").filter(Boolean).pop()?.split("/")[0] || ""
    : fileUuid;
  
  if (!uuid) return baseUrl;
  
  // Construct URL with transformations
  return `https://ucarecdn.com/${uuid}/-/${transformParams}/`;
}

