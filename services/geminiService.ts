
import { GoogleGenAI, Type } from "@google/genai";
import { Genre, ItemType } from "../types";

// Helper to get enum keys for the schema
const genreKeys = Object.values(Genre);
const itemTypeKeys = Object.values(ItemType);

export const getAlbumDetails = async (query: string): Promise<{ artist: string; title: string; genre: string; description: string; year: number; imageSearchQuery: string } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Encontre detalhes para o álbum de música correspondente a esta pesquisa: "${query}". Retorne o artista, título, gênero (correspondência mais próxima da lista), ano de lançamento, uma descrição curta de 2 frases em Português e um termo de busca otimizado para encontrar a capa em alta qualidade (ex: 'Pink Floyd Dark Side Moon album cover high resolution').`,
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
            imageSearchQuery: { type: Type.STRING, description: "Termo em inglês para buscar imagem HD no Google Images" }
          },
          required: ["artist", "title", "genre", "year", "description", "imageSearchQuery"]
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
      model: "gemini-2.5-flash",
      contents: `Encontre detalhes técnicos para o equipamento de áudio correspondente a esta pesquisa: "${query}". Retorne a Marca (Brand), Modelo, Tipo de Equipamento (ItemType), Ano aproximado de fabricação, Voltagem comum, uma descrição técnica curta em Português e um termo de busca otimizado para encontrar uma foto profissional do produto (ex: 'Technics SL-1200MK2 turntable professional photo white background').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "A marca do fabricante (ex: Technics, Pioneer)" },
            model: { type: Type.STRING, description: "O modelo específico (ex: SL-1200MK2)" },
            type: { type: Type.STRING, enum: itemTypeKeys, description: "Deve ser 'Equipamento' ou 'Serato' ou similar" },
            year: { type: Type.INTEGER },
            voltage: { type: Type.STRING, description: "Ex: 110v, 220v ou Bivolt" },
            description: { type: Type.STRING },
            imageSearchQuery: { type: Type.STRING, description: "Termo em inglês para buscar imagem HD no Google Images" }
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
