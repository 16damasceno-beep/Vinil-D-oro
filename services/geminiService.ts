
import { GoogleGenAI, Type } from "@google/genai";
import { Genre, ItemType } from "../types";

const genreKeys = Object.values(Genre);
const itemTypeKeys = Object.values(ItemType);

export const getAlbumDetails = async (query: string): Promise<{ artist: string; title: string; genre: string; description: string; year: number; imageSearchQuery: string; tracks: {position: string, title: string, duration: string}[] } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Encontre detalhes para o álbum/filme em Laser Disc (LD) ou Vinil correspondente a esta pesquisa: "${query}". 
      Retorne o artista/diretor, título, gênero, ano de lançamento, uma descrição curta de 2 frases em Português e um termo de busca otimizado para a capa.
      IMPORTANTE: Se for um álbum musical, retorne a lista de faixas. Se for filme, retorne os capítulos se possível.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artist: { type: Type.STRING },
            title: { type: Type.STRING },
            genre: { type: Type.STRING, enum: genreKeys },
            year: { type: Type.INTEGER },
            description: { type: Type.STRING },
            imageSearchQuery: { type: Type.STRING },
            tracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  position: { type: Type.STRING },
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING }
                },
                required: ["position", "title"]
              }
            }
          },
          required: ["artist", "title", "genre", "year", "description", "imageSearchQuery", "tracks"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error (Album):", error);
    return null;
  }
};

export const getEquipmentDetails = async (query: string): Promise<{ brand: string; model: string; type: string; year: number; description: string; voltage: string; imageSearchQuery: string } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Encontre detalhes técnicos para o equipamento de áudio/vídeo ou acessório (Feltro, etc) correspondente a esta pesquisa: "${query}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            type: { type: Type.STRING, enum: itemTypeKeys },
            year: { type: Type.INTEGER },
            voltage: { type: Type.STRING },
            description: { type: Type.STRING },
            imageSearchQuery: { type: Type.STRING }
          },
          required: ["brand", "model", "type", "year", "description", "imageSearchQuery"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error (Equipment):", error);
    return null;
  }
};
