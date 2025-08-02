import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { fetchPexelsImage } from "../utils/pexels";
import { TextField, Grid } from "@mui/material";

const sectionTitleSx = {
  color: "#1976d2",
  fontWeight: 700,
  fontSize: 18,
  mb: 1,
  mt: 2,
};
const infoTextSx = { color: "#444", lineHeight: 1.5 };
const labelSx = { minWidth: 90, fontWeight: 600, color: "#1976d2" };
const mealBoxSx = {
  p: 1.2,
  bgcolor: "#f5faff",
  borderRadius: 2,
  boxShadow: "0 1px 8px rgba(25,118,210,0.07)",
  mb: 1.5,
};
const activityBoxSx = {
  p: 1.1,
  bgcolor: "#fcfcfc",
  borderRadius: 2,
  border: "1px solid #e3eafd",
  mb: 1.2,
};
const stayBoxSx = {
  p: 1.3,
  bgcolor: "#f3fafe",
  borderRadius: 2,
  border: "1px solid #e3eafd",
  mb: 1.5,
};
const activityTypes = ["Nature", "Food", "Shopping", "Adventure", "Culture"];

const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

function useEnrichedItinerary(itinerary = []) {
  const [enrichedItinerary, setEnrichedItinerary] = useState([]);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function enrich() {
      if (!Array.isArray(itinerary) || itinerary.length === 0) {
        setEnrichedItinerary([]);
        return;
      }
      setEnriching(true);
      setEnrichError(null);
      try {
        const allDays = await Promise.all(
          itinerary.map(async (day) => {
            let meals = { ...day.meals };
            for (const mealType of ["breakfast", "lunch", "dinner"]) {
              if (meals && meals[mealType] && !meals[mealType].photoUrl) {
                const place = meals[mealType];
                const query = `${place.name} ${mealType} restaurant`;
                meals[mealType].photoUrl =
                  (await fetchPexelsImage(query, PEXELS_API_KEY)) || "";
              }
            }
            let activities = Array.isArray(day.activities)
              ? await Promise.all(
                  day.activities.map(async (activity) => {
                    if (activity.photoUrl) return activity;
                    const query = `${activity.name} ${activity.type} place`;
                    const photoUrl = await fetchPexelsImage(
                      query,
                      PEXELS_API_KEY
                    );
                    return { ...activity, photoUrl: photoUrl || "" };
                  })
                )
              : [];
            let stay_option = { ...day.stay_option };
            if (stay_option && !stay_option.photoUrl) {
              const query = `${stay_option.name} hotel`;
              stay_option.photoUrl =
                (await fetchPexelsImage(query, PEXELS_API_KEY)) || "";
            }
            return { ...day, meals, activities, stay_option };
          })
        );
        if (!cancelled) setEnrichedItinerary(allDays);
      } catch (err) {
        if (!cancelled) setEnrichError("Enriching with images failed.");
      } finally {
        if (!cancelled) setEnriching(false);
      }
    }

    enrich();
    return () => {
      cancelled = true;
    };
  }, [itinerary]);

  return { enrichedItinerary, enriching, enrichError };
}

