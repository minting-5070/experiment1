import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "General Assistant",
  description: "AI-powered general assistant ready to help with questions, tasks, explanations, and whatever you need assistance with",
  keywords: ["AI", "assistant", "General Assistant", "help", "questions", "tasks", "chatbot"],
  authors: [{ name: "General Assistant" }],
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZDGZ5YPFFS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZDGZ5YPFFS');
          `}
        </Script>
      </head>
      <body
        className={`${inter.className} antialiased font-medium`}
      >
        {children}
      </body>
    </html>
  );
}
