import React, { useState } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre } from '../types';
import { Link } from 'react-router-dom';

export const Catalog: React.FC = () => {
  const { catalog } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');

  const genres = ['Todos', ...Object.values(Genre)];

  const filteredCatalog = catalog.filter((item: CatalogItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'Todos' || item.genre === selectedGenre;
    return matchesSearch && matchesGenre;
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
          <select
            className="bg-gray-800 text-white rounded-md px-4 py-2 border border-gray-700 focus:outline-none focus:border-vinyl-accent"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredCatalog.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <img src={item.coverUrl} alt={item.title} className="w-full aspect-square object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-white truncate">{item.title}</h3>
                <p className="text-sm text-gray-400 truncate">{item.artist}</p>
                <p className="text-xs text-gray-500 mt-1">{item.genre} • {item.year}</p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredCatalog.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum álbum encontrado. Se você estiver vendendo, adicione-o ao catálogo!
          </div>
        )}
      </div>
    </div>
  );
};