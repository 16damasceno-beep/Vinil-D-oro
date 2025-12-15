import { GoogleGenAI, Type } from "@google/genai";
import { Genre } from "../types";

// Helper to get enum keys for the schema
const genreKeys = Object.values(Genre);

export const getAlbumDetails = async (query: string): Promise<{ artist: string; title: string; genre: string; description: string; year: number } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Encontre detalhes para o álbum de música correspondente a esta pesquisa: "${query}". Retorne o artista, título, gênero (correspondência mais próxima da lista), ano de lançamento e uma descrição curta de 2 frases em Português.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artist: { type: Type.STRING },
            title: { type: Type.STRING },
            genre: { type: Type.STRING, enum: genreKeys },
            year: { type: Type.INTEGER },
            description: { type: Type.STRING }
          },
          required: ["artist", "title", "genre", "year", "description"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};