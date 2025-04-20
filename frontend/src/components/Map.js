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
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`Error fetching directions: ${result}`);
          }
        }
      );
    }
  };

  return (
    <LoadScript googleMapsApiKey={MAPS_API} libraries={["places"]}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14}>
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
      <div>
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
      </div>
    </LoadScript>
  );
};

export default Map;
