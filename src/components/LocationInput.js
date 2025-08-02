import React, { useEffect, useRef, useState } from "react";
import { Button, TextField, List, ListItem, Paper } from "@mui/material";

const LocationInput = ({ location, setLocation, getCurrentLocation }) => {
  const [predictions, setPredictions] = useState([]);
  const autocompleteService = useRef(null);

  const fetchPredictions = (input) => {
    if (!input) {
      setPredictions([]);
      return;
    }
    if (autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input },
        (preds, status) => {
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !preds
          ) {
            setPredictions([]);
            return;
          }
          setPredictions(preds);
        }
      );
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    fetchPredictions(val);
  };

  // Handle selecting a suggestion
  const handleSelect = (description) => {
    setLocation(description);
    setPredictions([]);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 40,
      }}
    >
      <div style={{ position: "relative", width: 300 }}>
        <TextField
          label="Enter Starting Location"
          value={location}
          onChange={handleChange}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={getCurrentLocation}
          style={{ marginTop: 8 }}
        >
          Use Current Location
        </Button>

        {/* Suggestions dropdown */}
        {predictions.length > 0 && (
          <Paper
            style={{
              position: "absolute",
              zIndex: 1000,
              top: 70,
              left: 0,
              right: 0,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            <List dense>
              {predictions.map((pred) => (
                <ListItem
                  button
                  key={pred.place_id}
                  onClick={() => handleSelect(pred.description)}
                >
                  {pred.description}
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
