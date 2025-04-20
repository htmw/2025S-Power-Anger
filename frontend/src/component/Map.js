import React, { useState } from "react";

import {
  GoogleMap,
  LoadScript,
  DirectionsService,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 40.748817, // Example latitude
  lng: -73.985428, // Example longitude
};

const MAPS_API = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const Map = () => {
  const [directions, setDirections] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originAutocomplete, setOriginAutocomplete] = useState(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);
  const [steps, setSteps] = useState([]);
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [mapRef, setMapRef] = useState(null);

  


  const onOriginLoad = (autocomplete) => {
    setOriginAutocomplete(autocomplete);
  };

  const onDestinationLoad = (autocomplete) => {
    setDestinationAutocomplete(autocomplete);
  };

  const onPlaceChanged = (type) => {
    if (type === "origin" && originAutocomplete) {
      const place = originAutocomplete.getPlace();
      if (place && place.geometry) {
        setOrigin(place.formatted_address);
      }
    } else if (type === "destination" && destinationAutocomplete) {
      const place = destinationAutocomplete.getPlace();
      if (place && place.geometry) {
        setDestination(place.formatted_address);
      }
    }
  };

  const calculateRoute = () => {
    if (origin && destination) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.WALKING, // Change DRIVING to WALKING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            const steps = result.routes[0].legs[0].steps;
            setSteps(steps);
            setCurrentStepIndex(0);
            if (steps.length && mapRef) {
              mapRef.panTo(steps[0].start_location);
            }
          } else {
            console.error(`Error fetching directions: ${result}`);
          }
        }
      );
    }
  };
  const goToStep = (index) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      if (mapRef) {
        mapRef.panTo(steps[index].start_location);
      }
    }
  };

  return (
    <LoadScript googleMapsApiKey={MAPS_API} libraries={["places"]}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14}
      onLoad={(map) => setMapRef(map)}
      >
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
      {/* <div>
        <Autocomplete onLoad={onOriginLoad} onPlaceChanged={() => onPlaceChanged("origin")}>
          <input
            type="text"
            placeholder="Enter origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </Autocomplete>

        <Autocomplete onLoad={onDestinationLoad} onPlaceChanged={() => onPlaceChanged("destination")}>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Autocomplete>

        <button onClick={calculateRoute}>Get Directions</button>
      </div> */}
    
      <div style={{ maxWidth: 600, margin: "auto", padding: 16 }}>
  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
    <Autocomplete onLoad={onOriginLoad} onPlaceChanged={() => onPlaceChanged("origin")}>
      <input
        type="text"
        placeholder="Enter origin"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </Autocomplete>

    <Autocomplete onLoad={onDestinationLoad} onPlaceChanged={() => onPlaceChanged("destination")}>
      <input
        type="text"
        placeholder="Enter destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </Autocomplete>
  </div>

  <button
    onClick={calculateRoute}
    style={{
      padding: "10px",
      fontSize: "16px",
      borderRadius: "8px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      cursor: "pointer",
    }}
  >
    Get Directions
  </button>
  {steps.length > 0 && (
  <div style={{ marginTop: "1rem", backgroundColor: "#f0f0f0", padding: "10px" }}>
    <h3>Step-by-Step Navigation</h3>
    <div dangerouslySetInnerHTML={{ __html: steps[currentStepIndex].instructions }} />
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={() => goToStep(currentStepIndex - 1)}
        disabled={currentStepIndex === 0}
        style={{ marginRight: "10px", padding: "5px 10px" }}
      >
        Previous
      </button>
      <button
        onClick={() => goToStep(currentStepIndex + 1)}
        disabled={currentStepIndex === steps.length - 1}
        style={{ padding: "5px 10px" }}
      >
        Next
      </button>
      <p style={{ marginTop: "5px" }}>
        Step {currentStepIndex + 1} of {steps.length}
      </p>
    </div>
  </div>
)}
</div>
      
    </LoadScript>
  );
};

export default Map;