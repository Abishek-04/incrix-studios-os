import { GoogleGenAI } from "@google/genai";
import { Platform, Vertical } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

export const generateScript = async (
  title: string,
  platform: Platform,
  vertical: Vertical
): Promise<string> => {
  try {
    const prompt = `Write a video script for a ${platform} video about "${title}" in the ${vertical} vertical. 
    Style: Engaging, fast-paced, direct. 
    Format: Use headers for 'Hook', 'Body', and 'Call to Action'.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert creative director for viral social media content.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Could not generate script.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating script. Please check API key.";
  }
};

export const generateTasks = async (
  stage: string,
  platform: Platform
): Promise<{ id: string; text: string; done: boolean }[]> => {
  try {
    const prompt = `Generate a checklist of 5 critical technical tasks for a video editor working on a ${platform} video in the ${stage} stage. Return ONLY the tasks as a list.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
         thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text || "";
    const lines = text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    
    return lines.map((line, idx) => ({
      id: `generated-${Date.now()}-${idx}`,
      text: line.replace(/^- /, '').replace(/^\d+\. /, ''),
      done: false
    }));
  } catch (error) {
    return [{ id: 'err', text: 'Manual task entry required (AI Offline)', done: false }];
  }
};

export const refineNotes = async (notes: string): Promise<string> => {
  try {
    const prompt = `Refine the following messy creative notes into structured, bulleted technical instructions for a video editor: "${notes}"`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || notes;
  } catch (error) {
    return notes;
  }
};
