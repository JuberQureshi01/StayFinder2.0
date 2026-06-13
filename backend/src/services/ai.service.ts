import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

const AI_MODEL = "gemini-2.0-flash";

const getAI = (): GoogleGenAI => {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
};

const callWithRetry = async (
  model: string,
  contents: string,
  maxRetries = 3,
): Promise<string> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }

      const response = await getAI().models.generateContent({
        model,
        contents,
      });

      return response.text || "";
    } catch (error: any) {
      const status = error?.status || error?.code;
      const isRetryable = status === 429 || status === 503;

      if (isRetryable && attempt < maxRetries - 1) {
        // console.warn(
        //   `AI API ${status} (attempt ${attempt + 1}/${maxRetries}), retrying...`,
        // );
        continue;
      }

      const msg = typeof error?.message === "string" ? error.message : String(error?.message || error);
      throw new Error(msg);
    }
  }
  return "";
};

export class AIService {
  static async generateDescription(
    title: string,
    location: string,
    amenities: string[],
    hints?: string,
  ) {
    try {
      const systemPrompt = `
You are an expert hospitality and real estate copywriter.

Write highly engaging and professional hotel/property descriptions.

Focus on:
- comfort
- luxury
- guest experience
- travel appeal

Keep the response in 2 well-structured paragraphs. Do not use markdown or greetings.
`;

      const userPrompt = `
Generate a compelling property description for:

Title: ${title}
Location: ${location}
Amenities: ${amenities.join(", ")}
${hints ? `Additional details/hints from the host: ${hints}` : ""}
`;

      return await callWithRetry(AI_MODEL, `${systemPrompt}\n\n${userPrompt}`);
    } catch (error: any) {
      console.error("AI Description Generation Error:", error);
      throw new Error(error.message || "Failed to generate AI description");
    }
  }

