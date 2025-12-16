
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, VinylCondition, Listing, ItemType, ProductCondition, Track } from '../types';
import { getAlbumDetails, getEquipmentDetails } from '../services/geminiService';
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
  const [searchCategory, setSearchCategory] = useState<'MEDIA' | 'EQUIPMENT'>('MEDIA');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searchSource, setSearchSource] = useState<'LOCAL' | 'DISCOGS' | 'AI' | null>(null);

  // Discogs Token Management
  const [discogsToken, setDiscogsToken] = useState(localStorage.getItem('discogs_token') || '');
  const [showConfig, setShowConfig] = useState(false);

  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    artist: '', // Used as Brand for Equipment
    title: '',  // Used as Model for Equipment
    genre: Genre.ROCK,
    itemType: ItemType.LP, 
    year: '',
    description: '',
    label: '',
    voltage: 'N/A',
    coverUrl: '', // URL String
    imageSearchQuery: '', // To help user find images
    tracks: [] as Track[]
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

  // Reset form when switching item type significantly
  const handleItemTypeChange = (newType: ItemType) => {
     setManualForm(prev => ({
       ...prev,
       itemType: newType,
       // Default genre to OTHER if equipment, otherwise keep previous or default
       genre: newType === ItemType.EQUIPMENT ? Genre.OTHER : prev.genre,
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

  // --- Handlers ---

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchSource(null);

    // 1. Search Local Catalog first (Generic match)
    const localMatches = catalog.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter local matches based on category
    const filteredLocalMatches = localMatches.filter(c => {
      if (searchCategory === 'EQUIPMENT') return c.itemType === ItemType.EQUIPMENT;
      return c.itemType !== ItemType.EQUIPMENT;
    });

    if (filteredLocalMatches.length > 0) {
      setSearchResults(filteredLocalMatches);
      setSearchSource('LOCAL');
      setIsSearching(false);
      return;
    }

    // 2. Search External (Logic splits here based on category)
    
    if (searchCategory === 'MEDIA') {
      // Discogs Logic (Only for Media)
      if (discogsToken) {
        const discogsResults = await searchDiscogs(searchTerm, discogsToken);
        if (discogsResults.length > 0) {
          setSearchResults(discogsResults);
          setSearchSource('DISCOGS');
          setIsSearching(false);
          return;
        }
      }

      // Gemini AI (Album)
      const aiResult = await getAlbumDetails(searchTerm);
      if (aiResult) {
         // Auto-populate manual form in case user wants to edit it
         const newItem: CatalogItem = {
           id: `c-ai-${Date.now()}`,
           ...aiResult,
           genre: aiResult.genre as Genre, 
           itemType: ItemType.LP, // Default for AI results
           coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400`,
           format: 'Vinil',
           label: 'Desconhecido',
           tracks: aiResult.tracks
         };
         setSearchResults([newItem]);
         setSearchSource('AI');
      } else {
         if(confirm("Álbum não encontrado. Deseja cadastrar manualmente?")) {
            setMode('MANUAL');
            setManualForm(prev => ({ ...prev, itemType: ItemType.LP }));
         }
      }

    } else {
      // EQUIPMENT SEARCH LOGIC (Skip Discogs, go straight to Gemini Equipment)
      const aiResult = await getEquipmentDetails(searchTerm);
      
      if (aiResult) {
         const newItem: CatalogItem = {
           id: `c-eq-ai-${Date.now()}`,
           artist: aiResult.brand,  // Map Brand to Artist field
           title: aiResult.model,   // Map Model to Title field
           genre: Genre.OTHER,      // Equipment usually doesn't have music genre
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

  const handleSelectResult = (item: CatalogItem) => {
    // Populate Manual Form with the selected item data to allow Editing (adding tracks, etc)
    setManualForm({
      artist: item.artist,
      title: item.title,
      genre: item.genre,
      itemType: item.itemType,
      year: item.year ? item.year.toString() : '',
      description: item.description || '',
      label: item.label || '',
      voltage: item.voltage || 'N/A',
      coverUrl: item.coverUrl,
      imageSearchQuery: '',
      tracks: item.tracks || [] // Load existing tracks if any
    });

    // Switch to Manual Mode so the user can edit/add tracks
    setMode('MANUAL');
    window.scrollTo(0, 0); // Scroll to top to see the form
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
      voltage: isEquipment ? manualForm.voltage : undefined,
      tracks: manualForm.tracks.filter(t => t.title) // Save tracks
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
     // Construct a high quality search query
     const query = manualForm.imageSearchQuery || `${manualForm.artist} ${manualForm.title} high quality cover`;
     const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&tbs=isz:l`; // tbs=isz:l filters for Large images
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

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
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
              </div>
            )}

            {/* Toggle Mode */}
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
                {/* Search Category Selector */}
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 mb-4">
                   <p className="text-xs font-bold text-gray-400 mb-2 uppercase">O que você quer vender?</p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => { setSearchCategory('MEDIA'); setSearchResults([]); }}
                        className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'MEDIA' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                      >
                         💿 Mídia (Vinil, CD, K7)
                      </button>
                      <button 
                        onClick={() => { setSearchCategory('EQUIPMENT'); setSearchResults([]); }}
                        className={`flex-1 py-2 px-3 rounded text-sm font-bold border transition ${searchCategory === 'EQUIPMENT' ? 'bg-blue-900/50 text-blue-200 border-blue-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                      >
                         🎛️ Equipamento
                      </button>
                   </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={searchCategory === 'MEDIA' ? "Digite Artista ou Álbum..." : "Digite Marca e Modelo do Equipamento..."}
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
                          <p className="text-gray-400 text-xs mt-1">
                             {item.year} • {item.format || item.itemType || 'Vinil'}
                             {item.itemType === ItemType.EQUIPMENT && item.voltage && ` • ${item.voltage}`}
                          </p>
                          <button className="mt-2 text-[10px] bg-gray-600 hover:bg-green-600 text-white px-2 py-1 rounded w-full transition">
                            Revisar / Adicionar Faixas
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
                <p className="text-gray-400 text-sm">
                   {searchResults.length > 0 
                     ? "Revise os dados encontrados e adicione informações extras (como faixas) antes de confirmar." 
                     : "Adicione os dados da Ficha Técnica manualmente."}
                </p>
                
                {/* Item Type Selector First */}
                <div className="mb-4">
                    <label className="block text-sm font-bold text-white mb-2">Qual o tipo do item?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.values(ItemType).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => handleItemTypeChange(t)}
                                className={`p-2 text-xs rounded border transition ${manualForm.itemType === t ? 'bg-vinyl-accent text-black border-vinyl-accent font-bold' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start border-t border-gray-800 pt-4">
                   {/* Left Side: Image Tools */}
                   <div className="w-full md:w-64 space-y-3">
                     <label className="block text-xs font-bold text-gray-500">
                        {isEquipment ? 'Foto Principal do Equipamento' : 'Capa do Álbum'}
                     </label>
                     
                     {/* Image Preview - Large */}
                     <div className="w-full aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center relative overflow-hidden group">
                        {(manualCoverFile || manualForm.coverUrl) ? (
                          <img 
                            src={manualCoverFile ? URL.createObjectURL(manualCoverFile) : manualForm.coverUrl} 
                            className="absolute inset-0 w-full h-full object-contain bg-black" 
                          />
                        ) : <span className="text-2xl text-gray-600">+</span>}
                        
                        {/* Overlay for File Input */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
                            <span className="text-white text-xs font-bold">Alterar Arquivo</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                              setManualCoverFile(e.target.files ? e.target.files[0] : null);
                              setManualForm(prev => ({ ...prev, coverUrl: '' })); // Clear URL if file selected
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                     </div>

                     {/* High Quality Tools */}
                     <div className="space-y-2">
                         <p className="text-[10px] text-vinyl-accent font-bold uppercase border-b border-gray-700 pb-1">Ferramentas de Imagem</p>
                         
                         <button 
                           type="button" 
                           onClick={openGoogleImages}
                           className="w-full bg-blue-900/40 hover:bg-blue-800 text-blue-300 text-xs py-2 px-3 rounded border border-blue-800 flex items-center justify-center gap-2 transition"
                         >
                            <span>🔍</span> Buscar Capa HD no Google
                         </button>
                         
                         <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Cole a URL da imagem aqui..."
                              value={manualForm.coverUrl}
                              onChange={e => {
                                  setManualForm({...manualForm, coverUrl: e.target.value});
                                  setManualCoverFile(null); // Clear file if URL used
                              }}
                              className="w-full bg-gray-900 text-white text-xs p-2 pl-7 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
                            />
                            <span className="absolute left-2 top-2 text-gray-500 text-xs">🔗</span>
                         </div>
                         <p className="text-[9px] text-gray-500 text-center">
                            Dica: Busque no Google, clique com botão direito na imagem e selecione "Copiar endereço da imagem".
                         </p>
                     </div>
                   </div>
                   
                   <div className="flex-1 space-y-3 w-full">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">
                                {isEquipment ? 'Marca (Brand)' : 'Artista'}
                            </label>
                            <input 
                            type="text" 
                            placeholder={isEquipment ? "Ex: Technics, Pioneer" : "Ex: Pink Floyd"}
                            required
                            className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                            value={manualForm.artist}
                            onChange={e => setManualForm({...manualForm, artist: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">
                                {isEquipment ? 'Modelo' : 'Álbum / Título'}
                            </label>
                            <input 
                            type="text" 
                            placeholder={isEquipment ? "Ex: SL-1200 MK2" : "Ex: Dark Side of the Moon"}
                            required
                            className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                            value={manualForm.title}
                            onChange={e => setManualForm({...manualForm, title: e.target.value})}
                            />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">
                                {isEquipment ? 'Ano Fabricação' : 'Ano Lançamento'}
                            </label>
                            <input 
                            type="number" 
                            placeholder="AAAA"
                            required
                            className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                            value={manualForm.year}
                            onChange={e => setManualForm({...manualForm, year: e.target.value})}
                            />
                        </div>

                        {isEquipment ? (
                             <div className="flex flex-col">
                                <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Voltagem</label>
                                <select
                                className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                                value={manualForm.voltage}
                                onChange={e => setManualForm({...manualForm, voltage: e.target.value})}
                                >
                                    <option value="110v">110v</option>
                                    <option value="220v">220v</option>
                                    <option value="Bivolt">Bivolt</option>
                                    <option value="N/A">N/A</option>
                                </select>
                             </div>
                        ) : (
                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Gênero</label>
                                <select
                                className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                                value={manualForm.genre}
                                onChange={e => setManualForm({...manualForm, genre: e.target.value as Genre})}
                                >
                                {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                           <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">
                             {isEquipment ? 'Selo/Fabricante (Opcional)' : 'Gravadora / Selo'}
                           </label>
                            <input 
                              type="text" 
                              placeholder=""
                              className="w-full bg-gray-800 text-white p-2 border border-gray-700 rounded text-sm focus:border-vinyl-accent outline-none"
                              value={manualForm.label}
                              onChange={e => setManualForm({...manualForm, label: e.target.value})}
                            />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold mb-1 ml-1">
                            Descrição Técnica (Catálogo)
                        </label>
                        <textarea 
                        placeholder={isEquipment ? "Especificações técnicas, potência, dimensões..." : "Descrição do álbum..."}
                        className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none text-sm h-24"
                        value={manualForm.description}
                        onChange={e => setManualForm({...manualForm, description: e.target.value})}
                        />
                      </div>

                      {/* Tracks Section (Only for Media) */}
                      {!isEquipment && (
                        <div className="flex flex-col border-t border-gray-800 pt-3">
                           <div className="flex justify-between items-end mb-2">
                             <label className="text-[10px] text-gray-500 font-bold uppercase">Faixas (Tracklist)</label>
                             <button type="button" onClick={handleAddTrack} className="text-xs text-vinyl-accent font-bold hover:underline">+ Adicionar Faixa</button>
                           </div>
                           
                           {manualForm.tracks.length === 0 ? (
                             <p className="text-xs text-gray-500 italic text-center p-2 border border-dashed border-gray-800 rounded">Nenhuma faixa encontrada. Adicione manualmente para valorizar seu anúncio.</p>
                           ) : (
                             <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                               {manualForm.tracks.map((track, idx) => (
                                 <div key={idx} className="flex gap-2 items-center">
                                    <input 
                                      type="text" 
                                      placeholder="Pos (A1, 1)" 
                                      value={track.position} 
                                      onChange={e => handleTrackChange(idx, 'position', e.target.value)}
                                      className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white uppercase text-center"
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="Nome da Música" 
                                      value={track.title} 
                                      onChange={e => handleTrackChange(idx, 'title', e.target.value)}
                                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                    <button type="button" onClick={() => handleRemoveTrack(idx)} className="text-red-500 hover:text-white px-1">×</button>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      )}
                   </div>
                </div>

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
                   {selectedCatalogItem.itemType === ItemType.EQUIPMENT && selectedCatalogItem.voltage && (
                      <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">{selectedCatalogItem.voltage}</span>
                   )}
                </div>
                {selectedCatalogItem.tracks && selectedCatalogItem.tracks.length > 0 && (
                   <p className="text-[10px] text-green-400 mt-1">✓ {selectedCatalogItem.tracks.length} faixas detectadas</p>
                )}
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
              <p className="text-xs text-gray-400 mb-3">Adicione fotos do seu item específico (riscos, detalhes da capa). A imagem principal do catálogo será mantida como referência.</p>
              
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
                placeholder="Ex: Capa com leve desgaste nas bordas, aparelho funcionando 100%..."
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
