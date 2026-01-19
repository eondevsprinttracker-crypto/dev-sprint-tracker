import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // Replace with production URL when deployed
  title: {
    default: "DevSprint Tracker | EonTech Group",
    template: "%s | DevSprint Tracker",
  },
  description: "Advanced project management and task tracking system for EonTech Global Group. Streamline development workflows, track progress, and boost team efficiency.",
  keywords: ["project management", "task tracking", "developer dashboard", "agile", "scrum", "kanban", "productivity", "eontech", "software development"],
  authors: [{ name: "Lahiru Harshana", url: "https://eontech.group" }, { name: "EonTech Group" }],
  creator: "EonTech Group",
  publisher: "EonTech Group",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "DevSprint Tracker | EonTech Group",
    description: "The ultimate project management ecosystem for high-performance development teams.",
    url: "http://localhost:3000",
    siteName: "DevSprint Tracker",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/eontech-logo.png",
        width: 1200,
        height: 630,
        alt: "DevSprint Tracker - EonTech Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevSprint Tracker | EonTech Group",
    description: "Advanced project management for modern dev teams. Track, Manage, Deliver.",
    images: ["/eontech-logo.png"], // Ideally should be a wide banner
    creator: "@eontechgroup",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  category: "productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
