import { useState, useEffect } from "react";
import type { Location } from "../types";

interface GeolocationState {
  location: Location | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  isManualLocation: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: false,
    isManualLocation: false,
  });

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const position = await getCurrentPosition();
      const location: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setState({
        location,
        loading: false,
        error: null,
        hasPermission: true,
        isManualLocation: false,
      });

      // Store location in localStorage for persistence
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          ...location,
          isManual: false,
        })
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: getGeolocationError(error as GeolocationPositionError),
      }));
    }
  };

  const setManualLocation = (address: string, lat: number, lng: number) => {
    const location: Location = { lat, lng };

    setState({
      location,
      loading: false,
      error: null,
      hasPermission: true,
      isManualLocation: true,
    });

    // Store manual location with address
    localStorage.setItem(
      "userLocation",
      JSON.stringify({
        ...location,
        isManual: true,
        address,
      })
    );
  };

  const clearLocation = () => {
    setState({
      location: null,
      loading: false,
      error: null,
      hasPermission: false,
      isManualLocation: false,
    });
    localStorage.removeItem("userLocation");
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
    });
  };

  const getGeolocationError = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access denied. Please enable location permissions to use Localize.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please try again.";
      case error.TIMEOUT:
        return "Location request timed out. Please try again.";
      default:
        return "An unknown error occurred while retrieving location.";
    }
  };

  // Check for stored location on mount
  useEffect(() => {
    const storedLocation = localStorage.getItem("userLocation");
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setState({
          location: {
            lat: parsed.lat,
            lng: parsed.lng,
            accuracy: parsed.accuracy,
          },
          loading: false,
          error: null,
          hasPermission: true,
          isManualLocation: parsed.isManual || false,
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        localStorage.removeItem("userLocation");
      }
    }
  }, []);

  return {
    ...state,
    requestLocation,
    setManualLocation,
    clearLocation,
  };
}