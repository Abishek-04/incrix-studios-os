import { GoogleGenAI, Type } from "@google/genai";
import { Platform } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SocialMetrics {
    views: number;
    likes: number;
    comments: number;
    retention: string;
    sources?: string[];
}

// Fallback mock logic (Deterministic)
const fetchMockSocialMetrics = (url: string, platform: Platform): SocialMetrics => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash) + url.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    let viewMultiplier = 1;
    if (platform === Platform.YouTube) viewMultiplier = 1.5;
    if (platform === Platform.TikTok) viewMultiplier = 2.5;

    const views = Math.floor(((seed % 10000) + 500) * viewMultiplier);
    const likeRate = 0.08 + ((seed % 5) / 100);
    const likes = Math.floor(views * likeRate);
    const commentRate = 0.005 + ((seed % 3) / 1000);
    const comments = Math.floor(views * commentRate);
    const retentionVal = 35 + (seed % 45);

    return {
        views,
        likes,
        comments,
        retention: `${retentionVal}%`
    };
};

export const fetchSocialMetrics = async (url: string, platform: Platform): Promise<SocialMetrics> => {
    try {
        // Use Gemini to search for real metrics
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Find the exact current public view count, like count, and comment count for this video url: ${url}. 
            If exact numbers aren't available, estimate based on the most recent search results.
            Return the data as a JSON object.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        views: { type: Type.INTEGER, description: "Number of views" },
                        likes: { type: Type.INTEGER, description: "Number of likes" },
                        comments: { type: Type.INTEGER, description: "Number of comments" },
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}");
        
        // Extract grounding sources
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web?.uri)
            .filter((uri: string) => uri) || [];

        // Check if we actually got numbers, otherwise fallback
        if (typeof json.views === 'number') {
             // Mock retention as it's private analytics data
             const mockRetention = Math.floor(Math.random() * 40) + 30; 
             
             return {
                views: json.views,
                likes: json.likes || 0,
                comments: json.comments || 0,
                retention: `${mockRetention}%`, // Private data
                sources: sources
            };
        }
        
        throw new Error("Gemini returned empty data");

    } catch (error) {
        console.warn("Real-time fetch failed, using simulation:", error);
        return fetchMockSocialMetrics(url, platform);
    }
};