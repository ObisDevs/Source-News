import type { Metadata } from "next";
import React, { Suspense } from 'react';
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Source News - Nigerian News Intelligence",
  description: "AI-powered news aggregation with bias detection and multi-source analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<div />}> 
              <Header />
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
