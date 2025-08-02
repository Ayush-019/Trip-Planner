import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  FormGroup,
  FormHelperText,
  Typography,
  Paper,
} from "@mui/material";

const PRIMARY = "#1976d2";
const LIGHT_BG = "#f9fdff";
const interestOptions = ["Nature", "Food", "Adventure", "Culture", "Shopping"];

const PreferencesForm = ({ form, setForm, onSubmit }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.budget) newErrors.budget = "Please select a budget level.";
    if (!form.range || form.range <= 0)
      newErrors.range = "Positive range required.";
    if (!form.people || form.people <= 0)
      newErrors.people = "At least 1 person.";
    if (!form.days || form.days <= 0) newErrors.days = "At least 1 day.";
    if (!form.dailyHours || form.dailyHours <= 0 || form.dailyHours > 24)
      newErrors.dailyHours = "Daily hours 1–24.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(e);
  };

  const toggleInterest = (opt) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(opt)
        ? prev.interests.filter((i) => i !== opt)
        : [...prev.interests, opt],
    }));
  };

  const handleReset = () => {
    setForm({
      budget: "Medium",
      interests: [],
      range: 150,
      people: 2,
      days: 2,
      dailyHours: 7,
    });
    setErrors({});
  };

  return (
    <Paper
      elevation={5}
      sx={{
        mt: 5,
        p: 4,
        background: LIGHT_BG,
        borderRadius: 3,
        maxWidth: 650,
        mx: "auto",
      }}
    >
      <form onSubmit={handleSubmit}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            color: PRIMARY,
            fontWeight: "bold",
            mb: 2,
            letterSpacing: 1,
          }}
        >
          Your Trip Preferences
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              size="small"
              fullWidth
              label="Budget"
              value={form.budget}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, budget: e.target.value }))
              }
              error={!!errors.budget}
              helperText={errors.budget}
              InputLabelProps={{ shrink: true }} // Always float label
              placeholder="Select budget"
              sx={{ background: "#fff", borderRadius: 1 }}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              type="number"
              label="Exploration Range (km)"
              placeholder="Ex: 150"
              value={form.range}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  range: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              error={!!errors.range}
              helperText={errors.range}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ background: "#fff", borderRadius: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              type="number"
              label="No. of People"
              placeholder="Ex: 2"
              value={form.people}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  people: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              error={!!errors.people}
              helperText={errors.people}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ background: "#fff", borderRadius: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              type="number"
              label="No. of Days"
              placeholder="Ex: 3"
              value={form.days}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  days: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              error={!!errors.days}
              helperText={errors.days}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ background: "#fff", borderRadius: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              type="number"
              label="Daily Travel Hours"
              placeholder="Ex: 6"
              value={form.dailyHours}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  dailyHours:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              error={!!errors.dailyHours}
              helperText={errors.dailyHours}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ background: "#fff", borderRadius: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Interests
            </Typography>
            <FormGroup row>
              {interestOptions.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      checked={form.interests.includes(opt)}
                      onChange={() => toggleInterest(opt)}
                      sx={{
                        color: PRIMARY,
                        "&.Mui-checked": { color: PRIMARY },
                      }}
                      size="small"
                    />
                  }
                  label={opt}
                  sx={{
                    mr: 2,
                    userSelect: "none",
                    "& .MuiFormControlLabel-label": {
                      fontWeight: form.interests.includes(opt) ? 700 : 500,
                      color: form.interests.includes(opt) ? PRIMARY : "#444",
                    },
                  }}
                />
              ))}
            </FormGroup>
            <FormHelperText sx={{ color: "#888", mt: 0.5 }}>
              Select one or more interests
            </FormHelperText>
          </Grid>

          <Grid item xs={6}>
            <Button type="submit" variant="contained" fullWidth>
              Get Itinerary
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={handleReset}
              sx={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PreferencesForm;
