import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readar - Tactical Air Defense & Radar Simulator",
  description: "Next-gen retro futuristic radar defense and counter-strike tactical warfare simulator with real-time radar sweep, auto air defense, and missile guidance.",
  keywords: "radar, air defense, missile command, tactical simulation, html5 canvas, norad, airspace monitoring",
  other: {
    "google-adsense-account": "ca-pub-3265886650944680",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-3265886650944680";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content={adsenseId} />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-black text-green-400 select-none" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
