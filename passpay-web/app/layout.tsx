import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PassPay - Gasless Solana Payments with Passkeys",
  description:
    "A LazorKit-powered Solana starter template featuring passkey authentication, gasless transactions, staking, and subscriptions.",
  icons: {
    icon: [
      { url: "/passpay-icon.png", sizes: "any" },
      { url: "/passpay-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/passpay-icon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/passpay-icon.png",
    shortcut: "/passpay-icon.png",
  },
  openGraph: {
    title: "PassPay - Gasless Solana Payments with Passkeys",
    description:
      "Create a Solana wallet with biometrics. No seed phrases, no gas fees.",
    images: ["/passpay-icon.png"],
  },
  twitter: {
    card: "summary",
    title: "PassPay - Gasless Solana Payments",
    description:
      "Create a Solana wallet with biometrics. No seed phrases, no gas fees.",
    images: ["/passpay-icon.png"],
  },
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
