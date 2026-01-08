import { Metadata } from "next";

interface GenerateMetadataProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Generate SEO metadata for pages
 *
 * @example
 * ```tsx
 * export const metadata = generateMetadata({
 *   title: "Dashboard",
 *   description: "Manage your files and storage",
 *   keywords: ["dashboard", "file management"],
 * });
 * ```
 */
export function generateMetadata({
  title,
  description,
  image = "/thumbnail.webp",
  url,
  keywords = [],
  noIndex = false,
}: GenerateMetadataProps): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://s3karo.com";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = `${title} | S3Karo`;

  return {
    title,
    description,
    keywords: ["S3Karo", "file storage", "cloud storage", "S3", ...keywords],
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: "S3Karo",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@designbyte",
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

/**
 * Generate metadata for blog posts or articles
 */
export function generateArticleMetadata({
  title,
  description,
  image = "/thumbnail.webp",
  url,
  publishedTime,
  modifiedTime,
  author = "DesignByte",
  tags = [],
}: GenerateMetadataProps & {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://s3karo.com";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = `${title} | S3Karo`;

  return {
    title,
    description,
    keywords: ["S3Karo", ...tags],
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: "S3Karo",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
      locale: "en_US",
      publishedTime,
      modifiedTime,
      authors: [author],
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@designbyte",
    },
  };
}

/**
 * Default metadata for error pages
 */
export const errorPageMetadata: Metadata = {
  title: "Error",
  description: "An error occurred",
  robots: {
    index: false,
    follow: false,
  },
};