const ItineraryPreview = ({ itinerary, interests = [], onDownloadPDF }) => {
  const safeItinerary = Array.isArray(itinerary) ? itinerary : [];
  const normalizedInterests = useMemo(
    () => interests.map((i) => i.toLowerCase()),
    [interests]
  );

  const { enrichedItinerary, enriching, enrichError } =
    useEnrichedItinerary(safeItinerary);

  const filteredItinerary = useMemo(
    () =>
      enrichedItinerary.map((day) => ({
        ...day,
        activities: (Array.isArray(day.activities)
          ? day.activities
          : []
        ).filter(
          (activity) =>
            activity.type &&
            normalizedInterests.includes(activity.type.toLowerCase())
        ),
      })),
    [enrichedItinerary, normalizedInterests]
  );

  const groupActivitiesByType = (activities = []) => {
    const grouped = {};
    activityTypes.forEach((type) => {
      grouped[type] = [];
    });
    grouped["Other"] = [];
    activities.forEach((act) => {
      const type =
        act.type && activityTypes.includes(act.type) ? act.type : "Other";
      grouped[type].push(act);
    });
    return grouped;
  };

  // Payment dialog states
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleOpenPayment = () => {
    setPaymentOpen(true);
    setPaymentError(null);
  };

  const handleClosePayment = () => {
    if (!processingPayment) {
      setPaymentOpen(false);
      setPaymentError(null);
    }
  };

  const handleConfirmPayment = () => {
    setProcessingPayment(true);
    setPaymentError(null);

    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentOpen(false);
      onDownloadPDF(filteredItinerary);
    }, 2000);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", my: 4 }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 3,
          color: "#1976d2",
          fontWeight: 900,
          letterSpacing: 2,
        }}
      >
        Your Trip Itinerary
      </Typography>

      {enriching && (
        <Box sx={{ textAlign: "center", my: 3 }}>
          <CircularProgress color="primary" />{" "}
          <Typography>Fetching images...</Typography>
        </Box>
      )}

      {enrichError && (
        <Typography sx={{ color: "red", textAlign: "center" }}>
          {enrichError}
        </Typography>
      )}

      {!enriching && filteredItinerary.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "#999" }}>
          No itinerary to display.
        </Typography>
      )}

      <Stack spacing={5}>
        {filteredItinerary.map((day, idx) => {
          const groupedActivities = groupActivitiesByType(day.activities || []);
          return (
            <Card
              key={idx}
              elevation={6}
              sx={{
                background: "#f8fbff",
                borderRadius: 4,
                pb: 2,
                borderLeft: "6px solid #1976d2",
                boxShadow: "0 8px 32px -8px rgba(25,118,210,0.10)",
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  <Chip label={`Day ${idx + 1}`} color="primary" /> &nbsp;
                  Departure: {day.departure_time}
                  <span
                    style={{
                      float: "right",
                      color: "#1976d2",
                      fontWeight: 600,
                    }}
                  >
                    Distance: {day.distance} km
                  </span>
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Typography sx={sectionTitleSx}>Meals</Typography>
                {day.meals ? (
                  ["breakfast", "lunch", "dinner"].map(
                    (meal) =>
                      day.meals[meal] && (
                        <Box key={meal} sx={mealBoxSx}>
                          <Typography sx={labelSx}>
                            {meal.charAt(0).toUpperCase() + meal.slice(1)}:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {day.meals[meal].photoUrl && (
                              <img
                                src={day.meals[meal].photoUrl}
                                alt={day.meals[meal].name}
                                width={60}
                                style={{
                                  borderRadius: 8,
                                  boxShadow: "0 1px 6px #d9e6fb",
                                }}
                              />
                            )}
                            <div>
                              <Typography
                                sx={{ fontWeight: 700, color: "#1565c0" }}
                              >
                                {day.meals[meal].name}
                              </Typography>
                              <Typography sx={infoTextSx}>
                                {day.meals[meal].description}
                              </Typography>
                              <Typography sx={{ color: "#888", fontSize: 13 }}>
                                {day.meals[meal].location}
                              </Typography>
                            </div>
                          </Box>
                        </Box>
                      )
                  )
                ) : (
                  <Typography sx={{ color: "#aaa", mb: 1 }}>
                    No meal info available.
                  </Typography>
                )}
                {Object.values(groupedActivities).some(
                  (acts) => acts.length > 0
                ) ? (
                  Object.entries(groupedActivities).map(([type, acts]) =>
                    acts.length > 0 ? (
                      <Box key={type} sx={{ mt: 3 }}>
                        <Typography sx={sectionTitleSx}>
                          {type} Activities
                        </Typography>
                        {acts.map((activity, i) => (
                          <Box key={i} sx={activityBoxSx}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              {activity.photoUrl && (
                                <img
                                  src={activity.photoUrl}
                                  alt={activity.name}
                                  width={60}
                                  style={{
                                    borderRadius: 8,
                                    boxShadow: "0 1px 6px #d9e6fb",
                                  }}
                                />
                              )}
                              <div>
                                <Typography
                                  component="a"
                                  href={activity.mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    fontWeight: 600,
                                    color: "#1976d2",
                                    textDecoration: "none",
                                    fontSize: 17,
                                  }}
                                >
                                  {activity.name}
                                </Typography>
                                <Typography sx={infoTextSx}>
                                  {activity.description}
                                </Typography>
                              </div>
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    ) : null
                  )
                ) : (
                  <Typography sx={{ color: "#aaa", mt: 1 }}>
                    No activities for your selected interests on this day.
                  </Typography>
                )}
                {day.stay_option && (
                  <>
                    <Typography sx={sectionTitleSx}>Stay</Typography>
                    <Box sx={stayBoxSx}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        {day.stay_option.photoUrl && (
                          <img
                            src={day.stay_option.photoUrl}
                            alt={day.stay_option.name}
                            width={60}
                            style={{
                              borderRadius: 8,
                              boxShadow: "0 1px 6px #d9e6fb",
                            }}
                          />
                        )}
                        <div>
                          <Typography
                            component="a"
                            href={day.stay_option.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontWeight: 700,
                              color: "#1976d2",
                              textDecoration: "none",
                              fontSize: 17,
                            }}
                          >
                            {day.stay_option.name}
                          </Typography>
                          {day.stay_option.location && (
                            <Typography sx={{ color: "#888", fontSize: 14 }}>
                              {day.stay_option.location}
                            </Typography>
                          )}
                        </div>
                      </Stack>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{
            px: 5,
            py: 1.5,
            fontWeight: 700,
            fontSize: 20,
            borderRadius: 3,
            boxShadow: "0 2px 16px rgba(25,118,210,0.14)",
          }}
          disabled={enriching}
          onClick={handleOpenPayment}
        >
          Download PDF
        </Button>
      </Box>

      {/* Payment Modal */}
      <Dialog
        open={paymentOpen}
        onClose={handleClosePayment}
        disableEscapeKeyDown={processingPayment}
      >
        <DialogTitle>Payment Confirmation</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Please pay ₹49 to download your itinerary PDF.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Name on Card"
                fullWidth
                size="small"
                placeholder="John Doe"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Card Number"
                fullWidth
                size="small"
                placeholder="4242 4242 4242 4242"
                required
                inputProps={{ inputMode: "numeric", maxLength: 19 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Expiry"
                size="small"
                fullWidth
                placeholder="12/34"
                required
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="CVV"
                size="small"
                fullWidth
                placeholder="123"
                required
                inputProps={{ inputMode: "numeric", maxLength: 4 }}
              />
            </Grid>
          </Grid>
          {paymentError && (
            <Typography color="error">{paymentError}</Typography>
          )}
          {processingPayment && (
            <Typography>Processing payment, please wait...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayment} disabled={processingPayment}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmPayment}
            disabled={processingPayment}
          >
            Pay ₹49
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItineraryPreview;
