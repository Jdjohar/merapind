// utils/geo.ts
export type LatLng = { lat: number; lng: number };

/**
 * Haversine formula to compute distance in kilometers between two lat/lng points.
 */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return R * c;
}

/**
 * Promise wrapper for browser geolocation.
 * Resolves to { lat, lng } or rejects with an Error (user denied, timeout, unsupported).
 */
export function getUserLocation(options?: PositionOptions): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 1000 * 60 * 5,
        ...options,
      }
    );
  });
}
