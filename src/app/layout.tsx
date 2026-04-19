import { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import Providers from "@/src/components/Providers";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Breadbook",
  description: "Breadbook – bookkeeping for the financially half-baked",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // important for iPhone notch safe-area
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-dvh ${publicSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
