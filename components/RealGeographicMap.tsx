'use client';

import React, { useEffect, useRef } from 'react';
import { GeoLocation } from '../types/tactical';
import type L from 'leaflet';

interface RealGeographicMapProps {
  location: GeoLocation;
  radarRangeKm: number;
}

export const RealGeographicMap: React.FC<RealGeographicMapProps> = ({ location, radarRangeKm }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let map: L.Map | null = null;

    import('leaflet').then((leafletModule) => {
      const Leaflet = leafletModule.default || leafletModule;
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Determine initial regional zoom based on theater size
      const initialZoom = 9;

      map = Leaflet.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Dark Tactical Tiles (CartoDB Dark Matter)
      Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Tactical Base Center Marker (Bright green glowing radar base)
      const baseMarker = Leaflet.circleMarker([location.lat, location.lng], {
        radius: 6,
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);

      markerRef.current = baseMarker;
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Smoothly Fly / Move Map when location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([location.lat, location.lng], 9, {
      duration: 1.0,
      easeLinearity: 0.25,
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    }
  }, [location]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-full h-full z-0 bg-[#070a0e] pointer-events-none select-none opacity-85"
      style={{ filter: 'brightness(0.9) contrast(1.15)' }}
    />
  );
};
