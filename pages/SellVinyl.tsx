
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, VinylCondition, Listing, ItemType, ProductCondition, Track } from '../types';
import { getAlbumDetails, getEquipmentDetails } from '../services/geminiService';
import { searchDiscogs, getDiscogsReleaseDetails } from '../services/discogsService';
import { useNavigate } from 'react-router-dom';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const SellVinyl: React.FC = () => {
  const { catalog, addToCatalog, addListing, currentUser } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'SEARCH' | 'MANUAL'>('SEARCH');
  
  const [searchCategory, setSearchCategory] = useState<'MEDIA' | 'EQUIPMENT'>('MEDIA');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searchSource, setSearchSource] = useState<'LOCAL' | 'DISCOGS' | 'AI' | null>(null);

  const [discogsToken, setDiscogsToken] = useState(localStorage.getItem('discogs_token') || '');
  const [showConfig, setShowConfig] = useState(false);

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
    imageSearchQuery: '', 
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

  useEffect(() => {
    localStorage.setItem('discogs_token', discogsToken);
  }, [discogsToken]);

  const handleItemTypeChange = (newType: ItemType) => {
     setManualForm(prev => ({
       ...prev,
       itemType: newType,
       genre: (newType === ItemType.EQUIPMENT || newType === ItemType.FELTRO) ? Genre.OTHER : prev.genre,
       voltage: newType === ItemType.EQUIPMENT ? '110v' : 'N/A'
     }));
  };

  const handleAddTrack = () => {
    setManualForm(prev => ({
      ...prev,
      tracks: [...prev.tracks, { position: '', title: '', duration: '' }]
    }));
  };

  const handleTrackChange = (index: number, field: keyof Track, value: string) => {
    const newTracks = [...manualForm.tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setManualForm(prev => ({ ...prev, tracks: newTracks }));
  };

  const handleRemoveTrack = (index: number) => {
    setManualForm(prev => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index)
    }));
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-white">Por favor, faça login para vender.</div>;
  }

  const isEquipment = manualForm.itemType === ItemType.EQUIPMENT;
  const isFeltro = manualForm.itemType === ItemType.FELTRO;

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchSource(null);

    const localMatches = catalog.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLocalMatches = localMatches.filter(c => {
      if (searchCategory === 'EQUIPMENT') return c.itemType === ItemType.EQUIPMENT;
      return c.itemType !== ItemType.EQUIPMENT && c.itemType !== ItemType.FELTRO;
    });

    if (filteredLocalMatches.length > 0) {
      setSearchResults(filteredLocalMatches);
      setSearchSource('LOCAL');
      setIsSearching(false);
      return;
    }

    if (searchCategory === 'MEDIA') {
      if (discogsToken) {
        const discogsResults = await searchDiscogs(searchTerm, discogsToken);
        if (discogsResults.length > 0) {
          setSearchResults(discogsResults);
          setSearchSource('DISCOGS');
          setIsSearching(false);
          return;
        }
      }

      const aiResult = await getAlbumDetails(searchTerm);
      if (aiResult) {
         const newItem: CatalogItem = {
           id: `c-ai-${Date.now()}`,
           ...aiResult,
           genre: aiResult.genre as Genre, 
           itemType: ItemType.LP, 
           coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400`,
           format: 'Vinil / Mídia',
           label: 'Desconhecido',
           tracks: aiResult.tracks
         };
         setSearchResults([newItem]);
         setSearchSource('AI');
      } else {
         if(confirm("Título não encontrado. Deseja cadastrar manualmente?")) {
            setMode('MANUAL');
            setManualForm(prev => ({ ...prev, itemType: ItemType.LP }));
         }
      }

    } else {
      const aiResult = await getEquipmentDetails(searchTerm);
      if (aiResult) {
         const newItem: CatalogItem = {
           id: `c-eq-ai-${Date.now()}`,
           artist: aiResult.brand,  
           title: aiResult.model,   
           genre: Genre.OTHER,      
           itemType: ItemType.EQUIPMENT,
           year: aiResult.year,
           description: aiResult.description,
           coverUrl: `https://picsum.photos/seed/${aiResult.model.replace(/\s/g,'')}/400/400`,
           format: 'Equipamento',
           label: aiResult.brand,
           voltage: aiResult.voltage || 'N/A'
         };
         setSearchResults([newItem]);
         setSearchSource('AI');
      } else {
         if(confirm("Equipamento não encontrado automaticamente. Deseja cadastrar manualmente?")) {
            setMode('MANUAL');
            setManualForm(prev => ({ ...prev, itemType: ItemType.EQUIPMENT }));
         }
      }
    }
    setIsSearching(false);
  };

  const handleSelectResult = async (item: CatalogItem) => {
    let tracks = item.tracks || [];
    let year = item.year ? item.year.toString() : '';
    let label = item.label || '';

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
      imageSearchQuery: '',
      tracks: tracks
    });

    setMode('MANUAL');
    window.scrollTo(0, 0); 
  };

  const handleManualCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title || !manualForm.artist || !manualForm.year) {
      return alert("Preencha os campos obrigatórios.");
    }

    let finalCoverUrl = manualForm.coverUrl || `https://picsum.photos/seed/${manualForm.title}/400/400`;
    
    if (manualCoverFile) {
       try {
         finalCoverUrl = await fileToBase64(manualCoverFile);
       } catch (err) {
         console.error("Error reading file", err);
         return alert("Erro ao processar imagem.");
       }
    }

    const newItem: CatalogItem = {
      id: `c-man-${Date.now()}`,
      artist: manualForm.artist,
      title: manualForm.title,
      genre: manualForm.genre,
      itemType: manualForm.itemType,
      year: parseInt(manualForm.year),
      description: manualForm.description || 'Cadastrado pelo vendedor.',
      coverUrl: finalCoverUrl,
      format: manualForm.itemType,
      label: manualForm.label,
      voltage: (isEquipment) ? manualForm.voltage : undefined,
      tracks: manualForm.tracks.filter(t => t.title) 
    };

    addToCatalog(newItem);
    setSelectedCatalogItem(newItem);
    setStep(2);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // AUMENTADO DE 5 PARA 10
      if (e.target.files.length > 10) {
        alert("Máximo de 10 fotos permitido.");
        e.target.value = ''; 
        setPreviewImages([]);
        return;
      }
      
      const filesArray: File[] = Array.from(e.target.files);
      try {
        const base64Promises = filesArray.map(file => fileToBase64(file));
        const base64Images = await Promise.all(base64Promises);
        setPreviewImages(base64Images);
      } catch (err) {
        console.error("Error converting images", err);
        alert("Erro ao processar imagens.");
      }
    }
  };

  const openGoogleImages = () => {
     const query = manualForm.imageSearchQuery || `${manualForm.artist} ${manualForm.title} cover`;
     const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&tbs=isz:l`; 
     window.open(url, '_blank');
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem || !price) return;
    if (!allowPickup && !allowShipping) return alert("Selecione pelo menos uma forma de entrega.");

    const finalUserImages = previewImages.length > 0 
      ? previewImages 
      : [selectedCatalogItem.coverUrl];

    const newListing: Listing = {
      id: `l-${Date.now()}`,
      sellerId: currentUser.id,
      catalogItemId: selectedCatalogItem.id,
      price: parseFloat(price),
      productCondition,
      condition,
      description,
      userImages: finalUserImages,
      status: 'DISPONÍVEL',
      createdAt: new Date().toISOString(),
      allowPickup,
      allowShipping,
      shippingCost: undefined 
    };

    addListing(newListing);
    navigate('/'); 
  };

  const getArtistLabel = () => {
      if (isEquipment) return 'Marca (Brand)';
      if (isFeltro) return 'Estampa';
      return 'Artista / Diretor';
  };

  const getTitleLabel = () => {
      if (isEquipment || isFeltro) return 'Modelo';
      return 'Título';
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-4 border-vinyl-accent border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-white font-bold">Importando detalhes do Discogs...</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold text-white">Vender seu Item</h1>
           {step === 1 && mode === 'SEARCH' && searchCategory === 'MEDIA' && (
             <button onClick={() => setShowConfig(!showConfig)} className="text-xs text-vinyl-accent underline">
               Configurar Discogs
             </button>
           )}
        </div>
        
        {step === 1 && (
          <div className="space-y-6">
            
            {showConfig && (
              <div className="bg-gray-800 p-4 rounded border border-gray-700 animate-[fadeIn_0.3s]">
                 <label className="block text-xs font-bold text-white mb-2">Token Pessoal do Discogs (Opcional)</label>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={discogsToken}
                     onChange={e => setDiscogsToken(e.target.value)}
                     placeholder="Cole seu token aqui..."
                     className="flex-1 bg-gray-900 text-white p-2 border border-gray-600 rounded text-sm"
                   />
                   <button onClick={() => setShowConfig(false)} className="bg-gray-700 text-white px-3 py-1 rounded text-xs">Fechar</button>
                 </div>
              </div>
            )}

            <div className="flex border-b border-gray-700 mb-4">
              <button 
                onClick={() => setMode('SEARCH')}
                className={`px-4 py-2 font-medium text-sm ${mode === 'SEARCH' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}
              >
                Buscar Automático (IA)
              </button>
              <button 
                onClick={() => setMode('MANUAL')}
                className={`px-4 py-2 font-medium text-sm ${mode === 'MANUAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}
              >
                Cadastro Manual
              </button>
            </div>

            {mode === 'SEARCH' ? (
              <>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 mb-4">
                   <p className="text-xs font-bold text-gray-400 mb-2 uppercase">O que você quer vender?</p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => { setSearchCategory('MEDIA'); setSearchResults([]); }}
                        className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'MEDIA' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                      >
                         💿 Mídia (LD, LP, CD...)
                      </button>
                      <button 
                        onClick={() => { setSearchCategory('EQUIPMENT'); setSearchResults([]); }}
                        className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'EQUIPMENT' ? 'bg-blue-900/50 text-blue-200 border-blue-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                      >
                         🎛️ Equipamento / Outros
                      </button>
                   </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={searchCategory === 'MEDIA' ? "Digite Artista, Diretor ou Título..." : "Digite Marca e Modelo..."}
                    className="flex-1 bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="bg-vinyl-accent hover:bg-yellow-600 text-black px-6 rounded font-bold disabled:opacity-50"
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>

                <div className="mt-6">
                  {searchSource && (
                    <p className="text-sm text-gray-400 mb-2">
                      Resultados encontrados em: <span className="font-bold text-white">{searchSource === 'LOCAL' ? 'Catálogo Vinil D\'oro' : searchSource}</span>
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {searchResults.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        onClick={() => handleSelectResult(item)}
                        className="cursor-pointer bg-gray-800 hover:bg-gray-700 p-3 rounded border border-gray-700 transition flex gap-3 group"
                      >
                        <img src={item.coverUrl} className="w-20 h-20 object-cover rounded shadow-md group-hover:scale-105 transition" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{item.title}</p>
                          <p className="text-vinyl-accent text-xs truncate">{item.artist}</p>
                          <p className="text-gray-400 text-xs mt-1">
                             {item.year} • {item.format || item.itemType || 'Item'}
                          </p>
                          <button className="mt-2 text-[10px] bg-gray-600 hover:bg-green-600 text-white px-2 py-1 rounded w-full transition">
                            Revisar / Adicionar Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!isSearching && searchResults.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded">
                      <p>Nenhum resultado encontrado.</p>
                      <button onClick={() => setMode('MANUAL')} className="text-vinyl-accent underline mt-2">Cadastrar Manualmente</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleManualCatalogSubmit} className="space-y-4 animate-[fadeIn_0.3s]">
                <div className="mb-4">
                    <label className="block text-sm font-bold text-white mb-2">Qual o tipo do item?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {Object.values(ItemType).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => handleItemTypeChange(t)}
                                className={`p-2 text-[10px] rounded border transition ${manualForm.itemType === t ? 'bg-vinyl-accent text-black border-vinyl-accent font-bold' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start border-t border-gray-800 pt-4">
                   <div className="w-full md:w-64 space-y-3">
                     <label className="block text-xs font-bold text-gray-500">Foto Principal</label>
                     <div className="w-full aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center relative overflow-hidden group">
                        {(manualCoverFile || manualForm.coverUrl) ? (
                          <img 
                            src={manualCoverFile ? URL.createObjectURL(manualCoverFile) : manualForm.coverUrl} 
                            className="absolute inset-0 w-full h-full object-contain bg-black" 
                          />
                        ) : <span className="text-2xl text-gray-600">+</span>}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
                            <span className="text-white text-xs font-bold">Alterar Arquivo</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                              setManualCoverFile(e.target.files ? e.target.files[0] : null);
                              setManualForm(prev => ({ ...prev, coverUrl: '' })); 
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                     </div>
                     <div className="space-y-2">
                         <button type="button" onClick={openGoogleImages} className="w-full bg-blue-900/40 hover:bg-blue-800 text-blue-300 text-xs py-2 px-3 rounded border border-blue-800 flex items-center justify-center gap-2 transition">
                            <span>🔍</span> Buscar Imagem HD
                         </button>
                         <div className="relative">
                            <input type="text" placeholder="URL da imagem..." value={manualForm.coverUrl} onChange={e => { setManualForm({...manualForm, coverUrl: e.target.value}); setManualCoverFile(null); }} className="w-full bg-gray-900 text-white text-xs p-2 pl-7 border border-gray-700 rounded focus:border-vinyl-accent outline-none" />
                            <span className="absolute left-2 top-2 text-gray-500 text-xs">🔗</span>
                         </div>
                     </div>
                   </div>
                   
                   <div className="flex-1 space-y-3 w-full">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">{getArtistLabel()}</label>
                            <input type="text" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none" value={manualForm.artist} onChange={e => setManualForm({...manualForm, artist: e.target.value})} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">{getTitleLabel()}</label>
                            <input type="text" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none" value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Ano</label>
                            <input type="number" required className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none" value={manualForm.year} onChange={e => setManualForm({...manualForm, year: e.target.value})} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Gênero / Categoria</label>
                            <select disabled={isEquipment || isFeltro} className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none" value={manualForm.genre} onChange={e => setManualForm({...manualForm, genre: e.target.value as Genre})}>
                              {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                      </div>
                      {isEquipment && (
                         <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Voltagem</label>
                            <select className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none" value={manualForm.voltage} onChange={e => setManualForm({...manualForm, voltage: e.target.value})}>
                                <option value="110v">110v</option><option value="220v">220v</option><option value="Bivolt">Bivolt</option><option value="N/A">N/A</option>
                            </select>
                         </div>
                      )}
                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Descrição</label>
                        <textarea className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none text-sm h-24" value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded">Salvar e Continuar</button>
              </form>
            )}
          </div>
        )}

        {step === 2 && selectedCatalogItem && (
          <form onSubmit={handlePublish} className="space-y-6 animate-[fadeIn_0.3s]">
            <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700 relative overflow-hidden">
              <img src={selectedCatalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow-lg" />
              <div>
                <p className="font-bold text-white text-lg">{selectedCatalogItem.title}</p>
                <p className="text-gray-400 text-sm">{selectedCatalogItem.artist}</p>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-vinyl-accent hover:underline mt-2">← Trocar Item</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Condição</label>
                 <div className="flex bg-gray-800 p-1 rounded border border-gray-700">
                    <button type="button" onClick={() => setProductCondition('NOVO')} className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'NOVO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}>NOVO</button>
                    <button type="button" onClick={() => setProductCondition('USADO')} className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'USADO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}>USADO</button>
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none" />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estado Físico</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value as VinylCondition)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none">
                  {Object.values(VinylCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <label className="block text-sm font-bold text-white mb-2">Fotos Reais (Máx 10)</label>
              <div className="flex flex-col gap-4">
                 <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm text-center border border-gray-600 transition w-full md:w-auto">
                    <span>+ Selecionar Fotos</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                 </label>
                 {previewImages.length > 0 && (
                   <div className="flex flex-wrap gap-3 mt-2">
                     {previewImages.map((src, idx) => (
                       <div key={idx} className="relative w-24 h-24 border border-gray-600 rounded overflow-hidden shadow-sm group">
                          <img src={src} className="w-full h-full object-cover" />
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Notas do Vendedor</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none" />
            </div>

            <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded shadow-lg shadow-yellow-900/20">Publicar Anúncio</button>
          </form>
        )}
      </div>
    </div>
  );
};
