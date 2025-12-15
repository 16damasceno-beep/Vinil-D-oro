
import React, { useState } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, ItemType } from '../types';
import { Link } from 'react-router-dom';

export const Catalog: React.FC = () => {
  const { catalog } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<string>('Todos');

  const genres = ['Todos', ...Object.values(Genre)];
  const itemTypes = ['Todos', ...Object.values(ItemType)];

  const filteredCatalog = catalog.filter((item: CatalogItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'Todos' || item.genre === selectedGenre;
    const matchesType = selectedType === 'Todos' || (item.itemType === selectedType || (!item.itemType && selectedType === ItemType.LP)); // Fallback legacy items to LP if needed or just filter exact
    
    // Improved logic: if item has no itemType, we assume it matches nothing specific OR we could assume VINYL/LP. 
    // Let's go with exact match on property if present.
    const typeCheck = selectedType === 'Todos' 
       ? true 
       : item.itemType === selectedType;

    return matchesSearch && matchesGenre && typeCheck;
  });

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Catálogo Mestre</h1>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Buscar Artista ou Álbum..."
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
          {filteredCatalog.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <img src={item.coverUrl} alt={item.title} className="w-full aspect-square object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-white truncate">{item.title}</h3>
                <p className="text-sm text-gray-400 truncate">{item.artist}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                   <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{item.genre}</span>
                   <span className="text-[10px] bg-vinyl-accent/20 text-vinyl-accent border border-vinyl-accent/50 px-1.5 py-0.5 rounded">
                     {item.itemType || 'Vinil'}
                   </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredCatalog.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum item encontrado.
          </div>
        )}
      </div>
    </div>
  );
};
