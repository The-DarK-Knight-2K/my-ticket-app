
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// Body font (clean, modern)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Heading font (Canva-style display)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400","500","600","700"],
  variable: "--font-poppins",
  display: "swap",
});

// Optional mono font for toolbar/code
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticket/Card Designer",
  description: "Design and optimize tickets/cards like Canva",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
