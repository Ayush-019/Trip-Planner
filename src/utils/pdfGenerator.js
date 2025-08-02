import jsPDF from "jspdf";

// Helper: Convert remote image to base64 with better error handling
const toDataURL = async (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("Not an image");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Failed to load image: ${url}`, error);
    return null;
  }
};

// Helper: Clean text for PDF compatibility
const cleanText = (text, fallback = "Not specified") => {
  if (!text || typeof text !== "string") return fallback;

  // Remove problematic characters and normalize
  return (
    text
      .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]/g, "") // Keep basic Latin chars
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim() || fallback
  );
};

// Helper: Format time string
const formatTime = (timeStr) => {
  if (!timeStr) return "Not specified";
  try {
    // Handle various time formats
    const cleaned = timeStr.toString().trim();
    if (/^\d{1,2}:\d{2}/.test(cleaned)) return cleaned;
    return cleaned;
  } catch {
    return "Not specified";
  }
};

// Helper: Format distance
const formatDistance = (distance) => {
  if (!distance) return "N/A";
  const num = parseFloat(distance);
  return isNaN(num) ? "N/A" : `${num} km`;
};

export const generatePDF = async (itinerary, options = {}) => {
  // Input validation
  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    console.error("Invalid itinerary data");
    throw new Error("Itinerary must be a non-empty array");
  }

  const {
    title = "Travel Itinerary",
    travelerName = "",
    dateRange = "",
    includeImages = true,
  } = options;

  // PDF setup
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const maxContentHeight = pageHeight - 120; // Reserve space for header/footer

  // Color palette
  const colors = {
    primary: [41, 128, 185], // Blue
    secondary: [52, 73, 94], // Dark gray
    accent: [231, 76, 60], // Red accent
    background: [248, 249, 250], // Light gray
    cardBg: [255, 255, 255], // White
    divider: [189, 195, 199], // Light gray
    text: [44, 62, 80], // Dark text
    lightText: [127, 140, 141], // Light text
  };

  let currentY = 0;
  let pageNumber = 1;

  // Header function
  const addHeader = () => {
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...colors.primary);
    doc.text(cleanText(title), margin, 50);

    // Traveler info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);

    let infoY = 75;
    if (travelerName) {
      doc.text(`Traveler: ${cleanText(travelerName)}`, margin, infoY);
      infoY += 18;
    }

    if (dateRange) {
      doc.text(`Travel Dates: ${cleanText(dateRange)}`, margin, infoY);
    }

    // Header divider
    doc.setDrawColor(...colors.divider);
    doc.setLineWidth(1);
    doc.line(margin, 95, pageWidth - margin, 95);

    return 110; // Return Y position after header
  };

  // Footer function
  const addFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.lightText);

    const footerText = `Page ${pageNumber}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 25);

    // Generated timestamp
    const timestamp = new Date().toLocaleDateString();
    doc.text(`Generated: ${timestamp}`, margin, pageHeight - 25);
  };

  // Check if new page is needed
  const checkNewPage = (requiredHeight) => {
    if (currentY + requiredHeight > maxContentHeight) {
      addFooter();
      doc.addPage();
      pageNumber++;
      currentY = addHeader();
      return true;
    }
    return false;
  };

  // Add card block function
  const addCardBlock = async (cardData) => {
    const {
      type,
      title,
      mainText,
      subText,
      imageUrl,
      color = colors.primary,
    } = cardData;
    const cardHeight = 100;
    const imageSize = 80;

    checkNewPage(cardHeight + 20);

    // Card background
    doc.setFillColor(...colors.cardBg);
    doc.setDrawColor(...colors.divider);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, "FD");

    // Type indicator (colored bar)
    doc.setFillColor(...color);
    doc.rect(margin, currentY, 4, cardHeight, "F");

    let textX = margin + 15;

    // Image handling
    if (includeImages && imageUrl) {
      try {
        const imageData = await toDataURL(imageUrl);
        if (imageData) {
          doc.addImage(
            imageData,
            "JPEG",
            margin + 15,
            currentY + 10,
            imageSize,
            imageSize,
            undefined,
            "FAST"
          );
          textX = margin + imageSize + 35;
        }
      } catch (error) {
        console.warn("Failed to add image:", error);
      }
    }

    // Type/category label
    if (type) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...color);
      doc.text(cleanText(type).toUpperCase(), textX, currentY + 18);
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...colors.text);
    const titleY = currentY + (type ? 35 : 25);
    const titleLines = doc.splitTextToSize(
      cleanText(title),
      contentWidth - textX - 10
    );
    doc.text(titleLines.slice(0, 2), textX, titleY); // Limit to 2 lines

    // Description (mainText), then Location (subText)
    if (mainText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.lightText);
      const descY = titleY + titleLines.length * 12 + 2;
      const descLines = doc.splitTextToSize(
        cleanText(mainText),
        contentWidth - textX - 10
      );
      doc.text(descLines.slice(0, 3), textX, descY); // Limit to 3 lines

      // Show location below description in italic and accent color
      if (subText) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(...colors.accent);
        doc.text(cleanText(subText), textX, descY + descLines.length * 12 + 2);
      }
    }

    currentY += cardHeight + 15;
  };

  // Start generating PDF
  currentY = addHeader();

  // Process each day
  for (let dayIndex = 0; dayIndex < itinerary.length; dayIndex++) {
    const day = itinerary[dayIndex];

    if (!day || typeof day !== "object") {
      console.warn(`Skipping invalid day data at index ${dayIndex}`);
      continue;
    }

    // Day header
    checkNewPage(60);

    doc.setFillColor(...colors.background);
    doc.roundedRect(margin, currentY, contentWidth, 45, 6, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);

    const dayTitle = `Day ${dayIndex + 1}`;
    const departureTime = formatTime(day.departure_time);
    const distance = formatDistance(day.distance);

    doc.text(dayTitle, margin + 15, currentY + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    doc.text(`Departure: ${departureTime}`, margin + 15, currentY + 35);

    if (distance !== "N/A") {
      const distanceText = `Distance: ${distance}`;
      const distanceWidth = doc.getTextWidth(distanceText);
      doc.text(
        distanceText,
        pageWidth - margin - distanceWidth - 15,
        currentY + 35
      );
    }

    currentY += 60;

    // Accommodation
    if (day.stay_option && typeof day.stay_option === "object") {
      await addCardBlock({
        type: "Accommodation",
        title: day.stay_option.name || "Accommodation",
        mainText: "", // No description provided
        subText: day.stay_option.location || day.stay_option.address || "",
        imageUrl: day.stay_option.photoUrl,
        color: [155, 89, 182], // Purple for accommodation
      });
    }

    // Meals
    const meals = day.meals || {};
    const mealTypes = [
      { key: "breakfast", label: "Breakfast", color: [241, 196, 15] },
      { key: "lunch", label: "Lunch", color: [230, 126, 34] },
      { key: "dinner", label: "Dinner", color: [192, 57, 43] },
    ];

    for (const mealType of mealTypes) {
      const meal = meals[mealType.key];
      if (meal && typeof meal === "object") {
        await addCardBlock({
          type: mealType.label,
          title: meal.name || mealType.label,
          mainText: meal.description || "",
          subText: meal.location || "",
          imageUrl: meal.photoUrl,
          color: mealType.color,
        });
      }
    }

    // Activities
    if (Array.isArray(day.activities) && day.activities.length > 0) {
      for (const activity of day.activities) {
        if (activity && typeof activity === "object") {
          await addCardBlock({
            type: cleanText(activity.type) || "Activity",
            title: activity.name || "Activity",
            mainText: activity.description || "",
            subText: activity.location || "",
            imageUrl: activity.photoUrl,
            color: [46, 204, 113], // Green for activities
          });
        }
      }
    } else {
      // No activities message
      checkNewPage(40);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(...colors.lightText);
      doc.text(
        "No activities scheduled for this day",
        margin + 15,
        currentY + 20
      );
      currentY += 35;
    }

    // Add space between days
    currentY += 20;
  }

  // Final footer
  addFooter();

  // Generate filename
  const sanitizedTitle = cleanText(title).replace(/[<>:"/\\|?*\s]+/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizedTitle}_${timestamp}.pdf`;

  // Save PDF
  try {
    doc.save(filename);
    console.log(`PDF generated successfully: ${filename}`);
    return filename;
  } catch (error) {
    console.error("Failed to save PDF:", error);
    throw new Error("Failed to generate PDF file");
  }
};

// Export additional utility function for validation
export const validateItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) {
    return { valid: false, error: "Itinerary must be an array" };
  }

  if (itinerary.length === 0) {
    return { valid: false, error: "Itinerary cannot be empty" };
  }

  const issues = [];
  itinerary.forEach((day, index) => {
    if (!day || typeof day !== "object") {
      issues.push(`Day ${index + 1}: Invalid day data`);
    }
  });

  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
  };
};
