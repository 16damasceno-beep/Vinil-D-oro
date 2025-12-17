
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
  const { catalog, addToCatalog, addListing, currentUser, getEnrichedListings } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'SEARCH' | 'MANUAL' | 'LOTE'>('SEARCH');
  
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

  // Lote State
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

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

  const handleLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListingIds.length < 2) return alert("Selecione pelo menos 2 itens para criar um lote.");
    
    const selectedEnriched = getEnrichedListings().filter(l => selectedListingIds.includes(l.id));
    const totalPrice = selectedEnriched.reduce((sum, l) => sum + l.price, 0);
    const firstItem = selectedEnriched[0];

    const lotCatalogItem: CatalogItem = {
      id: `c-lot-${Date.now()}`,
      artist: currentUser.nickname,
      title: `Lote de ${selectedListingIds.length} Itens`,
      genre: Genre.OTHER,
      itemType: ItemType.LOTE,
      coverUrl: firstItem.catalogItem.coverUrl,
      description: `Lote promocional contendo: ${selectedEnriched.map(l => l.catalogItem.title).join(', ')}`,
      year: new Date().getFullYear()
    };

    addToCatalog(lotCatalogItem);
    setSelectedCatalogItem(lotCatalogItem);
    setPrice((totalPrice * 0.9).toFixed(2)); // Sugere 10% de desconto
    setDescription(`Este lote contém ${selectedListingIds.length} itens. Venda conjunta com valor reduzido!`);
    
    // Configura o lote no formulário
    setMode('LOTE');
    setStep(2);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem || !price) return;

    const finalUserImages = previewImages.length > 0 
      ? previewImages 
      : [selectedCatalogItem.coverUrl];

    let lotConfig = undefined;
    if (mode === 'LOTE') {
       const selectedEnriched = getEnrichedListings().filter(l => selectedListingIds.includes(l.id));
       const originalTotal = selectedEnriched.reduce((sum, l) => sum + l.price, 0);
       lotConfig = {
          id: `lot-cfg-${Date.now()}`,
          listingIds: selectedListingIds,
          originalTotalPrice: originalTotal
       };
    }

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
      lotConfig
    };

    addListing(newListing);
    navigate('/'); 
  };

  const toggleListingSelection = (id: string) => {
    setSelectedListingIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">Criar Anúncio</h1>
        
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
              <button onClick={() => setMode('SEARCH')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'SEARCH' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Busca Automática</button>
              <button onClick={() => setMode('MANUAL')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'MANUAL' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>Cadastro Manual</button>
              <button onClick={() => setMode('LOTE')} className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'LOTE' ? 'text-vinyl-accent border-b-2 border-vinyl-accent' : 'text-gray-400'}`}>🎁 Criar Lote</button>
            </div>

            {mode === 'LOTE' ? (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                <p className="text-gray-400 text-sm">Selecione seus itens ativos para criar um pacote com desconto. Itens vendidos separadamente removerão a oferta do lote.</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                   {getEnrichedListings().filter(l => l.sellerId === currentUser.id && l.status === 'DISPONÍVEL' && l.catalogItem.itemType !== ItemType.LOTE).map(l => (
                     <div 
                        key={l.id} 
                        onClick={() => toggleListingSelection(l.id)}
                        className={`p-3 rounded border flex items-center gap-4 cursor-pointer transition ${selectedListingIds.includes(l.id) ? 'bg-vinyl-accent/10 border-vinyl-accent' : 'bg-gray-800 border-gray-700'}`}
                     >
                        <input type="checkbox" checked={selectedListingIds.includes(l.id)} readOnly className="h-4 w-4" />
                        <img src={l.catalogItem.coverUrl} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                           <p className="font-bold text-white text-sm">{l.catalogItem.title}</p>
                           <p className="text-gray-400 text-xs">Preço individual: R$ {l.price.toFixed(2)}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <button onClick={handleLotSubmit} disabled={selectedListingIds.length < 2} className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded disabled:opacity-50">Configurar Preço do Lote</button>
              </div>
            ) : mode === 'SEARCH' ? (
              // Busca (Media / Equipment) - Mantendo lógica anterior
              <div className="space-y-6">
                <div className="flex gap-2">
                    <button onClick={() => setSearchCategory('MEDIA')} className={`flex-1 py-2 px-3 rounded text-sm font-bold border ${searchCategory === 'MEDIA' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}>💿 Mídias</button>
                    <button onClick={() => setSearchCategory('EQUIPMENT')} className={`flex-1 py-2 px-3 rounded text-sm font-bold border ${searchCategory === 'EQUIPMENT' ? 'bg-blue-900/50 text-blue-200 border-blue-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}>🎛️ Equipamentos</button>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="flex-1 bg-gray-800 text-white p-3 border border-gray-700 rounded" />
                  <button type="submit" className="bg-vinyl-accent hover:bg-yellow-600 text-black px-6 rounded font-bold">Buscar</button>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map(item => (
                    <div key={item.id} onClick={() => handleSelectResult(item)} className="cursor-pointer bg-gray-800 p-3 rounded border border-gray-700 hover:border-vinyl-accent flex gap-3">
                      <img src={item.coverUrl} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{item.title}</p><p className="text-gray-400 text-xs truncate">{item.artist}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Manual Form
              <form onSubmit={handleManualCatalogSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Marca/Artista" required className="bg-gray-800 text-white p-2 rounded border border-gray-700" value={manualForm.artist} onChange={e => setManualForm({...manualForm, artist: e.target.value})} />
                    <input type="text" placeholder="Modelo/Título" required className="bg-gray-800 text-white p-2 rounded border border-gray-700" value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded">Próximo Passo</button>
              </form>
            )}
          </div>
        )}

        {step === 2 && selectedCatalogItem && (
          <form onSubmit={handlePublish} className="space-y-6 animate-[fadeIn_0.3s]">
             <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700">
               <img src={selectedCatalogItem.coverUrl} className="w-16 h-16 object-cover rounded shadow-lg" />
               <div>
                 <p className="font-bold text-white">{selectedCatalogItem.title}</p>
                 <p className="text-gray-400 text-xs">{selectedCatalogItem.artist}</p>
                 <span className="text-[10px] bg-vinyl-accent/20 text-vinyl-accent px-2 py-0.5 rounded border border-vinyl-accent/30 mt-1 inline-block">MODO {mode}</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Preço Sugerido (R$)</label>
                  <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Estado</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as VinylCondition)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded">
                    {Object.values(VinylCondition).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-gray-400 mb-1">Notas e Descrição</label>
               <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded" />
             </div>

             <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded">Publicar Oferta</button>
          </form>
        )}
      </div>
    </div>
  );
};
