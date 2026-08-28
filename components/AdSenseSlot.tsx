'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '1234567890',
  format = 'auto',
  className = '',
}) => {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && adsenseId) {
        // Push ad init
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
      }
    } catch {
      // AdSense initialization error fallback
    }
  }, [adsenseId]);

  return (
    <div className={`my-3 p-2 bg-black/60 border border-green-950/60 rounded text-center overflow-hidden font-mono ${className}`}>
      {adsenseId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {adsenseId ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        /* Tactical Placeholder when no publisher ID is configured */
        <div className="flex flex-col items-center justify-center p-3 text-[10px] text-green-700 uppercase tracking-wider border border-dashed border-green-900/40 rounded bg-green-950/10">
          <span className="font-semibold text-green-600">PUBLIC DEFENSE ADVERTISING FREQUENCY</span>
          <span className="text-zinc-600 mt-1">Set NEXT_PUBLIC_ADSENSE_ID in .env.local to activate monetization</span>
        </div>
      )}
    </div>
  );
};
