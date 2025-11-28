export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "File must be an image (PNG, JPG, WebP, etc.)",
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Image size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check specific image formats
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: "Image must be in JPEG, PNG, WebP, or GIF format",
    };
  }

  return { isValid: true };
}

/**
 * Create image preview URL from file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke image preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
