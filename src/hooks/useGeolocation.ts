import { useState, useEffect, useRef, useCallback } from "react";

const GPS_TIMEOUT = 60000;
const MAX_ACCURACY = 30;

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [accuracyWarn, setAccuracyWarn] = useState(false);
  const watchId = useRef<number | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    const p: GeoPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
    setPosition(p);
    setAccuracyWarn(p.accuracy > MAX_ACCURACY);
    setError(null);
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err.message || "Error obteniendo GPS");
    setWatching(false);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS no disponible en este dispositivo");
      return;
    }

    setWatching(true);
    setError(null);
    setAccuracyWarn(false);

    timeoutId.current = setTimeout(() => {
      setError("GPS timeout");
      setWatching(false);
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }, GPS_TIMEOUT);

    watchId.current = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT, maximumAge: 0 }
    );
  }, [updatePosition, handleError]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setWatching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return { position, error, watching, accuracyWarn, startWatching, stopWatching };
}
