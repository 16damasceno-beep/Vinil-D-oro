
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
          <span className="text-xs text-gray-400">R$ individual</span>
          <span className="text-xl font-bold text-white">R$ {listing.price.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Loja & Catálogo</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <input type="text" placeholder="Pesquisar..." className="flex-1 bg-gray-800 text-white rounded px-4 py-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="bg-gray-800 text-white rounded px-4 py-2" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
             {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Lotes */}
        {lotListings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 border-b border-vinyl-accent pb-2">🎁 Super Lotes Promocionais</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {lotListings.map(l => renderListingCard(l, true))}
            </div>
          </div>
        )}

        {/* Mídias */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white uppercase mb-6 border-b border-gray-800 pb-2">Mídias & Colecionáveis</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {mediaListings.map(l => renderListingCard(l))}
          </div>
        </div>

        {/* Equipamentos */}
        {equipmentListings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white uppercase mb-6 border-b border-gray-800 pb-2">Equipamentos</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {equipmentListings.map(l => renderListingCard(l))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
