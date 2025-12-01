import type { Metadata } from "next";
import { Inter, Saira } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

  
const vendSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-vend",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Chat-ly - Better way to talk, smarter way to connect",
  description: "Open source chat application with real-time messaging, audio/video calls, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${saira.variable} ${vendSans.variable} ${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
