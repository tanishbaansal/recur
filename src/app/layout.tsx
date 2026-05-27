import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProviders } from "@/lib/privy/PrivyProviders";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Recur — Set-and-forget cross-chain subscriptions",
  description:
    "Deposit USDC once. Pay your SaaS, salary, or DCA on any chain. Gasless recurring crypto payments powered by LI.FI Intents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="paper-grain t-ui min-h-full flex flex-col">
        <PrivyProviders>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{ style: { fontSize: 14, fontFamily: "var(--f-ui)" } }}
          />
        </PrivyProviders>
      </body>
    </html>
  );
}
