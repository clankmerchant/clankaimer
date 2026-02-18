
import { GoogleGenAI, Type } from "@google/genai";
import { GameStats, CoachFeedback } from "../types";

export const getCoachFeedback = async (stats: GameStats): Promise<CoachFeedback> => {
  // Always use a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const accuracy = stats.hits + stats.misses > 0 
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
    : 0;
  
  const prompt = `Act as an elite eSports aim coach. 
    Analyze these session stats: 
    - Score: ${stats.score}
    - Hits: ${stats.hits}
    - Misses: ${stats.misses}
    - Accuracy: ${accuracy}%
    
    Provide a concise (2 sentences max) performance review. Be either motivational or a bit of a "tough love" roast depending on if accuracy is below 60%.
    Also provide a one-word skill rating (e.g., BRONZE, GOLD, RADIANT, BOT).`;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning tasks like eSports coaching analysis.
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            rating: { type: Type.STRING }
          },
          required: ["text", "rating"]
        }
      }
    });

    // Access the .text property directly instead of calling it as a method.
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Coaching Error:", error);
    return {
      text: "Keep practicing. Precision is the key to victory.",
      rating: "TRAINEE"
    };
  }
};
