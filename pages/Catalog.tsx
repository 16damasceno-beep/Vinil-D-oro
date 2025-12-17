
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

  // Filter only Available listings for the Catalog/Marketplace view
  const listings = getEnrichedListings().filter(l => l.status === 'DISPONÍVEL');

  const filteredListings = listings.filter((listing) => {
    const item = listing.catalogItem;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'Todos' || item.genre === selectedGenre;
    
    // Type Check
    const typeCheck = selectedType === 'Todos' 
       ? true 
       : (item.itemType === selectedType || (!item.itemType && selectedType === ItemType.LD));

    return matchesSearch && matchesGenre && typeCheck;
  });

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Loja & Catálogo</h1>
        <p className="text-gray-400 mb-8">Navegue pelos itens disponíveis para compra e reserva imediata.</p>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Buscar Artista, Diretor ou Título..."
            className="flex-1 bg-gray-800 text-white rounded-md px-4 py-2 border border-gray-700 focus:outline-none focus:border-vinyl-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-4">
            <select
              className="bg-gray-800 text-white rounded-md px-4 py-2 border border-gray-700 focus:outline-none focus:border-vinyl-accent"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select
              className="bg-gray-800 text-white rounded-md px-4 py-2 border border-gray-700 focus:outline-none focus:border-vinyl-accent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredListings.map(listing => (
            <Link to={`/listing/${listing.id}`} key={listing.id} className="block group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-vinyl-accent transition shadow-lg">
              <div className="relative pb-[100%] overflow-hidden">
                <img 
                  src={listing.catalogItem.coverUrl} 
                  alt={listing.catalogItem.title} 
                  className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                {/* Condition Badge */}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-gray-600">
                   {listing.condition.split(' ')[0]}
                </div>
                {/* Product Condition Badge (Novo/Usado) */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white border ${listing.productCondition === 'NOVO' ? 'bg-green-900/80 border-green-700' : 'bg-blue-900/80 border-blue-700'}`}>
                   {listing.productCondition || 'USADO'}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-white truncate text-lg">{listing.catalogItem.title}</h3>
                <p className="text-sm text-vinyl-accent truncate">{listing.catalogItem.artist}</p>
                
                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                   <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{listing.catalogItem.genre}</span>
                   <span className="text-[10px] bg-vinyl-accent/20 text-vinyl-accent border border-vinyl-accent/50 px-1.5 py-0.5 rounded">
                     {listing.catalogItem.itemType || 'Laser Disc'}
                   </span>
                </div>

                <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500">Vendedor</span>
                    <span className="text-xs text-gray-300 truncate max-w-[80px]">{listing.sellerName}</span>
                  </div>
                  <span className="text-xl font-bold text-white">R$ {listing.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {filteredListings.length === 0 && (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-dashed border-gray-800">
            <p className="text-gray-500 text-lg">Nenhum item disponível com esses filtros.</p>
            <p className="text-gray-600 text-sm mt-2">Tente buscar por outro termo ou limpe os filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};