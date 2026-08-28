import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readar - Tactical Air Defense & Radar Simulator",
  description: "Next-gen retro futuristic radar defense and counter-strike tactical warfare simulator with real-time radar sweep, auto Iron Dome defense, and missile guidance.",
  keywords: "radar, air defense, missile command, tactical game, nextjs, html5 canvas, norad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_ID} />
        )}
      </head>
      <body className="antialiased bg-black text-green-400 select-none">
        {children}
      </body>
    </html>
  );
}
