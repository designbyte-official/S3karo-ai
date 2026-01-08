import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
import { Providers } from "./providers";
import NextTopLoader from 'nextjs-toploader';
import { validateProductionEnv } from '@/lib/utils/production-check';
import { ConfigImportHandler } from "@/features/private-s3/components/ConfigImportHandler";

import "./globals.css";

// Validate production environment on startup
if (process.env.NODE_ENV === 'production') {
  try {
    validateProductionEnv();
  } catch (error) {
    console.error('❌ Production validation failed:', error);
    throw error;
  }
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://s3karo.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "S3Karo - Privacy-First File Storage & Management Platform",
    template: "%s | S3Karo"
  },
  description: "A powerful, privacy-first file management platform. Use our Managed Storage tier or bring your Own S3 bucket. Secure, fast, and fully encrypted.",
  keywords: [
    "file storage",
    "S3 storage",
    "private cloud storage",
    "file management",
    "secure file sharing",
    "AWS S3",
    "cloud storage",
    "privacy-first storage",
    "encrypted storage",
    "file upload"
  ],
  authors: [{ name: "DesignByte" }],
  creator: "DesignByte",
  publisher: "S3Karo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "S3Karo - Privacy-First File Storage & Management",
    description: "Store, share & manage your files securely. Privacy-first platform with dual storage modes - use our Managed Storage or bring your Own S3 bucket.",
    siteName: "S3Karo",
    images: [
      {
        url: "/thumbnail.webp",
        width: 1200,
        height: 630,
        alt: "S3Karo - Privacy-First File Storage Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "S3Karo - Privacy-First File Storage & Management",
    description: "Store, share & manage your files securely. Privacy-first platform with dual storage modes.",
    images: ["/thumbnail.webp"],
    creator: "@designbyte",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-poppins antialiased`}
      >
        <NextTopLoader color="#FA7275" showSpinner={false} />
        <Providers>
          {children}
          <ConfigImportHandler />
        </Providers>
      </body>
    </html>
  );
}
