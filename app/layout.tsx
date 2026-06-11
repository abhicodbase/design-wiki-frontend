import type { Metadata } from "next";
import { Playfair_Display, Inter, Geist_Mono, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unifraktur = UnifrakturMaguntia({
  variable: "--font-unifraktur",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "System Design Wiki - The Design Times",
  description: "A minimalist, newspaper-grade handbook for distributed systems, scalable architectures, and system design interviews.",
  keywords: ["system design", "distributed systems", "software architecture", "scalability", "interviews", "tech handbook"],
  authors: [{ name: "Design Wiki Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${geistMono.variable} ${unifraktur.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
