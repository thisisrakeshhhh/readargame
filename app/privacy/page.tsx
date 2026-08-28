import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Readar Tactical Radar Simulation',
  description: 'Privacy Policy and Cookie Disclosures for Readar Tactical Simulation, compliant with Google AdSense and international data regulations.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-300 font-mono p-4 sm:p-8 md:p-12 flex justify-center selection:bg-emerald-500 selection:text-black">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-emerald-900 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> RETURN TO RADAR
          </Link>
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">LEGAL COMPLIANCE</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">PRIVACY POLICY</h1>
          </div>
          <p className="text-xs text-zinc-500">Last updated: August 28, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          <section className="space-y-2 p-4 rounded-xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" /> 1. Introduction & Overview
            </h2>
            <p>
              At <strong>Readar Tactical Simulation</strong> (accessible from our web application), we take user privacy very seriously.
              This Privacy Policy document outlines the types of information that is collected and recorded by Readar and how we utilize it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">2. Google AdSense & Third-Party Advertising</h2>
            <p>
              Google is one of our third-party vendors. Google uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our website and other sites on the internet.
            </p>
            <p>
              Visitors may choose to decline the use of DART cookies by visiting the Google Ad and Content Network Privacy Policy at the following URL:
              <br />
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-200"
              >
                https://policies.google.com/technologies/ads
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">3. Cookies and Web Beacons</h2>
            <p>
              Like any other website, Readar uses &apos;cookies&apos;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">4. Log Files</h2>
            <p>
              Readar follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this as part of hosting services&apos; analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">5. Geolocation Data</h2>
            <p>
              When using the optional &apos;Use Current Location&apos; radar initialization feature, your browser requests permission to access your device&apos;s geographic coordinates (latitude and longitude). This data is processed entirely client-side within your browser to center the map tiles and is never transmitted, stored, or sold on any remote server.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">6. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
            <p>
              Under the CCPA, among other rights, California consumers have the right to request that a business delete any personal data about the consumer that a business has collected, and request that a business that sells a consumer&apos;s personal data, not sell the consumer&apos;s personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">7. GDPR Data Protection Rights</h2>
            <p>
              We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li>The right to access – You have the right to request copies of your personal data.</li>
              <li>The right to rectification – You have the right to request correction of any information you believe is inaccurate.</li>
              <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li>The right to restrict processing – You have the right to request restriction of personal data processing.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-emerald-950 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">8. Contact Information</h2>
            <p>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us through our <Link href="/contact" className="text-emerald-400 underline">Contact Page</Link>.
            </p>
          </section>

        </div>

        {/* Footer Link */}
        <div className="text-center pt-8 border-t border-emerald-950 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Readar Tactical Operations. All rights reserved.
        </div>

      </div>
    </main>
  );
}
