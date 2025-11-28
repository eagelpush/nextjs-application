"use client";

/**
 * ImageUpload Component
 * 
 * A reusable image upload component using Uploadcare for campaign hero images
 * and company logos. Supports aspect ratio constraints and platform-specific uploads.
 * 
 * @see https://uploadcare.com/docs/integrations/react/
 */

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Widget, type WidgetAPI, type FileInfo } from "@uploadcare/react-widget";

import { cn } from "@/lib/utils";
import { UPLOADCARE_PUBLIC_KEY, isUploadcareConfigured } from "@/lib/uploadcare";
import { OptimizedImage } from "@/components/uploadcare";
import { Button } from "@/components/ui/button";

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  aspectRatio?: "video" | "square" | "auto";
  disabled?: boolean;
  className?: string;
  maxFileSize?: number; // in bytes, default 10MB
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  aspectRatio = "auto",
  disabled = false,
  className,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const widgetRef = useRef<WidgetAPI | null>(null);

  // Determine crop ratio based on aspect ratio
  const cropRatio = aspectRatio === "video" ? "16:9" : aspectRatio === "square" ? "1:1" : undefined;

  // Handle Uploadcare file upload
  const handleUploadcareChange = (fileInfo: FileInfo | null) => {
    if (!fileInfo) {
      setIsUploading(false);
      return;
    }

    // Check file size if provided
    if (fileInfo.size && fileInfo.size > maxFileSize) {
      setUploadError(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
      setIsUploading(false);
      return;
    }

    if (fileInfo.cdnUrl && fileInfo.uuid) {
      setUploadError(null);
      setIsUploading(false);
      onChange(fileInfo.cdnUrl);
    } else {
      setUploadError("Failed to upload image. Please try again.");
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (disabled || isUploading) return;

    if (isUploadcareConfigured() && widgetRef.current) {
      setIsUploading(true);
      setUploadError(null);
      widgetRef.current.openDialog();
    } else {
      setUploadError("Uploadcare is not configured. Please set NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY.");
    }
  };

  const handleRemove = () => {
    setUploadError(null);
    onRemove();
  };

  // Widget component type
  const WidgetComponent = Widget as unknown as React.ComponentType<{
    publicKey: string;
    multiple?: boolean;
    imagesOnly?: boolean;
    crop?: string;
    clearable?: boolean;
    systemDialog?: boolean;
    previewStep?: boolean;
    onChange?: (fileInfo: FileInfo | null) => void;
    ref?: React.Ref<WidgetAPI>;
    className?: string;
  }>;

  if (!isUploadcareConfigured()) {
    return (
      <div className={cn("rounded-lg border-2 border-dashed border-gray-300 p-6 text-center", className)}>
        <p className="text-destructive text-sm">
          Uploadcare is not configured. Please set NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Hidden Uploadcare Widget */}
      <WidgetComponent
        publicKey={UPLOADCARE_PUBLIC_KEY}
        multiple={false}
        imagesOnly={true}
        crop={cropRatio}
        clearable={true}
        systemDialog={true}
        previewStep={true}
        onChange={handleUploadcareChange}
        ref={widgetRef}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border-2 border-dashed transition-all",
          value
            ? "border-gray-200"
            : "border-gray-300 hover:border-primary/50 hover:bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          isUploading && "border-primary"
        )}
      >
        {value ? (
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <OptimizedImage
                src={value}
                alt="Uploaded image"
                fill
                className="object-cover"
                transformations="format/auto,quality/lightest"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleUploadClick}
                  disabled={disabled || isUploading}
                  className="h-8 w-8 bg-white/90 shadow-lg hover:bg-white"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="h-8 w-8 bg-white/90 shadow-lg hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center p-8 text-center",
              disabled && "cursor-not-allowed"
            )}
            onClick={handleUploadClick}
          >
            {isUploading ? (
              <>
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-primary">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  PNG, JPG, WebP up to {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
                {aspectRatio !== "auto" && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Recommended: {aspectRatio === "video" ? "16:9" : "1:1"} aspect ratio
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="rounded-md bg-destructive/10 p-2">
          <p className="text-destructive text-xs">{uploadError}</p>
        </div>
      )}
    </div>
  );
}

