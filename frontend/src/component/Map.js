// Map.js
import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 40.748817,
  lng: -73.985428,
};

const getDistance = (loc1, loc2) => {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const simplifyInstruction = (htmlInstruction) => {
  const text = htmlInstruction.replace(/<[^>]+>/g, "").toLowerCase();
  console.log('text',text);
  if (text.includes("left")) return "Turn left";
  if (text.includes("right")) return "Turn right";
  if (text.includes("continue")) return "Continue straight";
  if (text.includes("head")) return "Start walking in the same direction";
  if (text.includes("destination is")) return "You have arrived";
  return "Continue straight";
};

const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};

const Map = () => {
  const [directions, setDirections] = useState(null);
  const [destination, setDestination] = useState("");
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextInstruction, setNextInstruction] = useState("");
  const mapRef = useRef(null);

  // Get initial location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          if (mapRef.current) {
            mapRef.current.panTo(loc);
          }
        },
        (err) => {
          console.error("Location error:", err.message);
          alert("Please allow location access.");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Watch movement and guide
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          if (mapRef.current) mapRef.current.panTo(loc);

          if (routeSteps.length > 0 && currentStepIndex < routeSteps.length) {
            const nextStep = routeSteps[currentStepIndex];
            const stepLoc = {
              lat: nextStep.start_location.lat(),
              lng: nextStep.start_location.lng(),
            };
            const dist = getDistance(loc, stepLoc);
            if (dist < 20) {
              const simpleText = simplifyInstruction(nextStep.instructions);
              setNextInstruction(simpleText);
              speak(simpleText);

              if (currentStepIndex + 1 < routeSteps.length) {
                setCurrentStepIndex(currentStepIndex + 1);
              }
            }
          }
        },
        (err) => console.error("Watch error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [routeSteps, currentStepIndex]);

  const onLoadMap = (map) => {
    mapRef.current = map;
  };

  const onDestinationLoad = (autocomplete) =>
    setDestinationAutocomplete(autocomplete);

  const onPlaceChanged = () => {
    if (!destinationAutocomplete) {
      console.warn("Autocomplete not loaded yet");
      return;
    }
    const place = destinationAutocomplete.getPlace();
    if (place && place.geometry) {
      setDestination(place.formatted_address);
    }
  };

  const calculateRoute = () => {
    if (!userLocation || !destination) return;

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: userLocation,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const steps = result.routes[0].legs[0].steps;
          setRouteSteps(steps);
          setCurrentStepIndex(0);
          const first = simplifyInstruction(steps[0].instructions);
          setNextInstruction(first);
          speak(first);
        } else {
          console.error("Directions failed:", status);
        }
      }
    );
  };

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={17}
        onLoad={onLoadMap}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            }}
          />
        )}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      <div style={{ marginTop: "20px" }}>
        <Autocomplete onLoad={onDestinationLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{ width: "300px", height: "40px", fontSize: "16px" }}
          />
        </Autocomplete>

        <button
          onClick={calculateRoute}
          style={{ height: "40px", fontSize: "16px", marginTop: "10px" }}
        >
          Start Navigation
        </button>

        {nextInstruction && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            🧭 Next: {nextInstruction}
          </div>
        )}
      </div>
    </>
  );
};

export default Map;
