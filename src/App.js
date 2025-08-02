import React, { useState } from "react";
import LocationInput from "./components/LocationInput";
import PreferencesForm from "./components/PreferencesForm";
import ItineraryPreview from "./components/ItineraryPreview";
import { generateItinerary } from "./utils/api";
import { generatePDF } from "./utils/pdfGenerator";

function App() {
  const [location, setLocation] = useState("");
  const [form, setForm] = useState({
    budget: "Medium",
    interests: [],
    range: 150,
    people: 2,
    days: 2,
    dailyHours: 7,
    location: "",
  });
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation(`${pos.coords.latitude}, ${pos.coords.longitude}`);
      });
    } else {
      alert("Geolocation not available");
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await generateItinerary({ ...form, location });
      setItinerary(data);
    } catch (err) {
      alert("AI failed to generate itinerary!");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center", // horizontally center
          alignItems: "center", // vertically center
          flexDirection: "column", // stack children vertically
          textAlign: "center",
          marginBottom: "-50px",
        }}
      >
        <h2>Road Trip Itinerary Planner</h2>
      </div>
      <LocationInput
        location={location}
        setLocation={setLocation}
        getCurrentLocation={getCurrentLocation}
      />
      <PreferencesForm
        form={form}
        setForm={setForm}
        onSubmit={handlePreferencesSubmit}
      />
      {loading && <p>Generating your itinerary...</p>}
      {itinerary.length > 0 && (
        // <ItineraryPreview
        //   itinerary={itinerary}
        //   onDownloadPDF={() => generatePDF(itinerary)}
        // />
        <ItineraryPreview
          itinerary={itinerary}
          onDownloadPDF={generatePDF}
          interests={form.interests} // pass selected interests here
        />
      )}
    </div>
  );
}

export default App;
