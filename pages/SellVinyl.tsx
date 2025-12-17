
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, VinylCondition, Listing, ItemType, ProductCondition, Track } from '../types';
import { getAlbumDetails, getEquipmentDetails } from '../services/geminiService';
import { searchDiscogs, getDiscogsReleaseDetails } from '../services/discogsService';
import { useNavigate } from 'react-router-dom';
import { DiscogsTokenManager } from '../components/DiscogsTokenManager';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const SellVinyl: React.FC = () => {
  const { catalog, addToCatalog, addListing, currentUser, getEnrichedListings } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'SEARCH' | 'MANUAL' | 'LOTE'>('SEARCH');
  
  const [searchCategory, setSearchCategory] = useState<'MEDIA' | 'EQUIPMENT'>('MEDIA');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);

  const [manualForm, setManualForm] = useState({
    artist: '', 
    title: '',  
    genre: Genre.OTHER,
    itemType: ItemType.LP, 
    year: new Date().getFullYear().toString(),
    description: '',
    label: '',
    voltage: 'N/A',
    coverUrl: '', 
    tracks: [] as Track[]
  });
  const [manualCoverFile, setManualCoverFile] = useState<File | null>(null);

  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [price, setPrice] = useState('');
  const [productCondition, setProductCondition] = useState<ProductCondition>('USADO');
  const [condition, setCondition] = useState<VinylCondition>(VinylCondition.VG);
  const [description, setDescription] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowShipping, setAllowShipping] = useState(true);

  // Lote State
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

  if (!currentUser) {
    return <div className="p-8 text-center text-white">Por favor, faça login para vender.</div>;
  }

  const isEquipment = manualForm.itemType === ItemType.EQUIPMENT;
  const isFeltro = manualForm.itemType === ItemType.FELTRO;

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchTerm) return;
    const discogsToken = localStorage.getItem('discogs_token') || '';
    setIsSearching(true);
    setSearchResults([]);

    if (searchCategory === 'MEDIA') {
      if (discogsToken) {
        const discogsResults = await searchDiscogs(searchTerm, discogsToken);
        if (discogsResults.length > 0) {
          setSearchResults(discogsResults);
          setIsSearching(false);
          return;
        }
      }
      const aiResult = await getAlbumDetails(searchTerm);
      if (aiResult) {
         setSearchResults([{ id: `c-ai-${Date.now()}`, ...aiResult, genre: aiResult.genre as Genre, itemType: ItemType.LP, coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400`, format: 'Vinil', label: 'AI Generated', tracks: aiResult.tracks }]);
      }
    } else {
      const aiResult = await getEquipmentDetails(searchTerm);
      if (aiResult) {
         setSearchResults([{ id: `c-eq-ai-${Date.now()}`, artist: aiResult.brand, title: aiResult.model, genre: Genre.OTHER, itemType: ItemType.EQUIPMENT, year: aiResult.year, description: aiResult.description, coverUrl: `https://picsum.photos/seed/${aiResult.model.replace(/\s/g,'')}/400/400`, format: 'Equipamento', label: aiResult.brand, voltage: aiResult.voltage || 'N/A' }]);
      }
    }
    setIsSearching(false);
  };

  const handleSelectResult = async (item: CatalogItem) => {
    let tracks = item.tracks || [];
    let year = item.year ? item.year.toString() : '';
    let label = item.label || '';
    const discogsToken = localStorage.getItem('discogs_token') || '';

    if (item.id.startsWith('discogs-') && discogsToken) {
       setLoadingDetails(true);
       const realId = item.discogsId || parseInt(item.id.replace('discogs-', ''));
       if (realId) {
         const details = await getDiscogsReleaseDetails(realId, discogsToken);
         if (details) {
            tracks = details.tracks;
            if (details.year) year = details.year.toString();
            if (details.label) label = details.label;
         }
       }
       setLoadingDetails(false);
    }

    setManualForm({
      artist: item.artist,
      title: item.title,
      genre: item.genre,
      itemType: item.itemType,
      year: year,
      description: item.description || '',
      label: label,
      voltage: item.voltage || 'N/A',
      coverUrl: item.coverUrl,
      tracks: tracks
    });

    setMode('MANUAL');
    window.scrollTo(0, 0); 
  };

  const handleManualCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCoverUrl = manualForm.coverUrl || `https://picsum.photos/seed/${manualForm.title}/400/400`;
    if (manualCoverFile) {
       finalCoverUrl = await fileToBase64(manualCoverFile);
    }
    const newItem: CatalogItem = {
      id: `c-man-${Date.now()}`,
      ...manualForm,
      year: parseInt(manualForm.year) || 0,
      coverUrl: finalCoverUrl,
      format: manualForm.itemType,
      tracks: manualForm.tracks.filter(t => t.title)
    };
    addToCatalog(newItem);
    setSelectedCatalogItem(newItem);
    setStep(2);
  };

  const handleLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListingIds.length < 2) return alert("Selecione pelo menos 2 itens.");
    const selectedEnriched = getEnrichedListings().filter(l => selectedListingIds.includes(l.id));
    const totalPrice = selectedEnriched.reduce((sum, l) => sum + l.price, 0);
    const lotCatalogItem: CatalogItem = { id: `c-lot-${Date.now()}`, artist: currentUser.nickname, title: `Lote de ${selectedListingIds.length} Itens`, genre: Genre.OTHER, itemType: ItemType.LOTE, coverUrl: selectedEnriched[0].catalogItem.coverUrl, description: `Contém: ${selectedEnriched.map(l => l.catalogItem.title).join(', ')}`, year: new Date().getFullYear() };
    addToCatalog(lotCatalogItem);
    setSelectedCatalogItem(lotCatalogItem);
    setPrice((totalPrice * 0.9).toFixed(2));
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">Criar Anúncio</h1>

        {mode === 'SEARCH' && step === 1 && <DiscogsTokenManager />}
        
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
              <button onClick={() => setMode('SEARCH')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'SEARCH' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Busca Automática</button>
              <button onClick={() => setMode('MANUAL')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'MANUAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>Cadastro Manual</button>
              <button onClick={() => setMode('LOTE')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'LOTE' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-500'}`}>🎁 Criar Lote</button>
            </div>

            {mode === 'LOTE' ? (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                <p className="text-gray-400 text-sm">Selecione pelo menos 2 itens ativos.</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                   {getEnrichedListings().filter(l => l.sellerId === currentUser.id && l.status === 'DISPONÍVEL').map(l => (
                     <div key={l.id} onClick={() => setSelectedListingIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])} className={`p-3 rounded border flex items-center gap-4 cursor-pointer transition ${selectedListingIds.includes(l.id) ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-800 border-gray-700'}`}>
                        <input type="checkbox" checked={selectedListingIds.includes(l.id)} readOnly className="h-4 w-4" />
                        <img src={l.catalogItem.coverUrl} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{l.catalogItem.title}</p><p className="text-gray-400 text-xs">R$ {l.price.toFixed(2)}</p></div>
                     </div>
                   ))}
                </div>
                <button onClick={handleLotSubmit} disabled={selectedListingIds.length < 2} className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded disabled:opacity-50">Configurar Preço do Lote</button>
              </div>
            ) : mode === 'SEARCH' ? (
              <div className="space-y-6">
                <div className="flex gap-2">
                    <button onClick={() => setSearchCategory('MEDIA')} className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'MEDIA' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>💿 Mídias</button>
                    <button onClick={() => setSearchCategory('EQUIPMENT')} className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'EQUIPMENT' ? 'bg-blue-900/50 text-blue-200 border-blue-500' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>🎛️ Equipamentos</button>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="flex-1 bg-gray-800 text-white p-3 border border-gray-700 rounded outline-none focus:border-vinyl-accent" />
                  <button type="submit" disabled={isSearching} className="bg-vinyl-accent hover:bg-yellow-600 text-black px-6 rounded font-bold transition disabled:opacity-50">{isSearching ? '...' : 'Buscar'}</button>
                </form>
                {loadingDetails && <div className="text-center py-4 text-vinyl-accent animate-pulse font-bold">Puxando detalhes e faixas do Discogs...</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map(item => (
                    <div key={item.id} onClick={() => handleSelectResult(item)} className="cursor-pointer bg-gray-800 p-3 rounded border border-gray-700 hover:border-vinyl-accent flex gap-3 group transition">
                      <img src={item.coverUrl} className="w-16 h-16 object-cover rounded shadow group-hover:scale-105 transition" />
                      <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{item.title}</p><p className="text-gray-400 text-xs truncate">{item.artist}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualCatalogSubmit} className="space-y-4 animate-[fadeIn_0.3s]">
                <div className="flex flex-col md:flex-row gap-6 items-start border-b border-gray-800 pb-6">
                   <div className="w-full md:w-64 space-y-3">
                     <div className="w-full aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center relative overflow-hidden group">
                        {(manualCoverFile || manualForm.coverUrl) ? (
                          <img src={manualCoverFile ? URL.createObjectURL(manualCoverFile) : manualForm.coverUrl} className="absolute inset-0 w-full h-full object-contain bg-black" />
                        ) : <span className="text-2xl text-gray-600">+</span>}
                        <input type="file" accept="image/*" onChange={e => {setManualCoverFile(e.target.files ? e.target.files[0] : null); setManualForm(prev => ({ ...prev, coverUrl: '' }));}} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                   </div>
                   <div className="flex-1 space-y-3 w-full">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Artista" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm" value={manualForm.artist} onChange={e => setManualForm({...manualForm, artist: e.target.value})} />
                        <input type="text" placeholder="Título" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm" value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="Ano" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm" value={manualForm.year} onChange={e => setManualForm({...manualForm, year: e.target.value})} />
                        <select className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm" value={manualForm.genre} onChange={e => setManualForm({...manualForm, genre: e.target.value as Genre})}>
                          {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <textarea placeholder="Descrição" className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded text-sm h-24" value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} />
                   </div>
                </div>

                {/* Tracklist Section */}
                {manualForm.tracks.length > 0 && (
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                    <h3 className="text-white font-bold text-sm mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
                       <span>Lista de Faixas ({manualForm.tracks.length})</span>
                       <span className="text-[10px] text-vinyl-accent">Puxado Automaticamente</span>
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {manualForm.tracks.map((track, idx) => (
                         <div key={idx} className="flex gap-2 items-center bg-gray-900/50 p-2 rounded border border-gray-800 group">
                            <span className="text-[10px] text-gray-500 w-6 font-bold">{track.position}</span>
                            <input 
                              type="text" 
                              value={track.title} 
                              onChange={(e) => {
                                const newTracks = [...manualForm.tracks];
                                newTracks[idx].title = e.target.value;
                                setManualForm({...manualForm, tracks: newTracks});
                              }}
                              className="flex-1 bg-transparent text-xs text-gray-300 outline-none border-none p-0 focus:text-white"
                            />
                            <span className="text-[10px] text-gray-600">{track.duration}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded shadow-lg transition transform active:scale-95">Salvar e Configurar Venda</button>
              </form>
            )}
          </div>
        )}

        {step === 2 && selectedCatalogItem && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const finalImages = previewImages.length > 0 ? previewImages : [selectedCatalogItem.coverUrl];
            const newListing: Listing = { id: `l-${Date.now()}`, sellerId: currentUser.id, catalogItemId: selectedCatalogItem.id, price: parseFloat(price), productCondition, condition, description, userImages: finalImages, status: 'DISPONÍVEL', createdAt: new Date().toISOString(), allowPickup, allowShipping };
            addListing(newListing);
            navigate('/'); 
          }} className="space-y-6 animate-[fadeIn_0.3s]">
             <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700 shadow-inner">
               <img src={selectedCatalogItem.coverUrl} className="w-16 h-16 object-cover rounded shadow-lg" />
               <div className="min-w-0 flex-1">
                 <p className="font-bold text-white truncate">{selectedCatalogItem.title}</p>
                 <p className="text-gray-400 text-xs truncate">{selectedCatalogItem.artist}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} placeholder="Preço R$" className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none" />
                <select value={condition} onChange={(e) => setCondition(e.target.value as VinylCondition)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none">
                  {Object.values(VinylCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>

             <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <p className="text-sm font-bold text-white mb-2">Fotos Reais (Máx 10)</p>
                <input type="file" multiple accept="image/*" onChange={async (e) => {
                  if (e.target.files) {
                    // Added explicit type annotation to fix 'unknown' map error
                    const filesArray: File[] = Array.from(e.target.files).slice(0, 10);
                    const base64s = await Promise.all(filesArray.map((f: File) => fileToBase64(f)));
                    setPreviewImages(base64s);
                  }
                }} className="text-xs text-gray-400 w-full" />
                <div className="flex flex-wrap gap-2 mt-4">
                  {previewImages.map((src, i) => <img key={i} src={src} className="w-12 h-12 object-cover rounded border border-gray-700" />)}
                </div>
             </div>

             <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded shadow-xl">Publicar Oferta</button>
          </form>
        )}
      </div>
    </div>
  );
};
