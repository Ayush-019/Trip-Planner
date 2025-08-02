import axios from "axios";

export const generateItinerary = async (form) => {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not found. Please set REACT_APP_OPENROUTER_API_KEY in your .env file."
    );
  }

  // New prompt with hard inclusion for all categories
  const prompt = `
You are an expert travel planner. Using ONLY the following user constraints, generate a JSON array (one object per day) for their road trip.

Location: ${form.location}
Budget: ${form.budget}
Range (maximum per day): ${form.range} km
People: ${form.people}
Days: ${form.days}
Daily Hours: ${form.dailyHours}

IMPORTANT:
- For each day, the "distance" field MUST NOT exceed ${form.range} km. 
- Ensure each day's total distance (from start to last stop) is within this strict maximum.
- For each day, "departure_time" should be adjusted according to the daily travel hours as for small hours no one wants to go early.

For EVERY day, the "activities" array MUST always include:
  • One activity that is a NATURE experience (e.g., park, scenic area, garden, lake, forest, mountain trail, wildlife viewing, picnic spot, etc.)
  • One activity that is a FOOD experience (e.g., local restaurant, famous food spot, food market, street food, tasting tour, etc.)
  • One activity that is a SHOPPING experience (e.g., unique shop, market, mall, open bazaar, souvenir spot, etc.)
  • One activity that is an ADVENTURE experience (e.g., hike, trek, fun outdoor activity, biking, sport, adventure park, river rafting, etc.)
  • One activity that is a CULTURE experience (e.g., museum, monument, temple, art gallery, heritage site, historical landmark, music or dance event, craft workshop, etc.)

For days where more activities are possible, you may add more, but ALWAYS include at least one from each category above and clearly mark each with its type in the description.

For each day, output as follows:
{
  departure_time: (e.g. "8:00 AM"),
  distance: (number, maximum ${form.range}, per day, km),
  meals: {
    breakfast: { name: "...", description: "...", location: "..." },
    lunch: { name: "...", description: "...", location: "..." },
    dinner: { name: "...", description: "...", location: "..." }
  },
  activities: [
    { name: "...", type: "Nature", description: "...", location: "..." },
    { name: "...", type: "Food", description: "...", location: "..." },
    { name: "...", type: "Shopping", description: "...", location: "..." },
    { name: "...", type: "Adventure", description: "...", location: "..." },
    { name: "...", type: "Culture", description: "...", location: "..." }
    // (optional: more activities for the day)
  ],
  stay_option: { name: "...", location: "..." }
}

Strictly follow this structure—DO NOT skip or combine categories, and do NOT explain; output ONLY the JSON array.
`;

  const data = {
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  };

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      data,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
        },
      }
    );
    const content = response.data.choices[0].message.content;
    console.log(content);
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw parseError;
    }
  } catch (error) {
    console.error(
      "OpenRouter API request failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};
