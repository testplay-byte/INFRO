import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infro — Video & Audio Similarity Matcher",
  description:
    "Detect repeated intros, outros, and shared clips between two videos entirely in your browser. No uploads, no servers — all processing happens locally.",
  keywords: [
    "video comparison",
    "intro detection",
    "outro detection",
    "audio fingerprinting",
    "perceptual hash",
    "browser video analysis",
  ],
  authors: [{ name: "Infro" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Infro — Video & Audio Similarity Matcher",
    description:
      "Detect repeated segments between two videos entirely in your browser.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
