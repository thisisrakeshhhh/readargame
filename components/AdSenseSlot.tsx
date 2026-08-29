'use client';

import React, { useEffect } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '1234567890',
  format = 'auto',
  className = '',
}) => {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-3265886650944680';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && adsenseId) {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
      }
    } catch {
      // Catch duplicate push errors safely
    }
  }, [adsenseId]);

  return (
    <div className={`w-full max-w-2xl mx-auto my-4 text-center select-none font-mono ${className}`}>
      <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
        ADVERTISEMENT
      </span>

      {adsenseId ? (
        <div className="bg-black/40 border border-emerald-950/60 rounded-xl overflow-hidden min-h-[90px] flex items-center justify-center p-1">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '90px' }}
            data-ad-client={adsenseId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        /* Compliant Tactical Preview Banner for development / review */
        <div className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-dashed border-emerald-900/50 bg-emerald-950/20 text-emerald-600/90 text-xs">
          <div className="flex items-center gap-2 font-bold tracking-wider text-[11px] text-emerald-400">
            <span>GOOGLE ADSENSE DISPLAY UNIT</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Ads activate automatically when <code className="text-emerald-400">NEXT_PUBLIC_ADSENSE_ID</code> is configured in Vercel.
          </p>
        </div>
      )}
    </div>
  );
};
