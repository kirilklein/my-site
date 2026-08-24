import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/data/profile";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kirilklein.github.io"),
  title: `${profile.name} | ${profile.role}`,
  description: profile.tagline,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${profile.name} | ${profile.role}`,
    description: profile.tagline,
    url: "/",
    type: "profile",
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kiril Klein",
  honorificSuffix: "PhD",
  jobTitle: profile.role,
  worksFor: { "@type": "Organization", name: "Aiomic" },
  alumniOf: { "@type": "Organization", name: "University of Copenhagen" },
  url: "https://kirilklein.github.io",
  sameAs: [profile.links.github, profile.links.scholar, profile.links.linkedin],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
