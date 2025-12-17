
import React, { useState } from 'react';
import { useStore } from '../store';
import { WantRequest, VinylCondition, ItemType, Genre, CatalogItem } from '../types';
import { Link } from 'react-router-dom';
import { getAlbumDetails, getEquipmentDetails } from '../services/geminiService';
import { searchDiscogs } from '../services/discogsService';
import { DiscogsTokenManager } from '../components/DiscogsTokenManager';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const LookingFor: React.FC = () => {
  const { wantRequests, currentUser, addWantRequest, deleteWantRequest, wantResponses } = useStore();
  
  // UI States
  const [isPosting, setIsPosting] = useState(false);
  const [searchMode, setSearchMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [searchCategory, setSearchCategory] = useState<'MEDIA' | 'EQUIPMENT'>('MEDIA');
  
  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  
  // Form State
  const [form, setForm] = useState({ title: '', artist: '', description: '', image: '' as string });
  const [file, setFile] = useState<File | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    const discogsToken = localStorage.getItem('discogs_token') || '';

    setIsSearching(true);
    setSearchResults([]);

    if (searchCategory === 'MEDIA') {
      // 1. Try Discogs
      if (discogsToken) {
        const discogsResults = await searchDiscogs(searchTerm, discogsToken);
        if (discogsResults.length > 0) {
          setSearchResults(discogsResults);
          setIsSearching(false);
          return;
        }
      }

      // 2. Try AI
      const aiResult = await getAlbumDetails(searchTerm);
      if (aiResult) {
         const newItem: any = {
           id: `want-ai-${Date.now()}`,
           artist: aiResult.artist,
           title: aiResult.title,
           coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400`,
           description: aiResult.description
         };
         setSearchResults([newItem]);
      }
    } else {
      // Equipment Search
      const aiResult = await getEquipmentDetails(searchTerm);
      if (aiResult) {
         const newItem: any = {
           id: `want-eq-ai-${Date.now()}`,
           artist: aiResult.brand,
           title: aiResult.model,
           coverUrl: `https://picsum.photos/seed/${aiResult.model.replace(/\s/g,'')}/400/400`,
           description: aiResult.description
         };
         setSearchResults([newItem]);
      }
    }
    setIsSearching(false);
  };

  const handleSelectResult = (item: CatalogItem) => {
    setForm({
      title: item.title,
      artist: item.artist,
      description: item.description || '',
      image: item.coverUrl
    });
    setSearchMode('MANUAL'); // Show form to add final description
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Faça login para postar.");
    if (!form.title || (!file && !form.image)) return alert("Preencha o título e adicione uma imagem.");

    let finalImg = form.image;
    if (file) {
      finalImg = await fileToBase64(file);
    }

    const newReq: WantRequest = {
      id: `wr-${Date.now()}`,
      buyerId: currentUser.id,
      buyerName: currentUser.nickname,
      title: form.title,
      artist: form.artist,
      description: form.description,
      imageUrl: finalImg,
      createdAt: new Date().toISOString(),
      status: 'ABERTO'
    };

    addWantRequest(newReq);
    setForm({ title: '', artist: '', description: '', image: '' });
    setFile(null);
    setIsPosting(false);
    setSearchMode('AUTO');
    setSearchResults([]);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-vinyl-accent">🔍</span> Procuro Por...
            </h1>
            <p className="text-gray-400">Encontre aquele disco ou aparelho raro com ajuda da comunidade.</p>
          </div>
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="bg-vinyl-accent hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            {isPosting ? 'Cancelar Pedido' : '+ Criar Novo Pedido'}
          </button>
        </div>

        {isPosting && (
          <div className="animate-[fadeIn_0.3s]">
            <DiscogsTokenManager />
            
            <div className="bg-gray-900 p-6 rounded-2xl border border-vinyl-accent/30 mb-12 shadow-2xl">
              <div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
                 <button onClick={() => setSearchMode('AUTO')} className={`px-4 py-1 rounded-full text-xs font-bold transition ${searchMode === 'AUTO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-gray-300'}`}>Busca Automática</button>
                 <button onClick={() => setSearchMode('MANUAL')} className={`px-4 py-1 rounded-full text-xs font-bold transition ${searchMode === 'MANUAL' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-gray-300'}`}>Preencher Manual</button>
              </div>

              {searchMode === 'AUTO' ? (
                <div className="space-y-6">
                  <div className="flex gap-2 max-w-md mx-auto mb-6">
                      <button onClick={() => setSearchCategory('MEDIA')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${searchCategory === 'MEDIA' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>💿 Discos/Mídia</button>
                      <button onClick={() => setSearchCategory('EQUIPMENT')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${searchCategory === 'EQUIPMENT' ? 'bg-blue-900/50 text-blue-200 border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>🎛️ Aparelhos</button>
                  </div>
                  
                  <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
                    <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder={searchCategory === 'MEDIA' ? "Nome do disco ou artista..." : "Marca ou modelo do aparelho..."}
                      className="flex-1 bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:border-vinyl-accent outline-none" 
                    />
                    <button type="submit" disabled={isSearching} className="bg-vinyl-accent hover:bg-yellow-600 text-black px-8 rounded-xl font-bold transition disabled:opacity-50">
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {searchResults.map(item => (
                      <div key={item.id} onClick={() => handleSelectResult(item)} className="cursor-pointer bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-vinyl-accent flex gap-3 group transition">
                        <div className="w-14 h-14 bg-black rounded overflow-hidden flex-shrink-0">
                          <img src={item.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-xs truncate">{item.title}</p>
                          <p className="text-gray-500 text-[10px] truncate">{item.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="animate-[fadeIn_0.3s]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">O que você procura?</label>
                        <input type="text" placeholder="Título do Disco / Equipamento" required className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Artista ou Marca</label>
                        <input type="text" placeholder="Ex: Pink Floyd, Technics..." className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Detalhes do Pedido</label>
                        <textarea placeholder="Ex: Procuro prensagem nacional, aceito com riscos leves, pago até R$ 200..." className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 h-32 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Foto de Referência</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-2xl h-64 flex flex-col items-center justify-center relative overflow-hidden group bg-gray-800/50">
                         {file ? (
                           <img src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-contain bg-black" />
                         ) : form.image ? (
                           <img src={form.image} className="absolute inset-0 w-full h-full object-contain bg-black" />
                         ) : (
                           <div className="text-center text-gray-500">
                              <span className="text-4xl block mb-2">🖼️</span>
                              <p className="text-xs font-medium">Arraste ou clique para subir uma foto</p>
                              <p className="text-[10px] mt-1 text-gray-600">Referência visual para o vendedor</p>
                           </div>
                         )}
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                            setFile(e.target.files ? e.target.files[0] : null);
                            setForm({...form, image: ''});
                         }} />
                      </div>
                      <input type="text" placeholder="Ou cole a URL de uma imagem..." className="w-full bg-gray-800 text-white p-2 rounded-lg text-[10px] border border-gray-700" value={form.image} onChange={e => {
                        setForm({...form, image: e.target.value});
                        setFile(null);
                      }} />
                      
                      <div className="flex gap-3 pt-4">
                         <button type="button" onClick={() => setSearchMode('AUTO')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition">Voltar</button>
                         <button type="submit" className="flex-[2] bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded-xl shadow-xl shadow-yellow-900/20 transition">Publicar Pedido</button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Want Requests List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wantRequests.length === 0 ? (
            <div className="col-span-full py-24 text-center text-gray-500 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
               <span className="text-5xl block mb-4">🛸</span>
               <p className="text-lg font-medium text-gray-400">Ninguém está procurando nada por enquanto.</p>
               <p className="text-sm">Seja o primeiro a postar o que você deseja colecionar!</p>
            </div>
          ) : (
            wantRequests.map(req => {
              const responsesCount = wantResponses.filter(r => r.requestId === req.id).length;
              return (
                <div key={req.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-vinyl-accent transition-all group flex flex-col shadow-lg hover:shadow-vinyl-accent/10">
                   <div className="relative h-56 overflow-hidden bg-black flex items-center justify-center">
                      <img src={req.imageUrl} className="max-h-full max-w-full object-contain group-hover:scale-110 transition duration-700" />
                      {responsesCount > 0 && (
                        <div className="absolute top-3 right-3 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse shadow-xl border border-green-400/30">
                           {responsesCount} {responsesCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                         <h3 className="text-white font-bold truncate text-lg">{req.title}</h3>
                         <p className="text-vinyl-accent text-sm truncate font-medium">{req.artist || 'Artista não especificado'}</p>
                      </div>
                   </div>
                   <div className="p-5 flex-1 flex flex-col">
                      <p className="text-gray-400 text-xs line-clamp-3 italic mb-6 leading-relaxed">"{req.description}"</p>
                      
                      <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-800">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-vinyl-accent rounded-full flex items-center justify-center text-[10px] font-bold text-black">{req.buyerName.charAt(0)}</div>
                            <span className="text-[10px] text-gray-500 font-bold">{req.buyerName}</span>
                         </div>
                         <div className="flex gap-2">
                            {currentUser?.id === req.buyerId && (
                               <button onClick={() => deleteWantRequest(req.id)} className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-900/10 transition">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                            )}
                            <Link to={`/procuro-por/${req.id}`} className="bg-gray-800 hover:bg-vinyl-accent hover:text-black text-white text-xs font-bold px-5 py-2 rounded-xl border border-gray-700 transition">
                               {currentUser?.id === req.buyerId ? 'Ver Propostas' : 'Eu Tenho!'}
                            </Link>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
