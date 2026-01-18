
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getGameFeedback(score: number, difficulty: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User just played a Snake game. Score: ${score}, Difficulty: ${difficulty}. 
      Give a short, witty, 1-sentence comment on their performance in Chinese.`,
      config: {
        maxOutputTokens: 50,
      }
    });
    return response.text || "太棒了！再接再厉。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "游戏结束，你的表现令人印象深刻！";
  }
}