  static async parseSmartSearch(prompt: string) {
    try {
      const systemInstruction = `
You are an API that converts natural language search queries into strict JSON.

Extract:
- location
- minimum price
- maximum price
- amenities

If value is missing, return null.

Respond ONLY with raw JSON.

Format:
{
  "location": "string or null",
  "minPrice": number or null,
  "maxPrice": number or null,
  "amenities": ["string"] or []
}
`;

      const text = await callWithRetry(
        AI_MODEL,
        `${systemInstruction}\n\nUser Query: "${prompt}"`,
      );

      if (!text) return null;
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.error("Invalid AI JSON Response:", cleaned);
        return null;
      }
    } catch (error) {
      console.error("AI Smart Search Failed:", error);
      return null;
    }
  }

  static async generateReviewSummary(reviews: { rating: number; comment: string }[]) {
    const reviewTexts = reviews.map((r) => `Rating: ${r.rating}/5 - "${r.comment}"`).join("\n");

    const prompt = `
You are a hospitality analyst. Analyze the following guest reviews for a property.

Summarize into:
1. What guests LOVE most (top 3 things, bullet points, short)
2. What guests COMPLAIN about (top 2 things, bullet points, short)
3. Overall sentiment (positive/mixed/negative)
4. An overall summary score out of 5 based on these reviews

Reviews:
${reviewTexts}

Respond ONLY with raw JSON in this format:
{
  "loves": ["string", ...],
  "complaints": ["string", ...],
  "sentiment": "positive" | "mixed" | "negative",
  "summaryScore": number
}
`;

    try {
      const text = await callWithRetry(AI_MODEL, prompt, 3);

      if (!text) return null;
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.error("Invalid AI Review Summary JSON:", cleaned);
        return null;
      }
    } catch (error) {
      console.error("AI Review Summary Error:", error);
      return null;
    }
  }

  static async generateRecommendation(prompt: string): Promise<string> {
    try {
      return await callWithRetry(AI_MODEL, prompt);
    } catch {
      return "";
    }
  }

  static async generateItinerary(
    location: string,
    days: number,
    propertyName: string,
    people: number,
    groupType: string,
    style: string,
    budget: string,
  ) {
    const prompt = `
Act as a world-class travel planner.
Create a ${days}-day itinerary for ${people} person(s) visiting ${location} and staying at "${propertyName}".

Trip details:
- Group type: ${groupType}
- Travel style: ${style}
- Budget level: ${budget}

Please provide:
1. Daily schedule (morning, afternoon, evening activities).
2. Recommendations for local food (fitting the budget).
3. "Hidden gems" suitable for the group style.
4. Tips for managing the ${budget} budget in ${location}.

Format the output cleanly in Markdown.
`;

    try {
      return await callWithRetry(AI_MODEL, prompt);
    } catch (error: any) {
      console.error("AI Itinerary Error:", error);
      return AIService.generateFallbackItinerary(location, days, propertyName, people, groupType, style, budget);
    }
  }

  static generateFallbackItinerary(
    location: string,
    days: number,
    propertyName: string,
    people: number,
    groupType: string,
    style: string,
    budget: string,
  ): string {
    const mealScale = budget === "luxury" ? "fine-dining" : budget === "moderate" ? "mid-range" : "budget-friendly";
    const pace = style === "relaxed" ? "leisurely" : style === "adventurous" ? "action-packed" : "balanced";

    let daysMarkdown = "";
    for (let d = 1; d <= days; d++) {
      daysMarkdown += `
### Day ${d}: ${d === 1 ? "Arrival & Exploration" : d === days ? "Final Day & Departure" : `Adventure Day ${d}`}

**Morning (${d === 1 ? "Check-in & Settle In" : d === days ? "Breakfast & Check-out" : "Start Fresh"}):**
- ${d === 1 ? `Check into **${propertyName}** and get settled in` : d === days ? "Enjoy a final breakfast and check out" : `Start the day with breakfast at ${propertyName}`}
- ${style === "adventurous" ? "Early morning walk to explore the neighborhood" : style === "cultural" ? "Visit a local museum or gallery" : "Relax with coffee at a nearby café"}
- ${budget === "luxury" ? "Optional: Book a private guide for the day" : budget === "moderate" ? "Check local tour availability" : "Plan your route using public transport"}

**Afternoon (Activities & Exploration):**
- Explore the best of ${location} — ask your host for their favorite spots
- ${budget === "luxury" ? `Enjoy a ${mealScale} lunch at a top-rated restaurant in ${location}` : `Grab ${mealScale} lunch at a local favorite`}
- ${style === "cultural" ? "Visit heritage sites and historical landmarks" : style === "adventurous" ? "Hike, bike, or try water sports" : "Stroll through parks and shops at your own pace"}
- ${groupType === "family" ? "Look for family-friendly attractions and activities" : groupType === "friends" ? "Perfect for group photos and shared experiences" : "Romantic spots and quiet corners"}

**Evening (Wind Down):**
- ${d === days ? "Enjoy a farewell dinner reflecting on your trip" : budget === "luxury" ? `Experience ${location}'s finest ${mealScale} restaurant` : `Try a well-reviewed ${mealScale} restaurant`}
- ${style === "relaxed" ? "Relax back at the property with a good book or movie" : style === "adventurous" ? "Explore the local nightlife or evening markets" : "Evening walk through the lit-up streets"}
- Head back to **${propertyName}** for a comfortable night's rest
`;
    }

    return `
# ${location} Itinerary

**Stay:** ${propertyName}  
**Duration:** ${days} day${days > 1 ? "s" : ""}  
**Group:** ${people} person${people > 1 ? "s" : ""} (${groupType})  
**Style:** ${style} · **Budget:** ${budget}  
${daysMarkdown}

---

## 🍽️ Food Recommendations

| Meal Type | ${budget === "luxury" ? "Fine Dining" : budget === "moderate" ? "Mid-Range" : "Budget-Friendly"} |
|-----------|${budget === "luxury" ? "---|" : "---|---|"}
| Breakfast | ${budget === "luxury" ? "Hotel breakfast or a chic brunch spot" : "Local café or bakery"} |
| Lunch | ${budget === "luxury" ? "Top-rated restaurant in the city center" : "Street food or casual eatery"} |
| Dinner | ${budget === "luxury" ? "Award-winning fine dining experience" : "Popular local restaurant recommended by host"} |
| Snacks | ${budget === "luxury" ? "Artisanal treats from gourmet shops" : "Local market fresh bites"} |

## 💡 ${budget} Budget Tips

- **${location}** has options for every budget — ask your host for money-saving tips
- ${budget === "budget" ? "Use public transport and eat where the locals eat" : budget === "moderate" ? "Mix paid attractions with free walking tours" : "Pre-book premium experiences for best rates"}
- Carry some local currency for small vendors and tips
- Check if **${propertyName}** offers kitchen access to save on some meals
- Download offline maps of ${location} before heading out

## 🌟 Hidden Gems

- Ask your host at **${propertyName}** for their personal hidden gem recommendations
- Explore side streets away from the main tourist areas
- Visit local markets for authentic souvenirs and street food
- ${style === "cultural" ? "Look for community-run cultural centers" : style === "adventurous" ? "Find lesser-known hiking trails or viewpoints" : "Discover quiet parks and tranquil spots"}
- Early morning walks reveal a different side of ${location}

## ✅ Quick Tips

- **Pace yourself**: This is a ${pace} trip — adjust activities to your energy
- **Stay connected**: Save your booking details for ${propertyName}
- **Weather check**: Pack according to ${location}'s forecast
- **Stay hydrated**: Always carry water, especially during activities
- **Travel insurance**: Recommended for peace of mind

---
*This itinerary was generated as a template. For a more personalized plan, please try again when the AI service is available.*
`;
  }
}
