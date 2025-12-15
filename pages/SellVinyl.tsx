
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, VinylCondition, Listing, ItemType, ProductCondition } from '../types';
import { getAlbumDetails } from '../services/geminiService';
import { searchDiscogs } from '../services/discogsService';
import { useNavigate } from 'react-router-dom';

// Helper to convert file to Base64 string for database storage
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

  // Step 1: Catalog Selection
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'SEARCH' | 'MANUAL'>('SEARCH');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searchSource, setSearchSource] = useState<'LOCAL' | 'DISCOGS' | 'AI' | null>(null);

  // Discogs Token Management
  const [discogsToken, setDiscogsToken] = useState(localStorage.getItem('discogs_token') || '');
  const [showConfig, setShowConfig] = useState(false);

  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    artist: '',
    title: '',
    genre: Genre.ROCK,
    itemType: ItemType.LP, // Default to LP
    year: '',
    description: '',
    label: ''
  });
  const [manualCoverFile, setManualCoverFile] = useState<File | null>(null);

  // Step 2: Listing Details
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [price, setPrice] = useState('');
  const [productCondition, setProductCondition] = useState<ProductCondition>('USADO'); // Novo/Usado
  const [condition, setCondition] = useState<VinylCondition>(VinylCondition.VG);
  const [description, setDescription] = useState('');
  
  // Image Storage (Base64)
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  // Delivery Options
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowShipping, setAllowShipping] = useState(true);

  useEffect(() => {
    localStorage.setItem('discogs_token', discogsToken);
  }, [discogsToken]);

  if (!currentUser) {
    return <div className="p-8 text-center text-white">Por favor, faça login para vender.</div>;
  }

  // --- Handlers ---

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchSource(null);

    // 1. Search Local Catalog first
    const localMatches = catalog.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setSearchSource('LOCAL');
      setIsSearching(false);
      return;
    }

    // 2. Search Discogs (if token exists)
    if (discogsToken) {
      const discogsResults = await searchDiscogs(searchTerm, discogsToken);
      if (discogsResults.length > 0) {
        setSearchResults(discogsResults);
        setSearchSource('DISCOGS');
        setIsSearching(false);
        return;
      }
    }

    // 3. Fallback to Gemini AI
    const aiResult = await getAlbumDetails(searchTerm);
    if (aiResult) {
       const newItem: CatalogItem = {
         id: `c-ai-${Date.now()}`,
         ...aiResult,
         genre: aiResult.genre as Genre, 
         itemType: ItemType.LP, // Default for AI results
         coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400`,
         format: 'Vinil',
         label: 'Desconhecido'
       };
       setSearchResults([newItem]);
       setSearchSource('AI');
    } else {
       if(confirm("Álbum não encontrado. Deseja cadastrar manualmente?")) {
          setMode('MANUAL');
       }
    }
    setIsSearching(false);
  };

  const handleSelectResult = (item: CatalogItem) => {
    // If it comes from Discogs or AI (not in local catalog yet), add it
    const exists = catalog.find(c => c.title === item.title && c.artist === item.artist);
    
    if (!exists) {
      // Need to ensure unique ID if coming from external source
      const newItem = { ...item, id: item.id.startsWith('c-') ? item.id : `c-${Date.now()}` };
      addToCatalog(newItem);
      setSelectedCatalogItem(newItem);
    } else {
      setSelectedCatalogItem(exists);
    }
    setStep(2);
  };

  const handleManualCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title || !manualForm.artist || !manualForm.year) {
      return alert("Preencha os campos obrigatórios do álbum.");
    }

    let coverUrl = `https://picsum.photos/seed/${manualForm.title}/400/400`;
    
    // Convert uploaded cover to Base64 for persistence
    if (manualCoverFile) {
       try {
         coverUrl = await fileToBase64(manualCoverFile);
       } catch (err) {
         console.error("Error reading file", err);
         return alert("Erro ao processar imagem da capa.");
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
      coverUrl: coverUrl,
      format: manualForm.itemType, // Using ItemType as basic format
      label: manualForm.label
    };

    addToCatalog(newItem);
    setSelectedCatalogItem(newItem);
    setStep(2);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 5) {
        alert("Máximo de 5 fotos permitido.");
        e.target.value = ''; // Reset input
        setPreviewImages([]);
        return;
      }
      
      const filesArray: File[] = Array.from(e.target.files);
      
      try {
        // Convert all files to Base64
        const base64Promises = filesArray.map(file => fileToBase64(file));
        const base64Images = await Promise.all(base64Promises);
        setPreviewImages(base64Images);
      } catch (err) {
        console.error("Error converting images", err);
        alert("Erro ao processar imagens.");
      }
    }
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

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold text-white">Vender seu Item</h1>
           {step === 1 && mode === 'SEARCH' && (
             <button onClick={() => setShowConfig(!showConfig)} className="text-xs text-vinyl-accent underline">
               Configurar Discogs
             </button>
           )}
        </div>
        
        {step === 1 && (
          <div className="space-y-6">
            
            {/* Discogs Config */}
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
                 <p className="text-[10px] text-gray-500 mt-1">Necessário para buscar metadados avançados na API do Discogs.</p>
              </div>
            )}

            {/* Toggle Mode */}
            <div className="flex border-b border-gray-700 mb-4">
              <button 
                onClick={() => setMode('SEARCH')}
                className={`px-4 py-2 font-medium text-sm ${mode === 'SEARCH' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}
              >
                Buscar (Catálogo / Discogs)
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
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Digite Artista, Álbum ou Código de Barras..."
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

                {/* Results Area */}
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
                          <p className="text-gray-400 text-xs mt-1">{item.year} • {item.format || item.itemType || 'Vinil'}</p>
                          {item.label && <p className="text-gray-500 text-[10px] truncate">{item.label}</p>}
                          <button className="mt-2 text-[10px] bg-gray-600 hover:bg-green-600 text-white px-2 py-1 rounded w-full transition">
                            {searchSource === 'LOCAL' ? 'Selecionar' : 'Importar & Selecionar'}
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
                <p className="text-gray-400 text-sm">Adicione os dados da Ficha Técnica manualmente.</p>
                
                <div className="flex gap-4 items-start">
                   <div className="w-32">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Capa</label>
                     <div className="w-full aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center relative overflow-hidden">
                        {manualCoverFile ? (
                          <img src={URL.createObjectURL(manualCoverFile)} className="absolute inset-0 w-full h-full object-cover" />
                        ) : <span className="text-2xl text-gray-600">+</span>}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => setManualCoverFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                     </div>
                   </div>
                   
                   <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Artista"
                          required
                          className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                          value={manualForm.artist}
                          onChange={e => setManualForm({...manualForm, artist: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="Álbum/Nome"
                          required
                          className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                          value={manualForm.title}
                          onChange={e => setManualForm({...manualForm, title: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="number" 
                          placeholder="Ano"
                          required
                          className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                          value={manualForm.year}
                          onChange={e => setManualForm({...manualForm, year: e.target.value})}
                        />
                        <select
                           className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                           value={manualForm.genre}
                           onChange={e => setManualForm({...manualForm, genre: e.target.value as Genre})}
                        >
                          {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         {/* Item Type Selector */}
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Tipo de Item</label>
                            <select 
                              className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                              value={manualForm.itemType}
                              onChange={e => setManualForm({...manualForm, itemType: e.target.value as ItemType})}
                            >
                              {Object.values(ItemType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        
                        <div className="flex flex-col">
                           <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Selo / Marca</label>
                            <input 
                              type="text" 
                              placeholder="Selo / Gravadora"
                              className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                              value={manualForm.label}
                              onChange={e => setManualForm({...manualForm, label: e.target.value})}
                            />
                        </div>
                      </div>
                   </div>
                </div>

                <textarea 
                   placeholder="Descrição curta ou notas técnicas..."
                   className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none text-sm"
                   value={manualForm.description}
                   onChange={e => setManualForm({...manualForm, description: e.target.value})}
                />

                <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded">
                  Salvar no Catálogo e Continuar
                </button>
              </form>
            )}
          </div>
        )}

        {step === 2 && selectedCatalogItem && (
          <form onSubmit={handlePublish} className="space-y-6 animate-[fadeIn_0.3s]">
            <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 font-bold text-4xl pointer-events-none">
                 {selectedCatalogItem.id.includes('discogs') ? 'DISCOGS' : 'CATÁLOGO'}
              </div>
              <img src={selectedCatalogItem.coverUrl} className="w-20 h-20 object-cover rounded shadow-lg" />
              <div>
                <p className="font-bold text-white text-lg">{selectedCatalogItem.title}</p>
                <p className="text-gray-400 text-sm">{selectedCatalogItem.artist}</p>
                <div className="flex gap-2 mt-1">
                   <span className="text-[10px] bg-gray-700 text-white px-2 py-0.5 rounded">{selectedCatalogItem.year}</span>
                   <span className="text-[10px] bg-vinyl-accent/20 text-vinyl-accent border border-vinyl-accent/50 px-2 py-0.5 rounded">{selectedCatalogItem.itemType || selectedCatalogItem.format || 'Vinil'}</span>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-vinyl-accent hover:underline mt-2">← Escolher outro item</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Condição do Produto</label>
                 <div className="flex bg-gray-800 p-1 rounded border border-gray-700">
                    <button 
                       type="button"
                       onClick={() => setProductCondition('NOVO')}
                       className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'NOVO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      NOVO
                    </button>
                    <button 
                       type="button"
                       onClick={() => setProductCondition('USADO')}
                       className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'USADO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      USADO
                    </button>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
                />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estado Físico Detalhado</label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value as VinylCondition)}
                  className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
                >
                  {Object.values(VinylCondition).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Classifique o estado da mídia/equipamento.</p>
            </div>

            {/* Delivery Options */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-4">
               <h3 className="font-bold text-white text-sm border-b border-gray-600 pb-2">Opções de Entrega</h3>
               <div className="flex items-center">
                 <input 
                   type="checkbox" 
                   id="pickup"
                   checked={allowPickup}
                   onChange={e => setAllowPickup(e.target.checked)}
                   className="h-4 w-4 text-vinyl-accent bg-gray-700 border-gray-600 rounded"
                 />
                 <label htmlFor="pickup" className="ml-2 text-sm text-gray-300">Aceito Retirada em Mãos</label>
               </div>
               <div className="flex items-center">
                   <input 
                     type="checkbox" 
                     id="shipping"
                     checked={allowShipping}
                     onChange={e => setAllowShipping(e.target.checked)}
                     className="h-4 w-4 text-vinyl-accent bg-gray-700 border-gray-600 rounded"
                   />
                   <label htmlFor="shipping" className="ml-2 text-sm text-gray-300">Faço Envio (Frete a combinar)</label>
               </div>
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <label className="block text-sm font-bold text-white mb-2">Fotos Reais do Produto</label>
              <p className="text-xs text-gray-400 mb-3">Adicione fotos do seu item específico (riscos, detalhes da capa). A capa original do catálogo será mantida como referência.</p>
              
              <div className="flex flex-col gap-4">
                 <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm text-center border border-gray-600 transition w-full md:w-auto">
                    <span>+ Selecionar Fotos (Máx 5)</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                 </label>

                 {/* Preview Grid */}
                 {previewImages.length > 0 && (
                   <div className="flex flex-wrap gap-3 mt-2">
                     {previewImages.map((src, idx) => (
                       <div key={idx} className="relative w-24 h-24 border border-gray-600 rounded overflow-hidden shadow-sm group">
                          <img src={src} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white">
                             Foto {idx + 1}
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição do estado / Notas</label>
              <textarea 
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Capa com leve desgaste nas bordas, disco toca perfeitamente..."
                className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              />
            </div>

            <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded transition shadow-lg shadow-yellow-900/20">
              Publicar Anúncio
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
