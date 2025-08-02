// // utils/pexels.js
// export async function fetchPexelsImage(query, apiKey) {
//   const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
//     query
//   )}&per_page=1`;

//   try {
//     const response = await fetch(url, {
//       headers: { Authorization: apiKey },
//     });
//     if (!response.ok) {
//       throw new Error("Pexels API request failed");
//     }
//     const data = await response.json();
//     if (data.photos && data.photos.length > 0) {
//       // Return the medium size photo url
//       return data.photos[0].src.medium;
//     }
//   } catch (err) {
//     console.error("Error fetching image from Pexels", err);
//   }
//   // Return null if no image available
//   return null;
// }
import axios from "axios";
const backendUrl = process.env.REACT_APP_BACKEND_URL;
export const fetchPexelsImage = async (query) => {
  try {
    const response = await axios.get(`${backendUrl}/api/pexels/search`, {
      params: { query },
    });
    if (response.data.photos && response.data.photos.length > 0) {
      return response.data.photos[0].src.medium;
    }
    return null;
  } catch (error) {
    console.error(
      "Error fetching image from backend Pexels proxy:",
      error.response?.data || error.message
    );
    return null;
  }
};
