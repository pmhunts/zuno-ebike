import { useState, useEffect, useRef } from 'react';

/**
 * useGeolocation
 * Returns { location: {lat, lng, accuracy}, error, loading, supported }
 * Updates in real time via watchPosition — cancels on unmount.
 */
export function useGeolocation({ enabled = true, highAccuracy = true } = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const watchId = useRef(null);

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  useEffect(() => {
    if (!enabled || !supported) return;

    setLoading(true);

    const onSuccess = (pos) => {
      setLocation({
        lat:      pos.coords.latitude,
        lng:      pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setLoading(false);
      setError(null);
    };

    const onError = (err) => {
      setError(err.message);
      setLoading(false);
    };

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout:            10000,
      maximumAge:         0,
    };

    // One-shot first, then watch
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled, supported, highAccuracy]);

  return { location, error, loading, supported };
}
