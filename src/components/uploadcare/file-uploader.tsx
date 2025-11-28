"use client";

/**
 * Uploadcare File Uploader Component
 * 
 * A React component that wraps Uploadcare's file uploader widget
 * for easy integration into the application.
 * 
 * Documentation: https://uploadcare.com/docs/integrations/react/
 */

import { useRef } from "react";
import { Widget, type WidgetAPI, type FileInfo } from "@uploadcare/react-widget";

import { UPLOADCARE_PUBLIC_KEY, isUploadcareConfigured } from "@/lib/uploadcare";

interface FileUploaderProps {
  onFileUpload: (fileInfo: { cdnUrl: string; uuid: string; name: string }) => void;
  onUploadError?: (error: Error) => void;
  publicKey?: string;
  multiple?: boolean;
  imagesOnly?: boolean;
  maxFileSize?: number; // in bytes
  crop?: string; // "free", "1:1", "4:3", etc.
  clearable?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  onFileUpload,
  publicKey,
  multiple = false,
  imagesOnly = true,
  crop,
  clearable = true,
  className,
}: FileUploaderProps) {
  const widgetRef = useRef<WidgetAPI | null>(null);

  const handleChange = (fileInfo: FileInfo | null) => {
    if (fileInfo && fileInfo.cdnUrl && fileInfo.uuid) {
      onFileUpload({
        cdnUrl: fileInfo.cdnUrl,
        uuid: fileInfo.uuid,
        name: fileInfo.name || "uploaded-file",
      });
    }
  };

  if (!isUploadcareConfigured() && !publicKey) {
    return (
      <div className="text-destructive text-sm">
        Uploadcare is not configured. Please set NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY.
      </div>
    );
  }

  // Widget is a ForwardRefRenderFunction, so we need to use it as a component
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

  return (
    <div className={className}>
      <WidgetComponent
        publicKey={publicKey || UPLOADCARE_PUBLIC_KEY}
        multiple={multiple}
        imagesOnly={imagesOnly}
        crop={crop}
        clearable={clearable}
        systemDialog={true}
        previewStep={true}
        onChange={handleChange}
        ref={widgetRef}
      />
    </div>
  );
}

/**
 * Simple Upload Button Component
 * Opens Uploadcare dialog when clicked
 */
interface UploadButtonProps {
  onFileUpload: (fileInfo: { cdnUrl: string; uuid: string; name: string }) => void;
  onUploadError?: (error: Error) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function UploadButton({
  onFileUpload,
  children,
  className,
  disabled = false,
}: UploadButtonProps) {
  const widgetRef = useRef<WidgetAPI | null>(null);

  const handleChange = (fileInfo: FileInfo | null) => {
    if (fileInfo && fileInfo.cdnUrl && fileInfo.uuid) {
      onFileUpload({
        cdnUrl: fileInfo.cdnUrl,
        uuid: fileInfo.uuid,
        name: fileInfo.name || "uploaded-file",
      });
    }
  };

  const handleClick = () => {
    if (!disabled && widgetRef.current) {
      widgetRef.current.openDialog();
    }
  };

  if (!isUploadcareConfigured()) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={true}
        className={className}
      >
        {children || "Upload Image (Not Configured)"}
      </button>
    );
  }

  // Widget is a ForwardRefRenderFunction, so we need to use it as a component
  const WidgetComponent = Widget as unknown as React.ComponentType<{
    publicKey: string;
    multiple?: boolean;
    imagesOnly?: boolean;
    systemDialog?: boolean;
    previewStep?: boolean;
    onChange?: (fileInfo: FileInfo | null) => void;
    ref?: React.Ref<WidgetAPI>;
    className?: string;
  }>;

  return (
    <>
      <WidgetComponent
        publicKey={UPLOADCARE_PUBLIC_KEY}
        multiple={false}
        imagesOnly={true}
        systemDialog={true}
        previewStep={true}
        onChange={handleChange}
        ref={widgetRef}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {children || "Upload Image"}
      </button>
    </>
  );
}
