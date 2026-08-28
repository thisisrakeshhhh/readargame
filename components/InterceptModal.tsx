'use client';

import React, { useState } from 'react';
import { TacticalContact, WeaponSystem } from '../types/tactical';
import { Crosshair, Shield, Rocket, X, CheckCircle2, AlertTriangle, Zap, Target } from 'lucide-react';

interface InterceptModalProps {
  contact: TacticalContact;
  weapons: Record<string, WeaponSystem>;
  onAuthorizeLaunch: (weapon: WeaponSystem, targetContact: TacticalContact) => void;
  onClose: () => void;
}

export const InterceptModal: React.FC<InterceptModalProps> = ({
  contact,
  weapons,
  onAuthorizeLaunch,
  onClose,
}) => {
  const [selectedWeaponKey, setSelectedWeaponKey] = useState<string>(Object.keys(weapons)[0] || 'ABM_01');
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const selectedWeapon = weapons[selectedWeaponKey] || Object.values(weapons)[0];

  const handleLaunch = () => {
    if (!selectedWeapon || selectedWeapon.ammo <= 0) return;
    onAuthorizeLaunch(selectedWeapon, contact);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono text-emerald-400">
      <div className="bg-black/95 border-2 border-red-500/60 p-6 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.35)] relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-red-500 animate-spin-slow" />
            <div>
              <h2 className="font-black text-base text-red-300 tracking-wider uppercase">INTERCEPTION SEQUENCE</h2>
              <div className="text-[10px] text-red-400/80">TARGET: {contact.callsign} | THREAT: {contact.threatLevel}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-red-300 p-1 text-xs cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1 & 2: Target Telemetry & Lock status */}
        <div className="bg-red-950/30 border border-red-900/60 p-3.5 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-red-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-red-400" /> TARGET LOCK-ON
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px]">
              LOCKED 100%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-red-200 pt-1">
            <div>TYPE: <strong>{contact.type.replace('HOSTILE_', '')}</strong></div>
            <div>SPEED: <strong>{contact.velocityKmS.toFixed(1)} KM/S</strong></div>
            <div>ALT: <strong>{contact.altKm.toFixed(0)} KM</strong></div>
            <div>HEADING: <strong>{contact.headingDeg}°</strong></div>
            <div>ETA: <strong>{contact.etaSeconds}s</strong></div>
            <div>STATUS: <strong>{contact.status}</strong></div>
          </div>
        </div>

        {/* Step 3: Weapon Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
            SELECT INTERCEPTOR WEAPON SYSTEM
          </label>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {Object.values(weapons).map((w) => {
              const isSelected = selectedWeapon?.id === w.id;
              const hasAmmo = w.ammo > 0;
              return (
                <div
                  key={w.id}
                  onClick={() => hasAmmo && setSelectedWeaponKey(w.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    !hasAmmo
                      ? 'opacity-40 bg-zinc-950 border-zinc-900 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'bg-black/60 border-emerald-950 hover:border-emerald-800 text-emerald-400/80'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-emerald-300 flex items-center gap-2">
                      <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                      {w.name}
                    </div>
                    <div className="text-[10px] text-emerald-500/70">{w.description}</div>
                  </div>

                  <div className="text-right text-[10px]">
                    <div className="font-bold text-amber-300">{w.successProbability}% PROB</div>
                    <div className="text-zinc-400">AMMO: {w.ammo}/{w.maxAmmo}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Authorization & Launch Button */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            disabled={!selectedWeapon || selectedWeapon.ammo <= 0}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-black font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all uppercase cursor-pointer disabled:opacity-40"
          >
            <Zap className="w-5 h-5 fill-black animate-bounce" />
            AUTHORIZE MISSILE LAUNCH
          </button>
        </div>

      </div>
    </div>
  );
};
