import type { Metadata } from "next";
import { Inter, Saira } from "next/font/google";
import localFont from "next/font/local";
import { lazy, Suspense } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

// Lazy load providers to reduce initial bundle size
const AuthProvider = lazy(() => import("@/contexts/auth-context").then(mod => ({ default: mod.AuthProvider })));
const SocketProvider = lazy(() => import("@/contexts/socket-context").then(mod => ({ default: mod.SocketProvider })));

// Loading fallback for providers
const ProviderFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
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
        className={`${inter.variable} ${saira.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <Suspense fallback={<ProviderFallback />}>
              <AuthProvider>
                <Suspense fallback={<ProviderFallback />}>
                  <SocketProvider>
                    {children}
                  </SocketProvider>
                </Suspense>
              </AuthProvider>
            </Suspense>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
