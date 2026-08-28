'use client';

import React, { useEffect, useRef } from 'react';
import { GeoLocation } from '../types/tactical';
import type L from 'leaflet';

interface RealGeographicMapProps {
  location: GeoLocation;
  radarRangeKm: number;
}

export const RealGeographicMap: React.FC<RealGeographicMapProps> = ({ location }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isSubscribed = true;

    import('leaflet').then((leafletModule) => {
      if (!isSubscribed) return;
      const Leaflet = leafletModule.default || leafletModule;
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Regional tactical zoom
      const initialZoom = 9;

      const map = Leaflet.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Public OpenStreetMap standard tiles with tactical dark CSS filter (no API key needed)
      Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: 'tactical-dark-tile',
      }).addTo(map);

      // Base Center Marker
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
      isSubscribed = false;
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
      className="absolute inset-0 w-full h-full z-0 bg-[#05080c] pointer-events-none select-none"
    />
  );
};
