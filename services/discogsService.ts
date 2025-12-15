
import { CatalogItem, Genre, ItemType } from "../types";

const BASE_URL = 'https://api.discogs.com';

// Helper to map Discogs genres to our Enum
const mapGenre = (styles?: string[], genres?: string[]): Genre => {
  const allTags = [...(styles || []), ...(genres || [])].map(s => s.toLowerCase());
  
  if (allTags.some(t => t.includes('rock'))) return Genre.ROCK;
  if (allTags.some(t => t.includes('jazz'))) return Genre.JAZZ;
  if (allTags.some(t => t.includes('pop'))) return Genre.POP;
  if (allTags.some(t => t.includes('hip hop') || t.includes('rap'))) return Genre.HIPHOP;
  if (allTags.some(t => t.includes('electronic') || t.includes('house') || t.includes('techno'))) return Genre.ELECTRONIC;
  if (allTags.some(t => t.includes('classical'))) return Genre.CLASSICAL;
  if (allTags.some(t => t.includes('mpb') || t.includes('bossanova'))) return Genre.MPB;
  if (allTags.some(t => t.includes('samba'))) return Genre.SAMBA;
  
  return Genre.OTHER;
};

// Helper to determine ItemType from Discogs format
const mapFormatToItemType = (formats?: string[]): ItemType => {
  if (!formats) return ItemType.VINYL;
  const formatString = formats.join(' ').toLowerCase();

  if (formatString.includes('cd')) return ItemType.CD;
  if (formatString.includes('cassette') || formatString.includes('tape')) return ItemType.K7;
  if (formatString.includes('7"')) return ItemType.SINGLE_7;
  if (formatString.includes('12"')) return ItemType.SINGLE_12;
  if (formatString.includes('lp')) return ItemType.LP;
  
  return ItemType.VINYL;
};

export const searchDiscogs = async (query: string, token: string): Promise<CatalogItem[]> => {
  if (!query || !token) return [];

  try {
    const response = await fetch(`${BASE_URL}/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`, {
      headers: {
        'Authorization': `Discogs token=${token}`
      }
    });

    if (!response.ok) throw new Error('Falha na busca do Discogs');

    const data = await response.json();
    
    return data.results.map((item: any) => ({
      id: `discogs-${item.id}`,
      discogsId: item.id,
      artist: item.title.split(' - ')[0] || 'Desconhecido', // Discogs often returns "Artist - Title"
      title: item.title.split(' - ')[1] || item.title,
      genre: mapGenre(item.style, item.genre),
      itemType: mapFormatToItemType(item.format),
      year: item.year ? parseInt(item.year) : undefined,
      // CHANGE: Use cover_image for high quality, fall back to thumb
      coverUrl: item.cover_image || item.thumb || 'https://via.placeholder.com/400x400?text=No+Cover',
      format: item.format ? item.format.join(', ') : 'Vinil',
      label: item.label ? item.label[0] : 'Desconhecido',
      description: `Importado do Discogs. ${item.format?.join(', ') || ''}.`
    }));

  } catch (error) {
    console.error("Discogs Error:", error);
    return [];
  }
};
