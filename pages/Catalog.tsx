
import React, { useState } from 'react';
import { useStore } from '../store';
import { Genre, ItemType } from '../types';
import { Link } from 'react-router-dom';

export const Catalog: React.FC = () => {
  const { getEnrichedListings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<string>('Todos');

  const genres = ['Todos', ...Object.values(Genre)];
  const itemTypes = ['Todos', ...Object.values(ItemType)];

  const listings = getEnrichedListings().filter(l => l.status === 'DISPONÍVEL');

  const filteredListings = listings.filter((listing) => {
    const item = listing.catalogItem;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'Todos' || item.genre === selectedGenre;
    const typeCheck = selectedType === 'Todos' ? true : item.itemType === selectedType;
    return matchesSearch && matchesGenre && typeCheck;
  });

  const lotListings = filteredListings.filter(l => l.catalogItem.itemType === ItemType.LOTE);
  const equipmentListings = filteredListings.filter(l => l.catalogItem.itemType === ItemType.EQUIPMENT);
  const mediaListings = filteredListings.filter(l => l.catalogItem.itemType !== ItemType.EQUIPMENT && l.catalogItem.itemType !== ItemType.LOTE);

  const renderListingCard = (listing: any, highlight: boolean = false) => (
    <Link to={`/listing/${listing.id}`} key={listing.id} className={`block group rounded-lg overflow-hidden border transition shadow-lg ${highlight ? 'bg-vinyl-accent/5 border-vinyl-accent/50' : 'bg-gray-800 border-gray-700 hover:border-vinyl-accent'}`}>
      <div className="relative pb-[100%] overflow-hidden">
        <img src={listing.catalogItem.coverUrl} alt={listing.catalogItem.title} className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {listing.catalogItem.itemType === ItemType.LOTE && (
          <div className="absolute top-0 left-0 bg-vinyl-accent text-black text-[10px] font-bold px-2 py-1 rounded-br z-10">🎁 LOTE</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white truncate text-lg">{listing.catalogItem.title}</h3>
        <p className="text-sm text-vinyl-accent truncate">{listing.catalogItem.artist}</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
          <span className="text-xs text-gray-400">Preço</span>
          <span className="text-xl font-bold text-white">R$ {listing.price.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Loja & Catálogo</h1>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Pesquisar por artista ou álbum..." 
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-vinyl-accent outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <select 
            className="bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-vinyl-accent outline-none cursor-pointer" 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
             <option value="Todos">Todos os Tipos</option>
             {Object.values(ItemType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 1. Mídias (Sempre primeiro) */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white uppercase mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
            <span className="text-vinyl-accent">💿</span> Mídias & Colecionáveis
          </h2>
          {mediaListings.length === 0 ? (
            <p className="text-gray-500 italic text-sm py-4">Nenhum item individual encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {mediaListings.map(l => renderListingCard(l))}
            </div>
          )}
        </div>

        {/* 2. Equipamentos (Segundo) */}
        {equipmentListings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white uppercase mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
               <span className="text-vinyl-accent">🎛️</span> Equipamentos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {equipmentListings.map(l => renderListingCard(l))}
            </div>
          </div>
        )}

        {/* 3. Lotes (Agora no Final) */}
        {lotListings.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-800">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <span className="bg-vinyl-accent text-black w-10 h-10 rounded-xl flex items-center justify-center text-lg">🎁</span> 
              Super Lotes Promocionais
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {lotListings.map(l => renderListingCard(l, true))}
            </div>
          </div>
        )}

        {filteredListings.length === 0 && (
          <div className="py-20 text-center text-gray-500">
            Nenhum resultado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
