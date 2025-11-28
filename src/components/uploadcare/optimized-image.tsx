"use client";

import UploadcareImage from "@uploadcare/nextjs-loader";
import { getOptimizedUploadcareUrl } from "@/lib/uploadcare";
import type { ComponentProps } from "react";

interface OptimizedImageProps extends Omit<ComponentProps<typeof UploadcareImage>, "src"> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  loading?: "lazy" | "eager";
  className?: string;
  transformations?: string;
  unoptimized?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  loading = "lazy",
  className,
  transformations,
  unoptimized,
  ...props
}: OptimizedImageProps) {
  // For local images or when unoptimized is true, use Next.js Image directly
  if (unoptimized || (!src.startsWith("http") && !src.startsWith("//"))) {
    // eslint-disable-next-line @next/next/no-img-element
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          loading={loading}
          style={{ objectFit: "cover", objectPosition: "top" }}
          {...props}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        {...props}
      />
    );
  }

  const imageSrc = transformations 
    ? getOptimizedUploadcareUrl(src, transformations)
    : src;

  if (fill) {
    return (
      <UploadcareImage
        src={imageSrc}
        alt={alt}
        fill
        loading={loading}
        className={className}
        {...props}
      />
    );
  }

  return (
    <UploadcareImage
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      {...props}
    />
  );
}

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function AvatarImage({ src, alt, size = 40, className }: AvatarImageProps) {
  if (!src) {
    return null;
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      transformations="format/auto,quality/lightest,resize/1:1"
      loading="eager"
    />
  );
}

